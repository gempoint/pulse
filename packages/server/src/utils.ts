import axios from 'axios';
export const a = axios.create({
  headers: {
    'User-Agent': 'Pulse-API (idk)'
  }
})

export const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SECRET } = Bun.env
export const SPOTIFY_ACCOUNTS_ENDPOINT = "https://accounts.spotify.com";
export const AUTH_SECRET = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
export const AUTH_HEADER = `Basic ${AUTH_SECRET}`;

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};
