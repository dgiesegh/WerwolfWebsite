/*
This script contains all functions directly called by UI elements or used to update UI elements.
Function names all end in UI.
*/

// globals
let globalPlayerDetailsStyle_UI = "none";
let globalRoleMenuSelectedPlayerID_UI = 0;
let globalGameScreenSelectedBtnID_UI = "";

let globalSettingsDisplayed_UI = false;
let globalSettingsShortTexts_UI = false;
let globalSettingsDeadSideRoles_UI = true;
let globalSettingsSelectedVillage_UI = "random";

const globalGameScreenConsoleHist_UI = [];
const globalDefaultNames = ["Hans", "Ursula", "Jakob", "Heinrich", "Lotte", "Horst", "Brigitte", "Walter", "Rosemarie", "Christian", "Ilse", "Helga", "Brunhilde", "Peter", "Franz", "Xaver", "Liesel", "Gert", "Erwin", "Ottilie", "Karl", "Agnes", "Marianne", "Barbara", "Valentin", "Anton", "Josef", "Marlies", "Renate", "Werner", "Gerhard", "Ingrid", "Irmgard", "Lutz", "Hubert", "Margarethe"];
shuffleArray(globalDefaultNames);

/*
Update the list of players with their properties and the game variables tab.
*/
function updateMenuColumnUI() {
	
    //Update player list
	
    let htmlString = "";
    for (let id=1; id<=globalGameState.getNumPlayers(); id++) {
        let player = globalGameState.getPlayerWithId(id);
        htmlString += "<div class=\"player\" id=\"Player"+id+"\"";
		if (player.hasProperty("dead")) {
            htmlString += " style=\"background-color: Tomato\"";
        } else if (player.hasProperty("inLove") && globalGameRunning) {
            htmlString += " style=\"background-color: LightPink\"";
        } else if (player.hasProperty("isWerewolf") && globalGameRunning) {
            htmlString += " style=\"background-color: SteelBlue\"";
        } else if (globalGameRunning) {
            htmlString += " style=\"background-color: LightGreen\"";
        }
		htmlString += "> <input type=\"text\" class=\"name\" value=\""+player.name+"\" onchange=\"updateNameUI(this)\" ";
		if (globalGameRunning) {htmlString += "readonly";}
		htmlString += "> <a href=\"#\" class=\"deleteplayer\" onclick=\"";
		if (!globalGameRunning) {htmlString += "removePlayerUI(this)";}
        else {htmlString += "killPlayerUI(this)";}
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
    let newPlayerName = globalDefaultNames[globalGameState.getNumPlayers() % globalDefaultNames.length];
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
    document.getElementsByClassName("gamescreen")[0].style.display = "block";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "none";
    document.getElementsByClassName("siderolemenu")[0].style.display = "none";
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
    globalRoleMenuSelectedPlayerID_UI = Number(htmlLink.parentElement.id.slice(6));
    document.getElementsByClassName("gamescreen")[0].style.display = "none";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "block";
    document.getElementsByClassName("siderolemenu")[0].style.display = "none";
}

/*
Displays the side role menu and sets selected player in globals.
*/
function showSideRoleMenuUI(htmlLink) {
    globalRoleMenuSelectedPlayerID_UI = Number(htmlLink.parentElement.id.slice(6));
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
    let id = Number(htmlTextField.parentElement.id.slice(6));
    let newName = htmlTextField.value;
    globalGameState.updatePlayerNameAndRole(id, newName, "", "");
}

/*
Removes a single player.
*/
function removePlayerUI(player) {
    let id = Number(player.parentElement.id.slice(6));
    globalGameState.removePlayer(id);
    updateMenuColumnUI();
    document.getElementsByClassName("gamescreen")[0].style.display = "block";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "none";
    document.getElementsByClassName("siderolemenu")[0].style.display = "none";
}

/*
Kills/revives a player while the game runs.
*/
function killPlayerUI(player) {
    let id = Number(player.parentElement.id.slice(6));
    let p = globalGameState.getPlayerWithId(id);
    if (!p.hasProperty("dead")) {
        if (!p.hasProperty("killedByMod")) {
            p.addProperty("killedByMod");
        } else {
            p.removeProperty("killedByMod");
        }
    } else {
        if (!p.hasProperty("revivedByMod")) {
            p.addProperty("revivedByMod");
        } else {
            p.removeProperty("revivedByMod");
        }
    }
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
Changes UI when game starts.
*/
function prepareGameStartUI() {
    document.getElementById("addplayer").style.display = "none";
    document.getElementById("clearplayers").style.display = "none";
    document.getElementsByClassName("menubuttons")[0].style.height = "35px";
    document.getElementsByClassName("playerlist")[0].style.height = "calc(100% - 195px)";
    document.getElementById("return").style.display = "inline-block";
    document.getElementById("abortGame").style.display = "inline-block";
    document.getElementById("openSettings").style.display = "none";
}

/*
Changes UI when game ends.
*/
function prepareGameEndUI() {
    document.getElementById("addplayer").style.display = "inline";
    document.getElementById("clearplayers").style.display = "inline";
    document.getElementsByClassName("menubuttons")[0].style.height = "105px";
    document.getElementsByClassName("playerlist")[0].style.height = "calc(100% - 265px)";
    document.getElementById("return").style.display = "none";
    document.getElementById("abortGame").style.display = "none";
    document.getElementById("openSettings").style.display = "inline-block";
}

/*
Triggers when a button in the game window is pressed. Handles game start, end and option selections during the game.
*/
function selectGameOptionUI(btn) {
	if (btn.id == "startGame") {
        prepareGameStartUI();
		if (!globalGameState.startGame()) {
            prepareGameEndUI();
        }
		return;
	} else if (btn.id == "endGame" || btn.id == "abortGame") {
        prepareGameEndUI();
		globalGameState.endGame();
		return;
	}
	globalGameScreenSelectedBtnID_UI = btn.id;
    logMessageUI(btn.innerHTML+" wurde per Button ausgewählt");
	globalGameState.advanceState(true);
}

/*
Triggers when settings button is clicked.
*/
function toggleSettingsUI() {
    if (!globalSettingsDisplayed_UI) {
        document.getElementsByClassName("gameheading")[0].innerHTML = "Einstellungen";
        document.getElementById("openSettings").innerHTML = "Speichern";
        let settings = "";
        settings += "Kurztexte anzeigen: <input type=\"checkbox\" id=\"shorttexts\" onchange=\"saveSettingsUI()\" ";
        settings += globalSettingsShortTexts_UI ? "checked" : "";
        settings += "> <br>";
        settings += "Tote Nebenrollen aufrufen: <input type=\"checkbox\" id=\"deadsideroles\" onchange=\"saveSettingsUI()\" ";
        settings += globalSettingsDeadSideRoles_UI ? "checked" : "";
        settings += "> <br>";
        settings += "Dorf auswählen: <select id=\"village\" onchange=\"saveSettingsUI()\"><option value=\"random\" ";
        settings += globalSettingsSelectedVillage_UI=="random" ? "selected" : "";
        settings += ">Zufällig</option><option value=\"0\" ";
        settings += globalSettingsSelectedVillage_UI=="0" ? "selected" : "";
        settings += ">Weizenfeld</option><option value=\"1\" ";
        settings += globalSettingsSelectedVillage_UI=="1" ? "selected" : "";
        settings += ">Moor</option></select>";
        document.getElementsByClassName("gamedesc")[0].innerHTML = settings;
        document.getElementsByClassName("gamebuttons")[0].innerHTML = "";
        globalSettingsDisplayed_UI = true;
    } else {
        document.getElementById("openSettings").innerHTML = "Einstellungen";
        updateGameScreenUI("Willkommen auf der Werwolf-Companion Website", 
			"Noch nicht implementierte Hauptrollen: Obdachloser, Doppelgänger <br> Noch nicht implementierte Nebenrollen: Starker Magen, Ludwig, Pestkranker, Hasstrank", 
			["Spiel beginnen"], ["startGame"]);
        globalSettingsDisplayed_UI = false;
    }
}

/*
Saves settings.
*/
function saveSettingsUI() {
    globalSettingsShortTexts_UI = document.getElementById("shorttexts").checked;
    globalSettingsDeadSideRoles_UI = document.getElementById("deadsideroles").checked;
    globalSettingsSelectedVillage_UI = document.getElementById("village").value;
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