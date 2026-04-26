const Redis = require("ioredis");
const { env } = require("./env");

const getLogger = () => {
  try { return require("../utils/logger"); } catch (e) { return console; }
};

let redis = null;
let errorLogged = false;

if (env.redisUrl) {
  redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 1) {
        if (!errorLogged && env.nodeEnv === 'development') {
           getLogger().warn('[Redis] Not connected. Operating in local memory mode.');
           errorLogged = true;
        }
        return env.nodeEnv === 'development' ? 60000 : Math.min(times * 1000, 30000); 
      }
      return 1000;
    },
  });

  redis.on("error", (err) => {
    if (env.nodeEnv === 'production' || !errorLogged) {
       getLogger().error(`[Redis] Connection error: ${err.message}`);
       if (env.nodeEnv === 'development') errorLogged = true;
    }
  });

  redis.on("connect", () => {
    getLogger().info("[Redis] Connection established");
    errorLogged = false;
  });
}

module.exports = { redis };
