use neon::prelude::*;
use ocl::{Buffer, ProQue};
use rand::Rng;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::ops::Div;

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

// OpenCL kernel for calculating similarity scores
const KERNEL_SRC: &str = r#"
    __kernel void calculate_similarity(
        __global float4 *song_features,
        __global float4 *avg_preferences,
        __global float *similarity_scores,
        const int num_songs
    ) {
        int gid = get_global_id(0);
        if (gid < num_songs) {
            float4 diff = fabs(song_features[gid] - avg_preferences[0]);
            float score = 1.0f - (diff.x + diff.y + diff.z + diff.w) / 4.0f;
            similarity_scores[gid] = score;
        }
    }
"#;

impl RecommendedSong {
    fn to_object<'a>(&self, cx: &mut FunctionContext<'a>) -> JsResult<'a, JsObject> {
        let obj = cx.empty_object();
        let id = cx.string(&self.id);
        obj.set(cx, "id", id)?;
        let danceability = cx.number(self.danceability);
        obj.set(cx, "danceability", danceability)?;
        let energy = cx.number(self.energy);
        obj.set(cx, "energy", energy)?;
        let valence = cx.number(self.valence);
        obj.set(cx, "valence", valence)?;
        let user_id = cx.string(&self.user_id);
        obj.set(cx, "userId", user_id)?;
        let similar_score = cx.number(self.similarity_score);
        obj.set(cx, "similarityScore", similar_score)?;
        Ok(obj)
    }
}

fn calculate_avg_preferences(songs: &[Song]) -> SongMetadata {
    let song_count = songs.len() as f64;

    // Using rayon for parallel CPU calculation of averages
    let base_preferences = songs
        .par_iter()
        .fold(
            || SongMetadata {
                danceability: 0.0,
                energy: 0.0,
                acousticness: 0.0,
                valence: 0.0,
            },
            |acc, song| SongMetadata {
                danceability: acc.danceability + song.danceability,
                energy: acc.energy + song.energy,
                acousticness: acc.acousticness + song.acousticness,
                valence: acc.valence + song.valence,
            },
        )
        .reduce(
            || SongMetadata {
                danceability: 0.0,
                energy: 0.0,
                acousticness: 0.0,
                valence: 0.0,
            },
            |a, b| SongMetadata {
                danceability: a.danceability + b.danceability,
                energy: a.energy + b.energy,
                acousticness: a.acousticness + b.acousticness,
                valence: a.valence + b.valence,
            },
        );

    SongMetadata {
        danceability: base_preferences.danceability.div(song_count),
        energy: base_preferences.energy.div(song_count),
        acousticness: base_preferences.acousticness.div(song_count),
        valence: base_preferences.valence.div(song_count),
    }
}

fn calculate_gpu_similarity_scores(
    songs: &[Song],
    avg_prefs: &SongMetadata,
) -> ocl::Result<Vec<f32>> {
    // Initialize OpenCL
    let pro_que = ProQue::builder()
        .src(KERNEL_SRC)
        .dims(songs.len())
        .build()?;

    // Prepare song features for GPU processing
    let song_features: Vec<[f32; 4]> = songs
        .iter()
        .map(|song| {
            [
                song.danceability as f32,
                song.energy as f32,
                song.acousticness as f32,
                song.valence as f32,
            ]
        })
        .collect();

    // Create GPU buffers
    let song_buffer = Buffer::builder()
        .queue(pro_que.queue().clone())
        .flags(ocl::MemFlags::new().read_only())
        .len(songs.len())
        .copy_host_slice(&song_features)
        .build()?;

    let avg_prefs_buffer = Buffer::builder()
        .queue(pro_que.queue().clone())
        .flags(ocl::MemFlags::new().read_only())
        .len(1)
        .copy_host_slice(&[[
            avg_prefs.danceability as f32,
            avg_prefs.energy as f32,
            avg_prefs.acousticness as f32,
            avg_prefs.valence as f32,
        ]])
        .build()?;

    let similarity_buffer = Buffer::builder()
        .queue(pro_que.queue().clone())
        .flags(ocl::MemFlags::new().write_only())
        .len(songs.len())
        .build()?;

    // Create and execute kernel
    let kernel = pro_que
        .kernel_builder("calculate_similarity")
        .arg(&song_buffer)
        .arg(&avg_prefs_buffer)
        .arg(&similarity_buffer)
        .arg(songs.len() as i32)
        .build()?;

    unsafe {
        kernel.enq()?;
    }

    // Read results back from GPU
    let mut similarity_scores = vec![0.0f32; songs.len()];
    similarity_buffer.read(&mut similarity_scores).enq()?;

    Ok(similarity_scores)
}

fn get_recommends_js(mut cx: FunctionContext) -> JsResult<JsArray> {
    let current_user_arg = cx.argument::<JsString>(0)?.value(&mut cx);
    let other_users_arg = cx.argument::<JsString>(1)?.value(&mut cx);
    let n = cx.argument::<JsNumber>(2)?.value(&mut cx) as usize;

    let base_user: User = serde_json::from_str(&current_user_arg).unwrap();
    let other_users: Vec<User> = serde_json::from_str(&other_users_arg).unwrap();

    // Calculate average preferences
    let avg_prefs = calculate_avg_preferences(&base_user.songs);

    // Collect all songs from other users
    let all_songs: Vec<(String, Song)> = other_users
        .par_iter()
        .flat_map(|user| {
            user.songs
                .iter()
                .map(|song| (user.id.clone(), song.clone()))
                .collect::<Vec<_>>()
        })
        .collect();

    // Calculate similarity scores using GPU
    let similarity_scores = calculate_gpu_similarity_scores(
        &all_songs
            .iter()
            .map(|(_, song)| song.clone())
            .collect::<Vec<_>>(),
        &avg_prefs,
    )
    .unwrap();

    // Create recommendations with GPU-calculated scores
    let mut recommendations: Vec<RecommendedSong> = all_songs
        .into_iter()
        .zip(similarity_scores)
        .filter(|(_, score)| *score >= 0.5)
        .map(|((user_id, song), score)| RecommendedSong {
            id: song.id,
            danceability: song.danceability,
            energy: song.energy,
            acousticness: song.acousticness,
            valence: song.valence,
            user_id,
            similarity_score: score as f64,
        })
        .collect();

    // Sort recommendations (keeping this on CPU as it's not parallelizable on GPU)
    recommendations.par_sort_unstable_by(|a, b| {
        let random_offset = (rand::thread_rng().gen::<f64>() - 0.5) * 0.1;
        (b.similarity_score + random_offset)
            .partial_cmp(&(a.similarity_score + random_offset))
            .unwrap()
    });

    // Take top N recommendations
    let final_recommendations: Vec<RecommendedSong> = recommendations.into_iter().take(n).collect();

    // Create JavaScript array
    let js_arr = JsArray::new(
        &mut cx,
        (final_recommendations.len() as u32).try_into().unwrap(),
    );
    for (i, song) in final_recommendations.iter().enumerate() {
        let song_obj = song.to_object(&mut cx)?;
        js_arr.set(&mut cx, i as u32, song_obj)?;
    }

    Ok(js_arr)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("getRecommendations", get_recommends_js)?;
    Ok(())
}
