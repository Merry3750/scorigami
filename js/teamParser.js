function getFullName(string)
{
	switch(string)
	{
		case "ARI":
			return "Arizona Cardinals";
			break;
		case "ATL":
			return "Atlanta Falcons";
			break;
		case "BAL":
			return "Baltimore Ravens";
			break;
		case "BUF":
			return "Buffalo Bills";
			break;
		case "CAR":
			return "Carolina Panthers";
			break;
		case "CHI":
			return "Chicago Bears";
			break;
		case "CIN":
			return "Cincinnati Bengals";
			break;
		case "CLE":
			return "Cleveland Browns";
			break;
		case "DAL":
			return "Dallas Cowboys";
			break;
		case "DEN":
			return "Denver Broncos";
			break;
		case "DET":
			return "Detroit Lions";
			break;
		case "GB":
			return "Green Bay Packers";
			break;
		case "HOU":
			return "Houston Texans";
			break;
		case "IND":
			return "Indianapolis Colts";
			break;
		case "JAX":
			return "Jacksonville Jaguars";
			break;
		case "KC":
			return "Kansas City Chiefs";
			break;
		case "LA":
			return "Los Angeles Rams";
			break;
		case "LAC":
			return "Los Angeles Chargers";
			break;
		case "MIA":
			return "Miami Dolphins";
			break;
		case "MIN":
			return "Minnesota Vikings";
			break;
		case "NE":
			return "New England Patriots";
			break;
		case "NO":
			return "New Orleans Saints";
			break;
		case "NYG":
			return "New York Giants";
			break;
		case "NYJ":
			return "New York Jets";
			break;
		case "OAK":
			return "Oakland Raiders";
			break;
		case "PHI":
			return "Philadelphia Eagles";
			break;
		case "PIT":
			return "Pittsburgh Steelers";
			break;
		case "SEA":
			return "Seattle Seahawks";
			break;
		case "SF":
			return "San Francisco 49ers";
			break;
		case "TB":
			return "Tampa Bay Buccaneers";
			break;
		case "TEN":
			return "Tennessee Titans";
			break;
		case "WAS":
			return "Washington Redskins";
			break;
	}

}

function getShorthandName(string)
{
	
	switch(string)
	{
		case "ARI":
			return "ARI";
			break;
		case "ATL":
			return "ATL";
			break;
		case "BAL":
			return "RAV";
			break;
		case "BUF":
			return "BUF";
			break;
		case "CAR":
			return "CAR";
			break;
		case "CHI":
			return "CHI";
			break;
		case "CIN":
			return "CIN";
			break;
		case "CLE":
			return "CLE";
			break;
		case "DAL":
			return "DAL";
			break;
		case "DEN":
			return "DEN";
			break;
		case "DET":
			return "DET";
			break;
		case "GB":
			return "GNB";
			break;
		case "HOU":
			return "HOU";
			break;
		case "IND":
			return "IND";
			break;
		case "JAX":
			return "JAX";
			break;
		case "KC":
			return "KAN";
			break;
		case "LA":
			return "LAR";
			break;
		case "LAC":
			return "LAC";
			break;
		case "MIA":
			return "MIA";
			break;
		case "MIN":
			return "MIN";
			break;
		case "NE":
			return "NWE";
			break;
		case "NO":
			return "NOR";
			break;
		case "NYG":
			return "NYG";
			break;
		case "NYJ":
			return "NYJ";
			break;
		case "OAK":
			return "OAK";
			break;
		case "PHI":
			return "PHI";
			break;
		case "PIT":
			return "PIT";
			break;
		case "SEA":
			return "SEA";
			break;
		case "SF":
			return "SFO";
			break;
		case "TB":
			return "TAM";
			break;
		case "TEN":
			return "TEN";
			break;
		case "WAS":
			return "WAS";
			break;
		default:
			return string;
			break;
	}
}

module.exports = {
	getFullName": getFullName,
	getShorthandName": getShorthandName
}