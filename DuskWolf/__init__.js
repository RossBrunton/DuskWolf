//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: Global
 * 
 * Global vars and functions. These are visible everywhere.
 * 
 * Note that this does NOT list every global, only the most global ones.
 * 	Ones relating to a specific class will not be listed here.
 */

/** Variable: duskWolf
 * [<DuskWolf>] This is the main DuskWolf object, it provides configuration constants and static functions.
 */
window.duskWolf = null;

/** Variable: game
 * [<Game>] The global game object, please don't refer to this deep inside the game.
 * 	It hurts the modularity of the system as a whole, y'see.
 */
window.game = null;

/** Variable: data
 * [<Data>] This is the global data object, for loading files and such.
 * 	Use this wherever you want, it's like static or something.
 */
window.data = null;
 
 /** Function: __start__
 * 
 * This starts up the whole thing, and should be called onLoad by the HTML page, you can't expect me to do everything for you!
 * 
 * It adds handlers to all the events, and imports all the main classes.
 */
window.__start__ = function() {
	__import__(["DuskWolf.js", "Game.js", "Events.js", "Data.js"]);
	
	window.duskWolf = new DuskWolf();
	
	try {
		window.game = new Game();
	} catch(e) {
		duskWolf.error(e);
	}
	
	if('game' in window) setInterval("game.everyFrame()", 1000/duskWolf.frameRate);
	
	$(document).bind("keydown", function(e){try {if("game" in window) game.keypress(e);} catch(e) {duskWolf.error(e);}});
	$(document).bind("keyup", function(e){try {if("game" in window) game.keyup(e);} catch(e) {duskWolf.error(e);}});
};
