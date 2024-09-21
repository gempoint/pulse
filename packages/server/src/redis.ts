import { createClient } from 'redis';

export default await createClient({
  url: Bun.env.REDIS_URL
})
  .on('error', err => console.log('Redis Client Error', err))
  .connect();