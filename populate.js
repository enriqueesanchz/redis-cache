const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        host: process.env.POSTGRES_IP,
        port: process.env.POSTGRES_PORT
    }
});

function generateTimestampsArray() {
    const timestamps = [];
    const now = new Date();
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutos en milisegundos

    for (let i = 0; i < 25000; i++) {
        const timestamp = new Date(now - (i * fifteenMinutes));
        timestamps.push(timestamp);
    }

    return timestamps;
}

const main = async () => {
    const timestampsArray = generateTimestampsArray();
    const ids = [1, 2, 3];
    const insertPromises = [];

    for (const id of ids) {
        insertPromises.push(
            Promise.all(
                timestampsArray.map(timestamp => {
                    return db('solar_plants').insert({
                        timestamp,
                        id,
                        kw: Math.random() * 10, ///generating a random number of purchases
                        temp: 25 + (Math.random() - 0.5) * 25 //generating a random number of purchases
                    });
                })
            )
        );
    }

    await Promise.all(insertPromises);
    console.log('inserted');
}

main();