//import { findTopMatches } from './index.node';
const napi = require('./index.node')

if (napi === undefined) {
  throw new Error('cargo didnt build!')
}

const { getRecommendations } = napi

//declare function findTopMatches(currentUser: string, otherUsers: string, limit: number): Song[]

export { getRecommendations };
//export type { Song, User };
