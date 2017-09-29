const { Client } = require('pg');

try 
{
	var dbinfo = require('./connection_string') || "";
}
catch(e)
{
	dbinfo = "";
}

var connectionString = process.env.DATABASE_URL || dbinfo.URI

const client = new Client({
  connectionString: connectionString,
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