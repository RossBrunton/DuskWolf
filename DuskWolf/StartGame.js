//Once all the mods have been imported, this is ran and starts the game
goog.provide("dusk.gameStarter");

dusk.startGame = function() {
	dusk.events.startGame();
	dusk.events.run([
	{"a":"fire", "ver":dusk.ver, "ver-id":dusk.verId, "event":"sys-event-load"},
	{"a":"fire", "ver":dusk.ver, "ver-id":dusk.verId, "event":"sys-event-start"},
	{"a":"var", "name":"sys.started", "value":true}], "_init");
};
