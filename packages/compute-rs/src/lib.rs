use crossbeam::channel;
use dashmap::DashMap;
use neon::prelude::*;
use num_cpus;
use rand::Rng;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::ops::Div;
use std::sync::Arc;

// Existing struct definitions remain the same
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Song {
    pub id: String,
    pub danceability: f64,
    pub energy: f64,
    pub acousticness: f64,
    pub valence: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SongMetadata {
    pub danceability: f64,
    pub energy: f64,
    pub acousticness: f64,
    pub valence: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub songs: Vec<Song>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RecommendedSong {
    pub id: String,
    pub danceability: f64,
    pub energy: f64,
    pub acousticness: f64,
    pub valence: f64,
    pub user_id: String,
    pub similarity_score: f64,
}

// Implement a thread pool for handling song processing
struct SongProcessor {
    workers: usize,
    sender: channel::Sender<ProcessingTask>,
    results: Arc<DashMap<String, Vec<RecommendedSong>>>,
}

struct ProcessingTask {
    user: Arc<User>,
    avg_prefs: Arc<SongMetadata>,
    batch_size: usize,
}

impl SongProcessor {
    fn new(workers: usize) -> Self {
        let (sender, receiver) = channel::bounded(workers * 2);
        let results = Arc::new(DashMap::new());
        let results_clone = results.clone();

        // Spawn worker threads
        for _ in 0..workers {
            let rx: crossbeam_channel::Receiver<ProcessingTask> = receiver.clone();
            let results = results_clone.clone();

            std::thread::spawn(move || {
                while let Ok(task) = rx.recv() {
                    let processed_songs = process_songs_batch(&task.user, &task.avg_prefs);
                    results.insert(task.user.id.clone(), processed_songs);
                }
            });
        }

        SongProcessor {
            workers,
            sender,
            results,
        }
    }

    fn process_user(&self, user: Arc<User>, avg_prefs: Arc<SongMetadata>) {
        let task = ProcessingTask {
            user,
            avg_prefs,
            batch_size: 100, // Adjustable batch size
        };

        let _ = self.sender.send(task);
    }
}

fn process_songs_batch(user: &User, avg_prefs: &SongMetadata) -> Vec<RecommendedSong> {
    user.songs
        .par_iter()
        .map(|song| {
            let similarity_score = calculate_similarity_score(&avg_prefs, song);
            RecommendedSong {
                id: song.id.clone(),
                danceability: song.danceability,
                energy: song.energy,
                acousticness: song.acousticness,
                valence: song.valence,
                user_id: user.id.clone(),
                similarity_score,
            }
        })
        .filter(|song| song.similarity_score >= 0.5)
        .collect()
}

// Optimized average preferences calculation using SIMD when possible
#[cfg(target_arch = "x86_64")]
fn calculate_avg_preferences(songs: &[Song]) -> SongMetadata {
    use std::arch::x86_64::*;

    let song_count = songs.len() as f64;
    let chunk_size = 4; // Process 4 songs at a time using SIMD

    unsafe {
        let mut sum_danceability = _mm256_setzero_pd();
        let mut sum_energy = _mm256_setzero_pd();
        let mut sum_acousticness = _mm256_setzero_pd();
        let mut sum_valence = _mm256_setzero_pd();

        // Process chunks of 4 songs at a time
        for chunk in songs.chunks(chunk_size) {
            if chunk.len() == chunk_size {
                let danceability = _mm256_set_pd(
                    chunk[0].danceability,
                    chunk[1].danceability,
                    chunk[2].danceability,
                    chunk[3].danceability,
                );
                sum_danceability = _mm256_add_pd(sum_danceability, danceability);

                // Similar SIMD operations for other attributes
                // ... (energy, acousticness, valence)
            }
        }

        // Extract results and handle remaining songs
        let mut results = SongMetadata {
            danceability: 0.0,
            energy: 0.0,
            acousticness: 0.0,
            valence: 0.0,
        };

        // Horizontal sum of SIMD registers
        let mut temp: [f64; 4] = std::mem::zeroed();
        _mm256_storeu_pd(temp.as_mut_ptr(), sum_danceability);
        results.danceability = temp.iter().sum::<f64>();

        // Process remaining songs
        for song in songs.chunks(chunk_size).last().unwrap_or(&[]) {
            results.danceability += song.danceability;
            results.energy += song.energy;
            results.acousticness += song.acousticness;
            results.valence += song.valence;
        }

        // Calculate final averages
        results.danceability /= song_count;
        results.energy /= song_count;
        results.acousticness /= song_count;
        results.valence /= song_count;

        results
    }
}

// Optimized similarity score calculation using precomputed weights
fn calculate_similarity_score(avg_prefs: &SongMetadata, song: &Song) -> f64 {
    const WEIGHTS: [f64; 4] = [0.3, 0.3, 0.2, 0.2]; // Adjustable weights for each attribute

    let differences = [
        (avg_prefs.danceability - song.danceability).abs(),
        (avg_prefs.energy - song.energy).abs(),
        (avg_prefs.acousticness - song.acousticness).abs(),
        (avg_prefs.valence - song.valence).abs(),
    ];

    let weighted_sum: f64 = differences
        .iter()
        .zip(WEIGHTS.iter())
        .map(|(diff, weight)| diff * weight)
        .sum();

    let base_score = 1.0 - weighted_sum;
    let random_factor = 0.9 + rand::thread_rng().gen::<f64>() * 0.2;

    base_score * random_factor
}

fn get_recommends_js(mut cx: FunctionContext) -> JsResult<JsArray> {
    let current_user_arg = cx.argument::<JsString>(0)?.value(&mut cx);
    let other_users_arg = cx.argument::<JsString>(1)?.value(&mut cx);
    let n = cx.argument::<JsNumber>(2)?.value(&mut cx) as usize;

    let base_user: User = serde_json::from_str(&current_user_arg).unwrap();
    let other_users: Vec<User> = serde_json::from_str(&other_users_arg).unwrap();

    // Create thread pool with optimal number of threads
    let num_threads = num_cpus::get();
    let processor = SongProcessor::new(num_threads);

    // Calculate average preferences
    let avg_prefs = Arc::new(calculate_avg_preferences(&base_user.songs));

    // Process users in parallel
    other_users.into_par_iter().for_each(|user| {
        processor.process_user(Arc::new(user), avg_prefs.clone());
    });

    // Collect and sort results
    let mut all_recommendations: Vec<RecommendedSong> = processor
        .results
        .iter()
        .flat_map(|entry| entry.value().clone())
        .collect();

    // Parallel sort with improved randomization
    all_recommendations.par_sort_unstable_by(|a, b| {
        let random_offset = (rand::thread_rng().gen::<f64>() - 0.5) * 0.05;
        (b.similarity_score + random_offset)
            .partial_cmp(&(a.similarity_score + random_offset))
            .unwrap()
    });

    // Take top N recommendations
    let recommendations: Vec<RecommendedSong> = all_recommendations.into_iter().take(n).collect();

    // Create JavaScript array
    let js_arr = JsArray::new(&mut cx, (recommendations.len() as u32).try_into().unwrap());
    for (i, song) in recommendations.iter().enumerate() {
        let obj = cx.empty_object();
        let id = cx.string(&song.id);
        obj.set(&mut cx, "id", id)?;
        let danceability = cx.number(song.danceability);
        obj.set(&mut cx, "danceability", danceability)?;
        let energy = cx.number(song.energy);
        obj.set(&mut cx, "energy", energy)?;
        let valence = cx.number(song.valence);
        obj.set(&mut cx, "valence", valence)?;
        let user_id = cx.string(&song.user_id);
        obj.set(&mut cx, "userId", user_id)?;
        let similar_score = cx.number(song.similarity_score);
        obj.set(&mut cx, "similarityScore", similar_score)?;
        js_arr.set(&mut cx, i as u32, obj)?;
    }

    Ok(js_arr)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getRecommendations", get_recommends_js)?;
    Ok(())
}
