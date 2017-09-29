var express = require('express');
var app = express();
var path = require("path");
const { Client } = require('pg');
require('dotenv').load();

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
			console.log("There was an error");
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