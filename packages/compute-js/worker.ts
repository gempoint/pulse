import {
  calculateAverage
} from './index'

type SongMetadata = [number, number, number, number];

function calculateDistance(average1: SongMetadata, average2: SongMetadata): number {
  return Math.sqrt(
    average1.reduce((sum, value, index) => {
      const diff = value - average2[index];
      return sum + diff * diff;
    }, 0)
  );
}

self.onmessage = (e: MessageEvent) => {
  const { currentUser, otherUsers } = e.data;
  const currentUserAverage = calculateAverage(currentUser);

  const distances = otherUsers.map(otherUser => {
    const otherUserAverage = calculateAverage(otherUser);
    const distance = calculateDistance(currentUserAverage, otherUserAverage);
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2;
    return { userId: otherUser.user_id, distance: distance * randomFactor };
  });

  self.postMessage(distances);
};