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
			return "crd";
			break;
		case "ATL":
			return "atl";
			break;
		case "BAL":
			return "rav";
			break;
		case "BUF":
			return "buf";
			break;
		case "CAR":
			return "car";
			break;
		case "CHI":
			return "chi";
			break;
		case "CIN":
			return "cin";
			break;
		case "CLE":
			return "cle";
			break;
		case "DAL":
			return "dal";
			break;
		case "DEN":
			return "den";
			break;
		case "DET":
			return "det";
			break;
		case "GB":
			return "gnb";
			break;
		case "HOU":
			return "htx";
			break;
		case "IND":
			return "clt";
			break;
		case "JAX":
			return "jax";
			break;
		case "KC":
			return "kan";
			break;
		case "LA":
			return "ram";
			break;
		case "LAC":
			return "ram";
			break;
		case "MIA":
			return "mia";
			break;
		case "MIN":
			return "min";
			break;
		case "NE":
			return "nwe";
			break;
		case "NO":
			return "nor";
			break;
		case "NYG":
			return "nyg";
			break;
		case "NYJ":
			return "nyj";
			break;
		case "OAK":
			return "rai";
			break;
		case "PHI":
			return "phi";
			break;
		case "PIT":
			return "pit";
			break;
		case "SEA":
			return "sea";
			break;
		case "SF":
			return "sfo";
			break;
		case "TB":
			return "tam";
			break;
		case "TEN":
			return "oti";
			break;
		case "WAS":
			return "was";
			break;
		default:
			return string;
			break;
	}
}

module.exports = {
	getFullName: getFullName,
	getShorthandName: getShorthandName
}