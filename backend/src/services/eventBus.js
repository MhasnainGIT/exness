const EventEmitter = require('events');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');
const Redis = require('ioredis');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.publisher = redis;
    this.subscriber = null;
    this.errorLogged = false;

    if (process.env.REDIS_URL) {
      this.subscriber = new Redis(process.env.REDIS_URL, { 
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          if (times > 1 && process.env.NODE_ENV === 'development') {
             this.errorLogged = true;
             return 60000;
          }
          return 1000;
        }
      });
      
      this.subscriber.on('connect', () => {
        logger.info('[EventBus] Redis subscriber connected');
        this.errorLogged = false;
      });

      this.subscriber.on('error', (err) => {
        if (!this.errorLogged || process.env.NODE_ENV === 'production') {
           logger.error(`[EventBus] Subscriber error: ${err.message}`);
           if (process.env.NODE_ENV === 'development') this.errorLogged = true;
        }
      });

      this.subscriber.on('message', (channel, message) => {
        try {
          const data = JSON.parse(message);
          super.emit(channel, data);
        } catch (error) {
          logger.error(`[EventBus] Error parsing Redis message:`, error);
        }
      });
    }
  }

  publish(channel, data) {
    super.emit(channel, data);

    if (this.publisher && this.publisher.status === 'ready') {
      this.publisher.publish(channel, JSON.stringify(data)).catch(() => {});
    }
  }

  subscribe(channel, handler) {
    this.on(channel, handler);
    if (this.subscriber) {
      this.subscriber.subscribe(channel).catch(() => {});
    }
  }

  unsubscribe(channel, handler) {
    this.off(channel, handler);
  }

  emit(channel, data) {
    this.publish(channel, data);
  }

  async stop() {
    if (this.subscriber) {
      await this.subscriber.quit().catch(() => this.subscriber.disconnect());
    }
  }
}

module.exports = new EventBus();
