let globalGameRunning = false;

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

    getReadableProperties() {
        let rps = [];
        for (let prop of this.properties) {
            rps.push(this.readableNames[prop])
        }
        return rps;
    }
	
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
			globalGameState.updateGameVariables();
        }
        if (newSideRole != "") {
            if (globalRoleManager.sideRoles.includes(newSideRole)) {
                this.sideRole = newSideRole;
            } else {
                console.error("Invalid side role name in updateNameAndRole");
            }
        }
	}
	
	hasProperty(prop) {
		return this.properties.includes(prop);
	}
	
	addProperty(prop) {
		if (!this.hasProperty(prop)) {
			this.properties.push(prop);
		}
	}
	
	removeProperty(prop) {
		if (this.hasProperty(prop)) {
			let i = this.properties.indexOf(prop);
			this.properties.splice(i, 1);
		}
	}

	clearProperties() {
		this.properties = [];
	}
	
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

    getNumPlayers() {
        return this.players.length;
    }

    // Player manipulations
	
	addDefaultPlayer(name) {
        let newPlayer = new Player(this.getNumPlayers() + 1, name);
        this.players.push(newPlayer);
        this.gameVariables["villagers"] += 1;
    }

    clearPlayers() {
        this.players.splice(0, this.getNumPlayers());
        this.gameVariables["werewolves"] = 0;
        this.gameVariables["villagers"] = 0;
    }

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

    getPlayerWithId(id) {
        if (id > 0 && id <= this.getNumPlayers()) {
            return this.players[id-1];
        }
        console.error("Invalid player id.");
        return null;
    }

    updatePlayerNameAndRole(id, newName, newMainRole, newSideRole) {
        console.log("Updating player", id, newName, newMainRole, newSideRole);
        let player = this.getPlayerWithId(id);
        player.updateNameAndRole(newName, newMainRole, newSideRole);
    }
	
	//Game logic
	
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
	
	startGame() {
		if (!this.checkGameStartConditions()) {return;}
		globalGameRunning = true;
		updateMenuColumnUI();
		this.advanceState();
	}
	
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

class RoleManager {
	
	constructor() {
		this.villagerMainRoles = ["Dorfbewohner", "Fieselotte", "Kleines Mädchen", "Doppelgänger", "Nekromant", "Beamter", "Seher", "Priester", "Dorfschlampe", "Obdachloser", "Hexe"];
        this.werewolfMainRoles = ["Werwolf", "Fips", "Räudiger Wolf", "Schwein", "Schattenwolf", "Werwolfwelpe", "Alphawolf"];
        this.sideRoles = ["Keine Nebenrolle", "Armbrust", "Dichter", "Schweigetrank", "Leichenfledderer", "Michi", "Adeliger", "Stein", "Amulett", "Stärketrank", "Starker Magen", "Ludwig", "Pestkranker", 
			"Liebestrank", "Hasstrank", "Holzwurm"];
	}
	
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

class GameHistory {
	
	constructor() {
		this.hist = [];
	}
	
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
	
	clear() {
		this.hist = [];
	}
	
}

const globalGameState = new GameState();
const globalRoleManager = new RoleManager();
const globalGameHistory = new GameHistory();