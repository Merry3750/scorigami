"use strict";

const { Client } = require("pg");
require("dotenv").load();

var scoresTable = "scores";
var metadataTable = "metadata";

if(process.env.DEBUG)
{
	console.log("DEBUG");
	scoresTable = "scores_DEBUG";
	metadataTable = "metadata_DEBUG";
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});


var request = require("request");

client.connect();

// var url = "https://www.pro-football-reference.com/boxscores/game-scores.htm";

// request(url, function(error, response, html)
// {
// 	if(!error)
// 	{
// 		html = html.substr(html.indexOf("<tr >"), html.length);
// 		var PTS_WIN_IDENTIFIER = "data-stat=\"pts_win\" >";
// 		var PTS_LOSE_IDENTIFIER = "data-stat=\"pts_lose\" >";
// 		var COUNTER_IDENTIFIER = "data-stat=\"counter\" >";
// 		//cycle through table in the returned HTML string
// 		while(html.indexOf("<tr >") >= 0)
// 		{
// 			html = html.substr(html.indexOf(PTS_WIN_IDENTIFIER) + PTS_WIN_IDENTIFIER.length, html.length);
// 			var ptsWin = parseInt(html.substr(0, html.indexOf("</td>")));
// 			html = html.substr(html.indexOf(PTS_LOSE_IDENTIFIER) + PTS_LOSE_IDENTIFIER.length, html.length);
// 			var ptsLose = parseInt(html.substr(0, html.indexOf("</td>")));
// 			html = html.substr(html.indexOf(COUNTER_IDENTIFIER) + COUNTER_IDENTIFIER.length, html.length);
// 			var count = parseInt(html.substr(0, html.indexOf("</td>")));
// 			html = html.substr(html.indexOf("<tr >"), html.length);
			
// 			//var queryString = "UPDATE " + scoresTable + " SET count=" + count + " WHERE (pts_win=" + ptsWin + " AND pts_lose=" + ptsLose + ");";
// 			var queryString = "INSERT INTO " + scoresTable + "(count, pts_win, pts_lose) VALUES (" + count + " , " + ptsWin + " , " + ptsLose + ");";

// 			console.log(queryString);
			
// 			client.query(queryString, (err, res) => {
// 				if (err) throw err;
// 				console.log(Date.now());
// 			});
// 		}
// 	}
// });

// client.query("DELETE FROM " + scoresTable, (err, res) => {
// 	if (err) throw err;
// 	console.log("finished");
// });
			
// client.query("UPDATE " + scoresTable + " SET last_link='https://www.pro-football-reference.com/boxscores/201712030sdg.htm' WHERE (pts_win=" + 19 + " AND pts_lose=" + 10 + ");", (err, res) => {
// 	if (err) throw err;
// 	console.log(Date.now());
// 	client.end();
// });

// client.query("SELECT * FROM " + scoresTable + ";", (err, res) => {
// 	if (err) throw err;
// 	console.log(res.rows);
// 	for (let row of res.rows) 
// 	{
// 		console.log(JSON.stringify(row));
// 		console.log();
// 	}
// 	client.end();
// });

// client.query("SELECT * FROM " + metadataTable + ";", (err, res) => {
// 	if (err) throw err;
// 	for (let row of res.rows) 
// 	{
// 		console.log(JSON.stringify(row));
// 		console.log();
// 	}
// 	client.end();
// });

// client.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
  // if (err) throw err;
  // for (let row of res.rows) {
    // console.log(JSON.stringify(row));
  // }
  // client.end();
// });


// var queryString = "ALTER TABLE " + scoresTable + " ADD COLUMN IF NOT EXISTS last_date DATE, ADD COLUMN IF NOT EXISTS last_team_win TEXT, ADD COLUMN IF NOT EXISTS last_team_lose TEXT, ADD COLUMN IF NOT EXISTS last_team_home TEXT, ADD COLUMN IF NOT EXISTS last_team_away TEXT, ADD COLUMN IF NOT EXISTS last_link TEXT, ADD COLUMN IF NOT EXISTS first_date DATE, ADD COLUMN IF NOT EXISTS first_team_win TEXT, ADD COLUMN IF NOT EXISTS first_team_lose TEXT, ADD COLUMN IF NOT EXISTS first_team_home TEXT, ADD COLUMN IF NOT EXISTS first_team_away TEXT, ADD COLUMN IF NOT EXISTS first_link TEXT"
// client.query(queryString, (err, res) => {
	// if (err) throw err;
	// console.log("finished");
	// client.end();
// });

var rows;
var index = 0;
var done = 0;

client.query("SELECT * FROM " + scoresTable + ";", (err, res) => {
	if (err) throw err;
	rows = res.rows;
	nextRequest();
});

 /*exported nextRequest */
function nextRequest()
{
	var row = rows[index];
	var pts_win = row.pts_win;
	var pts_lose = row.pts_lose;
	
	var url = "https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + pts_win + "&pts_lose=" + pts_lose;
	
	console.log("" + (index + 1) + " out of " + rows.length);
	console.log(url);

	request(url, function(error, response, html)
	{
		if(!error)
		{
			//console.log(html);
			html = html.substr(html.indexOf("<tr >"), html.length);
			var DATE_IDENTIFIER1 = "data-stat=\"game_date\"";
			var DATE_IDENTIFIER2 = "\" >";
			var TM_WIN_IDENTIFIER = "data-stat=\"winner\" >";
			var LOCATION_IDENTIFIER = "data-stat=\"game_location\" >";
			var TM_LOSE_IDENTIFIER = "data-stat=\"loser\" >";
			var LINK_IDENTIFIER = "data-stat=\"boxscore_word\" >";
			var PTS_WIN_IDENTIFIER = "data-stat=\"pts_win\" >";
			var PTS_LOSE_IDENTIFIER = "data-stat=\"pts_lose\" >";
			
			html = html.substr(html.indexOf(DATE_IDENTIFIER1) + DATE_IDENTIFIER1.length, html.length);
			html = html.substr(html.indexOf(DATE_IDENTIFIER2) + DATE_IDENTIFIER2.length, html.length);
			var first_date = html.substr(0, html.indexOf("</td>"));
			html = html.substr(html.indexOf(TM_WIN_IDENTIFIER) + TM_WIN_IDENTIFIER.length, html.length);
			var first_team_win = parseTeam(html.substr(0, html.indexOf("</td>")));
			html = html.substr(html.indexOf(LOCATION_IDENTIFIER) + LOCATION_IDENTIFIER.length, html.length);
			var away_win = html.substr(0, html.indexOf("</td>")) === "@";
			html = html.substr(html.indexOf(TM_LOSE_IDENTIFIER) + TM_LOSE_IDENTIFIER.length, html.length);
			var first_team_lose = parseTeam(html.substr(0, html.indexOf("</td>")));
			var first_team_home;
			var first_team_away;
			if(away_win)
			{
				first_team_away = first_team_win;
				first_team_home = first_team_lose;
			}
			else
			{
				first_team_away = first_team_lose;
				first_team_home = first_team_win;
			}
			html = html.substr(html.indexOf(LINK_IDENTIFIER) + LINK_IDENTIFIER.length, html.length);
			var first_link = parseLink(html.substr(0, html.indexOf("</td>")));
			
			html = html.substr(html.indexOf(PTS_WIN_IDENTIFIER) + PTS_WIN_IDENTIFIER.length, html.length);
			var pts_win2 = html.substr(0, html.indexOf("</td>"));
			if(pts_win2.indexOf("<strong>") >= 0)
			{
				pts_win2 = pts_win2.substr(pts_win2.indexOf("<strong>") + 8, pts_win2.length);
				pts_win2 = pts_win2.substr(0, pts_win2.indexOf("</strong>"));
			}
			pts_win2 = parseInt(pts_win2);
			
			
			
			html = html.substr(html.indexOf(PTS_LOSE_IDENTIFIER) + PTS_LOSE_IDENTIFIER.length, html.length);
			var pts_lose2 = parseInt(html.substr(0, html.indexOf("</td>")));
			
			
			
			var last_date = first_date;
			var last_team_win = first_team_win;
			var last_team_lose = first_team_lose;
			var last_team_home = first_team_home;
			var last_team_away = first_team_away;
			var last_link = first_link;
			
			//cycle through table in the returned HTML string
			while(html.indexOf("<tr >") >= 0)
			{
				html = html.substr(html.indexOf(DATE_IDENTIFIER1) + DATE_IDENTIFIER1.length, html.length);
				html = html.substr(html.indexOf(DATE_IDENTIFIER2) + DATE_IDENTIFIER2.length, html.length);
				last_date = html.substr(0, html.indexOf("</td>"));
				html = html.substr(html.indexOf(TM_WIN_IDENTIFIER) + TM_WIN_IDENTIFIER.length, html.length);
				last_team_win = parseTeam(html.substr(0, html.indexOf("</td>")));
				html = html.substr(html.indexOf(LOCATION_IDENTIFIER) + LOCATION_IDENTIFIER.length, html.length);
				away_win = html.substr(0, html.indexOf("</td>")) === "@";
				html = html.substr(html.indexOf(TM_LOSE_IDENTIFIER) + TM_LOSE_IDENTIFIER.length, html.length);
				last_team_lose = parseTeam(html.substr(0, html.indexOf("</td>")));
				if(away_win)
				{
					last_team_away = last_team_win;
					last_team_home = last_team_lose;
				}
				else
				{
					last_team_away = last_team_lose;
					last_team_home = last_team_win;
				}
				html = html.substr(html.indexOf(LINK_IDENTIFIER) + LINK_IDENTIFIER.length, html.length);
				last_link = parseLink(html.substr(0, html.indexOf("</td>")));
			}
			
			var queryString = "UPDATE " + scoresTable;
			queryString += " SET first_date=to_date('" + first_date + "', 'Month DD, YYYY')";
			queryString += ", first_team_win='" + first_team_win;
			queryString += "', first_team_lose='" + first_team_lose;
			queryString += "', first_team_home='" + first_team_home;
			queryString += "', first_team_away='" + first_team_away;
			queryString += "', first_link='" + first_link;
			queryString += "', last_date=to_date('" + last_date + "', 'Month DD, YYYY')";
			queryString += ", last_team_win='" + last_team_win;
			queryString += "', last_team_lose='" + last_team_lose;
			queryString += "', last_team_home='" + last_team_home;
			queryString += "', last_team_away='" + last_team_away;
			queryString += "', last_link='" + last_link;
			queryString += "' WHERE (pts_win=" + pts_win2 + " AND pts_lose=" + pts_lose2 + ");";
			
			
			client.query(queryString, (err, res) => {
				if (err) throw err;
				console.log(++done);
				// index++;
				// if (index < rows.length)
				// {
					// nextRequest();
				// }
				// else
				// {
					// client.end();
				// }
			});
			
			
		}
		else{
			console.log(error);
			// index++;
			// if (index < rows.length)
			// {
				// nextRequest();
			// }
			// else
			// {
				// client.end();
			// }
		}
	});
	
	
	index++;
	if (index < rows.length)
	{
		setTimeout(nextRequest, 1000);
	}
}

// request(url, function(error, response, html)
// {
	// if(!error)
	// {
		// //console.log(html);
		// html = html.substr(html.indexOf('<tr >'), html.length);
		// var DATE_IDENTIFIER1 = 'data-stat="game_date"';
		// var DATE_IDENTIFIER2 = '" >';
		// var TM_WIN_IDENTIFIER = 'data-stat="winner" >';
		// var LOCATION_IDENTIFIER = 'data-stat="game_location" >';
		// var TM_LOSE_IDENTIFIER = 'data-stat="loser" >';
		// var LINK_IDENTIFIER = 'data-stat="boxscore_word" >';
		
		// html = html.substr(html.indexOf(DATE_IDENTIFIER1) + DATE_IDENTIFIER1.length, html.length);
		// html = html.substr(html.indexOf(DATE_IDENTIFIER2) + DATE_IDENTIFIER2.length, html.length);
		// var first_date = html.substr(0, html.indexOf("</td>"));
		// html = html.substr(html.indexOf(TM_WIN_IDENTIFIER) + TM_WIN_IDENTIFIER.length, html.length);
		// var first_team_win = parseTeam(html.substr(0, html.indexOf("</td>")));
		// html = html.substr(html.indexOf(LOCATION_IDENTIFIER) + LOCATION_IDENTIFIER.length, html.length);
		// var away_win = html.substr(0, html.indexOf("</td>")) == "@";
		// html = html.substr(html.indexOf(TM_LOSE_IDENTIFIER) + TM_LOSE_IDENTIFIER.length, html.length);
		// var first_team_lose = parseTeam(html.substr(0, html.indexOf("</td>")));
		// var first_team_home;
		// var first_team_away;
		// if(away_win)
		// {
			// first_team_away = first_team_win;
			// first_team_home = first_team_lose;
		// }
		// else
		// {
			// first_team_away = first_team_lose;
			// first_team_home = first_team_win;
		// }
		// html = html.substr(html.indexOf(LINK_IDENTIFIER) + LINK_IDENTIFIER.length, html.length);
		// var first_link = parseLink(html.substr(0, html.indexOf("</td>")));
		
		
		// var last_date;
		// var last_team_win;
		// var last_team_lose;
		// var last_team_home;
		// var last_team_away;
		// var last_link;
		
		// //cycle through table in the returned HTML string
		// while(html.indexOf('<tr >') >= 0)
		// {
			// html = html.substr(html.indexOf(DATE_IDENTIFIER1) + DATE_IDENTIFIER1.length, html.length);
			// html = html.substr(html.indexOf(DATE_IDENTIFIER2) + DATE_IDENTIFIER2.length, html.length);
			// last_date = html.substr(0, html.indexOf("</td>"));
			// html = html.substr(html.indexOf(TM_WIN_IDENTIFIER) + TM_WIN_IDENTIFIER.length, html.length);
			// last_team_win = parseTeam(html.substr(0, html.indexOf("</td>")));
			// html = html.substr(html.indexOf(LOCATION_IDENTIFIER) + LOCATION_IDENTIFIER.length, html.length);
			// away_win = html.substr(0, html.indexOf("</td>")) == "@";
			// html = html.substr(html.indexOf(TM_LOSE_IDENTIFIER) + TM_LOSE_IDENTIFIER.length, html.length);
			// last_team_lose = parseTeam(html.substr(0, html.indexOf("</td>")));
			// if(away_win)
			// {
				// last_team_away = last_team_win;
				// last_team_home = last_team_lose;
			// }
			// else
			// {
				// last_team_away = last_team_lose;
				// last_team_home = last_team_win;
			// }
			// html = html.substr(html.indexOf(LINK_IDENTIFIER) + LINK_IDENTIFIER.length, html.length);
			// last_link = parseLink(html.substr(0, html.indexOf("</td>")));
		// }
		
		// console.log("first_date: " + first_date);
		// console.log("first_team_win: " + first_team_win);
		// console.log("first_team_lose: " + first_team_lose);
		// console.log("first_team_home: " + first_team_home);
		// console.log("first_team_away: " + first_team_away);
		// console.log("first_link: " + first_link);
		// console.log("last_date: " + last_date);
		// console.log("last_team_win: " + last_team_win);
		// console.log("last_team_lose: " + last_team_lose);
		// console.log("last_team_home: " + last_team_home);
		// console.log("last_team_away: " + last_team_away);
		// console.log("last_link: " + last_link);
		
		// var queryString = "UPDATE " + scoresTable;
		// queryString += " SET first_date=to_date('" + first_date + "', 'Month DD, YYYY')";
		// queryString += ", first_team_win='" + first_team_win;
		// queryString += "', first_team_lose='" + first_team_lose;
		// queryString += "', first_team_home='" + first_team_home;
		// queryString += "', first_team_away='" + first_team_away;
		// queryString += "', first_link='" + first_link;
		// queryString += "', last_date=to_date('" + last_date + "', 'Month DD, YYYY')";
		// queryString += ", last_team_win='" + last_team_win;
		// queryString += "', last_team_lose='" + last_team_lose;
		// queryString += "', last_team_home='" + last_team_home;
		// queryString += "', last_team_away='" + last_team_away;
		// queryString += "', last_link='" + last_link;
		// queryString += "' WHERE (pts_win=" + pts_win + " AND pts_lose=" + pts_lose + ");"
		
		
		// client.query(queryString, (err, res) => {
			// if (err) throw err;
			// console.log(Date.now());
		// });
		
		
	// }
	// else{
		// console.log("error");
	// }
// });

function parseTeam(string)
{
	var TEAM_IDENTIFIER = ".htm\">";
	string = string.substr(string.indexOf(TEAM_IDENTIFIER) + TEAM_IDENTIFIER.length, string.length);
	return string.substr(0, string.indexOf("</a>"));
}

function parseLink(string)
{
	//console.log(string);
	var TEAM_IDENTIFIER = "<a href=\"";
	string = string.substr(string.indexOf(TEAM_IDENTIFIER) + TEAM_IDENTIFIER.length, string.length);
	return "https://www.pro-football-reference.com" + string.substr(0, string.indexOf("\">boxscore</a>"));
}