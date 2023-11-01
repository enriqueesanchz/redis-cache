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

        if (typeof(id) === 'undefined' || typeof(kw) === 'undefined' || typeof(temp) === 'undefined') {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        await db('solar_plants').insert({ timestamp, id, kw, temp });

        res.status(201).json({ message: 'Succesfully created' });
    } catch (error) {
        console.error('Server error while creating', error);
        res.status(500).json({ error: 'Server error while creating' });
    }
});


app.listen(3000, async () => { //made this callback async so we can connect to redis client
    await redis.connect();
    console.log('Listening on port 3000')
});
