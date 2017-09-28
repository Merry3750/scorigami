const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('CREATE TABLE test (id INTEGER, text TEXT);', (err, res) => {
  if (err) throw err;

  client.end();
});