/*
This script contains all functions directly called by UI elements or used to update UI elements.
Function names all end in UI.
*/

// globals
let globalPlayerDetailsStyle_UI = "none";
let globalRoleMenuSelectedPlayerID_UI = 0;
let globalGameScreenSelectedBtnID_UI = "";
const globalGameScreenConsoleHist_UI = [];

/*
Update the list of players with their properties and the game variables tab.
*/
function updateMenuColumnUI() {
	
    //Update player list
	
    let htmlString = "";
    for (let id=1; id<=globalGameState.getNumPlayers(); id++) {
        let player = globalGameState.getPlayerWithId(id);
        htmlString += "<div class=\"player\" id=\"Player"+id+"\"";
		if (player.hasProperty("dead")) {htmlString += " style=\"background-color: crimson\"";}
		htmlString += "> <input type=\"text\" class=\"name\" value=\""+player.name+"\" onchange=\"updateNameUI(this)\" ";
		if (globalGameRunning) {htmlString += "readonly";}
		htmlString += "> <a href=\"#\" class=\"deleteplayer\" onclick=\"";
		if (!globalGameRunning) {htmlString += "removePlayerUI(this)";}
		htmlString += "\">X</a> <br> <a href=\"#\" class=\"rolelink\" onclick=\"";
		if (!globalGameRunning) {htmlString += "showMainRoleMenuUI(this)";}
		htmlString += "\">"+player.mainRole+"</a> /";
        htmlString += " <a href=\"#\" class=\"rolelink\" onclick=\"";
		if (!globalGameRunning) {htmlString += "showSideRoleMenuUI(this)";}
		htmlString += "\">"+player.sideRole+"</a> <div class=\"extrainfo\" style=\"display: "+globalPlayerDetailsStyle_UI+"\">";
        rps = player.getReadableProperties()
        for (let prop of rps) {
            htmlString += prop + " <br>";
        }
        htmlString += "</div> </div> ";
    }
    document.getElementsByClassName("playerlist")[0].innerHTML = htmlString;
	
    //Update game variables
    
	htmlString = "";
    rgvs = globalGameState.getReadableGameVariables();
    for (let key in rgvs) {
        if (rgvs[key] !== "") {
            htmlString += key + ": " + rgvs[key] + " <br>";
        } else {
            htmlString += key + " <br>";
        }
    }
    document.getElementsByClassName("gameinfo")[0].innerHTML = htmlString;
}

/*
Adds a default player and updates UI.
*/
function addPlayerUI() {
	if (globalGameRunning) {return;}
    let newPlayerID = globalGameState.getNumPlayers() + 1;
    let newPlayerName = "Spieler " + newPlayerID;
    globalGameState.addDefaultPlayer(newPlayerName);
    updateMenuColumnUI();
}

/*
Removes all players and updates UI.
*/
function clearPlayersUI() {
	if (globalGameRunning) {return;}
    document.getElementsByClassName("playerlist")[0].innerHTML = "";
    globalGameState.clearPlayers();
}

/*
Toggles the visibility of player properties on and off.
*/
function playerDetailsUI() {
    if (globalPlayerDetailsStyle_UI == "none") {
        globalPlayerDetailsStyle_UI = "block";
    } else {
        globalPlayerDetailsStyle_UI = "none";
    }
    updateMenuColumnUI();
}

/*
Switches between player list tab and game variables tab.
*/
function togglePlayersInfoUI(btn) {
    updateMenuColumnUI();
    if (btn.id == "displayplayers") {
        document.getElementsByClassName("menubuttons")[0].style.display = "block";
        document.getElementsByClassName("playerlist")[0].style.display = "block";
        document.getElementsByClassName("gameinfo")[0].style.display = "none";
        document.getElementsByClassName("messagelog")[0].style.display = "none";
    } else {
        document.getElementsByClassName("menubuttons")[0].style.display = "none";
        document.getElementsByClassName("playerlist")[0].style.display = "none";
        document.getElementsByClassName("gameinfo")[0].style.display = "block";
        document.getElementsByClassName("messagelog")[0].style.display = "block";
    }
}

/*
Displays the main role menu and sets selected player in globals.
*/
function showMainRoleMenuUI(htmlLink) {
    globalRoleMenuSelectedPlayerID_UI = Number(htmlLink.parentElement.id.at(-1));
    document.getElementsByClassName("gamescreen")[0].style.display = "none";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "block";
    document.getElementsByClassName("siderolemenu")[0].style.display = "none";
}

/*
Displays the side role menu and sets selected player in globals.
*/
function showSideRoleMenuUI(htmlLink) {
    globalRoleMenuSelectedPlayerID_UI = Number(htmlLink.parentElement.id.at(-1));
    document.getElementsByClassName("gamescreen")[0].style.display = "none";
    document.getElementsByClassName("siderolemenu")[0].style.display = "block";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "none";
}

/*
Triggers on selecting a role. Closes role menus, assigns role to selected player (from globals) and updates UI.
*/
function selectRoleUI(role, isMainRole) {
    if (globalRoleMenuSelectedPlayerID_UI == 0) {
        console.error("Global player id not set when changing role");
        return;
    }
    if (isMainRole) {
        globalGameState.updatePlayerNameAndRole(globalRoleMenuSelectedPlayerID_UI, "", role, "");
    } else {
        globalGameState.updatePlayerNameAndRole(globalRoleMenuSelectedPlayerID_UI, "", "", role);
    }
    updateMenuColumnUI();
    globalRoleMenuSelectedPlayerID_UI = 0;
    document.getElementsByClassName("gamescreen")[0].style.display = "block";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "none";
    document.getElementsByClassName("siderolemenu")[0].style.display = "none";
}

/*
Triggers on any changes made to the player name input fields. Changes player name.
*/
function updateNameUI(htmlTextField) {
    let id = Number(htmlTextField.parentElement.id.at(-1));
    let newName = htmlTextField.value;
    globalGameState.updatePlayerNameAndRole(id, newName, "", "");
}

/*
Removes a single player.
*/
function removePlayerUI(player) {
    let id = Number(player.parentElement.id.at(-1));
    globalGameState.removePlayer(id);
    updateMenuColumnUI();
}

/*
Updates the messages and buttons shown in the game window with given strings.
*/
function updateGameScreenUI(heading, message, buttonNames, buttonIDs) {
	if (buttonNames.length != buttonIDs.length) {
		console.error("Received different number of button names and ids in updateGameScreenUI");
		return;
	}
	document.getElementsByClassName("gameheading")[0].innerHTML = heading;
	document.getElementsByClassName("gamedesc")[0].innerHTML = message;
	let btns = "";
	for (let i = 0; i<buttonNames.length; i++) {
		btns += "<a href=\"#\" id=\""+buttonIDs[i]+"\" onclick=\"selectGameOptionUI(this)\">"+buttonNames[i]+"</a>"
	}
	document.getElementsByClassName("gamebuttons")[0].innerHTML = btns;
}

/*
Triggers when a button in the game window is pressed. Handles game start, end and option selections during the game.
*/
function selectGameOptionUI(btn) {
	if (btn.id == "startGame") {
		globalGameState.startGame();
		return;
	} else if (btn.id == "endGame") {
		globalGameState.endGame();
		return;
	}
	globalGameScreenSelectedBtnID_UI = btn.id;
    logMessageUI(btn.innerHTML+" wurde per Button ausgewählt");
	globalGameState.advanceState(true);
}

/*
Triggers on clicking the Zurück button. Reverts to the previous state and calls it again.
*/
function returnUI() {
	if (globalGameHistory.hist.length > 0) {
		globalGameHistory.restoreState();
		if (globalGameHistory.hist.length > 0) {
			globalGameHistory.restoreState();
			globalGameState.advanceState(true);
		} else {
			updateMenuColumnUI();
			globalGameState.callState();
		}
        printLogMessagesUI();
	} else {
		window.alert("Du bist bereits am Spielanfang angekommen, weiter zurück geht nicht.");
	}
}

/*
Triggers on clicking the Abbrechen button. Ends the game.
*/
function abortUI() {
	globalGameState.endGame();
}

/*
Adds message to game console log.
*/
function logMessageUI(message) {
    if (globalGameScreenConsoleHist_UI.length == 500) {
        globalGameScreenConsoleHist_UI.splice(0,1);
    }
    globalGameScreenConsoleHist_UI.push(message);
    printLogMessagesUI();
}

/*
Prints game console log
*/
function printLogMessagesUI() {
    globalGameScreenConsoleHist_UI.reverse();
    let htmlString = "";
    for (let msg of globalGameScreenConsoleHist_UI) {
        htmlString += "<p>"+msg+"</p>";
    }
    globalGameScreenConsoleHist_UI.reverse();
    document.getElementsByClassName("messagelog")[0].innerHTML = htmlString;
}