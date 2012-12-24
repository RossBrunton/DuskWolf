//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk");
dusk.load.require("dusk.data");

dusk.load.provide("dusk.game");

/** @namespace dusk.game
 * 
 * @description This is the main game class, it downloads all the files that the root.json requests in `coms`, `mods` and `req`.
 * 
 * It does this by adding a dependency for all the files on the namespace `dusk.gameStarter`, which contains a redefintion of {@link dusk.startGame}, and requiring that.
 */
	
/** Starts the game; requiring all the game components specified in the root.json.*/
dusk.game.init = function() {
	console.log("DuskWolf ver "+dusk.ver+" is starting.");
	
	var required = [];
	
	//External dependencies
	if("external" in dusk.data.root) {
		for(var i = dusk.data.root.external.length-1; i >= 0; i--) {
			if(typeof dusk.data.root.external[i] == "object"){
				console.log("External import: "+dusk.data.root.external[i][0]+"...");
				dusk.load.addDependency(dusk.data.root.external[i][0], dusk.data.root.external[i][1], dusk.data.root.external[i][2]);
			}
		}
	}
	
	//Mods
	for(var i = dusk.data.root.mods.length-1; i >= 0; i--) {
		console.log("Loading mod "+dusk.data.root.mods[i]+"...");
		required.push("dusk.mods."+dusk.data.root.mods[i]);
	}
	
	//Components
	for(var i = dusk.data.root.coms.length-1; i >= 0; i--) {
		console.log("Loading component "+dusk.data.root.coms[i]+"...");
		required.push("dusk.sgui."+dusk.data.root.coms[i]);
	}
	
	//Other things
	for(var i = dusk.data.root.reqs.length-1; i >= 0; i--) {
		console.log("Loading other file "+dusk.data.root.reqs[i]+"...");
		required.push(dusk.data.root.reqs[i]);
	}
	
	dusk.load.addDependency(__duskdir__+"/StartGame.js", ['dusk.gameStarter'], required);
	
	dusk.load.require("dusk.gameStarter");
};
