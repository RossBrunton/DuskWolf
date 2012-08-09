//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
//"use strict";

goog.require("dusk");
goog.require("dusk.game");

goog.provide("dusk.load");

var __duskdir__ = __duskdir__?__duskdir__:"DuskWolf";
var __datadir__ = __datadir__?__datadir__:"Data";

var loaded = [];

function __import__(file) {
	if(loaded.indexOf(file) == -1) {
		$.ajaxSetup({"async":false});
		if(typeof(file) == "string") {
			//Single file
			if(log) console.log("Importing "+file+" from "+__duskdir__+"/"+file+"...");
			if(logDiv) $("#"+logDiv).append("<b>Importing</b> "+file+"...<br/>");
			$("head").append("<script type='text/javascript' src='"+__duskdir__+"/"+file+"'></script>");
		}else{
			//Multiple files
			for(var i = 0; i < file.length; i++){
				__import__(file[i]);
			}
		}
		$.ajaxSetup({"async":true});
		loaded[loaded.length] = file;
	}
}

//Block keys from moving page
document.onkeydown = function(e) {
	if(e.keyCode >= 37 && e.keyCode <= 40) return false;
};


 /** Function: __start__
 * 
 * This starts up the whole thing, and should be called onLoad by the HTML page, you can't expect me to do everything for you!
 * 
 * It adds handlers to all the events, and imports all the main classes.
 */
window.game = dusk.game.init();

$(document).bind("keydown", function(e){try {if("game" in window) dusk.game.keypress(e);} catch(e) {console.error(e.name+", "+e.message);}});
$(document).bind("keyup", function(e){try {if("game" in window) dusk.game.keyup(e);} catch(e) {console.error(e.name+", "+e.message);}});
