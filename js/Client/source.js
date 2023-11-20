/* globals getShorthandName, chances */

"use strict";

var g_data;
var g_liveGames;
var g_prevLiveGames;
var g_mode;
var g_updateTimeout;
var g_bmacAnimating;
var searchSelectedGameId;

var MAX_HUE = 240.0;
var COLORBLIND_START_R = 75.0;
var COLORBLIND_START_G = 0.0;
var COLORBLIND_START_B = 130.0;
var COLORBLIND_END_R = 50.0;
var COLORBLIND_END_G = 205.0;
var COLORBLIND_END_B = 50.0;

var MODE_COUNT = "count";
var MODE_FIRST_GAME = "firstGame";
var MODE_LAST_GAME = "lastGame";
var MODE_SEARCH = "search"

var GROUP_ALL = "all";
var GROUP_ONGOING = "ongoing";
var GROUP_FINISHED = "finished";
var GROUP_TEN = "ten";

var debug = window.location.href.startsWith("http://localhost");

if (debug) {
	document.title = "(DEBUG) " + document.title;
}

$.ajax({
	url: "/data",
	success: function (data) {
		g_data = data;
		checkReady();
		checkLiveGamesReady();
	},
	error: function (data) {
		console.log("error");
		console.log(data);
	}
});

(function updateLiveGames() {
	$.ajax({
		url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
		cache: false,
		success: function (data) {
			g_liveGames = data.events.sort(function (a, b) {
				var adate = new Date(a.date).getTime();
				var bdate = new Date(b.date).getTime();
				return adate == bdate ? (a.id) - (b.id) : adate - bdate;
			});
			console.log(g_liveGames);
			checkLiveGamesReady();
		},
		error: function (data) {
			console.log("error");
			console.log(data);
		}
	});
	setTimeout(updateLiveGames, 30 * 1000);
})();

window.onload = function () {
	checkReady();
	checkLiveGamesReady();
};

function checkReady() {
	if (g_data && document.readyState === "complete") {
		render();
		setupEvents();
	}
}

function checkLiveGamesReady() {
	if (g_liveGames && g_data && document.readyState === "complete") {
		renderLiveGames();
		onResize();
		window.addEventListener("resize", onResize);
	}
}

//sets up table
function render() {

	var matrix = g_data.matrix;

	var table = document.getElementById("scoreTable");
	if (table) {
		var htmlString = "";

		htmlString += "<tr><td id='hAxisLabel' class='axisLabel' colspan=" + (g_data.maxpts + 2) + ">Winning Team Score</td>";
		htmlString += "<td id='vAxisLabel' class='axisLabel' rowspan=" + (g_data.maxpts + 3) + "><div class='vertical'>Losing Team Score</div></td></tr>";

		//cycle through all elements in the table (maxpts will always be the length and width of the matrix)
		//start at -1 so labels can be added
		for (var i = -1; i <= g_data.maxpts; i++) {
			htmlString += "<tr id='row_" + i + "'>";
			for (var j = 0; j <= g_data.maxpts + 1; j++) {
				//if i===-1, we are in the label row
				if (i === -1) {
					//do not label the top right cell, since the left column is all labels
					if (j > g_data.maxpts) {
						htmlString += "<th></th>";
					}
					//adding column lables
					else {
						htmlString += "<th id='colHeader_" + j + "'>" + j + "</th>";
					}
				}
				else {
					//coloring black squares
					if (j < i - 1) {
						htmlString += "<td class='black'></td>";
					}
					//adding row label
					else if (j === i - 1) {
						htmlString += "<th id='specialHeader_" + i + "' class='black'></th>";
					}
					//adding row label
					else if (j === g_data.maxpts + 1) {
						htmlString += "<th id='rowHeader_" + i + "'>" + i + "</th>";
					}
					//color in green squares
					else if (matrix[i][j].count > 0) {
						//htmlString += "<td id='cell_" + i + "-" + j + "' class='green'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'><div id='hover_" + i + "-" + j + "' class='hover'><div id='count_" + i + "-" + j + "' class='count'>" + matrix[i][j].count + "</div></div></a></td>";
						htmlString += "<td id='cell_" + i + "-" + j + "' class='green'><div id='hover_" + i + "-" + j + "' class='hover'><div id='count_" + i + "-" + j + "' class='count'>" + matrix[i][j].count + "</div></div></td>";
					}
					//fill in empty squares
					else {
						//color black squares for impossible scores along 1 point line
						//NOTE: we can do this after coloring in the green squares since these squares will never be green
						if (i === 1) {
							switch (j) {
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
						else if (i === 0 && j === 1) {
							htmlString += "<td class='black'></td>";
						}
						else {
							htmlString += "<td id='cell_" + i + "-" + j + "' class='blank'><div id='hover_" + i + "-" + j + "' class='hover'></div></td>";
						}
					}
				}
			}
			htmlString += "</tr>";
		}
		table.innerHTML = htmlString;

		var loadingTable = document.getElementById("loadingTable");
		if (loadingTable) {
			loadingTable.classList.add("hidden");
		}

		toggleEmptyRows(false);

		var helper = document.getElementById("helper");
		if (helper) {
			var helperRect = helper.getBoundingClientRect();
			helper.style.left = (window.innerWidth / 2) - (helperRect.width / 2);
			helper.style.top = (window.innerHeight / 2) - (helperRect.height / 2);
			helper.classList.remove("invisible");

			setTimeout(function () {
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

	for (var i = 0; i <= MAX_HUE; i++) {
		var width = (Math.log(MAX_HUE + 2 - i) - Math.log(MAX_HUE + 1 - i)) * num;
		htmlStringLogarithmic += "<span id='hueLog_" + i + "' class='hueColor' style='background-color:hsl(" + (MAX_HUE - i) + ",50%,50%);width:" + width + "px'></span>";
		htmlStringLinear += "<span id='hueLin_" + i + "' class='hueColor' style='background-color:hsl(" + (MAX_HUE - i) + ",50%,50%);width:2.5px'></span>";
	}

	hueSpectrumLogarithmicColors.innerHTML = htmlStringLogarithmic;
	hueSpectrumLinearColors.innerHTML = htmlStringLinear;

	var hueSpectrumLogarithmicLabelMaxCount = document.getElementById("hueSpectrumLogarithmicLabelMaxCount");
	if (hueSpectrumLogarithmicLabelMaxCount) {
		hueSpectrumLogarithmicLabelMaxCount.innerHTML = g_data.maxcount;
	}
	var hueSpectrumLinearLabelMaxCount = document.getElementById("hueSpectrumLinearLabelMaxCount");
	if (hueSpectrumLinearLabelMaxCount) {
		hueSpectrumLinearLabelMaxCount.innerHTML = new Date().getFullYear();
	}

	var video = document.getElementById("video");
	if (video) {
		video.src = "https://www.youtube.com/embed/9l5C8cGMueY?rel=0";
	}

	var lastUpdated = document.getElementById("lastUpdated");
	if (lastUpdated) {
		lastUpdated.innerHTML = "Last Updated: " + g_data.lastUpdated + " | ";
	}
}

function setupEvents() {
	//add hover events to cells
	for (var i = 0; i <= g_data.maxpts; i++) {
		for (var j = 0; j <= g_data.maxpts; j++) {
			var cell = document.getElementById("cell_" + i + "-" + j);
			if (cell) {
				cell.addEventListener("mouseover", mouseOverDelegate(i, j));
				cell.addEventListener("mouseout", mouseOffDelegate(i, j));
				cell.addEventListener("click", onClickDelegate(i, j));
			}
		}
	}

	var modeSelector = document.getElementById("modeSelector");
	if (modeSelector) {
		g_mode = modeSelector.options[modeSelector.selectedIndex].value;
		modeSelector.addEventListener("change", function (e) { changeMode(); });
	}

	var colorblindSwitch = document.getElementById("colorblindSwitch");
	if (colorblindSwitch) {
		colorblindSwitch.addEventListener("change", function (e) { toggleColorblind(e.target.checked); });
	}

	var countSwitch = document.getElementById("countSwitch");
	if (countSwitch) {
		countSwitch.addEventListener("change", function (e) { toggleNumber(e.target.checked); });
	}

	var gradientSwitch = document.getElementById("gradientSwitch");
	if (gradientSwitch) {
		gradientSwitch.addEventListener("change", function (e) { toggleGradient(e.target.checked); });
	}

	var emptyRowsSwitch = document.getElementById("emptyRowsSwitch");
	if (emptyRowsSwitch) {
		emptyRowsSwitch.addEventListener("change", function (e) { toggleEmptyRows(e.target.checked); });
	}

	var yearSlider = document.getElementById("yearSlider");
	if (yearSlider) {
		var date = new Date().getFullYear();
		yearSlider.max = date;
		yearSlider.value = date;
		yearSlider.addEventListener("input", function (e) { (changeYearSlider()); });
	}

	document.addEventListener("scroll", function (e) { handleBMAC() });

	changeMode();
}

function changeMode() {
	var modeSelector = document.getElementById("modeSelector");
	if (modeSelector) {
		g_mode = modeSelector.options[modeSelector.selectedIndex].value;
	}

	for (var i = 0; i <= g_data.maxpts; i++) {
		for (var j = i; j <= g_data.maxpts; j++) {
			var div = document.getElementById("count_" + i + "-" + j);
			if (div) {
				switch (g_mode) {
					case MODE_FIRST_GAME:
						div.innerHTML = g_data.matrix[i][j].first_date.substr(0, 4);
						div.style.fontSize = "6px";
						break;
					case MODE_LAST_GAME:
						div.innerHTML = g_data.matrix[i][j].last_date.substr(0, 4);
						div.style.fontSize = "6px";
						break;
					case MODE_COUNT:
					/* falls through */
					default:
						div.innerHTML = g_data.matrix[i][j].count;
						div.style.fontSize = "8px";
						break;
				}
			}
		}
	}

	var countSwitchText = document.getElementById("countSwitchText");
	if (countSwitchText) {
		switch (g_mode) {
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

	switch (g_mode) {
		case MODE_FIRST_GAME:
			deselectSearchedGame();
			hideSearch();
			showSlider();
			break;
		case MODE_SEARCH:
			hideSlider();
			showSearch();
			break;
		case MODE_LAST_GAME:
		/* falls through */
		case MODE_COUNT:
		/* falls through */
		default:
			deselectSearchedGame();
			hideSlider();
			hideSearch();
			break;
	}

	var spectrumLogarithmic = document.getElementById("hueSpectrumLogarithmic");
	var spectrumLinear = document.getElementById("hueSpectrumLinear");
	if (spectrumLogarithmic && spectrumLinear) {
		switch (g_mode) {
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

	var colorblindSwitch = document.getElementById("colorblindSwitch");
	var countSwitch = document.getElementById("countSwitch");
	var gradientSwitch = document.getElementById("gradientSwitch");
	var emptyRowsSwitch = document.getElementById("emptyRowsSwitch");

	toggleColorblind(colorblindSwitch.checked);
	toggleNumber(countSwitch.checked);
	toggleGradient(gradientSwitch.checked);
	toggleEmptyRows(emptyRowsSwitch.checked);
}

function showSlider() {
	var sliderContainer = document.getElementById("sliderContainer");
	if (sliderContainer) {
		sliderContainer.classList.remove("invisible");
	}
	changeYearSlider();
}

function hideSlider() {
	var sliderContainer = document.getElementById("sliderContainer");
	if (sliderContainer) {
		sliderContainer.classList.add("invisible");
	}

	for (var i = 0; i <= g_data.maxpts; i++) {
		for (var j = i; j <= g_data.maxpts; j++) {
			var cell = document.getElementById("cell_" + i + "-" + j);
			if (cell) {
				cell.classList.remove("later");
				cell.classList.remove("red");
			}
		}
	}
}

function changeYearSlider() {
	var value = parseInt(document.getElementById("yearSlider").value);

	var sliderValue = document.getElementById("sliderValue");
	if (sliderValue) {
		sliderValue.innerHTML = value;
	}

	for (var i = 0; i <= g_data.maxpts; i++) {
		for (var j = i; j <= g_data.maxpts; j++) {
			var cell = document.getElementById("cell_" + i + "-" + j);
			if (cell && cell.classList.contains("green")) {
				var year = parseInt(g_data.matrix[i][j].first_date.substr(0, 4));
				if (year > value) {
					cell.classList.add("later");
					cell.classList.remove("red");
				}
				else if (year === value) {
					cell.classList.add("red");
					cell.classList.remove("later");
				}
				else {
					cell.classList.remove("red");
					cell.classList.remove("later");
				}
			}
		}
	}

}

function showSearch() {
	var searchContainer = document.getElementById("searchContainer");
	if (searchContainer) {
		searchContainer.classList.remove("invisible");
	}
}

function hideSearch() {
	var searchContainer = document.getElementById("searchContainer");
	if (searchContainer) {
		searchContainer.classList.add("invisible");
	}
}

//shades the cells based on the number of times that score has been achieved
function toggleGradient(on) {
	var matrix = g_data.matrix;

	var max;
	var min;
	var colorblind = document.getElementById("colorblindSwitch").checked;

	switch (g_mode) {
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

	for (var i = 0; i <= g_data.maxpts; i++) {
		for (var j = i; j <= g_data.maxpts; j++) {
			var cell = document.getElementById("cell_" + i + "-" + j);
			if (cell) {
				if (on) {
					cell.classList.add("gradient");
					if (cell.classList.contains("green")) {
						if (colorblind) {
							var r;
							var g;
							var b;
							var rDiff = COLORBLIND_START_R - COLORBLIND_END_R;
							var gDiff = COLORBLIND_START_G - COLORBLIND_END_G;
							var bDiff = COLORBLIND_START_B - COLORBLIND_END_B;
							switch (g_mode) {
								case MODE_FIRST_GAME:
									var year = parseInt(matrix[i][j].first_date.substr(0, 4));
									r = COLORBLIND_START_R - rDiff * (year - min) / (max - min);
									g = COLORBLIND_START_G - gDiff * (year - min) / (max - min);
									b = COLORBLIND_START_B - bDiff * (year - min) / (max - min);
									break;
								case MODE_LAST_GAME:
									var year = parseInt(matrix[i][j].last_date.substr(0, 4));
									r = COLORBLIND_START_R - rDiff * (year - min) / (max - min);
									g = COLORBLIND_START_G - gDiff * (year - min) / (max - min);
									b = COLORBLIND_START_B - bDiff * (year - min) / (max - min);
									break;
								case MODE_COUNT:
								/* falls through */
								default:
									r = COLORBLIND_START_R - rDiff * Math.log(matrix[i][j].count) / max;
									g = COLORBLIND_START_G - gDiff * Math.log(matrix[i][j].count) / max;
									b = COLORBLIND_START_B - bDiff * Math.log(matrix[i][j].count) / max;
									break;
							}
							cell.style.backgroundColor = "rgba(" + r + "," + g + "," + b + ",1)";
						}
						else {
							// var alpha = 0.9 * matrix[i][j].count / g_data.maxcount + 0.1;
							// cell.style.backgroundColor = "rgba(0,128,0," + alpha + ")";
							var hue;
							switch (g_mode) {
								case MODE_FIRST_GAME:
									var year = parseInt(matrix[i][j].first_date.substr(0, 4));
									hue = MAX_HUE - MAX_HUE * (year - min) / (max - min);
									break;
								case MODE_LAST_GAME:
									var year = parseInt(matrix[i][j].last_date.substr(0, 4));
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
				}
				else {
					cell.classList.remove("gradient");
					if (cell.classList.contains("green")) {
						cell.style.backgroundColor = "";
					}
				}
			}
		}
	}
	var spectrumLogarithmic = document.getElementById("hueSpectrumLogarithmic");
	if (spectrumLogarithmic && g_mode === MODE_COUNT) {
		if (on && !colorblind) {
			spectrumLogarithmic.classList.remove("invisible");
		}
		else {
			spectrumLogarithmic.classList.add("invisible");
		}
	}
	var spectrumLinear = document.getElementById("hueSpectrumLinear");
	if (spectrumLinear && (g_mode === MODE_FIRST_GAME || g_mode === MODE_LAST_GAME)) {
		if (on && !colorblind) {
			spectrumLinear.classList.remove("invisible");
		}
		else {
			spectrumLinear.classList.add("invisible");
		}
	}
}

function toggleColorblind(on) {
	var body = document.getElementById("body");
	if (on) {
		body.classList.add("colorblind");
	}
	else {
		body.classList.remove("colorblind");
	}

	var gradientSwitch = document.getElementById("gradientSwitch");
	toggleGradient(gradientSwitch.checked);
}

function toggleNumber(on) {
	for (var i = 0; i <= g_data.maxpts; i++) {
		for (var j = i; j <= g_data.maxpts; j++) {
			var div = document.getElementById("count_" + i + "-" + j);
			if (div) {
				if (on) {
					div.classList.remove("hidden");
				}
				else {
					div.classList.add("hidden");
				}
			}
		}
	}
}

function toggleEmptyRows(on) {
	for (var i = g_data.maxlosepts + 1; i <= g_data.maxpts; i++) {
		var row = document.getElementById("row_" + i);
		if (row) {
			if (on) {
				row.classList.remove("hidden");
			}
			else {
				row.classList.add("hidden");
			}
		}
	}
}

//called when user moves mouse over an element
//adds adjhover class to all elements in the same row and column as the hovered element
function mouseOver(i, j) {
	for (var k = 0; k <= g_data.maxpts; k++) {
		var cell = document.getElementById("hover_" + i + "-" + k);
		if (cell && k !== j) {
			cell.classList.add("adjhover");
		}
		else if (k === j) {
			cell.classList.add("over");
		}
		cell = document.getElementById("hover_" + k + "-" + j);
		if (cell && k !== i) {
			cell.classList.add("adjhover");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.add("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.add("adjhover");
	var specialHeader2 = document.getElementById("specialHeader_" + (j + 1));
	if (specialHeader2) {
		specialHeader2.innerHTML = j;
		specialHeader2.classList.add("adjhover");
	}
	var specialHeader = document.getElementById("specialHeader_" + i);
	if (specialHeader) {
		specialHeader.innerHTML = i;
		specialHeader.classList.add("adjhover");
	}
}

//called when moves mouse off an element
//removes adjhover class to all elements in the same row and column as the hovered element
function mouseOff(i, j) {
	for (var k = 0; k <= g_data.maxpts; k++) {
		var cell = document.getElementById("hover_" + i + "-" + k);
		if (cell && k !== j) {
			cell.classList.remove("adjhover");
		}
		else if (k === j) {
			cell.classList.remove("over");
		}
		cell = document.getElementById("hover_" + k + "-" + j);
		if (cell && k !== i) {
			cell.classList.remove("adjhover");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.remove("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.remove("adjhover");
	var specialHeader2 = document.getElementById("specialHeader_" + (j + 1));
	if (specialHeader2) {
		specialHeader2.innerHTML = "";
		specialHeader2.classList.remove("adjhover");
	}
	var specialHeader = document.getElementById("specialHeader_" + i);
	if (specialHeader) {
		specialHeader.innerHTML = "";
		specialHeader.classList.remove("adjhover");
	}
}

function onClick(i, j) {
	hideHelper();
	var data = g_data.matrix[i][j];
	var infoBox = document.getElementById("infoBox");
	var cell = document.getElementById("cell_" + i + "-" + j);
	if (infoBox) {
		infoBox.classList.add("hidden");

		if (cell && !cell.classList.contains("later") && data.count > 0) {
			var htmlString = "";

			htmlString += "<span id=infoBoxScore>Score: " + j + "-" + i + "</span> ";
			if (data.count > 1) {
				htmlString += "(<a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i + "'>view all " + data.count + " games</a>)";
			}

			htmlString += "<span id='infoBoxClose' onclick='closeInfoBox()'>(<u>close</u>)</span>";

			var dateOptions = { year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" };
			var firstDate = new Date(data.first_date).toLocaleDateString("en-US", dateOptions);

			htmlString += "<br/>First Game: ";
			if (i !== j) {
				htmlString += "<b>";
			}
			htmlString += data.first_team_win + " " + j + " ";
			if (i !== j) {
				htmlString += "</b>";
			}
			if (data.first_team_win === data.first_team_home) {
				htmlString += "vs";
			}
			else {
				htmlString += "@";
			}
			htmlString += " " + i + " " + data.first_team_lose + " | ";
			htmlString += firstDate + " ";
			htmlString += "(<a href='" + data.first_link + "'>boxscore</a>)<br/>";

			if (data.count > 1) {
				var lastDate = new Date(data.last_date).toLocaleDateString("en-US", dateOptions);

				htmlString += "Latest Game: ";
				if (i !== j) {
					htmlString += "<b>";
				}
				htmlString += data.last_team_win + " " + j + " ";
				if (i !== j) {
					htmlString += "</b>";
				}
				if (data.last_team_win === data.last_team_home) {
					htmlString += "vs";
				}
				else {
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
			if (window.pageXOffset + cellRect.x - (infoBoxRect.width + cellRect.width) / 2 + infoBoxRect.width + 2 * INFOBOX_OUTER_PIXELS > windowRight) {
				boxRight = document.body.offsetWidth - document.documentElement.clientWidth - window.pageXOffset;
				boxLeft = Math.floor(windowRight - infoBoxRect.width);
			}
			//otherwise center it horizontally on the clicked cell
			else {
				boxLeft = window.pageXOffset + cellRect.x - (infoBoxRect.width + cellRect.width) / 2;
				infoBox.style.width = infoBoxRect.width;
			}
			//if the box would extend past the left side of the screen, place it on the left side of the screen
			if (boxLeft < window.pageXOffset) {
				boxLeft = window.pageXOffset;
			}
			infoBox.style.left = boxLeft;
			infoBox.style.right = boxRight;
			infoBoxRect = infoBox.getBoundingClientRect();
			//place it above the cell, unless it would extend past the top of the screen
			if (cellRect.y - infoBoxRect.height - 2 * INFOBOX_OUTER_PIXELS < 0) {
				infoBox.style.top = window.pageYOffset + cellRect.y + cellRect.height - 2 * INFOBOX_OUTER_PIXELS;
			}
			else {
				infoBox.style.top = window.pageYOffset + cellRect.y - infoBoxRect.height - 2 * INFOBOX_OUTER_PIXELS;
			}
		}
	}
}

/* exported closeInfoBox */
function closeInfoBox() {
	var infoBox = document.getElementById("infoBox");
	if (infoBox) {
		infoBox.classList.add("hidden");
	}
}

function hideHelper() {
	var helper = document.getElementById("helper");
	if (helper) {
		helper.classList.add("hidden");
	}
}

function renderLiveGames() {
	var liveGames = document.getElementById("liveGamesContent");
	var relevantInfo = [];
	if (liveGames) {
		var htmlString = "";

		for (var i = 0; i < g_liveGames.length; i++) {
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
			var phase = game.status.type.name;
			var homeScore = null;
			var awayScore = null;
			var homeNick = "";
			var awayNick = "";
			var homeAbbr = "";
			var awayAbbr = "";

			for (let competitorIndex in game.competitions[0].competitors) {
				var competitor = game.competitions[0].competitors[competitorIndex];
				if (competitor.homeAway === "home") {
					homeScore = parseInt(competitor.score);
					homeNick = competitor.team.shortDisplayName;
					homeAbbr = competitor.team.abbreviation;
				}
				else {
					awayScore = parseInt(competitor.score);
					awayNick = competitor.team.shortDisplayName;
					awayAbbr = competitor.team.abbreviation;
				}
			}

			relevantInfo.push({ homeScore: homeScore, awayScore: awayScore });

			var newUpdate = false;
			if (g_prevLiveGames && (g_prevLiveGames[i].awayScore !== awayScore || g_prevLiveGames[i].homeScore !== homeScore)) {
				newUpdate = true;
			}
			//console.log(game);
			htmlString += "<div class='liveGameContainer'>";

			htmlString += "<div id='liveGame_" + i + "' class='liveGame";

			var liveGame = document.getElementById("liveGame_" + i);
			if (liveGame && liveGame.classList.contains("selected")) {
				htmlString += " selected";
				moveSelectedCell(i);
			}

			if (newUpdate || (liveGame && liveGame.classList.contains("newUpdate"))) {
				htmlString += " newUpdate";
				if (document.hasFocus()) {
					clearUpdate();
				}
			}

			htmlString += "' onclick='liveGameClick(" + i + ");'>";
			htmlString += "<div class='liveGameContent'>";
			htmlString += "<div class='teams'>";
			htmlString += "<div class='teamInfo'><div class='img' style='background-image:url(\"../images/teams/" + awayAbbr + ".png\")'></div>";
			htmlString += awayNick;
			if (phase === "STATUS_IN_PROGRESS" || phase === "STATUS_HALFTIME" || phase === "STATUS_SUSPENDED" || phase === "STATUS_FINAL" || phase === "STATUS_FINAL_OVERTIME" || phase === "STATUS_END_PERIOD") {
				// if(game.score.possessionTeamAbbr === game.gameSchedule.visitorTeamAbbr && phase !== "HALFTIME" && phase !== "FINAL" && phase !== "FINAL_OVERTIME")
				// {
				// 	htmlString += " &bull;";
				// }
				htmlString += "<span class='teamScore'>" + awayScore + "</span>";
			}
			htmlString += "</div>";
			htmlString += "<div class='teamInfo'><div class='img' style='background-image:url(\"../images/teams/" + homeAbbr + ".png\")'></div>";
			htmlString += homeNick;
			if (phase === "STATUS_IN_PROGRESS" || phase === "STATUS_HALFTIME" || phase === "STATUS_SUSPENDED" || phase === "STATUS_FINAL" || phase === "STATUS_FINAL_OVERTIME" || phase === "STATUS_END_PERIOD") {
				// if(game.score.possessionTeamAbbr === game.gameSchedule.homeTeamAbbr && phase !== "HALFTIME" && phase !== "FINAL" && phase !== "FINAL_OVERTIME")
				// {
				// 	htmlString += " &bull;";
				// }
				htmlString += "<span class='teamScore'>" + homeScore + "</span>";
			}
			htmlString += "</div>";
			htmlString += "</div>";
			htmlString += "<div class='gameInfoWrapper'><div class='gameInfo'>";
			switch (phase) {
				case "STATUS_IN_PROGRESS":
					htmlString += game.status.type.detail.replace(" - ", "<br/>").replace(" Quarter", "");
					break;
				case "STATUS_HALFTIME":
					htmlString += "Halftime";
					break;
				case "STATUS_SUSPENDED":
					htmlString += "<span style='font-size: 12px'>Suspended</span>";
					break;
				case "STATUS_END_PERIOD":
					htmlString += game.status.type.detail.replace(" of ", "<br/>").replace(" Quarter", "");
					break;
				case "STATUS_FINAL":
					htmlString += "Final";
					break;
				default:
					var date = new Date(game.date);
					var day;
					//check if the game is within the next week, if yes display weekday, if no display date and change title to "Upcoming Games"
					if (Date.now() + 604800000 >= date.getTime()) {
						day = (date.toLocaleDateString("en-US", { weekday: "short" }));
					}
					else {
						day = (date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
						document.getElementById("liveGamesTitle").innerHTML = "Upcoming Games";
					}
					var time = (date.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" }));
					htmlString += day + "<br />" + time;
					break;
			}
			htmlString += "</div></div></div>";
			htmlString += "<div class='liveGameFooter'>";

			//if game is preseason or probowl
			//TODO: double check that type 3 is postseason and other types are exhibition games
			if ((game.season.type !== 2 && game.season.type !== 3) || game.competitions[0].type.abbreviation == "ALLSTAR") {
				htmlString += "Untracked Exhibition Game";
			}
			//if game is over
			else if (phase === "STATUS_FINAL" || phase == "STATUS_FINAL_OVERTIME") {
				var highScore = (awayScore > homeScore ? awayScore : homeScore);
				var lowScore = (awayScore > homeScore ? homeScore : awayScore);
				var matrix = g_data.matrix;
				if (g_data.newScorigami.includes(game.id) || !matrix[lowScore] || !matrix[lowScore][highScore] || matrix[lowScore][highScore].count === 0) {
					htmlString += "<span class='newScorigami'>SCORIGAMI!</span>";
				}
				else {
					htmlString += "No Scorigami (" + matrix[lowScore][highScore].count + ")";
				}
			}
			//if game is ongoing
			else if (phase === "STATUS_IN_PROGRESS" || phase === "STATUS_HALFTIME" || phase === "STATUS_END_PERIOD") {
				var probability = getScorigamiProbability(game);
				htmlString += "Chance of Scorigami: " + probability + "%";
			}
			//if game is upcoming
			else {
				var date = new Date(game.date).toLocaleDateString('en-US', { timeZone: "America/New_York", year: 'numeric', month: '2-digit', day: '2-digit' });
				date = date.substr(6, 4) + date.substr(0, 2) + date.substr(3, 2);

				htmlString += "<a href='https://www.pro-football-reference.com/boxscores/" + date + "0" + getShorthandName(homeAbbr) + ".htm'>Game Preview</a>";
			}
			htmlString += "</div></div></div>";

			htmlString += "<div id='liveGameSeparator_" + i + "' class='liveGameSeparator'></div>"
		}

		liveGames.innerHTML = htmlString;

		var liveGamesContainer = document.getElementById("liveGamesContainer");
		if (g_liveGames.length >= 1 && liveGamesContainer) {
			liveGamesContainer.classList.remove("hidden");
		}
	}

	//only runs once
	if (!g_prevLiveGames) {
		window.addEventListener("focus", clearUpdate);
	}

	g_prevLiveGames = relevantInfo;
}

/* exported liveGameClick */
function liveGameClick(index) {
	var liveGame = document.getElementById("liveGame_" + index);
	if (liveGame) {
		if (liveGame.classList.contains("selected")) {
			liveGameSelect(index);
			liveGame.classList.remove("selected");
		}
		else {
			liveGameDeselect(index);
			liveGame.classList.add("selected");
		}
	}
	selectTableCells();
}

function liveGameSelect(index) {
	var liveGame = document.getElementById("liveGame_" + index);
	if (liveGame) {
		liveGame.classList.add("selected");
	}
}

function liveGameDeselect(index) {
	var liveGame = document.getElementById("liveGame_" + index);
	if (liveGame) {
		liveGame.classList.remove("selected");
	}
}

/* exported liveGameSelectGroup */
function liveGameSelectGroup(group) {
	liveGameDeselectAll();
	var selectedGameIndexes = [];
	for (var i = 0; i < g_liveGames.length; i++) {
		var game = g_liveGames[i];
		var phase = game.status.type.name;
		if (phase && phase.startsWith("OT")) {
			phase = "OT1"
		}
		if (group === GROUP_ALL) {
			selectedGameIndexes.push(i);
		}
		else if (group === GROUP_ONGOING) {
			if (phase === "STATUS_IN_PROGRESS" || phase === "HALFTIME" || phase === "STATUS_END_PERIOD") {
				selectedGameIndexes.push(i);
			}
		}
		else if (group === GROUP_FINISHED) {
			if (phase === "STATUS_FINAL" || phase === "STATUS_FINAL_OVERTIME") {
				selectedGameIndexes.push(i);
			}
		}
		else if (group === GROUP_TEN) {
			if (getScorigamiProbability(game) >= 10.0) {
				selectedGameIndexes.push(i);
			}
		}
	}
	for (var i = 0; i < selectedGameIndexes.length; i++) {
		liveGameSelect(selectedGameIndexes[i]);
	}
	selectTableCells();
}

/* exported liveGameDeselectAll */
function liveGameDeselectAll() {
	for (var i = 0; i < g_liveGames.length; i++) {
		liveGameDeselect(i);
	}
	selectTableCells();
}

function selectTableCells() {
	var selectedCellIds = [];
	for (var i = 0; i < g_liveGames.length; i++) {
		var game = g_liveGames[i];
		//console.log(game);
		var homeScore = null
		var awayScore = null
		var phase = game.status.type.name;

		for (let competitorIndex in game.competitions[0].competitors) {
			var competitor = game.competitions[0].competitors[competitorIndex];
			if (competitor.homeAway === "home") {
				homeScore = parseInt(competitor.score);
			}
			else {
				awayScore = parseInt(competitor.score);
			}
		}

		var highScore = (awayScore > homeScore ? awayScore : homeScore);
		var lowScore = (awayScore > homeScore ? homeScore : awayScore);
		var id = "hover_" + lowScore + "-" + highScore;

		var liveGame = document.getElementById("liveGame_" + i);
		if (liveGame && liveGame.classList.contains("selected") && phase !== "STATUS_SCHEDULED") {
			selectedCellIds.push(id);
		}

		var cell = document.getElementById(id);
		if (cell) {
			cell.classList.remove("selected");
		}
	}
	for (var i = 0; i < selectedCellIds.length; i++) {
		var id = selectedCellIds[i];
		var cell = document.getElementById(id);
		if (cell) {
			cell.classList.add("selected");
		}
	}
}

function moveSelectedCell(index) {

	var oldGame = g_prevLiveGames[index];
	var oldHomeScore = (typeof oldGame.homeScore !== "undefined" ? oldGame.homeScore : null);
	var oldAwayScore = (typeof oldGame.awayScore !== "undefined" ? oldGame.awayScore : null);

	var oldHighScore = (oldAwayScore > oldHomeScore ? oldAwayScore : oldHomeScore);
	var oldLowScore = (oldAwayScore > oldHomeScore ? oldHomeScore : oldAwayScore);
	var oldId = "hover_" + oldLowScore + "-" + oldHighScore;
	var oldCell = document.getElementById(oldId);
	if (oldCell && oldCell.classList.contains("selected")) {
		oldCell.classList.remove("selected");
	}

	var newGame = g_liveGames[index];

	var newHomeScore = null;
	var newAwayScore = null;
	var phase = newGame.status.type.name;

	for (let competitorIndex in newGame.competitions[0].competitors) {
		var competitor = newGame.competitions[0].competitors[competitorIndex];
		if (competitor.homeAway === "home") {
			newHomeScore = parseInt(competitor.score);
		}
		else {
			newAwayScore = parseInt(competitor.score);
		}
	}

	var newHighScore = (newAwayScore > newHomeScore ? newAwayScore : newHomeScore);
	var newLowScore = (newAwayScore > newHomeScore ? newHomeScore : newAwayScore);
	var newId = "hover_" + newLowScore + "-" + newHighScore;
	var newCell = document.getElementById(newId);
	if (newCell && phase !== "STATUS_SCHEDULED") {
		newCell.classList.add("selected");
	}
}

function clearUpdate() {
	clearTimeout(g_updateTimeout);
	g_updateTimeout = setTimeout(function () {
		if (g_liveGames) {
			for (let key in g_liveGames) {
				var liveGame = document.getElementById("liveGame_" + key);
				if (liveGame && liveGame.classList.contains("newUpdate")) {
					liveGame.classList.remove("newUpdate");
				}
			}
		}
	}, 3 * 1000);
}

function onResize() {

	var liveGames = document.getElementById("liveGamesContent");
	if (liveGames) {

		// dynamically remove the bottom border of games on bottom row
		var liveGamesContainer = document.getElementById("liveGamesContainer");

		if (liveGamesContainer) {
			liveGames.style.width = liveGamesContainer.offsetWidth;
		}

		var numPossibleInRow = 1;
		if (window.innerWidth > ((280 * 4) + 30)) {
			numPossibleInRow = 4;
		} else if (window.innerWidth > ((280 * 3) + 30)) {
			numPossibleInRow = 3;
		} else if (window.innerWidth > ((280 * 2) + 30)) {
			numPossibleInRow = 2;
		}

		var liveGameContainers = document.getElementsByClassName("liveGameContainer");

		var numInLastRow = (liveGameContainers.length % numPossibleInRow);
		if (numInLastRow === 0) {
			numInLastRow = numPossibleInRow;
		}

		for (var i = 0; i < liveGameContainers.length; i++) {
			if (i < liveGameContainers.length - numInLastRow) {
				liveGameContainers[i].style.borderBottom = "1px dashed #888888";
			} else {
				liveGameContainers[i].style.borderBottom = "none";
			}
		}

		var liveGameSeparators = document.getElementsByClassName("liveGameSeparator");

		for (var i = 0; i < liveGameSeparators.length; i++) {
			if ((i + 1) % numPossibleInRow === 0 || i === liveGameSeparators.length - 1) {
				liveGameSeparators[i].style.borderRight = "none";
			} else {
				liveGameSeparators[i].style.borderRight = "1px dashed #888888";
			}
		}


	}
}

function getScorigamiProbability(game) {

	var homeScore = null
	var awayScore = null
	var phase = game.status.type.name;

	for (let competitorIndex in game.competitions[0].competitors) {
		var competitor = game.competitions[0].competitors[competitorIndex];
		if (competitor.homeAway === "home") {
			homeScore = parseInt(competitor.score);
		}
		else {
			awayScore = parseInt(competitor.score);
		}
	}

	var clock = game.status.clock;
	var quarter;
	var overtime = false;


	switch (phase) {
		case "STATUS_IN_PROGRESS":
		case "STATUS_END_PERIOD":
			quarter = game.status.period;
			break;
		case "STATUS_HALFTIME":
			quarter = 2;
			clock = 0;
			break;
		case "STATUS_FINAL":
		case "STATUS_FINAL_OVERTIME":
			quarter = 4;
			clock = 0;
			break;
		default:
			quarter = 1;
			clock = 900;
			break;
	}

	quarter = (quarter > 4 ? 4 : quarter);

	var probability = 0.0;
	var matrix = g_data.matrix;

	for (var i = 0; i < chances.length; i++) {
		var chance1 = chances[i];
		var prob1 = getProb(quarter, clock, chance1);
		var score1 = awayScore + chance1.pts;

		for (var j = 0; j < chances.length; j++) {
			var chance2 = chances[j];
			var prob2 = getProb(quarter, clock, chance2);
			var score2 = homeScore + chance2.pts;

			var winScore = (score1 > score2 ? score1 : score2);
			var loseScore = (score1 > score2 ? score2 : score1);

			if (!matrix[loseScore] || !matrix[loseScore][winScore] || matrix[loseScore][winScore].count === 0) {
				if (loseScore === winScore && !overtime) {
					probability += prob1 * prob2 / 75.0;
				}
				else {
					probability += prob1 * prob2;
				}
			}

		}
	}

	probability *= 100.0;

	return probability.toFixed(2);
}

function factorial(n) {
	if (n <= 1) {
		return 1;
	}
	return n * factorial(n - 1);
}

function getProb(quarter, clock, chance) {
	var prob = Math.exp(-1 * (((4 - quarter) * 15 + (clock / 60.0)) / 60.0 * 4.22)) * Math.pow((((4 - quarter) * 15 + (clock / 60.0)) / 60 * 4.22), (chance.td_1pt + chance.fg + chance.td + chance.td_2pt + chance.safety)) / factorial(chance.td_1pt + chance.fg + chance.td + chance.td_2pt + chance.safety) * chance.bin_chance;

	return prob;
}

function handleBMAC() {
	if (window.scrollY >= 500) {
		var bmac = document.getElementById("bmac");
		if (bmac && !g_bmacAnimating && !bmac.classList.contains("hidden")) {
			g_bmacAnimating = true;
			bmac.style.right = 5;
			bmacOut();
		}
	}
	if (window.scrollY == 0) {
		var bmac = document.getElementById("bmac");
		if (bmac && !g_bmacAnimating && bmac.classList.contains("hidden")) {
			//g_bmacAnimating = true;
			//bmac.classList.remove("hidden");
			//bmacIn();
		}
	}
}

function bmacIn() {
	var bmac = document.getElementById("bmac");
	if (bmac) {
		var right = parseInt(bmac.style.right);
		if (right < 5) {
			right += 15;
			bmac.style.right = right;
			setTimeout(bmacIn, 10);
		}
		else {
			bmac.style.right = 5;
			g_bmacAnimating = false;
		}
	}
}

function bmacOut() {
	var bmac = document.getElementById("bmac");
	if (bmac) {
		var right = parseInt(bmac.style.right);
		if (right > -200) {
			right -= 15;
			bmac.style.right = right;
			setTimeout(bmacOut, 10);
		}
		else {
			bmac.style.right = -200;
			g_bmacAnimating = false;
			bmac.classList.add("hidden");
		}
	}
}

//delegate functions to make it possible to create event listeners in a loop
function onClickDelegate(i, j) {
	return function () {
		onClick(i, j);
	};
}

function mouseOverDelegate(i, j) {
	return function () {
		mouseOver(i, j);
	};
}

function mouseOffDelegate(i, j) {
	return function () {
		mouseOff(i, j);
	};
}

function onScoreSearchChange() {
	if (searchSelectedGameId) {
		var cell = document.getElementById(searchSelectedGameId);
		if (cell) {
			cell.classList.remove("hover");
			cell.classList.remove("selected");
		}
	}
	var searchClearButton = document.getElementById("scoreSearchClearButton");
	var homeScore = document.getElementById("score1SearchInput").value;
	var awayScore = document.getElementById("score2SearchInput").value;
	if (homeScore && awayScore) {
		var highScore = (awayScore > homeScore ? awayScore : homeScore);
		var lowScore = (awayScore > homeScore ? homeScore : awayScore);
		searchSelectedGameId = "cell_" + lowScore + "-" + highScore;
		var cell = document.getElementById(searchSelectedGameId);
		if (cell) {
			cell.classList.add("hover")
			cell.classList.add("selected");
		}
		if (searchClearButton && searchClearButton.classList.contains("invisible")) {
			searchClearButton.classList.remove("invisible");
		}
	}
	else {
		if (searchClearButton && !searchClearButton.classList.contains("invisible")) {
			searchClearButton.classList.add("invisible");
		}
	}
}

function deselectSearchedGame() {
	var searchClearButton = document.getElementById("scoreSearchClearButton");
	if (searchSelectedGameId) {
		var cell = document.getElementById(searchSelectedGameId);
		if (cell) {
			cell.classList.remove("hover");
			cell.classList.remove("selected");
		}
	}
	searchSelectedGameId = null;
	document.getElementById("score1SearchInput").value = "";
	document.getElementById("score2SearchInput").value = "";
	if (searchClearButton && !searchClearButton.classList.contains("invisible")) {
		searchClearButton.classList.add("invisible");
	}
}

function onScoreSearchClear() {
	deselectSearchedGame();
}