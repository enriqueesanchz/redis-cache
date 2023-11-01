const knex = require('knex');
const express = require('express')
const { createClient } = require('redis');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const db = knex({
    client: 'pg',
    connection: {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_IP,
        port: process.env.POSTGRES_PORT
    }
});

const redis = createClient({
    socket: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_IP,
    }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get the 20 highest kw records with caching
 *     description: Get the 20 highest kw records with caching
 *     responses:
 *       200:
 *         description: Succesfully obtained
 */
app.get('/', async (req, res) => {
    const cache = await redis.get('highest-production');

    if (cache) {
        return res.send({ highestProduction: JSON.parse(cache) });
    }

    const highestProduction = await db('solar_plants').orderBy('kw', 'desc').limit(20);
    await redis.setEx('highest-production', 5, JSON.stringify(highestProduction)); //setting an expiring time of 5 seconds to this cache

    res.send({ highestProduction });
});

/**
 * @swagger
 * /no-redis:
 *   get:
 *     summary: Get the 20 highest kw records without caching
 *     description: Get the 20 highest kw records without caching
 *     responses:
 *       200:
 *         description: Succesfully obtained
 */
app.get('/no-redis', async (req, res) => {
    const highestProduction = await db('solar_plants').orderBy('kw', 'desc').limit(20);
    res.send({ highestProduction });
});

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new record
 *     description: Create a new record in the database
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Solar plant id
 *               kw:
 *                 type: number
 *                 description: Kilowatts
 *               temp:
 *                 type: number
 *                 description: Celsius degrees
 *     responses:
 *       201:
 *         description: Succesfully created
 *       400:
 *         description: Required fields are missing
 *       500:
 *         description: Server error while creating
 */
app.post('/', async (req, res) => {
    try {
        const timestamp = new Date();
        const { id, kw, temp } = req.body;

        if (typeof (id) === 'undefined' || typeof (kw) === 'undefined' || typeof (temp) === 'undefined') {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        await db('solar_plants').insert({ timestamp, id, kw, temp });

        res.status(201).json({ message: 'Succesfully created' });
    } catch (error) {
        console.error('Server error while creating', error);
        res.status(500).json({ error: 'Server error while creating' });
    }
});

/**
 * @swagger
 * /no-redis/filter:
 *   get:
 *     summary: Get filtered random records without caching
 *     description: Retrieve random records from the database based on kw and temp criteria without caching
 *     responses:
 *       200:
 *         description: Successful response with filtered records.
 *       400:
 *         description: Bad request due to missing parameters.
 *       500:
 *         description: Server error while filtering records.
 */
app.get('/no-redis/filter', async (req, res) => {
    const kw = Math.floor(Math.random() * 10);
    const temp = Math.floor(25 + (Math.random() - 0.5) * 5);

    const filteredRecords = await db('solar_plants')
        .where('kw', '>=', kw)
        .where('temp', '<=', temp)
        .select('*')
        .orderBy('kw', 'desc')
        .limit(20);

    res.status(200).json(filteredRecords);

});

/**
 * @swagger
 * /filter:
 *   get:
 *     summary: Get filtered random records with caching
 *     description: Retrieve random records from the database based on kw and temp criteria with caching
 *     responses:
 *       200:
 *         description: Successful response with filtered records.
 *       400:
 *         description: Bad request due to missing parameters.
 *       500:
 *         description: Server error while filtering records.
 */
app.get('/filter', async (req, res) => {
    const kw = Math.floor(Math.random() * 9);
    const temp = Math.floor(25 + (Math.random() - 0.5) * 5);

    const cache = await redis.get(`${kw}-${temp}`);

    if (cache) {
        return res.send({ filteredRecords: JSON.parse(cache) });
    }

    const filteredRecords = await db('solar_plants')
        .where('kw', '>=', kw)
        .where('temp', '<=', temp)
        .select('*')
        .orderBy('kw', 'desc')
        .limit(20);

    await redis.setEx(`${kw}-${temp}`, 10, JSON.stringify(filteredRecords)); //setting an expiring time of 10 seconds to this cache

    res.status(200).json(filteredRecords);

});

app.listen(3000, async () => { //made this callback async so we can connect to redis client
    await redis.connect();
    console.log('Listening on port 3000')
});
