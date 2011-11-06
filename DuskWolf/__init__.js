//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.__start__ = function() {
	__import__(["DuskWolf.js", "Game.js", "Events.js", "Data.js"]);
	
	window.duskWolf = new DuskWolf();
	
	try {
		window.game = new Game();
	} catch(e) {
		duskWolf.error(e);
	}
	
	setInterval("if('game' in window) game.everyFrame()", 1000/duskWolf.frameRate);
	
	$(document).bind("keydown", function(e){try {if("game" in window) game.keyPress(e);} catch(e) {duskWolf.error(e);}});
};
