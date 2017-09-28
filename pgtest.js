const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query("INSERT INTO test (id, text) VALUES (0, 'hello, world');", (err, res) => {
	if (err) throw err;
	client.query('SELECT * FROM test;', (err, res) => {
	  if (err) throw err;
	  for (let row of res.rows) {
		console.log(JSON.stringify(row));
	  }
	  client.end();
	});
});