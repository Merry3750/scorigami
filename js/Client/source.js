/* globals getShorthandName, chances */

"use strict";

var g_data;
var g_liveGames;
var g_prevLiveGames;
var g_mode;
var g_updateTimeout;

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
	success: function(data) 
	{
		////console.log('success');
		g_data = data;
		//console.log(g_data);
		checkReady();
		checkLiveGamesReady();
	},
	error: function(data) 
	{
		console.log("error");
		console.log(data);
	}
});

(function updateLiveGames()
{
	$.ajax({
		url: "https://feeds.nfl.com/feeds-rs/scores.json",
		cache:false,				
		success: function(data) 
		{
			g_liveGames = data.gameScores.sort(function(a,b)
			{
				return a.gameSchedule.gameId - b.gameSchedule.gameId
			});
			//console.log(g_liveGames);
			checkLiveGamesReady();
		},
		error: function(data) 
		{
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
		lastUpdated.innerHTML = "Last Updated: " + g_data.lastUpdated + " | ";
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
	//console.log(data);
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
			
			var dateOptions = { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York"};
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
		for(var i = 0; i < g_liveGames.length; i++)
		{
			var game = g_liveGames[i];

			// if(debug)
			// {
			// 	var random = Math.random();
			// 	if(random < 0.33)
			// 	{
			// 		game.away.score.T = Math.floor(Math.random() * 50);
			// 		game.home.score.T = Math.floor(Math.random() * 50);
			// 		game.qtr = Math.ceil(Math.random() * 5);
			// 		var mins = Math.floor(Math.random() * 15);
			// 		var seconds = Math.floor(Math.random() * 60);
			// 		game.clock = mins + ":" + seconds;
			// 	}
			// 	else if(random < 0.66)
			// 	{
			// 		game.away.score.T = Math.floor(Math.random() * 50);
			// 		game.home.score.T = Math.floor(Math.random() * 50);
			// 		game.qtr = "Final";
			// 		game.clock = "15:00";
			// 	}
			// }
			var homeScore = (game.score ? game.score.homeTeamScore.pointTotal : null);
			var awayScore = (game.score ? game.score.visitorTeamScore.pointTotal : null);
			var phase = (game.score ? game.score.phase : null);
			if(phase && phase.startsWith("OT"))
			{
				phase = "OT1"
			}

			var newUpdate = false;
			if(g_prevLiveGames && g_prevLiveGames[i].score && (g_prevLiveGames[i].score.visitorTeamScore.pointTotal !== awayScore || g_prevLiveGames[i].score.homeTeamScore.pointTotal !== homeScore))
			{
				newUpdate = true;
			}
			//console.log(game);
			htmlString += "<div class='liveGameContainer'>";

			htmlString += "<div id='liveGame_" + i + "' class='liveGame";

			var liveGame = document.getElementById("liveGame_" + i);
			if(liveGame && liveGame.classList.contains("selected"))
			{
				htmlString += " selected";
				moveSelectedCell(i);
			}

			if(newUpdate || (liveGame && liveGame.classList.contains("newUpdate")))
			{
				htmlString += " newUpdate";
				if(document.hasFocus())
				{
					clearUpdate();
				}
			}

			htmlString += "' onclick='liveGameClick(" + i + ");'>";
			htmlString += "<div class='liveGameContent'>";
			htmlString += "<div class='teams'>";
			htmlString += "<div class='teamInfo'><div class='img' style='background-image:url(\"../images/teams/" + game.gameSchedule.visitorTeamAbbr + ".gif\")'></div>";
			htmlString += game.gameSchedule.visitorNickname;
			if(phase === "Q1" || phase === "Q2" || phase === "Q3" || phase === "Q4" || phase === "OT1" || phase === "HALFTIME" || phase === "FINAL" || phase === "FINAL_OVERTIME" || phase === "SUSPENDED")
			{
				if(game.score.possessionTeamAbbr === game.gameSchedule.visitorTeamAbbr && phase !== "HALFTIME" && phase !== "FINAL" && phase !== "FINAL_OVERTIME")
				{
					htmlString += " &bull;";
				}
				htmlString += "<span class='teamScore'>" + game.score.visitorTeamScore.pointTotal + "</span>";
			}
			htmlString += "</div>";
			htmlString += "<div class='teamInfo'><div class='img' style='background-image:url(\"../images/teams/" + game.gameSchedule.homeTeamAbbr + ".gif\")'></div>";
			htmlString += game.gameSchedule.homeNickname;
			if(phase === "Q1" || phase === "Q2" || phase === "Q3" || phase === "Q4" || phase === "OT1" || phase === "HALFTIME" || phase === "FINAL" || phase === "FINAL_OVERTIME" || phase === "SUSPENDED")
			{
				if(game.score.possessionTeamAbbr === game.gameSchedule.homeTeamAbbr && phase !== "HALFTIME" && phase !== "FINAL" && phase !== "FINAL_OVERTIME")
				{
					htmlString += " &bull;";
				}
				htmlString += "<span class='teamScore'>" + game.score.homeTeamScore.pointTotal + "</span>";
			}
			htmlString += "</div>";
			htmlString += "</div>";
			htmlString += "<div class='gameInfoWrapper'><div class='gameInfo'>";
			switch(phase)
			{
				case "Q1":
					htmlString += "1st<br />" + game.score.time;
					break;
				case "Q2":
					htmlString += "2nd<br />" + game.score.time;
					break;
				case "Q3":
					htmlString += "3rd<br />" + game.score.time;
					break;
				case "Q4":
					htmlString += "4th<br />" + game.score.time;
					break;
				case "OT1":
					htmlString += "Overtime<br />" + game.score.time;
					break;
				case "HALFTIME":
					htmlString += "Halftime";
					break;
				case "SUSPENDED":
					htmlString += "<span style='font-size: 12px'>Suspended</span>";
					break;
				case "FINAL":
					htmlString += "Final";
					break;
				case "FINAL_OVERTIME":
					htmlString += "Final/OT";
					break;
				default:
					var date = new Date(game.gameSchedule.gameDate + " " + game.gameSchedule.gameTimeEastern);
					var day;
					//check if the game is within the next week, if yes display weekday, if no display date and change title to "Upcoming Games"
					if(Date.now() + 604800000 >= date.getTime())
					{
						day = (date.toLocaleDateString("en-US", {weekday:"short"}));
					}
					else
					{
						day = (date.toLocaleDateString("en-US", {month:"short", day:"numeric"}));
						document.getElementById("liveGamesTitle").innerHTML = "Upcoming Games";
					}
					var time = (date.toLocaleTimeString("en-US", {hour:"numeric", minute:"numeric"}));
					htmlString += day + "<br />" + time;
					break;
			}
			htmlString += "</div></div></div>";
			htmlString += "<div class='liveGameFooter'>";

			//if game is preseason or probowl
			if(game.gameSchedule.seasonType !== "REG" && game.gameSchedule.seasonType !== "POST")
			{
					htmlString += "Untracked Exhibition Game";
			}
			//if game is over
			else if (phase === "FINAL" || phase == "FINAL_OVERTIME")
			{
				var highScore = (awayScore > homeScore ? awayScore : homeScore);
				var lowScore = (awayScore > homeScore ? homeScore : awayScore);
				var matrix = g_data.matrix;
				if(g_data.newScorigami.includes(game.gameSchedule.gameId) || ! matrix[lowScore] || !matrix[lowScore][highScore] || matrix[lowScore][highScore].count === 0)
				{
					htmlString += "<span class='newScorigami'>SCORIGAMI!</span>";
				}
				else
				{
					htmlString += "No Scorigami";
				}
			}
			//if game is ongoing
			else if(phase === "Q1" || phase === "Q2" || phase === "Q3" || phase === "Q4" || phase === "OT1" || phase === "HALFTIME")
			{
				var probability = getScorigamiProbability(game);
				htmlString += "Chance of Scorigami: " + probability + "%";
			}
			//if game is upcoming
			else
			{
				//var gamelink = "https://www.pro-football-reference.com/boxscores/" + key.substr(0, key.length - 2) + "0" + getShorthandName(game.abbr) + ".htm";
				htmlString += "<a href='https://www.pro-football-reference.com/boxscores/" + Math.floor(game.gameSchedule.gameId / 100) + "0" + getShorthandName(game.gameSchedule.homeTeamAbbr) + ".htm'>Game Preview</a>";
			}
			htmlString += "</div></div></div>";
		}

		liveGames.innerHTML = htmlString;

		var liveGamesWrapper = document.getElementById("liveGamesWrapper");
		if(g_liveGames.length >= 1 && liveGamesWrapper)
		{
			liveGamesWrapper.classList.remove("hidden");
		}
	}

	//only runs once
	if(!g_prevLiveGames)
	{
		window.addEventListener("focus", clearUpdate);
	}

	g_prevLiveGames = g_liveGames;
}

/* exported liveGameClick */
function liveGameClick(index)
{
	var liveGame = document.getElementById("liveGame_" + index);
	if(liveGame)
	{
		if(liveGame.classList.contains("selected"))
		{
			liveGameSelect(index);
			liveGame.classList.remove("selected");
		}
		else
		{
			liveGameDeselect(index);
			liveGame.classList.add("selected");
		}
	}
	selectTableCells();
}

function liveGameSelect(index)
{
	var liveGame = document.getElementById("liveGame_" + index);
	if(liveGame)
	{
		liveGame.classList.add("selected");
	}
}

function liveGameDeselect(index)
{
	var liveGame = document.getElementById("liveGame_" + index);
	if(liveGame)
	{
		liveGame.classList.remove("selected");
	}
}

/* exported liveGameSelectGroup */
function liveGameSelectGroup(group)
{
	liveGameDeselectAll();
	var selectedGameIndexes = [];
	for(var i = 0; i < g_liveGames.length; i++)
	{
		var game = g_liveGames[i];
		var phase = (game.score ? game.score.phase : null);
		if(phase && phase.startsWith("OT"))
		{
			phase = "OT1"
		}
		if(group === GROUP_ALL)
		{
			selectedGameIndexes.push(i);
		}
		else if(group === GROUP_ONGOING)
		{
			if(phase === "Q1" || phase === "Q2" || phase === "Q3" || phase === "Q4" || phase === "OT1" || phase === "HALFTIME")
			{
				selectedGameIndexes.push(i);
			}
		}
		else if(group === GROUP_FINISHED)
		{
			if(phase === "FINAL" || phase === "FINAL_OVERTIME")
			{
				selectedGameIndexes.push(i);
			}
		}
	}
	for(var i = 0; i < selectedGameIndexes.length; i++)
	{
		liveGameSelect(selectedGameIndexes[i]);
	}
	selectTableCells();
}

/* exported liveGameDeselectAll */
function liveGameDeselectAll()
{
	for(var i = 0; i < g_liveGames.length; i++)
	{
		liveGameDeselect(i);
	}
	selectTableCells();
}

function selectTableCells()
{
	var selectedCellIds = [];
	for(var i = 0; i < g_liveGames.length; i++)
	{
		var game = g_liveGames[i];
		//console.log(game);
		if(game.score)
		{
			var homeScore = game.score.homeTeamScore.pointTotal;
			var awayScore = game.score.visitorTeamScore.pointTotal;
			var phase = game.score.phase;

			var highScore = (awayScore > homeScore ? awayScore : homeScore);
			var lowScore = (awayScore > homeScore ? homeScore : awayScore);
			var id = "hover_" + lowScore + "-" + highScore;

			var liveGame = document.getElementById("liveGame_" + i);
			if(liveGame && liveGame.classList.contains("selected") && phase !== "PREGAME")
			{
				selectedCellIds.push(id);
			}

			var cell = document.getElementById(id);
			if(cell)
			{
				cell.classList.remove("selected");
			}
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

function moveSelectedCell(index)
{

	var oldGame = g_prevLiveGames[index];
	//console.log(game);
	var oldHomeScore = (oldGame.score ? oldGame.score.homeTeamScore.pointTotal : null);
	var oldAwayScore = (oldGame.score ? oldGame.score.visitorTeamScore.pointTotal : null);

	var oldHighScore = (oldAwayScore > oldHomeScore ? oldAwayScore : oldHomeScore);
	var oldLowScore = (oldAwayScore > oldHomeScore ? oldHomeScore : oldAwayScore);
	var oldId = "hover_" + oldLowScore + "-" + oldHighScore;
	var oldCell = document.getElementById(oldId);
	if(oldCell && oldCell.classList.contains("selected"))
	{
		oldCell.classList.remove("selected");
	}

	var newGame = g_liveGames[index];
	//console.log(game);
	var newHomeScore = (newGame.score ? newGame.score.homeTeamScore.pointTotal : null);
	var newAwayScore = (newGame.score ? newGame.score.visitorTeamScore.pointTotal : null);

	var newHighScore = (newAwayScore > newHomeScore ? newAwayScore : newHomeScore);
	var newLowScore = (newAwayScore > newHomeScore ? newHomeScore : newAwayScore);
	var newId = "hover_" + newLowScore + "-" + newHighScore;
	var newCell = document.getElementById(newId);
	if(newCell && newGame.qtr !== "Pregame")
	{
		newCell.classList.add("selected");
	}
}

function clearUpdate()
{
	clearTimeout(g_updateTimeout);
	g_updateTimeout = setTimeout(function()
	{
		if(g_liveGames)
		{
			for(let key in g_liveGames)
			{
				var liveGame = document.getElementById("liveGame_" + key);
				if(liveGame && liveGame.classList.contains("newUpdate"))
				{
					liveGame.classList.remove("newUpdate");
				}
			}
		}
	}, 3 * 1000);
}

function onResize()
{
	var liveGames = document.getElementById("liveGames");
	if(liveGames)
	{
		var liveGamesWrapper = document.getElementById("liveGamesWrapper");
		if(liveGamesWrapper)
		{
			liveGames.style.width = liveGamesWrapper.offsetWidth;
		}
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

function getScorigamiProbability(game)
{

	var homeScore = (game.score ? game.score.homeTeamScore.pointTotal : null);
	var awayScore = (game.score ? game.score.visitorTeamScore.pointTotal : null);
	var phase = (game.score ? game.score.phase : null);

	var minutes = (game.score ? parseFloat(game.score.time.split(":")[0]) : 15);
	var seconds = (game.score ? parseFloat(game.score.time.split(":")[1]) : 0);
	var quarter;
	var overtime = false;
	switch(phase)
	{
		case "Q1":
			quarter = 1;
			break;
		case "Q2":
			quarter = 2;
			break;
		case "Q3":
			quarter = 3;
			break;
		case "Q4":
			quarter = 4;
			break;
		case "OT1":
			quarter = 4;
			overtime = true;
			break;
		case "HALFTIME":
			quarter = 2;
			minutes = 0;
			seconds = 0;
			break;
		case "FINAL":
		case "FINAL_OVERTIME":
			quarter = 4;
			minutes = 0;
			seconds = 0;
			break;
		default:
			quarter = 1;
			minutes = 15;
			seconds = 0;
			break;
	}


	var probability = 0.0;
	var matrix = g_data.matrix;

	for(var i = 0; i < chances.length; i++)
	{
		var chance1 = chances[i];
		var prob1 = getProb(quarter, minutes, seconds, chance1);
		var score1 = awayScore + chance1.pts;

		for(var j = 0; j < chances.length; j++)
		{
			var chance2 = chances[j];
			var prob2 = getProb(quarter, minutes, seconds, chance2);
			var score2 = homeScore + chance2.pts;

			var winScore = (score1 > score2 ? score1 : score2);
			var loseScore = (score1 > score2 ? score2 : score1);

			if(!matrix[loseScore] || !matrix[loseScore][winScore] || matrix[loseScore][winScore].count === 0)
			{
				if(loseScore === winScore && !overtime)
				{
					probability += prob1 * prob2 / 75.0;
				}
				else
				{
					probability += prob1 * prob2;
				}
			}

		}
	}

	probability *= 100.0;

	return probability.toFixed(2);
}

function factorial(n)
{
	if(n <= 1)
	{
		return 1;
	}
	return n * factorial(n-1);
}

function getProb(quarter, minutes, seconds, chance)
{
	var prob = Math.exp(-1 * (((4 - quarter) * 15 + (minutes + seconds / 60.0)) / 60.0 * 4.22)) * Math.pow((((4 - quarter) * 15 + (minutes + seconds / 60)) / 60 * 4.22), (chance.td_1pt + chance.fg + chance.td + chance.td_2pt + chance.safety)) / factorial(chance.td_1pt + chance.fg + chance.td + chance.td_2pt + chance.safety) * chance.bin_chance;

	return prob;
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