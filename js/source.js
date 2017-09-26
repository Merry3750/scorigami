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

function main()
{
	var matrix = g_data.matrix
	
	var table = document.getElementById('scoreTable');
	var htmlstring = "";
	
	for(var i = -1; i <= g_data.maxpts; i++)
	{
		htmlstring += "<tr>";
		for(var j = -1; j <= g_data.maxpts; j++)
		{
			if(i == -1)
			{
				if (j < 0)
				{
					htmlstring += "<th></th>";
				}
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
				//adding number
				else if (j == i-1)
				{
					htmlstring += "<th id='rowHeader_" + i + "' class='black'>" + i + "</th>";
				}
				//color in green squares
				else if (matrix[i][j] > 0)
				{
					htmlstring += "<td id='cell_" + i + "-" + j + "' class='green'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'>&nbsp</a></td>";
					//var alpha = 0.9 * matrix[i][j] / g_data.maxcount + 0.1;
					//htmlstring += "<td id='cell_" + i + "-" + j + "' class='green' style='background-color:rgba(0,128,0," + alpha + ")'><a href='https://www.pro-football-reference.com/boxscores/game_scores_find.cgi?pts_win=" + j + "&pts_lose=" + i +"'>&nbsp</a></td>";
				}
				//fill in empty squares
				else
				{
					//color black squares for impossible scores along 1 point line
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
	
	//onmouseover='mouseOver(" + i + "," + j + ");' onmouseout='mouseOff(" + i + "," + j + ");'
}
function mouseOver(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		var cell = document.getElementById("cell_" + i + "-" + k);
		if(cell && k != j)
		{
			if(cell.classList.contains('green'))
			{
				cell.style = "background-color:#008800;";
			}
			else
			{
				cell.style = "background-color:#EEEEEE;";
			}
		}
		var cell = document.getElementById("cell_" + k + "-" + j);
		if(cell && k != i)
		{
			if(cell.classList.contains('green'))
			{
				cell.style = "background-color:#008800;";
			}
			else
			{
				cell.style = "background-color:#EEEEEE;";
			}
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.style = "background-color:yellow;font-size:12px;";
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.style = "background-color:yellow;font-size:12px;color:black";
}
function mouseOff(i, j)
{
	for(var k = 0; k <= g_data.maxpts; k++)
	{
		var cell = document.getElementById("cell_" + i + "-" + k);
		if(cell && k != j)
		{
			cell.style = "";
		}
		var cell = document.getElementById("cell_" + k + "-" + j);
		if(cell && k != i)
		{
			cell.style = "";
		}
	}
	var colHeader = document.getElementById("colHeader_" + j);
	colHeader.style = "";
	var rowHeader = document.getElementById("rowHeader_" + i);
	rowHeader.style = "";
}
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