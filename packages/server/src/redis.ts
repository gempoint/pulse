import { createClient } from 'redis';

let redis = await createClient({
  url: Bun.env.REDIS_URL,
})
  .on('ready', () => console.log("redis ready"))
  .on('error', err => console.log('redis error: ', err))
  .on('reconnecting', () => console.log('redis reconnecting smh'))
  .connect();

export default redis