//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

//Three vars required
// __duskdir__ Location of DuskWolf
// __datadir__ Location of game data

var __duskdir__ = __duskdir__?__duskdir__:"";
var __datadir__ = __datadir__?__datadir__:"";

var log = true;
var logDiv = "info";

var loaded = [];

function __load__() {
	__import__("__init__.js");
	__start__();
}

function __import__(file) {
	if(loaded.indexOf(file) == -1) {
		if(typeof(file) == "string") {
			//Single file
			if(log) console.log("Importing "+file+" from "+__duskdir__+"/"+file+"...");
			if(logDiv) $("#"+logDiv).append("<b>Importing</b> "+file+"...<br/>");
			$("head").append("<script type='text/javascript' src='"+__duskdir__+"/"+file+"'></script>");
		}else{
			//Multiple files
			if(log) console.log("Importing "+file.join(", ")+" from "+__duskdir__+"...");
			if(logDiv) $("#"+logDiv).append("<b>Importing:</b><br/>"+file.join("<br/>")+"<br/>");
			var imString = "";
			for(var i = 0; i < file.length; i++){
				imString += "<script type='text/javascript' src='"+__duskdir__+"/"+file[i]+"' async='async'></script>";
			}
			$("head").append(imString);
		}
		loaded[loaded.length] = file;
	}
}

//Block keys from moving page
document.onkeydown = function(e) {
	if(e.keyCode >= 37 && e.keyCode <= 40) return false;
}
