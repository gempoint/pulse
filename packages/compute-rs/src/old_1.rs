use neon::prelude::*;
use rand::Rng;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::ops::Div;

fn log<'a>(cx: &mut FunctionContext<'a>, str: String) -> JsResult<'a, JsUndefined> {
    // Get the message argument
    //let message = cx.argument::<JsString>(0)?.value(&mut cx);

    let console: Handle<JsObject> = cx.global("console")?;
    let log: Handle<JsFunction> = console.get(cx, "log")?;

    // Get log function from console
    let s = cx.string(str);
    log.call_with(cx).arg(s).exec(cx)?;

    // Return undefined
    Ok(cx.undefined())
}

fn start_puffin_server() {
    puffin::set_scopes_on(true); // tell puffin to collect data

    match puffin_http::Server::new("127.0.0.1:8585") {
        Ok(puffin_server) => {
            //log::info!("Run:  cargo install puffin_viewer && puffin_viewer --url 127.0.0.1:8585");

            std::process::Command::new("puffin_viewer")
                .arg("--url")
                .arg("127.0.0.1:8585")
                .spawn()
                .ok();

            // We can store the server if we want, but in this case we just want
            // it to keep running. Dropping it closes the server, so let's not drop it!
            #[allow(clippy::mem_forget)]
            std::mem::forget(puffin_server);
        }
        Err(err) => {
            //log::error!("Failed to start puffin server: {err}");
        }
    };
}

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

// New helper function to calculate average preferences
fn calculate_avg_preferences(songs: &[Song]) -> SongMetadata {
    let song_count = songs.len() as f64;

    // Use parallel iterator to sum all songs
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

// New helper function to calculate similarity score
fn calculate_similarity_score(avg_prefs: &SongMetadata, song: &Song) -> f64 {
    let base_score = 1.0
        - ((avg_prefs.danceability - song.danceability).abs()
            + (avg_prefs.energy - song.energy).abs()
            + (avg_prefs.acousticness - song.acousticness).abs()
            + (avg_prefs.valence - song.valence).abs())
            / 4.0;

    let random_factor = 0.9 + rand::thread_rng().gen::<f64>() * 0.2;
    base_score * random_factor
}

fn get_recommends_js(mut cx: FunctionContext) -> JsResult<JsArray> {
    let current_user_arg = cx.argument::<JsString>(0)?.value(&mut cx);
    let other_users_arg = cx.argument::<JsString>(1)?.value(&mut cx);
    let n = cx.argument::<JsNumber>(2)?.value(&mut cx) as usize;
    log(&mut cx, "test".to_string());
    let base_user: User = serde_json::from_str(&current_user_arg).unwrap();
    let other_users: Vec<User> = serde_json::from_str(&other_users_arg).unwrap();

    // Calculate average preferences in parallel
    let avg_prefs = calculate_avg_preferences(&base_user.songs);

    // Process all potential songs in parallel
    let all_potential_songs: Vec<RecommendedSong> = other_users
        .par_iter() // Parallel iterator over users
        .flat_map(|user| {
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
                .collect::<Vec<_>>()
        })
        .filter(|song| song.similarity_score >= 0.5)
        .collect();

    // Sort in parallel using Rayon
    let mut sorted_songs = all_potential_songs;
    sorted_songs.par_sort_unstable_by(|a, b| {
        let random_offset = (rand::thread_rng().gen::<f64>() - 0.5) * 0.1;
        (b.similarity_score + random_offset)
            .partial_cmp(&(a.similarity_score + random_offset))
            .unwrap()
    });

    // Take top N recommendations
    let recommendations: Vec<RecommendedSong> = sorted_songs.into_iter().take(n).collect();

    // Create JavaScript array
    let js_arr = JsArray::new(&mut cx, (recommendations.len() as u32).try_into().unwrap());
    for (i, song) in recommendations.iter().enumerate() {
        let song_obj = song.to_object(&mut cx)?;
        js_arr.set(&mut cx, i as u32, song_obj)?;
    }
    puffin::profile_scope!("func");

    Ok(js_arr)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    start_puffin_server();
    cx.export_function("getRecommendations", get_recommends_js)?;
    Ok(())
}
