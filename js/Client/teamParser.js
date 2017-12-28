"use strict";

/* exported getFullName */
function getFullName(string)
{
	switch(string)
	{
		case "ARI":
			return "Arizona Cardinals";
		case "ATL":
			return "Atlanta Falcons";
		case "BAL":
			return "Baltimore Ravens";
		case "BUF":
			return "Buffalo Bills";
		case "CAR":
			return "Carolina Panthers";
		case "CHI":
			return "Chicago Bears";
		case "CIN":
			return "Cincinnati Bengals";
		case "CLE":
			return "Cleveland Browns";
		case "DAL":
			return "Dallas Cowboys";
		case "DEN":
			return "Denver Broncos";
		case "DET":
			return "Detroit Lions";
		case "GB":
			return "Green Bay Packers";
		case "HOU":
			return "Houston Texans";
		case "IND":
			return "Indianapolis Colts";
		case "JAC":
		case "JAX":
			return "Jacksonville Jaguars";
		case "KC":
			return "Kansas City Chiefs";
		case "LA":
			return "Los Angeles Rams";
		case "LAC":
			return "Los Angeles Chargers";
		case "MIA":
			return "Miami Dolphins";
		case "MIN":
			return "Minnesota Vikings";
		case "NE":
			return "New England Patriots";
		case "NO":
			return "New Orleans Saints";
		case "NYG":
			return "New York Giants";
		case "NYJ":
			return "New York Jets";
		case "OAK":
			return "Oakland Raiders";
		case "PHI":
			return "Philadelphia Eagles";
		case "PIT":
			return "Pittsburgh Steelers";
		case "SEA":
			return "Seattle Seahawks";
		case "SF":
			return "San Francisco 49ers";
		case "TB":
			return "Tampa Bay Buccaneers";
		case "TEN":
			return "Tennessee Titans";
		case "WAS":
			return "Washington Redskins";
	}

}
/* exported getMascot */
function getMascot(string)
{
	switch(string)
	{
		case "ARI":
			return "Cardinals";
		case "ATL":
			return "Falcons";
		case "BAL":
			return "Ravens";
		case "BUF":
			return "Bills";
		case "CAR":
			return "Panthers";
		case "CHI":
			return "Bears";
		case "CIN":
			return "Bengals";
		case "CLE":
			return "Browns";
		case "DAL":
			return "Cowboys";
		case "DEN":
			return "Broncos";
		case "DET":
			return "Lions";
		case "GB":
			return "Packers";
		case "HOU":
			return "Texans";
		case "IND":
			return "Colts";
		case "JAC":
		case "JAX":
			return "Jaguars";
		case "KC":
			return "Chiefs";
		case "LA":
			return "Rams";
		case "LAC":
			return "Chargers";
		case "MIA":
			return "Dolphins";
		case "MIN":
			return "Vikings";
		case "NE":
			return "Patriots";
		case "NO":
			return "Saints";
		case "NYG":
			return "Giants";
		case "NYJ":
			return "Jets";
		case "OAK":
			return "Raiders";
		case "PHI":
			return "Eagles";
		case "PIT":
			return "Steelers";
		case "SEA":
			return "Seahawks";
		case "SF":
			return "49ers";
		case "TB":
			return "Buccaneers";
		case "TEN":
			return "Titans";
		case "WAS":
			return "Redskins";
	}

}

/* exported getShorthandName */
function getShorthandName(string)
{
	
	switch(string)
	{
		case "ARI":
			return "crd";
		case "ATL":
			return "atl";
		case "BAL":
			return "rav";
		case "BUF":
			return "buf";
		case "CAR":
			return "car";
		case "CHI":
			return "chi";
		case "CIN":
			return "cin";
		case "CLE":
			return "cle";
		case "DAL":
			return "dal";
		case "DEN":
			return "den";
		case "DET":
			return "det";
		case "GB":
			return "gnb";
		case "HOU":
			return "htx";
		case "IND":
			return "clt";
		case "JAX":
		case "JAC":
			return "jax";
		case "KC":
			return "kan";
		case "LA":
			return "ram";
		case "LAC":
			return "sdg";
		case "MIA":
			return "mia";
		case "MIN":
			return "min";
		case "NE":
			return "nwe";
		case "NO":
			return "nor";
		case "NYG":
			return "nyg";
		case "NYJ":
			return "nyj";
		case "OAK":
			return "rai";
		case "PHI":
			return "phi";
		case "PIT":
			return "pit";
		case "SEA":
			return "sea";
		case "SF":
			return "sfo";
		case "TB":
			return "tam";
		case "TEN":
			return "oti";
		case "WAS":
			return "was";
		default:
			return string;
	}
}