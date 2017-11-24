var express = require('express');
var app = express();
var path = require("path");
const { Client } = require('pg');
require('dotenv').load();
var request = require('request');
var fs = require('fs');
var teamParser = require("./teamParser.js");

var url = 'http://www.nfl.com/liveupdate/scorestrip/ss.json';

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

client.connect();

app.use(express.static(__dirname + '/..'));

var json = [];
var matrix = [];
var maxpts = 0;
var maxlosepts = 0;
var maxcount = 0;
var maxcount = 0;

function updateData()
{
	console.log("fetching data");
	request(url, function(err0, res0, data)
	{
		if(!err0)
		{
			data = JSON.parse(data);
			//if the game is regular or post season, continue, otherwise (preseason) ignore it
			if (data.t == "REG" || data.t == "POST")
			{
				//check the current week
				client.query("SELECT data_int FROM " + metadataTable + " WHERE description='current_week';", (err1, res1) =>
				{
					if(!err1)
					{
						var current_week = res1.rows[0].data_int;
						//if the current week does not match the current tracked week, change the current week and delete the tracked games (we won't be needing them any more)
						if(current_week != data.w)
						{
							client.query("UPDATE " + metadataTable + " SET data_int=" + data.w + " WHERE description='current_week';DELETE FROM " + metadataTable + " WHERE description='tracked_game';", (err2, res2) => {updateData()});
						}
						else
						{
							//get the list of tracked games
							client.query("SELECT data_int FROM " + metadataTable + " WHERE description='tracked_game';", (err2, res2) =>
							{	
								if(!err2)
								{
									var newgames = [];
									var secondHalf = false;
									//iterate through this week's games
									for (let game of data.gms)
									{
										//if the game is not over, ignore it
										if(game.q == "F")
										{	
											var tracked = false;
											//if the game has already been tracked, ignore it
											for (let row of res2.rows) 
											{
												if(game.eid == row.data_int)
												{
													tracked = true;
													//console.log("game " + game.eid + " not tracked because it has already been tracked");
													break;
												}
											}
											//if the game is over, and has not been tracked, add it to the list of untracked games
											if(!tracked)
											{
												newgames.push(game);
											}
										}
										else
										{
											//console.log("game " + game.eid + " not tracked because it has not ended");
										}
										//if there is a game in the second half, set secondHalf to true
										if(game.q == 3 || game.q == 4)
										{
											secondHalf = true;
										}
									}
									//if there is a game in the second half, run tick every minute instead of every hour
									if(secondHalf)
									{
										console.log("secondHalf");
										setTimeout(tick, 1000 * 60);
									}
									var finishedQueries = 0;
									var queryString = "";
									//iterate through the list of untracked games
									for (let game of newgames)
									{
										(function(game)
										{
											//get the score row from the database
											var pts_win = game.hs > game.vs ? game.hs : game.vs;
											var pts_lose = game.hs > game.vs ? game.vs : game.hs;
											var homeWin = game.hs > game.vs;
											client.query("SELECT count FROM " + scoresTable + " WHERE (pts_win=" + pts_win + " AND pts_lose=" + pts_lose + ");", (err3, res3) =>
											{
												if(!err3)
												{
													//aCompleteFuckingMiracleHasHapppened is true when 2 games achieve scorigami with same score at the same time
													var aCompleteFuckingMiracleHasHapppened = false;
													for (let game2 of newgames)
													{
														if(game.hs == game2.hs && game.vs == game2.vs && game.eid > game2.eid)
														{
															aCompleteFuckingMiracleHasHapppened = true;
														}
													}
													var winTeam = teamParser.getFullName(homeWin ? game.h : game.v);
													var loseTeam = teamParser.getFullName(homeWin ? game.v : game.h);
													var homeTeam = teamParser.getFullName(game.h);
													var awayTeam = teamParser.getFullName(game.v);
													var date =  Math.floor(game.eid / 100).toString();
													var gamelink = "https://www.pro-football-reference.com/boxscores/" + date + "0" + teamParser.getShorthandName(game.h) + ".htm";
													date = date.substr(0, 4) + "-" + date.substr(4, 2) + "-" + date.substr(6, 2);
													//if the game score has been achieved before (in database), increment the count and add it to the list of tracked games
													if(res3.rows[0] || aCompleteFuckingMiracleHasHapppened)
													{
														queryString += "UPDATE " + scoresTable;
														queryString += " SET count=count+1";
														queryString += ", last_date=to_date('" + date + "', 'YYYY-MM-DD')";
														queryString += ", last_team_win='" + winTeam;
														queryString += "', last_team_lose='" + loseTeam;
														queryString += "', last_team_home='" + homeTeam;
														queryString += "', last_team_away='" + awayTeam;
														queryString += "', last_link='" + gamelink;
														queryString += "' WHERE (pts_win=" + pts_win + " AND pts_lose=" + pts_lose + ");\n";
														
														
														//queryString += "UPDATE " + scoresTable + " SET count=count+1 WHERE (pts_win=" + pts_win + " AND pts_lose=" + pts_lose + ");\n";
													}
													//if the game score has not been achieved before (not in database), add it to the database and add it to the list of tracked games
													else
													{
														queryString += "INSERT INTO " + scoresTable + " (pts_win, pts_lose, count, first_date, first_team_win, first_team_lose, first_team_home, first_team_away, first_link, last_date, last_team_win, last_team_lose, last_team_home, last_team_away, last_link) "
														queryString += "VALUES (" + pts_win;
														queryString += ", " + pts_lose;
														queryString += ", 1";
														queryString += ", to_date('" + date + "', 'YYYY-MM-DD')";
														queryString += ", '" + winTeam;
														queryString += "', '" + loseTeam;
														queryString += "', '" + homeTeam;
														queryString += "', '" + awayTeam;
														queryString += "', '" + gamelink;
														queryString += "', to_date('" + date + "', 'YYYY-MM-DD')";
														queryString += ", '" + winTeam;
														queryString += "', '" + loseTeam;
														queryString += "', '" + homeTeam;
														queryString += "', '" + awayTeam;
														queryString += "', '" + gamelink;
														queryString += "');\n";
													}
													queryString += "INSERT INTO " + metadataTable + " (description, data_int) VALUES ('tracked_game', " + game.eid + ");\n";
													finishedQueries++;
													if(finishedQueries >= newgames.length)
													{
														client.query(queryString, (err4, res4) => 
														{
															if(!err4)
															{
																updated = true;
																getData();
															}
															else
															{
																console.log("There was an error updating data: 4");
																getData();
															}
														});
													}
												}
												else
												{
													console.log("There was an error updating data: 3");
													getData();
												}
											});
										})(game);
									}
									if(newgames.length == 0)
									{
										getData();
									}
								}
								else
								{
									console.log("There was an error updating data: 2");
									getData();
								}
							});
						}
					}
					else
					{
						console.log("There was an error updating data: 1");
						getData();
					}
				});
			}
			else
			{
				//console.log("no games tracked because it is not a regular or post season week");
				getData();
			}
		}
		else
		{
			console.log("There was an error updating data: 0");
			getData();
		}
	});
}

function getData()
{
	client.query("SELECT * FROM " + scoresTable + ";", (err, res) =>
	{
		if(!err)
		{
			var newjson = [];
			var newmatrix = [];
			for (let row of res.rows) 
			{
				newjson.push(row);
				if(row.pts_lose > maxlosepts)
				{
					maxlosepts = row.pts_lose;
				}
				if(row.pts_win > maxpts)
				{
					maxpts = row.pts_win;
				}
				if(row.count > maxcount)
				{
					maxcount = row.count;
				}
			}
			
			//create matrix with length and width equal to the max points, fill it with 0's
			for (var i = 0; i <= maxpts; i++)
			{
				newmatrix[i] = [];
				for(var j = 0; j <= maxpts; j++)
				{
					newmatrix[i][j] = 0;
				}
			}
			//fill matrix with useful data
			for(var i = 0; i < newjson.length; i++)
			{
				newmatrix[newjson[i].pts_lose][newjson[i].pts_win] = newjson[i].count;
			}
			json = newjson;
			matrix = newmatrix;
			var date = new Date();
			console.log("done " + date.toUTCString());
		}
		else
		{
			console.log("There was an error getting data");
			throw err;
		}
		//renderPage();
	});
}

function tick()
{
	updateData();
}

tick();

setInterval(tick, 1000 * 60 * 60);
	
app.get('/data', function(req, res)
{
	var data = {
		matrix: matrix,
		maxpts: maxpts,
		maxlosepts: maxlosepts,
		maxcount: maxcount
	};
	//console.log(data);
	res.json(data);
});

app.get('/*', function(req, res)
{
	res.sendFile(path.join(__dirname+"/../view/index.html"));
});

app.listen(process.env.PORT || 8081);