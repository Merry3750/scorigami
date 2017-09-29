var express = require('express');
var app = express();
var path = require("path");
const { Client } = require('pg');
require('dotenv').load();
var request = require('request');

var url = 'http://www.nfl.com/liveupdate/scorestrip/ss.json';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

app.use(express.static(__dirname + '/'));

var json = [];
var matrix = [];
var sbmatrix = [];
var maxpts = 0;
var maxlosepts = 0;
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
				client.query("SELECT data_int FROM metadata WHERE description='current_week';", (err1, res1) =>
				{
					if(!err1)
					{
						var current_week = res1.rows[0].data_int;
						//if the current week does not match the current tracked week, change the current week and delete the tracked games (we won't be needing them any more)
						if(current_week != data.w)
						{
							client.query("UPDATE metadata SET data_int=" + data.w + " WHERE description='current_week';DELETE FROM metadata WHERE description='tracked_game';", (err2, res2) => {updateData()});
						}
						else
						{
							//get the list of tracked games
							client.query("SELECT data_int FROM metadata WHERE description='tracked_game';", (err2, res2) =>
							{	
								if(!err2)
								{
									var newgames = [];
									//iterate through this week's games
									for (let game of data.gms)
									{
										//if the game is not over, ignore it
										if(game.q == "F" || true)
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
									}
									//iterate through the list of untracked games
									for (let game of newgames)
									{
										var finishedQueries = 0;
										var queryString = "";
										(function(game)
										{
											//get the score row from the database
											var pts_win = game.hs > game.vs ? game.hs : game.vs;
											var pts_lose = game.hs > game.vs ? game.vs : game.hs;
											client.query("SELECT count FROM scores WHERE (pts_win=" + pts_win + " AND pts_lose=" + pts_lose + ");", (err3, res3) =>
											{
												if(!err3)
												{
													//aCompleteFuckingMiracleHasHapppened is true when 2 games with achieve scoragami with same score at the same time
													var aCompleteFuckingMiracleHasHapppened = false;
													for (let game2 of newgames)
													{
														if(game.hs == game2.hs && game.vs == game2.vs && game.eid > game2.eid)
														{
															aCompleteFuckingMiracleHasHapppened = true;
														}
													}
													//if the game score has been achieved before (in database), increment the count and add it to the list of tracked games
													if(res3.rows[0] || aCompleteFuckingMiracleHasHapppened)
													{
														queryString += "UPDATE scores SET count=count+1 WHERE (pts_win=" + pts_win + " AND pts_lose=" + pts_lose + ");\n";
													}
													//if the game score has not been achieved before (not in database), add it to the database and add it to the list of tracked games
													else
													{
														queryString += "INSERT INTO scores VALUES (" + pts_win + ", " + pts_lose + ", 1);\n";
													}
													queryString += "INSERT INTO metadata (description, data_int) VALUES ('tracked_game', " + game.eid + ");\n";
													finishedQueries++;
													if(finishedQueries >= newgames.length)
													{
														client.query(queryString, (err4, res4) => 
														{
															if(!err4)
															{
																getData();
															}
															else
															{
																console.log("There was an error updating data");
																getData();
															}
														});
													}
												}
												else
												{
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
									console.log("There was an error updating data");
									getData();
								}
							});
						}
					}
					else
					{
						console.log("There was an error updating data");
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
			console.log("There was an error updating data");
			getData();
		}
	});
}

function getData()
{
	client.query('SELECT * FROM scores;', (err, res) =>
	{
		if(!err)
		{
			var newjson = [];
			var newmatrix = [];
			var newsbmatrix = [];
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
				newsbmatrix[i] = [];
				for(var j = 0; j <= maxpts; j++)
				{
					newmatrix[i][j] = 0;
					newsbmatrix[i][j] = 0;
				}
			}
			//fill matrix with useful data
			for(var i = 0; i < newjson.length; i++)
			{
				newmatrix[newjson[i].pts_lose][newjson[i].pts_win] = newjson[i].count;
				// if(newjson[i].sbEra)
				// {
					// newsbmatrix[newjson[i].pts_lose][newjson[i].pts_win] = newjson[i].count;
				// }
			}
			json = newjson;
			matrix = newmatrix;
			sbmatrix = newsbmatrix;
			var date = new Date();
			console.log("done " + date.toUTCString());
		}
		else
		{
			console.log("There was an error getting data");
			throw err;
		}
	});
}

updateData();

setInterval(updateData, 1000 * 60 * 60);
	
app.get('/data', function(req, res)
{
	var data = {
		matrix: matrix,
		sbmatrix: sbmatrix,
		maxpts: maxpts,
		maxlosepts: maxlosepts,
		maxcount: maxcount
	};
	//console.log(data);
	res.json(data);
});

app.get('/*', function(req, res)
{
	res.sendFile(path.join(__dirname+"/view/index.html"));
});

app.listen(process.env.PORT || 8081);