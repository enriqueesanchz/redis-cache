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

const main = async () => {
    const products = ['shirt', 'bag', 'jeans', 'coat', 'socks'];

    await Promise.all( //running the insertions concurrently
        Array.from({ length: 25000 }, (_, i) => i + 1) //creating a 25000 items empty array
            .map(id => {
                const title = products[Math.floor(Math.random() * products.length)]; // selecting random product title

                return db('products').insert({
                    id,
                    title,
                    purchases: Math.floor(Math.random() * 20000) //generating a random number of purchases
                });
            })
    );
    console.log('products inserted');
}

main();