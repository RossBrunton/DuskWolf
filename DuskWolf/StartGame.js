//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.gameStarter");

/** Starts the DuskWolf game.
 * 
 * The function defined in DuskWolf.js with the same name as this sets a timout for itself every 100ms. This allows this function, defined in a different file, to override it, and run when ready.
 * 
 * The file is downloaded and ran only when all the required files that the `root.json` file specifies have been. This ensures that this function will only start the game if it is ready.
 * 
 * It dispatches the `sys-event-load` and `sys-event-start` events.
 */
dusk.startGame = function() {
	dusk.events.startGame();
	
	if(dusk.events.waitingFor != 0) {
		setTimeout(dusk.startGame, 100);
		return;
	}
	
	dusk.events.run([
	{"a":"fire", "ver":dusk.ver, "ver-id":dusk.verId, "event":"sys-event-load"},
	{"a":"fire", "ver":dusk.ver, "ver-id":dusk.verId, "event":"sys-event-start"},
	{"a":"var", "name":"sys.started", "value":true}], "_init");
};
