const { Client } = require('pg');
var dbinfo = require('./connection_string'); || "";

console.log(process.env.DATABASE_URL);

var connectionString = process.env.DATABASE_URL || dbinfo.URI

const client = new Client({
  connectionString: dbinfo.URI || process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    //console.log(JSON.stringify(row));
  }
  client.end();
});