//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
//"use strict";

var __dir__ = "test/DuskWolf";
var __domain__ = "http://www.savagewolf.org";
var log = true;
var logDiv = true;
var loaded = [];

function __load__() {
	__import__("__init__.js");
	__start__();
}

function __import__(file) {
	if(loaded.indexOf(file) == -1) {
		if(typeof(file) == "string") {
			//Single file
			if(log) console.log("Importing "+file+" from "+__domain__+"/"+__dir__+"/"+file+"...");
			if(logDiv) $("#info").append("<b>Importing</b> "+file+"...<br/>");
			$("head").append("<script type='text/javascript' src='"+__domain__+"/"+__dir__+"/"+file+"'></script>");
		}else{
			//Multiple files
			if(log) console.log("Importing "+file.join(", ")+" from "+__domain__+"/"+__dir__+"/"+file+"...");
			if(logDiv) $("#info").append("<b>Importing:</b><br/>"+file.join("<br/>")+"<br/>");
			var imString = "";
			for(var i = 0; i < file.length; i++){
				imString += "<script type='text/javascript' src='"+__domain__+"/"+__dir__+"/"+file[i]+"'></script>";
			}
			$("head").append(imString);
		}
		loaded[loaded.length] = file;
	}
}

//Block arrow keys from moving page
document.onkeydown = function(e) {
	if(e.keyCode >= 37 && e.keyCode <= 40) return false;
}
