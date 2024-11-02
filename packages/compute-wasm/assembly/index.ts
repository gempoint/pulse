// Import necessary AssemblyScript core modules
//import { JSON } from "assemblyscript/json";
//import { JSON } from "assemblyscript-json"
import * as console from "as-console";

// Define the data structures
class Song {
  id: string;
  danceability: f64;
  energy: f64;
  acousticness: f64;
  valence: f64;

  constructor(id: string, danceability: f64, energy: f64, acousticness: f64, valence: f64) {
    this.id = id;
    this.danceability = danceability;
    this.energy = energy;
    this.acousticness = acousticness;
    this.valence = valence;
  }
}

class SongMetadata {
  danceability: f64;
  energy: f64;
  acousticness: f64;
  valence: f64;

  constructor(danceability: f64, energy: f64, acousticness: f64, valence: f64) {
    this.danceability = danceability;
    this.energy = energy;
    this.acousticness = acousticness;
    this.valence = valence;
  }
}

class User {
  id: string;
  songs: Song[];

  constructor(id: string, songs: Song[]) {
    this.id = id;
    this.songs = songs;
  }
}

class RecommendedSong extends Song {
  userId: string;
  similarityScore: f64;

  constructor(
    id: string,
    danceability: f64,
    energy: f64,
    acousticness: f64,
    valence: f64,
    userId: string,
    similarityScore: f64
  ) {
    super(id, danceability, energy, acousticness, valence);
    this.userId = userId;
    this.similarityScore = similarityScore;
  }
}

// Helper function to calculate average preferences
function calculateAvgPreferences(songs: Song[]): SongMetadata {
  const songCount = f64(songs.length);
  let totalDanceability: f64 = 0;
  let totalEnergy: f64 = 0;
  let totalAcousticness: f64 = 0;
  let totalValence: f64 = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    totalDanceability += song.danceability;
    totalEnergy += song.energy;
    totalAcousticness += song.acousticness;
    totalValence += song.valence;
  }

  return new SongMetadata(
    totalDanceability / songCount,
    totalEnergy / songCount,
    totalAcousticness / songCount,
    totalValence / songCount
  );
}

// Helper function to calculate similarity score
function calculateSimilarityScore(avgPrefs: SongMetadata, song: Song): f64 {
  const baseScore: f64 = 1.0 - (
    Math.abs(avgPrefs.danceability - song.danceability) +
    Math.abs(avgPrefs.energy - song.energy) +
    Math.abs(avgPrefs.acousticness - song.acousticness) +
    Math.abs(avgPrefs.valence - song.valence)
  ) / 4.0;

  // Add small random variation (0.9 to 1.1)
  const randomFactor: f64 = 0.9 + Math.random() * 0.2;
  return baseScore * randomFactor;
}

// Main recommendation function
export function getRecommendations(currentUserJson: string, otherUsersJson: string, n: i32): string {
  // Parse JSON input
  const currentUser = JSON.parse<User>(currentUserJson);
  const otherUsers = JSON.parse<User[]>(otherUsersJson);

  // Calculate average preferences
  const avgPrefs = calculateAvgPreferences(currentUser.songs);

  // Process all potential songs
  const allPotentialSongs: RecommendedSong[] = [];

  for (let i = 0; i < otherUsers.length; i++) {
    const user = otherUsers[i];
    for (let j = 0; j < user.songs.length; j++) {
      const song = user.songs[j];
      const similarityScore = calculateSimilarityScore(avgPrefs, song);

      if (similarityScore >= 0.5) {
        allPotentialSongs.push(
          new RecommendedSong(
            song.id,
            song.danceability,
            song.energy,
            song.acousticness,
            song.valence,
            user.id,
            similarityScore
          )
        );
      }
    }
  }

  // Sort songs by similarity score (with small random variation)
  allPotentialSongs.sort((a, b) => {
    const randomOffset = (Math.random() - 0.5) * 0.1;
    return f64(b.similarityScore + randomOffset - (a.similarityScore + randomOffset));
  });

  // Take top N recommendations
  const recommendations = allPotentialSongs.slice(0, n);

  // Convert to JSON string and return
  return JSON.stringify(recommendations);
}

// Export the function for use in JavaScript
export function getRecommendationsWrapped(currentUserJson: string, otherUsersJson: string, n: i32): string {
  try {
    return getRecommendations(currentUserJson, otherUsersJson, n);
  } catch (e) {
    Console.log("Error in getRecommendations: " + e.message);
    return "[]";
  }
}