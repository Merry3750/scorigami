/* globals getMascot */

"use strict";

var g_data;
var g_liveGames;
var g_prevLiveGames;
var g_mode;
var MAX_HUE = 240.0;

var MODE_COUNT = "count";
var MODE_FIRST_GAME = "firstGame";
var MODE_LAST_GAME = "lastGame";

var GROUP_ALL = "all";
var GROUP_ONGOING = "ongoing";
var GROUP_FINISHED = "finished";

var debug = window.location.href.startsWith("http://localhost");

if(debug)
{
	document.title = "Scorigami (DEBUG)";
}

$.ajax({
	url: "/data",						
	success: function(data) {
		////console.log('success');
		//console.log(data);
		g_data = data;
		checkReady();
		checkLiveGamesReady();
	},
	error: function(data) {
		console.log("error");
		console.log(data);
	}
});

(function updateLiveGames()
{
	$.ajax({
		url: "http://www.nfl.com/liveupdate/scores/scores.json",						
		success: function(data) {
			//console.log(data);
			g_liveGames = data;
			checkLiveGamesReady();
		},
		error: function(data) {
			console.log("error");
			console.log(data);
		}
	});
	setTimeout(updateLiveGames, 30 * 1000);
})();

window.onload = function()
{
	checkReady();
	checkLiveGamesReady();
};

function checkReady()
{
	if(g_data && document.readyState === "complete") 
	{ 
		render(); 
		setupEvents();
	}
}

function checkLiveGamesReady()
{
	if(g_liveGames && g_data && document.readyState === "complete") 
	{ 
		renderLiveGames(); 
		onResize();
		window.addEventListener("resize", onResize);
	}
}

//sets up table
function render()
{

	var matrix = g_data.matrix;
	
	var table = document.getElementById("scoreTable");
	if(table)
	{
		var htmlString = "";
		
		htmlString += "<tr><td id='hAxisLabel' class='axisLabel' colspan=" + (g_data.maxpts + 2) + ">Winning Team Score</td>";
		htmlString += "<td id='vAxisLabel' class='axisLabel' rowspan=" + (g_data.maxpts + 3) + "><div class='vertical'>Losing Team Score</div></td></tr>";

		//cycle through all elements in the table (maxpts will always be the length and width of the matrix)
		//start at -1 so labels can be added
		for(var i = -1; i <= g_data.maxpts; i++)
		{
			htmlString += "<tr id='row_" + i + "'>";
			for(var j = 0; j <= g_data.maxpts + 1; j++)
			{
				//if i===-1, we are in the label row
				if(i === -1)
				{
					//do not label the top right cell, since the left column is all labels
					if (j > g_data.maxpts)
					{
						htmlString += "<th></th>";
					}
					//adding column lables
					else 
					{
						htmlString += "<th id='colHeader_" + j + "'>" + j + "</th>";
					}
				}
				else
				{
					//coloring black squares
					if(j < i - 1)
					{
						htmlString += "<td class='black'></td>";
					}
					//adding row label
					else if (j === i - 1)
					{
						htmlString += "<th id='specialHeader_" + i + "' class='black'></th>";
					}
					//adding row label
					else if (j === g_data.maxpts + 1)
					{
						htmlString += "<th id='rowHeader_" + i + "'>" + i + "</th>";
					}
					//color in green squares
					else if (matrix[i][j].count > 0)
					{
						//htmlString += "<td id='cell_" + i + "-" + j + "' class='green'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'><div id='hover_" + i + "-" + j + "' class='hover'><div id='count_" + i + "-" + j + "' class='count'>" + matrix[i][j].count + "</div></div></a></td>";
						htmlString += "<td id='cell_" + i + "-" + j + "' class='green'><div id='hover_" + i + "-" + j + "' class='hover'><div id='count_" + i + "-" + j + "' class='count'>" + matrix[i][j].count + "</div></div></td>";
					}
					//fill in empty squares
					else
					{
						//color black squares for impossible scores along 1 point line
						//NOTE: we can do this after coloring in the green squares since these squares will never be green
						if( i === 1)
						{
							switch (j)
							{
								case 1:
									/* falls through */
								case 2: 
									/* falls through */
								case 3: 
									/* falls through */
								case 4:
									/* falls through */
								case 5:
									/* falls through */
								case 7: 
									htmlString += "<td class='black'></td>";
									break;
								default:
									htmlString += "<td id='cell_" + i + "-" + j + "' class='blank'><div id='hover_" + i + "-" + j + "' class='hover'></div></td>";
									break;
									
							}
						}
						//color 0,1 square black since that is also impossible
						//NOTE: we can do this after coloring in the green squares since this square will never be green
						else if (i === 0 && j === 1)
						{
							htmlString += "<td class='black'></td>";
						}
						else
						{
							htmlString += "<td id='cell_" + i + "-" + j + "' class='blank'><div id='hover_" + i + "-" + j + "' class='hover'></div></td>";
						}
					}
				}
			}
			htmlString += "</tr>";
		}
		table.innerHTML = htmlString;
		
		var loadingTable = document.getElementById("loadingTable");
		if(loadingTable)
		{
			loadingTable.classList.add("hidden");
		}
		
		toggleEmptyRows(false);
		var tableRect = table.getBoundingClientRect();
		
		var helper = document.getElementById("helper");
		if(helper)
		{
			var helperRect = helper.getBoundingClientRect();
			helper.style.left = tableRect.x + tableRect.width / 2 - helperRect.width / 2;
			helper.style.top = tableRect.y + tableRect.height / 2 - helperRect.height * 2;
			helper.classList.remove("invisible");
			
			setTimeout(function()
			{	
				helper.classList.add("hide-opacity");
				setTimeout(hideHelper, 1000);
			}, 3000);
		}
	}
	
	//populate hue spectrum (because doing this manually would be tedious)
	var htmlStringLogarithmic = "";
	var htmlStringLinear = "";
	//var cssString = "background: linear-gradient(to right";
	var hueSpectrumLogarithmicColors = document.getElementById("hueSpectrumLogarithmicColors");
	var hueSpectrumLinearColors = document.getElementById("hueSpectrumLinearColors");
	
	var num = 600 / Math.log(MAX_HUE + 2);
	
	for(var i = 0; i <= MAX_HUE; i++)
	{
		var width = (Math.log(MAX_HUE + 2 - i) - Math.log(MAX_HUE + 1 - i)) * num;
		htmlStringLogarithmic += "<span id='hueLog_" + i + "' class='hueColor' style='background-color:hsl(" + (MAX_HUE - i) + ",50%,50%);width:" + width + "px'></span>";
		htmlStringLinear += "<span id='hueLin_" + i + "' class='hueColor' style='background-color:hsl(" + (MAX_HUE - i) + ",50%,50%);width:2.5px'></span>";
	}
	
	hueSpectrumLogarithmicColors.innerHTML = htmlStringLogarithmic;
	hueSpectrumLinearColors.innerHTML = htmlStringLinear;
	
	var hueSpectrumLogarithmicLabelMaxCount = document.getElementById("hueSpectrumLogarithmicLabelMaxCount");
	if(hueSpectrumLogarithmicLabelMaxCount)
	{
		hueSpectrumLogarithmicLabelMaxCount.innerHTML = g_data.maxcount;
	}
	var hueSpectrumLinearLabelMaxCount = document.getElementById("hueSpectrumLinearLabelMaxCount");
	if(hueSpectrumLinearLabelMaxCount)
	{
		hueSpectrumLinearLabelMaxCount.innerHTML = new Date().getFullYear();
	}
	
	var video = document.getElementById("video");
	if(video)
	{
		video.src = "https://www.youtube.com/embed/9l5C8cGMueY?rel=0";
	}
	
	var lastUpdated = document.getElementById("lastUpdated");
	if(lastUpdated)
	{
		lastUpdated.innerHTML = "Last Updated: " + g_data.lastUpdated + ".";
	}
}

function setupEvents()
{
	//add hover events to cells
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = 0; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				cell.addEventListener("mouseover", mouseOverDelegate(i, j));
				cell.addEventListener("mouseout", mouseOffDelegate(i, j));
				cell.addEventListener("click", onClickDelegate(i, j));
			}
		}
	}
	
	var modeSelector = document.getElementById("modeSelector");
	if(modeSelector)
	{
		g_mode = modeSelector.options[modeSelector.selectedIndex].value;
		modeSelector.addEventListener("change", function(e){changeMode();});
	}
	
	var countSwitch = document.getElementById("countSwitch");
	if(countSwitch)
	{
		countSwitch.addEventListener("change", function(e){toggleNumber(e.target.checked);});
	}
	
	var gradientSwitch = document.getElementById("gradientSwitch");
	if(gradientSwitch)
	{
		gradientSwitch.addEventListener("change", function(e){toggleGradient(e.target.checked);});
	}
	
	var emptyRowsSwitch = document.getElementById("emptyRowsSwitch");
	if(emptyRowsSwitch)
	{
		emptyRowsSwitch.addEventListener("change", function(e){toggleEmptyRows(e.target.checked);});
	}
	
	var yearSlider = document.getElementById("yearSlider");
	if(yearSlider)
	{
		var date = new Date().getFullYear();
		yearSlider.max = date;
		yearSlider.value = date;
		yearSlider.addEventListener("input", function(e){(changeYearSlider());});
	}
	
	changeMode();
}

function changeMode()
{	
	var modeSelector = document.getElementById("modeSelector");
	if(modeSelector)
	{
		g_mode = modeSelector.options[modeSelector.selectedIndex].value;
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var div = document.getElementById("count_" + i + "-" + j);
			if(div)
			{
				switch(g_mode)
				{
					case MODE_FIRST_GAME:
						div.innerHTML = g_data.matrix[i][j].first_date.substr(0,4);
						div.style.fontSize="6px";
						break;
					case MODE_LAST_GAME:
						div.innerHTML = g_data.matrix[i][j].last_date.substr(0,4);
						div.style.fontSize="6px";
						break;
					case MODE_COUNT:
						/* falls through */
					default:
						div.innerHTML = g_data.matrix[i][j].count;
						div.style.fontSize="8px";
						break;
				}
			}
		}
	}
	
	var countSwitchText = document.getElementById("countSwitchText");
	if(countSwitchText)
	{
		switch(g_mode)
		{
			case MODE_FIRST_GAME:
				/* falls through */
			case MODE_LAST_GAME:
				countSwitchText.innerHTML = "Show Year";
				break;
			case MODE_COUNT:
						/* falls through */
			default:
				countSwitchText.innerHTML = "Show Count";
				break;
		}
	}
	
	switch(g_mode)
	{
		case MODE_FIRST_GAME:
			showSlider();
			break;
		case MODE_LAST_GAME:
			/* falls through */
		case MODE_COUNT:
			/* falls through */
		default:
			hideSlider();
			break;
	}
	
	var spectrumLogarithmic = document.getElementById("hueSpectrumLogarithmic");
	var spectrumLinear = document.getElementById("hueSpectrumLinear");
	if(spectrumLogarithmic && spectrumLinear)
	{
		switch(g_mode)
		{
			case MODE_FIRST_GAME:
				/* falls through */
			case MODE_LAST_GAME:
				spectrumLogarithmic.classList.remove("invisible");
				spectrumLogarithmic.classList.add("hidden");
				spectrumLinear.classList.remove("hidden");
				spectrumLinear.classList.add("invisible");
				break;
			case MODE_COUNT:
				/* falls through */
			default:
				spectrumLogarithmic.classList.add("invisible");
				spectrumLogarithmic.classList.remove("hidden");
				spectrumLinear.classList.add("hidden");
				spectrumLinear.classList.remove("invisible");
				break;
		}
	}

	var countSwitch = document.getElementById("countSwitch");
	var gradientSwitch = document.getElementById("gradientSwitch");
	var emptyRowsSwitch = document.getElementById("emptyRowsSwitch");
	
	toggleNumber(countSwitch.checked);
	toggleGradient(gradientSwitch.checked);
	toggleEmptyRows(emptyRowsSwitch.checked);
}

function showSlider()
{
	var sliderContainer = document.getElementById("sliderContainer");
	if(sliderContainer)
	{
		sliderContainer.classList.remove("invisible");
	}
	changeYearSlider();
}

function hideSlider()
{
	var sliderContainer = document.getElementById("sliderContainer");
	if(sliderContainer)
	{
		sliderContainer.classList.add("invisible");
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				cell.classList.remove("later");
				cell.classList.remove("red");
			}
		}
	}
}

function changeYearSlider()
{
	var value = parseInt(document.getElementById("yearSlider").value);
	
	var sliderValue = document.getElementById("sliderValue");
	if(sliderValue)
	{
		sliderValue.innerHTML = value;
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell && cell.classList.contains("green"))
			{
				var year = parseInt(g_data.matrix[i][j].first_date.substr(0,4));
				if(year > value)
				{
					cell.classList.add("later");
					cell.classList.remove("red");
				}
				else if (year === value)
				{
					cell.classList.add("red");
					cell.classList.remove("later");
				}
				else
				{
					cell.classList.remove("red");
					cell.classList.remove("later");
				}
			}
		}
	}
	
}

//shades the cells based on the number of times that score has been achieved
function toggleGradient(on)
{
	var matrix = g_data.matrix;
	
	var max;
	var min;
	
	switch(g_mode)
	{
		case MODE_FIRST_GAME:
			/* falls through */
		case MODE_LAST_GAME:
			max = new Date().getFullYear();
			min = 1920;
			break;
		case MODE_COUNT:
			/* falls through */
		default:
			max = Math.log(g_data.maxcount);
			min = 0;
			break;
	}
	
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				if(on)
				{
					cell.classList.add("gradient");
					if (cell.classList.contains("green"))
					{
						// var alpha = 0.9 * matrix[i][j].count / g_data.maxcount + 0.1;
						// cell.style.backgroundColor = "rgba(0,128,0," + alpha + ")";
						var hue;
						switch(g_mode)
						{
							case MODE_FIRST_GAME:
								var year = parseInt(matrix[i][j].first_date.substr(0,4));
								hue = MAX_HUE - MAX_HUE * (year - min) / (max - min);
								break;
							case MODE_LAST_GAME:
								var year = parseInt(matrix[i][j].last_date.substr(0,4));
								hue = MAX_HUE - MAX_HUE * (year - min) / (max - min);
								break;
							case MODE_COUNT:
								/* falls through */
							default:
								hue = MAX_HUE - MAX_HUE * Math.log(matrix[i][j].count) / max;
								break;
						}
						cell.style.backgroundColor = "hsl(" + hue + ",50%,50%)";
					}
				}
				else
				{
					cell.classList.remove("gradient");
					if (cell.classList.contains("green"))
					{
						cell.style.backgroundColor = "";
					}
				}
			}
		}
	}
	var spectrumLogarithmic = document.getElementById("hueSpectrumLogarithmic");
	if(spectrumLogarithmic && g_mode === MODE_COUNT)
	{
		if(on )
		{
			spectrumLogarithmic.classList.remove("invisible");
		}
		else
		{
			spectrumLogarithmic.classList.add("invisible");
		}
	}
	var spectrumLinear = document.getElementById("hueSpectrumLinear");
	if(spectrumLinear && (g_mode === MODE_FIRST_GAME || g_mode === MODE_LAST_GAME))
	{
		if(on)
		{
			spectrumLinear.classList.remove("invisible");
		}
		else
		{
			spectrumLinear.classList.add("invisible");
		}
	}
}

function toggleNumber(on)
{
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = i; j <= g_data.maxpts; j++)
		{
			var div = document.getElementById("count_" + i + "-" + j);
			if(div)
			{
				if(on)
				{
					div.classList.remove("hidden");
				}
				else
				{
					div.classList.add("hidden");
				}
			}
		}
	}
}

function toggleEmptyRows(on)
{
	for(var i = g_data.maxlosepts + 1; i <= g_data.maxpts; i++)
	{
		var row = document.getElementById("row_" + i);
		if(row)
		{
			if(on)
			{
				row.classList.remove("hidden");
			}
			else
			{
				row.classList.add("hidden");
			}
		}
	}
}

//called when user moves mouse over an element
//adds adjhover class to all elements in the same row and column as the hovered element
function mouseOver(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		var cell = document.getElementById("hover_" + i + "-" + k);
		if(cell && k !== j)
		{
			cell.classList.add("adjhover");
		}
		else if(k === j)
		{
			cell.classList.add("over");
		}
		cell = document.getElementById("hover_" + k + "-" + j);
		if(cell && k !== i)
		{
			cell.classList.add("adjhover");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.add("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.add("adjhover");
	var specialHeader2 = document.getElementById("specialHeader_" + (j + 1));
	if(specialHeader2)
	{
		specialHeader2.innerHTML = j;
		specialHeader2.classList.add("adjhover");
	}
	var specialHeader = document.getElementById("specialHeader_" + i);
	if(specialHeader)
	{
		specialHeader.innerHTML = i;
		specialHeader.classList.add("adjhover");
	}
}
//called when moves mouse off an element
//removes adjhover class to all elements in the same row and column as the hovered element
function mouseOff(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		var cell = document.getElementById("hover_" + i + "-" + k);
		if(cell && k !== j)
		{
			cell.classList.remove("adjhover");
		}
		else if(k === j)
		{
			cell.classList.remove("over");
		}
		cell = document.getElementById("hover_" + k + "-" + j);
		if(cell && k !== i)
		{
			cell.classList.remove("adjhover");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.remove("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.remove("adjhover");
	var specialHeader2 = document.getElementById("specialHeader_" + (j + 1));
	if(specialHeader2)
	{
		specialHeader2.innerHTML = "";
		specialHeader2.classList.remove("adjhover");
	}
	var specialHeader = document.getElementById("specialHeader_" + i);
	if(specialHeader)
	{
		specialHeader.innerHTML = "";
		specialHeader.classList.remove("adjhover");
	}
}

function onClick(i, j)
{
	hideHelper();
	var data = g_data.matrix[i][j];
	var infoBox = document.getElementById("infoBox");
	var cell = document.getElementById("cell_" + i + "-" + j);
	if(infoBox)
	{
		infoBox.classList.add("hidden");
	
		if(cell && !cell.classList.contains("later") && data.count > 0)
		{
			var htmlString = "";
			
			htmlString += "<span id=infoBoxScore>Score: " + j + "-" + i + "</span> ";
			if(data.count > 1)
			{
				htmlString += "(<a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'>view all " + data.count + " games</a>)";
			}
			
			htmlString += "<span id='infoBoxClose' onclick='closeInfoBox()'>(<u>close</u>)</span>";
			
			var dateOptions = { year: "numeric", month: "long", day: "numeric" };
			var firstDate = new Date(data.first_date).toLocaleDateString("en-US", dateOptions);
			
			htmlString += "<br/>First Game: ";
			if(i !== j)
			{
				htmlString += "<b>";
			}
			htmlString += data.first_team_win + " " + j + " ";
			if(i !== j)
			{
				htmlString += "</b>";
			}
			if(data.first_team_win === data.first_team_home)
			{
				htmlString += "vs";
			}
			else
			{
				htmlString += "@";
			}
			htmlString += " " + i + " " + data.first_team_lose + " | ";
			htmlString += firstDate + " ";
			htmlString += "(<a href='" + data.first_link + "'>boxscore</a>)<br/>";
			
			if(data.count > 1)
			{
				var lastDate = new Date(data.last_date).toLocaleDateString("en-US", dateOptions);
				
				htmlString += "Latest Game: ";
				if(i !== j)
				{
					htmlString += "<b>";
				}
				htmlString += data.last_team_win + " " + j + " ";
				if(i !== j)
				{
					htmlString += "</b>";
				}
				if(data.last_team_win === data.last_team_home)
				{
					htmlString += "vs";
				}
				else
				{
					htmlString += "@";
				}
				htmlString += " " + i + " " + data.last_team_lose + " | ";
				htmlString += lastDate + " ";
				htmlString += "(<a href='" + data.last_link + "'>boxscore</a>)<br/>";
			}
			infoBox.innerHTML = htmlString;
			infoBox.classList.remove("hidden");
			
			infoBox.style.left = 0;
			infoBox.style.right = "";
			infoBox.style.width = "";
			infoBox.style.top = 0;

			var INFOBOX_OUTER_PIXELS = 5; //determined by infobox padding + border in common.css
			var cellRect = cell.getBoundingClientRect();
			var infoBoxRect = infoBox.getBoundingClientRect();
			var windowRight = window.pageXOffset + document.documentElement.clientWidth;
			var boxLeft;
			var boxRight;
			//if the box would extend past the right side of the screen, place it on the right side of the screen
			if(window.pageXOffset + cellRect.x - (infoBoxRect.width + cellRect.width) / 2 + infoBoxRect.width + 2 * INFOBOX_OUTER_PIXELS > windowRight)
			{
				boxRight = document.body.offsetWidth - document.documentElement.clientWidth - window.pageXOffset;
				boxLeft = Math.floor(windowRight - infoBoxRect.width);
			}
			//otherwise center it horizontally on the clicked cell
			else
			{
				boxLeft =	window.pageXOffset + cellRect.x - (infoBoxRect.width + cellRect.width) / 2;
				infoBox.style.width = infoBoxRect.width;
			}
			//if the box would extend past the left side of the screen, place it on the left side of the screen
			if(boxLeft < window.pageXOffset)
			{
				 boxLeft = window.pageXOffset;
			}
			infoBox.style.left = boxLeft;
			infoBox.style.right = boxRight;
			infoBoxRect = infoBox.getBoundingClientRect();
			//place it above the cell, unless it would extend past the top of the screen
			if(cellRect.y - infoBoxRect.height - 2 * INFOBOX_OUTER_PIXELS < 0)
			{
				infoBox.style.top = window.pageYOffset + cellRect.y + cellRect.height - 2 * INFOBOX_OUTER_PIXELS;
			}
			else
			{
				infoBox.style.top = window.pageYOffset + cellRect.y - infoBoxRect.height - 2 * INFOBOX_OUTER_PIXELS;
			}
		}
	}
}

/* exported closeInfoBox */
function closeInfoBox()
{
	var infoBox = document.getElementById("infoBox");
	if(infoBox)
	{
		infoBox.classList.add("hidden");
	}
} 

function hideHelper()
{
	var helper = document.getElementById("helper");
	if(helper)
	{
		helper.classList.add("hidden");
	}
}

function renderLiveGames()
{


	var liveGames = document.getElementById("liveGames");
	if(liveGames)
	{
		var htmlString = "";

		for(var i = 0; i < g_data.thisWeek.games.length; i++)
		{
			var key = g_data.thisWeek.games[i].id;
			var game = g_liveGames[key];

			// if(debug)
			// {
			// 	var random = Math.random();
			// 	if(random < 0.25)
			// 	{
			// 		game.away.score.T = Math.floor(Math.random() * 50);
			// 		game.home.score.T = Math.floor(Math.random() * 50);
			// 		game.qtr = Math.ceil(Math.random() * 5);
			// 		game.clock = "15:00";
			// 	}
			// 	else if(random < 0.75)
			// 	{
			// 		game.away.score.T = Math.floor(Math.random() * 50);
			// 		game.home.score.T = Math.floor(Math.random() * 50);
			// 		game.qtr = "Final";
			// 		game.clock = "15:00";
			// 	}
			// }

			var newUpdate = false;
			if(g_prevLiveGames && (game.away.score.T !== g_prevLiveGames[key].away.score.T || game.home.score.T !== g_prevLiveGames[key].home.score.T))
			{
				newUpdate = true;
			}
			//console.log(game);
			htmlString += "<div class='liveGameContainer'>";

			htmlString += "<div id='liveGame_" + key + "' class='liveGame";

			var liveGame = document.getElementById("liveGame_" + key);
			if(liveGame && liveGame.classList.contains("selected"))
			{
				htmlString += " selected";
				moveSelectedCell(key);
			}

			if(newUpdate || (liveGame && liveGame.classList.contains("newUpdate")))
			{
				htmlString += " newUpdate";
				(function(key)
					{
						var hasFocus = function()
						{
							setTimeout(function()
							{
								var liveGame = document.getElementById("liveGame_" + key);
								if(liveGame)
								{
									liveGame.classList.remove("newUpdate");
								}
							}, 3 * 1000);
						};
						if(document.hasFocus())
						{
							hasFocus();
						}
						else
						{
							window.addEventListener("focus", hasFocus);
						}
					})(key);
			}

			htmlString += "' onclick='liveGameClick(" + key + ");'>";
			htmlString += "<div class='teams'>";
			htmlString += "<div class='teamInfo'><img src='../images/teams/" + game.away.abbr + ".gif'' alt='" + getMascot(game.away.abbr) + "'>";
			htmlString += getMascot(game.away.abbr);
			if(game.away.score.T !== null)
			{
				htmlString += ": <span class='teamScore'>" + game.away.score.T + "</span>";
			}
			htmlString += "</div>";
			htmlString += "<div class='teamInfo'><img src='../images/teams/" + game.home.abbr + ".gif'' alt='" + getMascot(game.home.abbr) + "'>";
			htmlString += getMascot(game.home.abbr);
			if(game.home.score.T !== null)
			{
				htmlString += ": <span class='teamScore'>" + game.home.score.T + "</span>";
			}
			htmlString += "</div>";
			htmlString += "</div>";
			htmlString += "<div class='gameInfoWrapper'><div class='gameInfo'>";
			switch(game.qtr)
			{
				case 1:
					htmlString += "1st<br />" + game.clock;
					break;
				case 2:
					htmlString += "2nd<br />" + game.clock;
					break;
				case 3:
					htmlString += "3rd<br />" + game.clock;
					break;
				case 4:
					htmlString += "4th<br />" + game.clock;
					break;
				case 5:
					htmlString += "OT<br />" + game.clock;
					break;
				case "Final":
					htmlString += "Final";
					break;
				default:
					htmlString += g_data.thisWeek.games[i].day + "<br />" + g_data.thisWeek.games[i].time;
					break;
			}

			htmlString += "</div></div>";
			htmlString += "</div></div>";
		}

		liveGames.innerHTML = htmlString;

		var liveGamesWrapper = document.getElementById("liveGamesWrapper");
		if(g_data.thisWeek.games.length >= 1 && liveGamesWrapper)
		{
			liveGamesWrapper.classList.remove("hidden");
		}
	}

	g_prevLiveGames = g_liveGames;
}

/* exported liveGameClick */
function liveGameClick(key)
{
	var liveGame = document.getElementById("liveGame_" + key);
	if(liveGame)
	{
		if(liveGame.classList.contains("selected"))
		{
			liveGameSelect(key);
			liveGame.classList.remove("selected");
		}
		else
		{
			liveGameDeselect(key);
			liveGame.classList.add("selected");
		}
	}
	selectTableCells();
}

function liveGameSelect(key)
{
	var liveGame = document.getElementById("liveGame_" + key);
	if(liveGame)
	{
		liveGame.classList.add("selected");
	}
}

function liveGameDeselect(key)
{
	var liveGame = document.getElementById("liveGame_" + key);
	if(liveGame)
	{
		liveGame.classList.remove("selected");
	}
}

/* exported liveGameSelectGroup */
function liveGameSelectGroup(group)
{
	liveGameDeselectAll();
	var selectedGameIds = [];
	for(let key in g_liveGames)
	{
		var game = g_liveGames[key];
		if(group === GROUP_ALL)
		{
			selectedGameIds.push(key);
		}
		else if(group === GROUP_ONGOING)
		{
			if(game.qtr === 1 || game.qtr === 2 || game.qtr === 3 || game.qtr === 4 || game.qtr === 5)
			{
				selectedGameIds.push(key);
			}
		}
		else if(group === GROUP_FINISHED)
		{
			if(game.qtr === "Final")
			{
				selectedGameIds.push(key);
			}
		}
	}
	for(var i = 0; i < selectedGameIds.length; i++)
	{
		liveGameSelect(selectedGameIds[i]);
	}
	selectTableCells();
}

/* exported liveGameDeselectAll */
function liveGameDeselectAll()
{
	for(let key in g_liveGames)
	{
		liveGameDeselect(key);
	}
	selectTableCells();
}



function selectTableCells()
{
	var selectedCellIds = [];
	for(let key in g_liveGames)
	{
		var game = g_liveGames[key];
		//console.log(game);
		var highScore = (game.away.score.T > game.home.score.T ? game.away.score.T : game.home.score.T);
		var lowScore = (game.away.score.T > game.home.score.T ? game.home.score.T : game.away.score.T);
		var id = "hover_" + lowScore + "-" + highScore;

		var liveGame = document.getElementById("liveGame_" + key);
		if(liveGame && liveGame.classList.contains("selected"))
		{
			selectedCellIds.push(id);
		}

		var cell = document.getElementById(id);
		if(cell)
		{
			cell.classList.remove("selected");
		}
	}
	for(var i = 0; i < selectedCellIds.length; i++)
	{
		var id = selectedCellIds[i];
		var cell = document.getElementById(id);
		if(cell)
		{
			cell.classList.add("selected");
		}
	}
}

function moveSelectedCell(key)
{
	var oldGame = g_prevLiveGames[key];
	//console.log(game);
	var oldHighScore = (oldGame.away.score.T > oldGame.home.score.T ? oldGame.away.score.T : oldGame.home.score.T);
	var oldLowScore = (oldGame.away.score.T > oldGame.home.score.T ? oldGame.home.score.T : oldGame.away.score.T);
	var oldId = "hover_" + oldLowScore + "-" + oldHighScore;
	var oldCell = document.getElementById(oldId);
	if(oldCell && oldCell.classList.contains("selected"))
	{
		oldCell.classList.remove("selected");

		var newGame = g_liveGames[key];
		//console.log(game);
		var newHighScore = (newGame.away.score.T > newGame.home.score.T ? newGame.away.score.T : newGame.home.score.T);
		var newLowScore = (newGame.away.score.T > newGame.home.score.T ? newGame.home.score.T : newGame.away.score.T);
		var newId = "hover_" + newLowScore + "-" + newHighScore;
		var newCell = document.getElementById(newId);
		if(newCell)
		{
			newCell.classList.add("selected");
		}
	}
}

function onResize()
{
	var liveGames = document.getElementById("liveGames");
	if(liveGames)
	{
		liveGames.classList.remove("p100");
		liveGames.classList.remove("p50");
		liveGames.classList.remove("p33");
		var liveGamesWidth = liveGames.offsetWidth;
		var liveGame = document.getElementsByClassName("liveGame")[0];
		if(liveGame)
		{
			var liveGameWidth = liveGame.offsetWidth;
			var ratio = liveGamesWidth / liveGameWidth;
			if(ratio >= 3.0 && ratio < 4.0)
			{
				liveGames.classList.add("p33");
			}
			else if(ratio >= 2.0 && ratio < 3.0)
			{
				liveGames.classList.add("p50");
			}
			else if(ratio < 2.0)
			{
				liveGames.classList.add("p100");
			}
		}
	}
}

//delegate functions to make it possible to create event listeners in a loop
function onClickDelegate(i, j) 
{
	return function()
	{
			onClick(i, j);
	};
}
function mouseOverDelegate(i, j) 
{
	return function()
	{
			mouseOver(i, j);
	};
}
function mouseOffDelegate(i, j) 
{
	return function()
	{
			mouseOff(i, j);
	};
}