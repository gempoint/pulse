export interface Song {
  id: string;
  danceability: number;
  energy: number;
  acousticness: number;
  valence: number;
}

export interface User {
  id: string;
  songs: Song[];
}

export interface RecommendedSong extends Song {
  userId: string;
  similarityScore: number;
}

export function getRecommendations(
  baseUser: User,
  otherUsers: User[],
  limit: number
): RecommendedSong[] {
  // Calculate average preferences for base user
  const basePreferences = baseUser.songs.reduce(
    (acc, song) => ({
      danceability: acc.danceability + song.danceability,
      energy: acc.energy + song.energy,
      acousticness: acc.acousticness + song.acousticness,
      valence: acc.valence + song.valence,
    }),
    { danceability: 0, energy: 0, acousticness: 0, valence: 0 }
  );

  const songCount = baseUser.songs.length;
  const avgPreferences = {
    danceability: basePreferences.danceability / songCount,
    energy: basePreferences.energy / songCount,
    acousticness: basePreferences.acousticness / songCount,
    valence: basePreferences.valence / songCount,
  };

  // Calculate similarity scores for all songs from other users
  const allPotentialSongs: RecommendedSong[] = otherUsers.flatMap((user) =>
    user.songs.map((song) => {
      // Calculate base similarity score
      const similarityScore =
        1 -
        (Math.abs(avgPreferences.danceability - song.danceability) +
          Math.abs(avgPreferences.energy - song.energy) +
          Math.abs(avgPreferences.acousticness - song.acousticness) +
          Math.abs(avgPreferences.valence - song.valence)) /
        4;

      // Add controlled randomness (±10% variation)
      const randomFactor = 0.9 + Math.random() * 0.2; // Random number between 0.9 and 1.1
      const finalScore = similarityScore * randomFactor;

      return {
        ...song,
        userId: user.id,
        similarityScore: finalScore,
      };
    })
  );

  // Filter out songs that are too different (similarity score < 0.5)
  const filteredSongs = allPotentialSongs.filter(
    (song) => song.similarityScore >= 0.5
  );

  // Sort by similarity score and add randomness to the selection
  const sortedSongs = filteredSongs.sort((a, b) => {
    // Add small random factor to break ties and add variety
    const randomOffset = (Math.random() - 0.5) * 0.1; // ±5% random variation
    return b.similarityScore + randomOffset - (a.similarityScore + randomOffset);
  });

  // Return top N recommendations
  return sortedSongs.slice(0, limit);
}

// Helper function to get diversity score of recommendations
function getDiversityScore(recommendations: RecommendedSong[]): number {
  if (recommendations.length <= 1) return 1;

  let totalVariance = 0;
  const features = ['danceability', 'energy', 'acousticness', 'valence'] as const;

  features.forEach((feature) => {
    const values = recommendations.map((song) => song[feature]);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    totalVariance += variance;
  });

  return Math.min(1, totalVariance / features.length);
}

// Example usage:
// const baseUser: User = {
//   id: "user1",
//   songs: [
//     {
//       id: "song1",
//       danceability: 0.8,
//       energy: 0.7,
//       acousticness: 0.2,
//       valence: 0.6
//     }
//   ]
// };
// 
// const otherUsers: User[] = [/* ... */];
// const recommendations = getRecommendations(baseUser, otherUsers, 5);