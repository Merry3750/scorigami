var express = require('express');
var fs = require('fs');
var request = require('request');
var app = express();
var path = require("path");

app.use(express.static(__dirname + '/'));

url = 'https://www.pro-football-reference.com/boxscores/game-scores.htm';
var json = [];
var matrix = [];
var maxpts = 0;
var maxcount = 0;

function updateData()
{
	request(url, function(error, response, html)
	{
		if(!error)
		{
			console.log("fetching data");
			var newjson = [];
			var newmatrix = [];
			html = html.substr(html.indexOf('<tr >'), html.length);
			var PTS_WIN_IDENTIFIER = 'data-stat="pts_win" >';
			var PTS_LOSE_IDENTIFIER = 'data-stat="pts_lose" >';
			var COUNTER_IDENTIFIER = 'data-stat="counter" >';
			while(html.indexOf('<tr >') >= 0)
			{
				var object = {};
				html = html.substr(html.indexOf(PTS_WIN_IDENTIFIER) + PTS_WIN_IDENTIFIER.length, html.length);
				object.ptsWin = parseInt(html.substr(0, html.indexOf("</td>")));
				html = html.substr(html.indexOf(PTS_LOSE_IDENTIFIER) + PTS_LOSE_IDENTIFIER.length, html.length);
				object.ptsLose = parseInt(html.substr(0, html.indexOf("</td>")));
				html = html.substr(html.indexOf(COUNTER_IDENTIFIER) + COUNTER_IDENTIFIER.length, html.length);
				object.count = parseInt(html.substr(0, html.indexOf("</td>")));
				html = html.substr(html.indexOf('<tr >'), html.length);
				newjson.push(object);
			}
			for(var i = 0; i < newjson.length; i++)
			{
				if(newjson[i].ptsWin > maxpts)
				{
					maxpts = newjson[i].ptsWin;
				}
				if(newjson[i].count > maxcount)
				{
					maxcount = newjson[i].count;
				}
			}
			for (var i = 0; i <= maxpts; i++)
			{
				newmatrix[i] = [];
				for(var j = 0; j <= maxpts; j++)
				{
					newmatrix[i][j] = 0;
				}
			}
			for(var i = 0; i < newjson.length; i++)
			{
				newmatrix[newjson[i].ptsLose][newjson[i].ptsWin] = newjson[i].count;
			}
			json = newjson;
			matrix = newmatrix;
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
		maxpts: maxpts,
		maxcount: maxcount
	};
	//console.log(data);
	res.json(data);
});

app.get('/*', function(req, res)
{
	res.sendFile(path.join(__dirname+"/view/index.html"));
});

app.listen(process.env.PORT);