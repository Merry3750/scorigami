const { Client } = require('pg');
require('dotenv').load();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});


var request = require('request');

var url = 'https://www.pro-football-reference.com/boxscores/game-scores.htm';

client.connect();

var id = 0;

// request(url, function(error, response, html)
// {
	// if(!error)
	// {
		// html = html.substr(html.indexOf('<tr >'), html.length);
		// var PTS_WIN_IDENTIFIER = 'data-stat="pts_win" >';
		// var PTS_LOSE_IDENTIFIER = 'data-stat="pts_lose" >';
		// var COUNTER_IDENTIFIER = 'data-stat="counter" >';
		// //cycle through table in the returned HTML string
		// while(html.indexOf('<tr >') >= 0)
		// {
			// html = html.substr(html.indexOf(PTS_WIN_IDENTIFIER) + PTS_WIN_IDENTIFIER.length, html.length);
			// var ptsWin = parseInt(html.substr(0, html.indexOf("</td>")));
			// html = html.substr(html.indexOf(PTS_LOSE_IDENTIFIER) + PTS_LOSE_IDENTIFIER.length, html.length);
			// var ptsLose = parseInt(html.substr(0, html.indexOf("</td>")));
			// html = html.substr(html.indexOf(COUNTER_IDENTIFIER) + COUNTER_IDENTIFIER.length, html.length);
			// var count = parseInt(html.substr(0, html.indexOf("</td>")));
			// html = html.substr(html.indexOf('<tr >'), html.length);
			
			// var queryString = "INSERT INTO scores VALUES (" + id + "," + ptsWin + "," + ptsLose + "," + count + ");";
			
			// client.query(queryString, (err, res) => {
				// if (err) throw err;
				// console.log(Date.now());
			// });
			
			// id++;
		// }
	// }
// });

// client.query("DELETE FROM scores", (err, res) => {
	// if (err) throw err;
	// console.log("finished");
// });

client.query('SELECT * FROM scores;', (err, res) => {
  if (err) throw err;
  for (let row of res.rows) {
    console.log(JSON.stringify(row));
  }
  client.end();
});

// client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  // if (err) throw err;
  // for (let row of res.rows) {
    // console.log(JSON.stringify(row));
  // }
  // client.end();
// });