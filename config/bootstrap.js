/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */


const IORedis = require('ioredis');
const dayjs = require('dayjs')
const isoWeek = require('dayjs/plugin/isoWeek');
const weekOfYear = require('dayjs/plugin/weekOfYear');

// Extend Day.js with actual plugins
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
module.exports.bootstrap = async function () {
  sails.dayjs =dayjs;
  // Create a Redis client
  const redis = new IORedis({url: sails.config.redis.url});
  sails.redis = redis;

  sails.redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  redis.on('connect', () => {
    console.log('Connected to Redis server');
  })
}

