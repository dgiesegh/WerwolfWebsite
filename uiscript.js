let globalPlayerDetailsStyle_UI = "none";
let globalRoleMenuSelectedPlayerID_UI = 0;
let globalGameScreenSelectedBtnID_UI = "";

function updateMenuColumnUI() {
    //Update player list
    let htmlString = "";
    for (let id=1; id<=globalGameState.getNumPlayers(); id++) {
        let player = globalGameState.getPlayerWithId(id);
        htmlString += "<div class=\"player\" id=\"Player"+id+"\"> <input type=\"text\" class=\"name\" value=\""+player.name+"\" onchange=\"updateNameUI(this)\" ";
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
    //Update game info
    htmlString = "";
    rgvs = globalGameState.getReadableGameVariables();
    for (let key in rgvs) {
        htmlString += key + ": " + rgvs[key] + " <br><br>";
    }
    document.getElementsByClassName("gameinfo")[0].innerHTML = htmlString;
}

function addPlayerUI() {
	if (globalGameRunning) {return;}
    let newPlayerID = globalGameState.getNumPlayers() + 1;
    let newPlayerName = "Spieler " + newPlayerID;
    globalGameState.addDefaultPlayer(newPlayerName);
    updateMenuColumnUI();
}

function clearPlayersUI() {
	if (globalGameRunning) {return;}
    document.getElementsByClassName("playerlist")[0].innerHTML = "";
    globalGameState.clearPlayers();
}

function playerDetailsUI() {
    if (globalPlayerDetailsStyle_UI == "none") {
        globalPlayerDetailsStyle_UI = "block";
    } else {
        globalPlayerDetailsStyle_UI = "none";
    }
    updateMenuColumnUI();
}

function togglePlayersInfoUI(button) {
    updateMenuColumnUI();
    if (button.id == "displayplayers") {
        document.getElementsByClassName("menubuttons")[0].style.display = "block";
        document.getElementsByClassName("playerlist")[0].style.display = "block";
        document.getElementsByClassName("gameinfo")[0].style.display = "none";
    } else {
        document.getElementsByClassName("menubuttons")[0].style.display = "none";
        document.getElementsByClassName("playerlist")[0].style.display = "none";
        document.getElementsByClassName("gameinfo")[0].style.display = "block";
    }
}

function showMainRoleMenuUI(htmlLink) {
    globalRoleMenuSelectedPlayerID_UI = Number(htmlLink.parentElement.id.at(-1));
    document.getElementsByClassName("gamescreen")[0].style.display = "none";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "block";
    document.getElementsByClassName("siderolemenu")[0].style.display = "none";
}

function showSideRoleMenuUI(htmlLink) {
    globalRoleMenuSelectedPlayerID_UI = Number(htmlLink.parentElement.id.at(-1));
    document.getElementsByClassName("gamescreen")[0].style.display = "none";
    document.getElementsByClassName("siderolemenu")[0].style.display = "block";
    document.getElementsByClassName("mainrolemenu")[0].style.display = "none";
}

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

function updateNameUI(htmlTextField) {
    let id = Number(htmlTextField.parentElement.id.at(-1));
    let newName = htmlTextField.value;
    globalGameState.updatePlayerNameAndRole(id, newName, "", "");
}

function removePlayerUI(player) {
    let id = Number(player.parentElement.id.at(-1));
    globalGameState.removePlayer(id);
    updateMenuColumnUI();
}

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

function selectGameOptionUI(btn) {
	if (btn.id == "endGame") {
		globalGameState.endGame();
		return;
	} else if (btn.id == "startGame") {
		document.getElementsByClassName("backandabort")[0].style.visibility = "visible";
		globalGameState.startGame();
		return;
	}
	globalGameScreenSelectedBtnID_UI = btn.id;
	globalGameState.advanceState();
}

function returnUI() {
	console.log("Restoring state");
	globalGameHistory.restoreState();
	globalGameHistory.restoreState();
	console.log("New state id:", globalGameState.currentStateID);
	globalGameState.callState();
}

function abortUI() {
	globalGameState.endGame();
}
