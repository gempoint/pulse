declare var self: Worker;

import * as Sentry from "@sentry/bun";

// will print out a shit ton of msgs to log goddamn
// Sentry.init({
//   dsn: Bun.env.SENTRY_DSN,
//   maxBreadcrumbs: 50,
//   debug: true,
// });

import redis from './redis';
import { REDIS_EXPIRE_KEY, REDIS_GEO_KEY } from './utils';

const expire = async () => {
  //console.log("running redis cleanup")
  try {
    const currentTime = Math.floor(Date.now() / 1000);

    const expiredLocations = await redis.zRangeByScore(REDIS_EXPIRE_KEY, 0, currentTime);

    for (const location of expiredLocations) {
      // Remove the expired location from the geo set
      await redis.zRem(REDIS_GEO_KEY, location);
      console.log(`Removed location ${location} from geo set`);

      // Remove the expired entry from the expiration sorted set
      await redis.zRem(REDIS_EXPIRE_KEY, location);
    }
  } catch (e) {
    Sentry.captureException(e);
  }

}

const interval = setInterval(expire, 10000);

