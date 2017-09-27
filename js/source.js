var g_data;

window.onload = function()
{
	$.ajax({
			url: '/data',						
			success: function(data) {
				//console.log('success');
				//console.log(data);
				g_data = data;
				main(data);
			},
			error: function(data) {
				console.log('error');
				console.log(data);
				
				// two arguments: the id of the Timeline container (no '#')
				// and the JSON object or an instance of TL.TimelineConfig created from
				// a suitable JSON object
				//window.timeline = new TL.Timeline('timeline-embed', 'marktwain_test.json');
			}
		});
};

//sets up table
function main()
{
	var matrix = g_data.matrix;
	
	var table = document.getElementById('scoreTable');
	var htmlstring = "";
	
	//cycle through all elements in the table (maxpts will always be the length and width of the matrix)
	//start at -1 so labels can be added
	for(var i = -1; i <= g_data.maxpts; i++)
	{
		htmlstring += "<tr>";
		for(var j = -1; j <= g_data.maxpts; j++)
		{
			//if i==-1, we are in the label row
			if(i == -1)
			{
				//do not label the top left cell, since the left column is all labels
				if (j < 0)
				{
					htmlstring += "<th></th>";
				}
				//adding column lables
				else
				{
					htmlstring += "<th id='colHeader_" + j + "'>" + j + "</th>";
				}
			}
			else
			{
				//coloring black squares
				if(j < i - 1)
				{
					htmlstring += "<td class='black'></td>";
				}
				//adding row label
				else if (j == i-1)
				{
					htmlstring += "<th id='rowHeader_" + i + "' class='black'>" + i + "</th>";
				}
				//color in green squares
				else if (matrix[i][j] > 0)
				{
					htmlstring += "<td id='cell_" + i + "-" + j + "' class='green'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'><div><div id='count_" + i + "-" + j + "' class='count'>" + matrix[i][j] + "</div></div></a></td>";
				}
				//fill in empty squares
				else
				{
					//color black squares for impossible scores along 1 point line
					//NOTE: we can do this after coloring in the green squares since these squares will never be green
					if( i == 1)
					{
						switch (j)
						{
							case 1:
							case 2: 
							case 3: 
							case 4:
							case 5:
							case 7: 
								htmlstring += "<td class='black'></td>";
								break;
							default:
								htmlstring += "<td id='cell_" + i + "-" + j + "' class='blank'></td>";
								break;
								
						}
					}
					//color 0,1 square black since that is also impossible
					//NOTE: we can do this after coloring in the green squares since this square will never be green
					else if (i == 0 && j == 1)
					{
						htmlstring += "<td class='black'></td>";
					}
					else
					{
						htmlstring += "<td id='cell_" + i + "-" + j + "' class='blank'></td>";
					}
				}
			}
		}
		htmlstring += "</tr>";
	}
	table.innerHTML = htmlstring;
	
	//add events to cells
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = 0; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				cell.addEventListener('mouseover', mouseOverDelegate(i, j));
				cell.addEventListener('mouseout', mouseOffDelegate(i, j));
			}
		}
	}
	//toggleGradient();
	//toggleCount();
}

//shades the cells based on the number of times that score has been achieved
function toggleGradient()
{
	var matrix = g_data.matrix;
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = 0; j <= g_data.maxpts; j++)
		{
			var cell = document.getElementById("cell_" + i + "-" + j);
			if(cell)
			{
				if(cell.classList.contains("gradient"))
				{
					cell.classList.remove("gradient");
					if (cell.classList.contains("green"))
					{
						cell.firstChild.firstChild.style.backgroundColor = "";
					}
				}
				else
				{
					cell.classList.add("gradient");
					if (cell.classList.contains("green"))
					{
						var alpha = 1.0 - (0.8 * matrix[i][j] / g_data.maxcount + 0.1);
						cell.firstChild.firstChild.style.backgroundColor = "rgba(255,255,255," + alpha + ")";
					}
				}
			}
		}
	}

					//htmlstring += "<td id='cell_" + i + "-" + j + "' class='green' style='background-color:rgba(0,128,0," + alpha + ")'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'>&nbsp</a></td>";
}

function toggleCount()
{
	for(var i = 0; i <= g_data.maxpts; i++)
	{
		for(var j = 0; j <= g_data.maxpts; j++)
		{
			var div = document.getElementById("count_" + i + "-" + j);
			if(div)
			{
				if(div.classList.contains("hidden"))
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

//called when user moves mouse over an element
//adds adjhover class to all elements in the same row and column as the hovered element
function mouseOver(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		var cell = document.getElementById("cell_" + i + "-" + k);
		if(cell && k != j)
		{
			cell.classList.add("adjhoverH");
		}
		var cell = document.getElementById("cell_" + k + "-" + j);
		if(cell && k != i)
		{
			cell.classList.add("adjhoverV");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.add("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.add("adjhover");
}
//called when moves mouse off an element
//removes adjhover class to all elements in the same row and column as the hovered element
function mouseOff(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		var cell = document.getElementById("cell_" + i + "-" + k);
		if(cell && k != j)
		{
			cell.classList.remove("adjhoverH");
		}
		var cell = document.getElementById("cell_" + k + "-" + j);
		if(cell && k != i)
		{
			cell.classList.remove("adjhoverV");
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.classList.remove("adjhover");
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.classList.remove("adjhover");
}

//delegate functions to make it possible to create event liteners in a loop
function mouseOverDelegate(i, j) {
  return function(){
      mouseOver(i, j)
  }
}
function mouseOffDelegate(i, j) {
  return function(){
      mouseOff(i, j)
  }
}