export interface Song {
  song_id: string;
  danceability: number;
  energy: number;
  acousticness: number;
  valence: number;
  origin: string; // User ID of the song's origin
}

export interface User {
  user_id: string;
  songs: Song[];
}

type SongMetadata = [number, number, number, number]; // [danceability, energy, acousticness, valence]

export function calculateAverage(user: User): SongMetadata {
  const totalSongs = user.songs.length;
  const totals: SongMetadata = [0, 0, 0, 0];

  for (const song of user.songs) {
    totals[0] += song.danceability;
    totals[1] += song.energy;
    totals[2] += song.acousticness;
    totals[3] += song.valence;
  }

  return totals.map(total => total / totalSongs) as SongMetadata;
}

export async function findTopMatches(currentUser: User, otherUsers: User[], n: number): Promise<string[]> {
  const workerCount = navigator.hardwareConcurrency || 4; // Use available cores or default to 4
  const usersPerWorker = Math.ceil(otherUsers.length / workerCount);

  const workerPromises = [];
  for (let i = 0; i < workerCount; i++) {
    const start = i * usersPerWorker;
    const end = Math.min((i + 1) * usersPerWorker, otherUsers.length);
    const workerUsers = otherUsers.slice(start, end);

    const worker = new Worker(new URL("worker.ts", import.meta.url).href);;
    const promise = new Promise<{ userId: string, distance: number }[]>((resolve) => {
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
    });

    worker.postMessage({ currentUser, otherUsers: workerUsers });
    workerPromises.push(promise);
  }

  const results = await Promise.all(workerPromises);
  console.log(results);
  const allDistances = results.flat();
  allDistances.sort((a, b) => a.distance - b.distance);
  return allDistances.slice(0, n).map(match => match.userId);
}

//// Example usage
//const currentUser: User = {
//  user_id: "current_user_id",
//  songs: [
//    { song_id: "song_1", danceability: 0.8, energy: 0.6, acousticness: 0.2, valence: 0.7, origin: "current_user_id" },
//    { song_id: "song_2", danceability: 0.7, energy: 0.8, acousticness: 0.1, valence: 0.9, origin: "current_user_id" },
//  ]
//};

//const otherUsers: User[] = [
//  {
//    user_id: "user_1",
//    songs: [
//      { song_id: "song_3", danceability: 0.75, energy: 0.65, acousticness: 0.15, valence: 0.8, origin: "user_1" },
//      { song_id: "song_4", danceability: 0.85, energy: 0.7, acousticness: 0.1, valence: 0.85, origin: "user_1" },
//    ]
//  },
//  {
//    user_id: "user_2",
//    songs: [
//      { song_id: "song_5", danceability: 0.6, energy: 0.5, acousticness: 0.3, valence: 0.6, origin: "user_2" },
//      { song_id: "song_6", danceability: 0.5, energy: 0.4, acousticness: 0.4, valence: 0.5, origin: "user_2" },
//    ]
//  }
//];

//// Run multiple times to see different results
//for (let i = 0; i < 5; i++) {
//  findTopMatches(currentUser, otherUsers, 2).then(topMatches => {
//    console.log(`Run ${i + 1} - Top matches:`, topMatches);
//  });
//}
