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

const { createClient } = require('redis');

module.exports.bootstrap = async function () {
    sails.client = createClient({ url: sails.config.redis.url });
    sails.client.on('error', (err) => console.log('Redis Client Error', err));

    await sails.client.connect();
};
