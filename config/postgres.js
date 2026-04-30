const { Client } = require('pg');

const pgClient = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'fixora_pg',
    password: 'rekha@2007', // yaha apna pgAdmin/PostgreSQL password daalo
    port: 5432
});

pgClient.connect()
    .then(() => console.log('✅ PostgreSQL Connected'))
    .catch((err) => console.error('❌ PostgreSQL connection error:', err.message));

module.exports = pgClient;