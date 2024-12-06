/*
This script contains all game logic handled by four classes:
Player - represents a single player
GameState - contains most logic and represents the total state of a game
RoleManager - contains the logic for the different roles (used to be part of GameState, only separated for clarity/better overview)
GameHistory - saves the GameState during the game to allow to revert to previous states
*/

//globals
let globalGameRunning = false;

/*
Class representing a single player.
All statuses affecting a player are collected in "properties". Player ids start at 1, not 0.
*/
class Player {

    constructor(id, name) {
        this.name = name;
        this.id = id;
        this.mainRole = "Dorfbewohner";
        this.sideRole = "Keine Nebenrolle";
		this.properties = [];
        this.readableNames = {
            "dead": "Tot",
            "isWerewolf": "Ist Werwolf",
			"attackedByWerewolf": "Vom Wolf angegriffen",
			"gettingHanged": "Wird gehängt"
			};
    }

    /*
	Returns an array of formatted properties.
	*/
	getReadableProperties() {
        let rps = [];
        for (let prop of this.properties) {
            rps.push(this.readableNames[prop])
        }
        return rps;
    }
	
	/*
	Updates name and roles depending on input and properties if necessary
	*/
	updateNameAndRole(newName, newMainRole, newSideRole) {
		if (newName != "") {
            this.name = newName;
        }
        if (newMainRole != "") {
            if (globalRoleManager.villagerMainRoles.includes(newMainRole)) {
                this.mainRole = newMainRole;
                if (this.hasProperty("isWerewolf")) {
                    this.removeProperty("isWerewolf");
                }
            } else if (globalRoleManager.werewolfMainRoles.includes(newMainRole)) {
                this.mainRole = newMainRole;
                if (!this.hasProperty("isWerewolf")) {
                    this.addProperty("isWerewolf");
                }
            } else {
                console.error("Invalid main role name in updateNameAndRole");
            }
        }
        if (newSideRole != "") {
            if (globalRoleManager.sideRoles.includes(newSideRole)) {
                this.sideRole = newSideRole;
            } else {
                console.error("Invalid side role name in updateNameAndRole");
            }
        }
	}
	
	/*
	Returns true if prop in properties, else false.
	*/
	hasProperty(prop) {
		return this.properties.includes(prop);
	}
	
	/*
	Adds prop to properties if it doesn't exist yet.
	*/
	addProperty(prop) {
		if (!this.hasProperty(prop)) {
			this.properties.push(prop);
		}
	}
	
	/*
	Removes prop from properties if it exists.
	*/
	removeProperty(prop) {
		if (this.hasProperty(prop)) {
			let i = this.properties.indexOf(prop);
			this.properties.splice(i, 1);
		}
	}
	
	/*
	Removes all properties.
	*/
	clearProperties() {
		this.properties = [];
	}
	
	/*
	Is called once every night and day, updating player properties according to the game rules.
	Most relevant player state modifications should thus go here, not in GameState.
	*/
	updateProperties() {
		if (this.hasProperty("attackedByWerewolf")) {
			this.removeProperty("attackedByWerewolf");
			this.addProperty("dead");
		}
		if (this.hasProperty("gettingHanged")) {
			this.removeProperty("gettingHanged");
			this.addProperty("dead");
		}
	}
}

/*
Class fully specifying the unique state of the game and handling the game's logic.
gameVariables contains game properties relevant to more than one player.
*/
class GameState {

    constructor() {
        this.players = []
        this.gameVariables = {
            "werewolves": 0, 
            "villagers": 0 };
        this.readableNames = {
            "werewolves": "Anzahl Werwölfe", 
            "villagers": "Anzahl Dorfbewohner" };
		this.currentState = "beforeGame";
		this.currentStateID = -1;
		this.states = ["werewolves1", "werewolves2", "nightCleanup", "day1", "day2", "dayCleanup"]
    }
	
	// Misc
	
	/*
	Returns a dict of formatted game variables for the game info tab.
	*/
    getReadableGameVariables() {
        let rgvs = {};
        for (let key in this.gameVariables) {
            if (typeof(this.gameVariables[key]) == "boolean") {
                rgvs[this.readableNames[key]] = this.gameVariables[key] ? "ja" : "nein";
            } else {
                rgvs[this.readableNames[key]] = this.gameVariables[key];
            }
        }
        return rgvs;
    }
	
	/*
	Returns the number of players.
	*/
    getNumPlayers() {
        return this.players.length;
    }

    // Player manipulations
	
	/*
	Adds a default player (Dorfbewohner, Keine Nebenrolle).
	*/
	addDefaultPlayer(name) {
        let newPlayer = new Player(this.getNumPlayers() + 1, name);
        this.players.push(newPlayer);
        this.gameVariables["villagers"] += 1;
    }
	
	/*
	Removes all players.
	*/
    clearPlayers() {
        this.players.splice(0, this.getNumPlayers());
        this.gameVariables["werewolves"] = 0;
        this.gameVariables["villagers"] = 0;
    }
	
	/*
	Removes a single player identified by id.
	*/
    removePlayer(id) {
        if (this.players[id-1].hasProperty("isWerewolf")) {
            this.gameVariables["werewolves"]--;
        } else {
            this.gameVariables["villagers"]--;
        }
        this.players.splice(id-1, 1);
        for (let i=0; i<this.getNumPlayers(); i++) {
            this.players[i].id = i+1;
        }
    }
	
	/*
	Returns the player with the given id.
	*/
    getPlayerWithId(id) {
        if (id > 0 && id <= this.getNumPlayers()) {
            return this.players[id-1];
        }
        console.error("Invalid player id.");
        return null;
    }
	
	/*
	Updates player name and role given by id as well as game variables.
	*/
    updatePlayerNameAndRole(id, newName, newMainRole, newSideRole) {
        console.log("Updating player", id, newName, newMainRole, newSideRole);
        let player = this.getPlayerWithId(id);
        player.updateNameAndRole(newName, newMainRole, newSideRole);
		globalGameState.updateGameVariables();
    }
	
	//Game logic
	
	/*
	Updates the game variables that can be inferred from the player list / game state (rn only werewolf/villager counts)
	*/
	updateGameVariables() {
		this.gameVariables["werewolves"] = 0;
		this.gameVariables["villagers"] = 0;
		for (let p of this.players) {
			if (!p.hasProperty("dead")) {
				if (p.hasProperty("isWerewolf")) {
					this.gameVariables["werewolves"]++;
				} else {
					this.gameVariables["villagers"]++;
				}
			}
		}
	}
	
	/*
	Checks if the game can be started (enough players, no role conflicts, ...)
	*/
	checkGameStartConditions() {
		if (this.getNumPlayers() <= 0) {
			window.alert("Zum Beginnen Spieler hinzufügen!");
			return false;
		}
		if (this.gameVariables["villagers"] <= 0) {
			window.alert("Mindestens ein Dorfbewohner erforderlich!");
			return false;
		}
		if (this.gameVariables["werewolves"] <= 0) {
			window.alert("Mindestens ein Werwolf erforderlich!");
			return false;
		}
		
		return true;
	}
	
	/*
	Starts the game.
	*/
	startGame() {
		if (!this.checkGameStartConditions()) {return;}
		globalGameRunning = true;
		updateMenuColumnUI();
		this.advanceState();
	}
	
	/*
	Advances to the next state.
	*/
	advanceState() {
		updateMenuColumnUI();
		this.currentStateID += 1;
		if (this.currentStateID >= this.states.length) {
			this.currentStateID = 0;
		}
		this.currentState = this.states[this.currentStateID];
		console.log(this.currentState, this.currentStateID);
		this.callState();
	}
	
	/*
	Calls the current state and saves the game state if applicable.
	*/
	callState() {
		switch(this.currentState) {
			case "werewolves1":
			  globalGameHistory.saveState();
			  globalRoleManager.werewolves(1); break;
			case "werewolves2":
			  globalRoleManager.werewolves(2); break;
			case "nightCleanup":
			  globalGameHistory.saveState();
			  this.nightEnd(); break;
			case "day1":
			  globalGameHistory.saveState();
			  globalRoleManager.discussion(1); break;
			case "day2":
			  globalRoleManager.discussion(2); break;
			case "dayCleanup":
			  globalGameHistory.saveState();
			  this.dayEnd(); break;
		}
	}
	
	/*
	Checks if victory conditions are met (no werewolves/villagers remaining).
	*/
	checkVictory() {
		if (this.gameVariables["werewolves"]==0) {
			updateGameScreenUI("Die Dorfbewohner gewinnen!", "", ["OK"], ["endGame"]);
			return true;
		} else if (this.gameVariables["villagers"]==0) {
			updateGameScreenUI("Die Werwölfe gewinnen!", "", ["OK"], ["endGame"]);
			return true;
		}
		return false;
	}
	
	/*
	Ends the game. Resets game state, game window, player list and history.
	*/
	endGame() {
		for (let p of this.players) {
			p.clearProperties();
			p.updateNameAndRole(p.name, p.mainRole, p.sideRole);
		}
		this.updateGameVariables();
		globalGameRunning = false;
		this.currentState = "beforeGame";
		this.currentStateID = -1;
		globalGameHistory.clear();
		updateGameScreenUI("Willkommen auf der Werwolf-Companion Website", "", ["Spiel beginnen"], ["startGame"]);
		updateMenuColumnUI();
		document.getElementsByClassName("backandabort")[0].style.visibility = "hidden";
	}
	
	// Night and day cleanups
	
	/*
	What happens at the end of the night. Updates player properties, displays killed players, checks victory.
	*/
	nightEnd() {
		let aliveNames = "";
		let killedNames = "";
		for (let p of this.players) {
			let dead = p.hasProperty("dead");
			p.updateProperties();
			if (!p.hasProperty("dead")) {
				aliveNames += p.name + ", ";
			}
			if (!dead && p.hasProperty("dead")) {
				killedNames += p.name + ", ";
			}
		}
		this.updateGameVariables();
		if (!this.checkVictory()) {
			let txt = "<b>"+aliveNames.slice(0,-2)+"</b> sind noch am Leben.<br><br>";
			if (killedNames != "") {
				txt += "<b>"+killedNames.slice(0,-2)+"</b> hat/haben die Nacht nicht überlebt.";
			} else {
				txt += "Niemand ist heute Nacht gestorben.";
			}
			updateGameScreenUI("Der Morgen graut", txt, ["OK"], ["OK"]);
		}
	}
	
	/*
	What happens at the end of the day. Updates player properties, displays killed players, checks victory.
	*/
	dayEnd() {
		let killedNames = "";
		for (let p of this.players) {
			let dead = p.hasProperty("dead");
			p.updateProperties();
			if (!dead && p.hasProperty("dead")) {
				killedNames += p.name + ", ";
			}
		}
		this.updateGameVariables();
		if (!this.checkVictory()) {
			let txt = "";
			if (killedNames != "") {
				txt += "<b>"+killedNames.slice(0,-2)+"</b> ist/sind gestorben.";
			} else {
				txt += "Niemand ist gestorben.";
			}
			updateGameScreenUI("Die Nacht bricht herein", txt, ["OK"], ["OK"]);
		}
	}

}

/*
Class that provides methods for the logic of different roles. Only separated from GameState for clarity.
Roles that provide a clickable choice have two iterations, one before selection and one after.
*/
class RoleManager {
	
	constructor() {
		this.villagerMainRoles = ["Dorfbewohner", "Fieselotte", "Kleines Mädchen", "Doppelgänger", "Nekromant", "Beamter", "Seher", "Priester", "Dorfschlampe", "Obdachloser", "Hexe"];
        this.werewolfMainRoles = ["Werwolf", "Fips", "Räudiger Wolf", "Schwein", "Schattenwolf", "Werwolfwelpe", "Alphawolf"];
        this.sideRoles = ["Keine Nebenrolle", "Armbrust", "Dichter", "Schweigetrank", "Leichenfledderer", "Michi", "Adeliger", "Stein", "Amulett", "Stärketrank", "Starker Magen", "Ludwig", "Pestkranker", 
			"Liebestrank", "Hasstrank", "Holzwurm"];
	}
	
	/*
	Discussion during the day.
	*/
	discussion(iteration) {
		if (iteration == 1) {
			let names = [];
			let names_s = "";
			let ids = [];
			for (let i = 1; i<=globalGameState.getNumPlayers(); i++) {
				let p = globalGameState.getPlayerWithId(i);
				if (!p.hasProperty("dead")) {
					ids.push(i);
					names.push(p.name);
					names_s += p.name + ", ";
				}
			}
			names.push("Niemand");
			ids.push(-1);
			updateGameScreenUI("Diskussion", "Die Dorfbewohner ("+names_s.slice(0, -2)+") diskutieren, wer gehängt wird.", names, ids);
		} else if (iteration == 2) {
			let id = Number(globalGameScreenSelectedBtnID_UI);
			if (id != -1) {
				globalGameState.getPlayerWithId(id).addProperty("gettingHanged");
			}
			globalGameState.advanceState();
		}
	}
	
	/*
	Werewolves
	*/
	werewolves(iteration) {
		if (iteration == 1) {
			let names = [];
			let ids = [];
			let werewolves = "";
			for (let i = 1; i<=globalGameState.getNumPlayers(); i++) {
				let p = globalGameState.getPlayerWithId(i);
				if (!p.hasProperty("dead")) {
					ids.push(i);
					names.push(p.name);
					if (p.hasProperty("isWerewolf")) {
						werewolves += p.name + ", ";
					}
				}
			}
			updateGameScreenUI("<b>Werwölfe</b> ("+werewolves.slice(0,-2)+")", "Wen wollen sie töten?", names, ids);
		} else if (iteration == 2) {
			let id = Number(globalGameScreenSelectedBtnID_UI);
			globalGameState.getPlayerWithId(id).addProperty("attackedByWerewolf");
			globalGameState.advanceState();
		}
	}
}

/*
Class representing the game history. Provides utility for saving and restoring previous game states.
*/
class GameHistory {
	
	constructor() {
		this.hist = [];
	}
	
	/*
	Saves all variables defining the game state in hist.
	*/
	saveState() {
		let variables = {};
		for (let k in globalGameState.gameVariables) {
			variables[k] = globalGameState.gameVariables[k];
		}
		let currentStateID = globalGameState.currentStateID;
		let players = {};
		for (let p of globalGameState.players) {
			let id = p.id;
			let props = [];
			for (let prop of p.properties) {
				props.push(prop);
			}
			players[id] = props;
		}
		this.hist.push([variables, currentStateID, players]);
	}
	
	/*
	Pops the last element of hist and restores all stored variables to the game state and players.
	*/
	restoreState() {
		if (this.hist.length == 0) {
			window.alert("Du bist bereits am Spielbeginn angekommen, weiter zurück geht nicht!");
			return;
		}
		let [variables, currentStateID, players] = this.hist.pop();
		for (let k in variables) {
			globalGameState.gameVariables[k] = variables[k];
		}
		globalGameState.currentStateID = currentStateID;
		globalGameState.currentState = globalGameState.states[currentStateID];
		for (let id in players) {
			let p = globalGameState.getPlayerWithId(id);
			p.clearProperties();
			for (let prop of players[id]) {
				p.addProperty(prop);
			}
		}
	}
	
	/*
	Clears the history.
	*/
	clear() {
		this.hist = [];
	}
	
}

//Initialization of game state, role manager and history.
const globalGameState = new GameState();
const globalRoleManager = new RoleManager();
const globalGameHistory = new GameHistory();