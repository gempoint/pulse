import KeyvRedis from '@keyv/redis';

const keyv = new Keyv(new KeyvRedis('redis://user:pass@localhost:6379'));