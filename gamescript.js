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
			"gettingHanged": "Wird gehängt",
			"blessed": "Gesegnet",
			"healedByPotion": "Von der Hexe geheilt",
			"attackedByPotion": "Von der Hexe angegriffen",
			"healUsed": "Heiltrank verbraucht",
			"killUsed": "Todestrank verbraucht",
			"safeKillUsed": "Alpha-Angriff verwendet", 
			"attackedByAlpha": "Vom Alphawolf angegriffen",
			"diedLastNight": "Letzte Nacht gestorben",
			"usedLovePotion": "Liebestrank verbraucht",
			"inLove": "Verliebt",
			"attackedByCrossbow": "Von der Armbrust getroffen",
			"extraLife": "Hat ein zweites Leben"
			};
    }

    /*
	Returns an array of formatted properties.
	*/
	getReadableProperties() {
        let rps = [];
        for (let prop of this.properties) {
			if (this.readableNames[prop] != undefined) {
				rps.push(this.readableNames[prop]);
			}
        }
        return rps;
    }
	
	/*
	Updates name and roles depending on input and properties if necessary
	*/
	updateNameAndRole(newName, newMainRole, newSideRole, nolog=false) {
		if (newName != "") {
            this.name = newName;
        }
        if (newMainRole != "") {
            if (globalRoleManager.villagerMainRoles.includes(newMainRole)) {
                this.mainRole = newMainRole;
				if (!nolog) {logMessageUI(this.name+" ändert die Hauptrolle zu "+newMainRole);}
                if (this.hasProperty("isWerewolf")) {
                    this.removeProperty("isWerewolf", nolog);
                }
            } else if (globalRoleManager.werewolfMainRoles.includes(newMainRole)) {
                this.mainRole = newMainRole;
				if (!nolog) {logMessageUI(this.name+" ändert die Hauptrolle zu "+newMainRole);}
                if (!this.hasProperty("isWerewolf")) {
                    this.addProperty("isWerewolf", nolog);
                }
            } else {
                console.error("Invalid main role name in updateNameAndRole");
            }
        }
        if (newSideRole != "") {
            if (globalRoleManager.sideRoles.includes(newSideRole)) {
                this.sideRole = newSideRole;
				if (!nolog) {logMessageUI(this.name+" ändert die Nebenrolle zu "+newSideRole);}
				if (newSideRole == "Stärketrank") {
					this.addProperty("extraLife", nolog);
				} else {
					this.removeProperty("extraLife", nolog);
				}
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
	addProperty(prop, nolog=false) {
		if (!this.hasProperty(prop)) {
			if (this.readableNames[prop] != undefined && this.readableNames[prop] != "Tot" && !nolog) {
				logMessageUI(this.name+" erhält Eigenschaft \""+this.readableNames[prop]+"\"");
			}
			this.properties.push(prop);
		}
	}
	
	/*
	Removes prop from properties if it exists.
	*/
	removeProperty(prop, nolog=false) {
		if (this.hasProperty(prop)) {
			if (this.readableNames[prop] != undefined && !nolog) {
				logMessageUI(this.name+" verliert Eigenschaft \""+this.readableNames[prop]+"\"");
			}
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
		let startsDead = this.hasProperty("dead");
		let deathReason = "";
		//Werwolf attack
		if (this.hasProperty("attackedByWerewolf")) {
			if (!this.hasProperty("blessed") && !this.hasProperty("healedByPotion")) {
				this.addProperty("dead"); deathReason = "Werwölfen";
			}
			this.removeProperty("attackedByWerewolf");
		}
		if (this.hasProperty("attackedByAlpha")) {
			this.removeProperty("attackedByAlpha");
			this.addProperty("dead"); deathReason = "Alphawolf";
		}
		//Hanging
		if (this.hasProperty("gettingHanged")) {
			this.removeProperty("gettingHanged");
			this.addProperty("dead"); deathReason = "Hinrichtung";
		}
		//Witch attack
		if (this.hasProperty("attackedByPotion")) {
			this.addProperty("dead"); deathReason = "Hexentrank";
			this.removeProperty("attackedByPotion");
		}
		//Crossbow attack
		if (this.hasProperty("attackedByCrossbow")) {
			this.addProperty("dead"); deathReason = "Armbrust";
			this.removeProperty("attackedByCrossbow");
		}
		//Lovers death
		if (this.hasProperty("inLove") && !this.hasProperty("dead") && globalGameState.gameVariables["loverDied"] == true) {
			this.addProperty("dead"); deathReason = "Liebeskummer";
			delete globalGameState.gameVariables["loverDied"];
		}
		//All properties that get removed at end of night/day
		this.removeProperty("blessed");
		this.removeProperty("firstWerewolfKill");
		this.removeProperty("healedByPotion");
		//Extra life
		if (!startsDead && this.hasProperty("dead") && this.hasProperty("extraLife")) {
			this.removeProperty("dead");
			this.removeProperty("extraLife");
			logMessageUI(this.name+" hat das zweite Leben verbraucht");
		}
		// DEATH CHECKS
		//Console
		if (!startsDead && this.hasProperty("dead")) {
			logMessageUI(this.name+" stirbt wegen "+deathReason);
		}
		//Lovers
		if (this.hasProperty("inLove") && !startsDead && this.hasProperty("dead") && globalGameState.gameVariables["loverDied"] != true) {
			globalGameState.gameVariables["loverDied"] = true;
		}
		//Puppy
		if (this.mainRole == "Werwolfwelpe" && !startsDead && this.hasProperty("dead")) {
			this.addProperty("diedLastNight");
		}
		//Stone and amulet
		if ((this.sideRole == "Stein" || this.sideRole == "Amulett") && !startsDead && this.hasProperty("dead")) {
			globalGameState.gameVariables["stoneAndAmulet"] = true;
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
            "villagers": "Anzahl Dorfbewohner",	
			"bitchSleepsAt": "Dorfschlampe schläft bei Spieler",
			"lastBlessed": "Zuletzt gesegneter Spieler",
			"crossbow": "Armbrust aktiv",
			"stoneAndAmulet": "Stein oder Amulett gestorben" };
		this.currentState = "beforeGame";
		this.currentStateID = -1;
		this.states = ["lovepotion1", "lovepotion2", "lovepotion3", "necro", "priest1", "priest2", "bitch1", "bitch2", 
			"werewolves1", "werewolves2", "werewolves3", "werewolves4", 
			"witch1", "witch2", "witch3", "bitch3", "crossbow1", "crossbow2", "nightCleanup", "stoneAndAmulet", 
			"day1", "day2", "crossbow1", "crossbow2", "dayCleanup", "stoneAndAmulet"]
    }
	
	// Misc
	
	/*
	Returns a dict of formatted game variables for the game info tab.
	*/
    getReadableGameVariables() {
        let rgvs = {};
        for (let key in this.gameVariables) {
            if (typeof(this.gameVariables[key]) == "boolean") {
                rgvs[this.readableNames[key]] = this.gameVariables[key] ? "" : "nein";
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
		logMessageUI(name+" hinzugefügt");
    }
	
	/*
	Removes all players.
	*/
    clearPlayers() {
        this.players.splice(0, this.getNumPlayers());
        this.gameVariables["werewolves"] = 0;
        this.gameVariables["villagers"] = 0;
		logMessageUI("Alle Spieler entfernt");
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
		logMessageUI(this.players[id-1].name+" entfernt");
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
	Returns player id(s) with specified role, 0 if no players are found.
	*/
	getPlayersWithRole(role) {
		let ids = [];
		for (let p of this.players) {
			if (p.mainRole == role || p.sideRole == role) {
				ids.push(p.id);
			}
		}
		if (ids.length == 0) {
			return [0];
		}
		return ids;
	}
	
	/*
	Returns player id(s) with(out) specified property excluding excluded_ids, 0 if no players are found.
	*/
	getPlayersWithProperty(prop, negate=false, excluded_ids=[]) {
		let ids = [];
		for (let p of this.players) {
			if ((p.hasProperty(prop) == !negate) && !excluded_ids.includes(p.id)) {
				ids.push(p.id);
			}
		}
		if (ids.length == 0) {
			return [0];
		}
		return ids;
	}
	
	/*
	Updates player name and role given by id as well as game variables.
	*/
    updatePlayerNameAndRole(id, newName, newMainRole, newSideRole) {
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
		const roles = [];
		for (let p of this.players) {
			if (p.mainRole != "Dorfbewohner" && p.mainRole != "Werwolf") {roles.push(p.mainRole);}
			if (p.sideRole != "Keine Nebenrolle") {roles.push(p.sideRole);}
		}
		const duplicates = roles.filter((item, index) => roles.indexOf(item) != index);
		if (duplicates.length != 0) {
			window.alert("Doppelte Rollen: "+ roles.toString());
			return false;
		}
		if (!([0,2].includes(this.players.filter(p => p.sideRole=="Stein" || p.sideRole=="Amulett").length))) {
			window.alert("Es müssen entweder Stein und Amulett oder keines von beiden im Spiel sein!");
			return false;
		}
		return true;
	}
	
	/*
	Starts the game.
	*/
	startGame() {
		if (!this.checkGameStartConditions()) {return;}
		logMessageUI("Spiel beginnt");
		document.getElementsByClassName("backandabort")[0].style.visibility = "visible";
		globalGameRunning = true;
		updateMenuColumnUI();
		this.advanceState();
	}
	
	/*
	Advances to the next state.
	*/
	advanceState(save=false) {
		if (save) {
			globalGameHistory.saveState();
		}
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
			case "lovepotion1":
			  globalRoleManager.lovepotion(1); break;
			case "lovepotion2":
			  globalRoleManager.lovepotion(2); break;
			case "lovepotion3":
			  globalRoleManager.lovepotion(3); break;
			case "necro":
			  globalRoleManager.necro(); break;
			case "priest1":
			  globalRoleManager.priest(1); break;
			case "priest2":
			  globalRoleManager.priest(2); break;
			case "bitch1":
			  globalRoleManager.bitch(1); break;
			case "bitch2":
			  globalRoleManager.bitch(2); break;
			case "werewolves1":
			  globalRoleManager.werewolves(1); break;
			case "werewolves2":
			  globalRoleManager.werewolves(2); break;
			case "werewolves3":
			  globalRoleManager.werewolves(3); break;
			case "werewolves4":
			  globalRoleManager.werewolves(4); break;
			case "witch1":
			  globalRoleManager.witch(1); break;
			case "witch2":
			  globalRoleManager.witch(2); break;
			case "witch3":
			  globalRoleManager.witch(3); break;
			case "bitch3":
			  globalRoleManager.bitch(3); break;
			case "crossbow1":
			  globalRoleManager.crossbow(1); break;
			case "crossbow2":
			  globalRoleManager.crossbow(2); break;
			case "nightCleanup":
			  this.nightEnd(); break;
			case "stoneAndAmulet":
			  globalRoleManager.stoneAndAmulet(); break;
			case "day1":
			  globalRoleManager.discussion(1); break;
			case "day2":
			  globalRoleManager.discussion(2); break;
			case "dayCleanup":
			  this.dayEnd(); break;
		}
	}
	
	/*
	Checks if victory conditions are met (no werewolves/villagers remaining).
	*/
	checkVictory() {
		if (this.gameVariables["werewolves"]==0 && this.gameVariables["villagers"]==0) {
			updateGameScreenUI("Alle sind tot, niemand gewinnt.", "", ["OK"], ["endGame"]);
			return true;
		} else if (this.players.filter(p => p.hasProperty("inLove") && !p.hasProperty("dead")).length == 2 && this.getPlayersWithProperty("dead", true).length == 2) {
			updateGameScreenUI("Das Liebespaar gewinnt!", "", ["OK"], ["endGame"]);
			return true;
		} else if (this.gameVariables["werewolves"]==0) {
			updateGameScreenUI("Die Dorfbewohner gewinnen!", "", ["OK"], ["endGame"]);
			return true;
		} else if (this.gameVariables["villagers"]==0) {
			updateGameScreenUI("Die Werwölfe gewinnen!", "", ["OK"], ["endGame"]);
			return true;
		}
		return false;
	}

	/*
	Updates all player properties (used at day/night end and by crossbow) (handling lovers)
	Returns names of killed players
	*/
	updatePlayerProperties() {
		const killedNames = [];
		const idsToCheck = [];
		for (let p of this.players) {
			idsToCheck.push(p.id);
		}
		idsToCheck.reverse()
		while (idsToCheck.length > 0) {
			let p = globalGameState.getPlayerWithId(idsToCheck.pop());
			let dead = p.hasProperty("dead");
			p.updateProperties();
			if (!dead && p.hasProperty("dead")) {
				killedNames.push(p.name);
				if (p.hasProperty("inLove") && globalGameState.gameVariables["loverDied"] == true) {
					for (let p2 of this.players.filter(_p => _p.id != p.id && _p.hasProperty("inLove") && !idsToCheck.includes(_p.id))) {
						idsToCheck.push(p2.id);
					}
				}
			}
		}
		this.updateGameVariables();
		return killedNames;
	}
	
	/*
	Ends the game. Resets game state, game window, player list and history.
	*/
	endGame() {
		for (let p of this.players) {
			p.clearProperties();
			p.updateNameAndRole(p.name, p.mainRole, p.sideRole, true);
		}
		this.gameVariables = {"werewolves": 0, "villagers": 0 };
		this.updateGameVariables();
		globalGameRunning = false;
		this.currentState = "beforeGame";
		this.currentStateID = -1;
		globalGameHistory.clear();
		updateGameScreenUI("Willkommen auf der Werwolf-Companion Website", 
			"Bisher implementierte Rollen: Dorfbewohner, Werwolf, Priester, Kleines Mädchen, Hexe, Nekromant, Dorfschlampe, Alphawolf, Werwolfwelpe, Liebestrank, Armbrust, Stein, Amulett, Stärketrank", 
			["Spiel beginnen"], ["startGame"]);
		updateMenuColumnUI();
		document.getElementsByClassName("backandabort")[0].style.visibility = "hidden";
		logMessageUI("Spiel endet");
	}
	
	// Night and day cleanups
	
	/*
	What happens at the end of the night. Updates player properties, displays killed players, checks victory.
	*/
	nightEnd() {
		const killedNamesList = this.updatePlayerProperties();
		let killedNames = "";
		for (let n of killedNamesList) {
			killedNames += n + ", ";
		}
		if (!this.checkVictory()) {
			let txt = "";
			if (killedNames != "") {
				txt += "<b>"+killedNames.slice(0,-2)+"</b> hat/haben die Nacht nicht überlebt.";
			} else {
				txt += "Niemand ist heute Nacht gestorben.";
			}
			updateGameScreenUI("Der Morgen graut", txt, ["OK"], [-1]);
		}
	}
	
	/*
	What happens at the end of the day. Updates player properties, displays killed players, checks victory.
	*/
	dayEnd() {
		const killedNamesList = this.updatePlayerProperties();
		let killedNames = "";
		for (let n of killedNamesList) {
			killedNames += n + ", ";
		}
		if (!this.checkVictory()) {
			let txt = "";
			if (killedNames != "") {
				txt += "<b>"+killedNames.slice(0,-2)+"</b> ist/sind gestorben.";
			} else {
				txt += "Niemand ist gestorben.";
			}
			updateGameScreenUI("Die Nacht bricht herein", txt, ["OK"], [-1]);
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
			logMessageUI("Diskussion beginnt");
			const names = [];
			let names_s = "";
			const ids = globalGameState.getPlayersWithProperty("dead", true);
			for (let i of ids) {
				let name = globalGameState.getPlayerWithId(i).name;
				names.push(name);
				names_s += name + ", ";
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
	Werwölfe
	*/
	werewolves(iteration) {
		let puppy_id = globalGameState.getPlayersWithRole("Werwolfwelpe")[0];
		if (iteration > 2 && (puppy_id == 0 || (puppy_id != 0 && !globalGameState.getPlayerWithId(puppy_id).hasProperty("diedLastNight")))) {
			globalGameState.advanceState();
			return;
		}
		let alpha_id = globalGameState.getPlayersWithRole("Alphawolf")[0];
		let alphaKill = false;
		let alpha = undefined;
		if (iteration < 3 && alpha_id != 0) {
			alpha = globalGameState.getPlayerWithId(alpha_id);
			if (!alpha.hasProperty("dead") && !alpha.hasProperty("safeKillUsed") && globalGameState.getPlayersWithProperty("isWerewolf").filter(id => !globalGameState.getPlayerWithId(id).hasProperty("dead")).length == 1) {
				alphaKill = true;
			}
		}
		if (iteration == 1 || iteration == 3) {
			logMessageUI("Die Werwölfe sind an der Reihe");
			const names = [];
			const ids = globalGameState.getPlayersWithProperty("dead", true).filter(id => !globalGameState.getPlayerWithId(id).hasProperty("attackedByWerewolf"));
			let werewolves = "";
			for (let i of ids) {
				let p = globalGameState.getPlayerWithId(i);
				names.push(p.name);
				if (p.hasProperty("isWerewolf")) {
					werewolves += p.name + ", ";
				}
			}
			let flavortext = "";
			const littleGirlID = globalGameState.getPlayersWithRole("Kleines Mädchen")[0];
			if (littleGirlID != 0 && !globalGameState.getPlayerWithId(littleGirlID).hasProperty("dead")) {
				flavortext += "Das kleine Mädchen ("+globalGameState.getPlayerWithId(littleGirlID).name+") darf blinzeln.<br><br>";
			}
			if (alphaKill) {
				flavortext += "Der Alphawolf hat einen unabwehrbaren Angriff. Wen möchte er töten?"
			} else if (iteration == 3) {
				flavortext += "Da der Welpe letzte Nacht gestorben ist, haben die Werwölfe einen zweiten Angriff. Wen wollen sie töten?";
				names.push("Niemanden");
				ids.push(-1);
			} else {
				flavortext += "Wen wollen sie töten?";
			}
			updateGameScreenUI("<b>Werwölfe</b> ("+werewolves.slice(0,-2)+")", flavortext, names, ids);
		} else if (iteration == 2 || iteration == 4) {
			let id = Number(globalGameScreenSelectedBtnID_UI);
			if (id != -1) {
				globalGameState.getPlayerWithId(id).addProperty("attackedByWerewolf");
				if (iteration == 2) {
					globalGameState.getPlayerWithId(id).addProperty("firstWerewolfKill");
				}
				if (alphaKill) {
					globalGameState.getPlayerWithId(id).addProperty("attackedByAlpha");
					alpha.addProperty("safeKillUsed");
				}
			}
			if (iteration == 4 && puppy_id != 0) {
				globalGameState.getPlayerWithId(puppy_id).removeProperty("diedLastNight");
			}
			globalGameState.advanceState();
		}
	}
	
	/*
	Priester
	*/
	priest(iteration) {
		let priest_id = -1;
		if (!(priest_id = globalGameState.getPlayersWithRole("Priester")[0])) {
			globalGameState.advanceState();
			return;
		}
		let priest = globalGameState.getPlayerWithId(priest_id);
		if (iteration == 1) {
			logMessageUI("Der Priester ist an der Reihe");
			if (priest.hasProperty("dead")) {
				updateGameScreenUI("Priester ("+priest.name+")", "Der Priester ist leider schon tot.", ["OK"], [-1]);
				return;
			}
			const names = [];
			const excl = [priest_id];
			if (globalGameState.gameVariables["lastBlessed"] != undefined) {
				excl.push(globalGameState.gameVariables["lastBlessed"]);
			}
			const ids = globalGameState.getPlayersWithProperty("dead", true, excl);
			for (let i of ids) {
				names.push(globalGameState.getPlayerWithId(i).name);
			}
			names.push("Keines"); ids.push(-1);
			updateGameScreenUI("Priester ("+priest.name+")", "Welches Haus wird gesegnet?", names, ids);
		} else if (iteration == 2) {
			let id = Number(globalGameScreenSelectedBtnID_UI);
			if (id != -1) {
				globalGameState.getPlayerWithId(id).addProperty("blessed");
				globalGameState.gameVariables["lastBlessed"] = id;
			} else if (globalGameState.gameVariables["lastBlessed"] != undefined){
				delete globalGameState.gameVariables["lastBlessed"];
			}
			globalGameState.advanceState();
		}
	}
	
	/*
	Hexe
	*/
	witch(iteration) {
		let witch_id = -1;
		if (!(witch_id = globalGameState.getPlayersWithRole("Hexe")[0])) {
			globalGameState.advanceState();
			return;
		}
		let witch = globalGameState.getPlayerWithId(witch_id);
		if (iteration == 1) {
			logMessageUI("Die Hexe ist an der Reihe");
			if (witch.hasProperty("dead")) {
				updateGameScreenUI("Hexe ("+witch.name+")", "Die Hexe ist leider schon tot.", ["OK"], [-1]);
			} else if (!witch.hasProperty("healUsed")) {
				const victim_ids = globalGameState.getPlayersWithProperty("attackedByWerewolf");
				let victim_id = 0;
				for (let id of victim_ids) {
					if (globalGameState.getPlayerWithId(id).hasProperty("firstWerewolfKill")) {
						victim_id = id;
						break;
					}
				}
				updateGameScreenUI("Hexe ("+witch.name+")", "Möchte sie das Opfer ("+globalGameState.getPlayerWithId(victim_id).name+") retten?", ["Ja", "Nein"], [victim_id, -1]);
			} else {
				updateGameScreenUI("Hexe ("+witch.name+")", "Sie kann das Opfer leider nicht retten.", ["Ok"], [-1]);
			}
		} else if (iteration == 2) {
			if (witch.hasProperty("dead")) {
				globalGameState.advanceState();
			} else if (globalGameScreenSelectedBtnID_UI != -1) {
				globalGameState.getPlayerWithId(globalGameScreenSelectedBtnID_UI).addProperty("healedByPotion");
				witch.addProperty("healUsed");
				updateGameScreenUI("Hexe ("+witch.name+")", "Sie kann diese Runde leider niemanden töten.", ["Ok"], [-1]);
			} else if (!witch.hasProperty("killUsed")) {
				const ids = globalGameState.getPlayersWithProperty("dead", true);
				const names = [];
				for (let id of ids) {
					names.push(globalGameState.getPlayerWithId(id).name);
				}
				names.push("Nein");
				ids.push(-1);
				updateGameScreenUI("Hexe ("+witch.name+")", "Möchte sie noch jemanden töten?", names, ids);
			} else {
				updateGameScreenUI("Hexe ("+witch.name+")", "Sie kann leider niemanden mehr töten.", ["Ok"], [-1]);
			}
		} else if (iteration == 3) {
			if (!witch.hasProperty("dead")) {
				if (globalGameScreenSelectedBtnID_UI != -1) {
					globalGameState.getPlayerWithId(globalGameScreenSelectedBtnID_UI).addProperty("attackedByPotion");
					witch.addProperty("killUsed");
				}
			}
			globalGameState.advanceState();
		}
	}
	
	/*
	Nekromant
	*/
	necro() {
		let necro_id = -1;
		if (!(necro_id = globalGameState.getPlayersWithRole("Nekromant")[0])) {
			globalGameState.advanceState();
			return;
		}
		logMessageUI("Der Nekromant ist an der Reihe");
		let necro = globalGameState.getPlayerWithId(necro_id);
		if (necro.hasProperty("dead")) {
			updateGameScreenUI("Nekromant ("+necro.name+")", "Der Nekromant ist leider schon tot.", ["Ok"], [-1]);
			return;
		}
		const dead = globalGameState.getPlayersWithProperty("dead");
		console.log(dead);
		if (dead[0] != 0) {
			let name_str = "Der Nekromant darf die Rolle eines toten Spielers erfragen: <br><br>";
			for (let dead_id of dead) {
				let p = globalGameState.getPlayerWithId(dead_id);
				name_str += p.name + ": " + p.mainRole + "<br><br>";
			}
			updateGameScreenUI("Nekromant ("+necro.name+")", name_str, ["Ok"], [-1]);
		} else {
			updateGameScreenUI("Nekromant ("+necro.name+")", "Es ist leider noch niemand gestorben.", ["Ok"], [-1]);
		}
	}
	
	/*
	Dorfschlampe
	*/
	bitch(iteration) {
		let bitch_id = -1;
		if (!(bitch_id = globalGameState.getPlayersWithRole("Dorfschlampe")[0])) {
			globalGameState.advanceState();
			return;
		}
		let bitch = globalGameState.getPlayerWithId(bitch_id);
		if (iteration == 1) {
			logMessageUI("Die Dorfschlampe ist an der Reihe");
			if (bitch.hasProperty("dead")) {
				updateGameScreenUI("Dorfschlampe ("+bitch.name+")", "Die Dorfschlampe ist leider schon tot.", ["Ok"], [-1]);
				return;
			}
			const excl = [];
			if (globalGameState.gameVariables["bitchSleepsAt"] != undefined && globalGameState.gameVariables["bitchSleepsAt"] != bitch_id) {
				excl.push(globalGameState.gameVariables["bitchSleepsAt"]);
			}
			const ids = globalGameState.getPlayersWithProperty("dead", true, excl);
			const names = [];
			for (let id of ids) {
				names.push(globalGameState.getPlayerWithId(id).name);
			}
			updateGameScreenUI("Dorfschlampe ("+bitch.name+")", "Wo möchte sie heute Nacht schlafen?", names, ids);
		} else if (iteration == 2) {
			if (!bitch.hasProperty("dead")) {
				let id = Number(globalGameScreenSelectedBtnID_UI);
				globalGameState.gameVariables["bitchSleepsAt"] = id;
			}
			globalGameState.advanceState();
		} else if (iteration == 3) {
			if (!bitch.hasProperty("dead") && globalGameState.gameVariables["bitchSleepsAt"] != bitch_id) {
				bitch.removeProperty("healedByPotion");
				let p = globalGameState.getPlayerWithId(globalGameState.gameVariables["bitchSleepsAt"]);
				for (let prop of ["attackedByPotion", "attackedByWerewolf", "blessed"]) {
					bitch.removeProperty(prop);
					if (p.hasProperty(prop) && !p.hasProperty("isWerewolf")) {
						bitch.addProperty(prop);
					}
				}
				if (p.hasProperty("isWerewolf")) {
					bitch.addProperty("attackedByWerewolf");
				}
			}
			globalGameState.advanceState();
		}
	}

	/*
	Liebestrank
	*/
	lovepotion(iteration) {
		let pot_id = -1;
		if (!(pot_id = globalGameState.getPlayersWithRole("Liebestrank")[0])) {
			globalGameState.advanceState();
			return;
		}
		let pot = globalGameState.getPlayerWithId(pot_id);
		if (!pot.hasProperty("usedLovePotion")) {
			if (iteration == 1) {
				logMessageUI("Der Spieler mit dem Liebestrank ist an der Reihe");
				const ids = globalGameState.getPlayersWithProperty("dead", true, [pot_id]);
				const names = [];
				for (let id of ids) {
					names.push(globalGameState.getPlayerWithId(id).name);
				}
				updateGameScreenUI("Liebestrank ("+pot.name+")", "Wer verliebt sich?", names, ids);
			} else if (iteration == 2) {
				let selected_id = Number(globalGameScreenSelectedBtnID_UI);
				globalGameState.getPlayerWithId(selected_id).addProperty("inLove");
				const ids = globalGameState.getPlayersWithProperty("dead", true, [pot_id, selected_id]);
				const names = [];
				for (let id of ids) {
					names.push(globalGameState.getPlayerWithId(id).name);
				}
				updateGameScreenUI("Liebestrank ("+pot.name+")", "Wer verliebt sich?", names, ids);
			} else if (iteration == 3) {
				let selected_id = Number(globalGameScreenSelectedBtnID_UI);
				globalGameState.getPlayerWithId(selected_id).addProperty("inLove");
				pot.addProperty("usedLovePotion");
				globalGameState.advanceState();
			}
		} else {
			globalGameState.advanceState();
		}
	}

	/*
	Armbrust
	*/
	crossbow(iteration) {
		let cb_id = 0;
		if (!(cb_id = globalGameState.getPlayersWithRole("Armbrust")[0])) {
			globalGameState.advanceState();
			return;
		}
		let cb = globalGameState.getPlayerWithId(cb_id);
		if (!cb.hasProperty("dead")) {
			if (iteration == 1) {
				globalGameHistory.saveState();
				globalGameState.updatePlayerProperties();
				if (cb.hasProperty("dead")) {
					globalGameHistory.restoreState();
					logMessageUI("Die Armbrust wurde ausgelöst");
					const ids = globalGameState.getPlayersWithProperty("dead", true, [cb_id]);
					const names = [];
					for (let id of ids) {
						names.push(globalGameState.getPlayerWithId(id).name);
					}
					ids.push(-1);
					names.push("Niemanden");
					globalGameState.gameVariables["crossbow"] = true;
					updateGameScreenUI("Armbrust ("+cb.name+")", "Der Spieler mit der Armbrust darf noch einen letzten Schuss abfeuern. Wen reißt er mit in den Tod?", names, ids);
				} else {
					globalGameHistory.restoreState();
					globalGameState.advanceState();
				}
			} else if (iteration == 2) {
				if (globalGameState.gameVariables["crossbow"] == true) {
					let id = Number(globalGameScreenSelectedBtnID_UI);
					if (id > 0) {
						globalGameState.getPlayerWithId(id).addProperty("attackedByCrossbow");
					}
					delete globalGameState.gameVariables["crossbow"];
					globalGameState.advanceState()
				}
			}
		} else {
			globalGameState.advanceState();
		}
	}

	/*
	Stein und Amulett
	*/
	stoneAndAmulet() {
		if (globalGameState.gameVariables["stoneAndAmulet"] == true) {
			for (let role of ["Stein", "Amulett"]) {
				let id = globalGameState.getPlayersWithRole(role)[0];
				if (id > 0) {
					let p = globalGameState.getPlayerWithId(id);
					if (!p.hasProperty("dead")) {
						p.addProperty("extraLife");
					}
				}
			}
			delete globalGameState.gameVariables["stoneAndAmulet"];
		}
		globalGameState.advanceState();
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
		let console_length = globalGameScreenConsoleHist_UI.length;
		this.hist.push([variables, currentStateID, players, globalGameScreenSelectedBtnID_UI, console_length]);
	}
	
	/*
	Pops the last element of hist and restores all stored variables to the game state and players.
	*/
	restoreState() {
		if (this.hist.length == 0) {
			window.alert("Du bist bereits am Spielbeginn angekommen, weiter zurück geht nicht!");
			return;
		}
		let [variables, currentStateID, players, gGSSBID_UI, console_length] = this.hist.pop();
		globalGameScreenSelectedBtnID_UI = gGSSBID_UI;
		globalGameState.gameVariables = {"werewolves":0, "villagers":0};
		for (let k in variables) {
			globalGameState.gameVariables[k] = variables[k];
		}
		globalGameState.currentStateID = currentStateID;
		globalGameState.currentState = globalGameState.states[currentStateID];
		for (let id in players) {
			let p = globalGameState.getPlayerWithId(id);
			p.clearProperties();
			for (let prop of players[id]) {
				p.addProperty(prop, true);
			}
		}
		globalGameScreenConsoleHist_UI.splice(console_length, globalGameScreenConsoleHist_UI.length-console_length);
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