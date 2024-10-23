import { createClient } from 'redis';

let redis = await createClient({
  url: Bun.env.REDIS_URL
})
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

// for debugging but might cause security issue?
global.redis = redis
export default redis