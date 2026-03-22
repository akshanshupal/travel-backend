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
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const APP_TIME_ZONE = 'Asia/Kolkata';

// Extend Day.js with actual plugins
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(APP_TIME_ZONE);

const sailsDayjs = (...args) => {
  if (args.length === 1 && typeof args[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(args[0])) {
    return dayjs.tz(args[0], APP_TIME_ZONE);
  }
  return dayjs(...args).tz(APP_TIME_ZONE);
};
Object.assign(sailsDayjs, dayjs);
module.exports.bootstrap = async function () {
  sails.dayjs = sailsDayjs;
  // Create a Redis client
  const redis = new IORedis(sails.config.redis.url);
  sails.redis = redis;

  sails.redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });

  redis.on('connect', () => {
    console.log('Connected to Redis server');
  })
}
