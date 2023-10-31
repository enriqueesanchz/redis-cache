const knex = require('knex');
const express = require('express')
const { createClient } = require('redis');

const db = knex({
    client: 'pg',
    connection: {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_IP,
        port: process.env.POSTGRES_PORT
    }
});

const app = express();
const redis = createClient({
    socket: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_IP,
      }
});

app.get('/', async (req, res) => {
    const cache = await redis.get('most-purchased-products');

    if (cache) {
        return res.send({ mostPurchased: JSON.parse(cache) });
    }

    const mostPurchased = await db('products').orderBy('purchases', 'desc').limit(20);
    await redis.setEx('most-purchased-products', 5, JSON.stringify(mostPurchased)); //setting an expiring time of 5 seconds to this cache

    res.send({ mostPurchased });
});

app.listen(3000, async () => { //made this callback async so we can connect to redis client
    await redis.connect();
    console.log('Listening on port 3000')
});
