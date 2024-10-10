use neon::prelude::*;
use rand::Rng;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Song {
    song_id: String,
    danceability: f64,
    energy: f64,
    acousticness: f64,
    valence: f64,
    origin: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct User {
    user_id: String,
    songs: Vec<Song>,
}

type SongMetadata = [f64; 4];

fn calculate_average(user: &User) -> SongMetadata {
    let total_songs = user.songs.len() as f64;
    let mut totals = [0.0; 4];

    for song in &user.songs {
        totals[0] += song.danceability;
        totals[1] += song.energy;
        totals[2] += song.acousticness;
        totals[3] += song.valence;
    }

    [
        totals[0] / total_songs,
        totals[1] / total_songs,
        totals[2] / total_songs,
        totals[3] / total_songs,
    ]
}

fn calculate_distance(average1: &SongMetadata, average2: &SongMetadata) -> f64 {
    average1
        .iter()
        .zip(average2.iter())
        .map(|(&a, &b)| (a - b).powi(2))
        .sum::<f64>()
        .sqrt()
}

fn find_top_matches(current_user: &User, other_users: &[User], n: usize) -> Vec<String> {
    let current_user_average = calculate_average(current_user);

    let distances: Vec<(String, f64)> = other_users
        .par_iter()
        .map(|other_user| {
            let other_user_average = calculate_average(other_user);
            let distance = calculate_distance(&current_user_average, &other_user_average);
            let mut rng = rand::thread_rng();
            let random_factor = 1.0 + (rng.gen::<f64>() - 0.5) * 0.2;
            (other_user.user_id.clone(), distance * random_factor)
        })
        .collect();

    let mut distances = distances;
    distances.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap());
    distances
        .into_iter()
        .take(n)
        .map(|(user_id, _)| user_id)
        .collect()
}

fn find_top_matches_js(mut cx: FunctionContext) -> JsResult<JsArray> {
    let current_user_arg = cx.argument::<JsString>(0)?.value(&mut cx);
    let other_users_arg = cx.argument::<JsString>(1)?.value(&mut cx);
    let n = cx.argument::<JsNumber>(2)?.value(&mut cx) as usize;

    let current_user: User = serde_json::from_str(&current_user_arg).unwrap();
    let other_users: Vec<User> = serde_json::from_str(&other_users_arg).unwrap();

    let top_matches = find_top_matches(&current_user, &other_users, n);

    let js_array = JsArray::new(&mut cx, (top_matches.len() as u32).try_into().unwrap());
    for (i, user_id) in top_matches.iter().enumerate() {
        let js_string = cx.string(user_id);
        js_array.set(&mut cx, i as u32, js_string)?;
    }

    Ok(js_array)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("findTopMatches", find_top_matches_js)?;
    Ok(())
}
