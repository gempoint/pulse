// @ts-expect-error
//import { findTopMatches } from './index.node';
const napi = require('./index.node')

if (napi === undefined) {
  throw new Error('cargo didnt build!')
}

interface Song {
  song_id: string;
  danceability: number;
  energy: number;
  acousticness: number;
  valence: number;
  origin: string;
}

interface User {
  user_id: string;
  songs: Song[];
}

const { findTopMatches } = napi

//declare function findTopMatches(currentUser: string, otherUsers: string, limit: number): Song[]

export { findTopMatches };
export type { Song, User };
