//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
//"use strict";

goog.require("dusk");

goog.provide("dusk.data");

/** Class: Data
 * 
 * This class provides the ability to download stuff such as images.
 * 
 * It is created as the global variable "data" when <Game> is constructed.
 * 
 * All paths it uses are relative to the var <__datadir__>.
 * 
 * The root JSON File:
 * 
 * When DuskWolf starts, it loads a file (or dies if the file can't be found) named root.json from the folder specified by <DuskWolf.gameDir>, this file contains configuration files and such like for the game.
 *  It should be an oject with the following properties:
 * 
 * > "name":"..."
 * A string that is a human readable name of the game. It is not used anyware outside logging, so it can be a number or something, I suppose...
 * 
 * > "version":"..."
 * The version of the game. This can be in any format, but it should be unique for each game version.
 * 
 * > "author":"..."
 * The author of the game.
 * 
 * > "duskVer":123
 * The earliest version of DuskWolf this will run on, it should be a number corresponding to <DuskWolf.verId>. If this is smaller than the DuskWolf, then the game won't run.
 * 
 * > "files":[...]
 * An array of filenames, these files will be retrieved, and all the actions ran inside them ran. They are relative to <DuskWolf.gameDir>.
 * 
 * > "mods":[...]
 * An array of modules to import (they are strings), these are the only modules imported.
 * 
 * See:
 * * <Events>
 * * <Game>
 */



/** Function: Data
 * 
 * Creates a new instance of this.
 * 
 * It downloads the root json, and does everything that it needs to do.
 */
dusk.data.init = function() {
	/*- Variable: _loaded
	 * [object] This is all the files that have been downloaded, it is ether a string (for text based files) or a HTML img tag (for images). The name of the file is the property name, for example _loaded["test.json"] would be the file "test.json".
	 */
	dusk.data._loaded = {};
	/** Variable: scripts
	 * [array] This is an array of arrays consisting of all the files specified in the root JSON. <Events> loops through these and runs them when it is constructed.
	 */
	dusk.data.scripts = [];
	
	/*- Variable: _hold
	 * [string] This is a global temporary variable used when retrieving files from AJAX, it's a horrible hack... Ugh...
	 */
	dusk.data._hold = "";
	
	/** Variable: root
	 * [object] This is the root JSON, it is obtained from root.json and provides all the basic stuff that describes the game.
	 */
	dusk.data.root = dusk.data.grabJson("root");
	
	//Enable/disable cache
	$.ajaxSetup({"cache": !dusk.dev});
	
	if(!dusk.data.root) {dusk.error("Root json could not be loaded."); return;}
	if(dusk.data.root.duskVer > dusk.verId) {dusk.error("DuskWolf version is incompatable with this program."); return;}
	console.info(dusk.data.root.name+" is loading."); 
	
	return dusk.data;
};

dusk.data.download = function(file, type, async) {
	if(this._loaded[file] === undefined) {
		console.log("Downloading file "+file+"...");
		
		$.ajax({"async":async, "dataType":(type!==undefined?type:"text"), "error":function(jqXHR, textStatus, errorThrown) {
			console.error("Error getting "+file+", "+errorThrown);
			dusk.data._hold = "";
		}, "success":function(data, textStatus, jqXHR) {
			dusk.data._hold = data;
		}, "url":__datadir__+"/"+file});
		
		this._loaded[file] = dusk.data._hold;
	}
	
	return this._loaded[file];
};


/** Function: grabJson
 * 
 * This downloads and parses a JSON file from an online place. It blocks until the file is downloaded, and returns that file.
 * 
 * This is a little more lax than the normal JSON parser. before the file is parsed, tabs and newlines are replaced by spaces, and /* comments are removed, letting you use them in the file.
 * 
 * If the file is not a valid JSON file or has a ".dws" file extension and the useDwc param is true, then it will be called and will attempt to compile the file.
 * 
 * Params:
 * 	file - [string] The name of the file to load, is relative to <__datadir__> and the "json" file extension is added to this automatically if the file name does not contain a ".".
 * 	useDwc - [boolean] If true, then the DuskWolf compiler can be invoked to compile the file if needed.
 * 
 * Return:
 * [object] The contents of the file, parsed as a JSON object.
 */
dusk.data.grabJson = function(file, useDwc) {
	if(file.indexOf(".") === -1) file += ".json";
	if(file.match(/\.dws$/i) && useDwc) return this.grabDws(file);
	
	var contents = dusk.data.download(file, "text", false).replace(/\t/g, " ").replace(/\/\*(?:.|\n)*?\*\//g, "").replace(/\n/g, " ");
	
	if(this._isJson(contents)) return window.JSON.parse(contents);
	if(useDwc) return this.grabDws(file);
};

/** Function: grabDws
 * 
 * This downloads and parses a DWS (DuskWolfScript) file from an online place. It blocks until the file is downloaded, and returns that file.
 * 
 * 
 * Params:
 * 	file - [string] The name of the file to load, is relative to <__datadir__> and the "dws" file extension is added to this automatically if the file name does not contain a ".".
 * 
 * Return:
 * [object] The contents of the file, compiled and parsed as a JSON object.
 */
dusk.data.grabDws = function(file) {
	if(file.indexOf(".") === -1) file += ".dws";
	
	var contents = dusk.data.download(file, "text", false);
	
	try {
		return window.JSON.parse(dusk.dwc.compile(contents));
	} catch (e) {
		console.error("Could not parse "+file+" as DWS.");
		console.error(e.name+", "+e.description);
		return {};
	}
};

/** Function: grabImage
 * 
 * [Image] This downloads an image from a remote location. It downloads without blocking, so be aware of that!
 * 
 * If you call this without asigning the return value to anything, the image should download in the background.
 * 
 * Params:
 * 	file - [string] A path to the file located in <__datadir__>.
 * 	The file extension is not added automatically.
 * 
 * Return:
 * 	A DOM image object with the src attribute set to the image path.
 */
dusk.data.grabImage = function(file) {
	if(this._loaded[file] === undefined) {
		console.log("Downloading image "+file+"...");
		
		this._loaded[file] = new Image()
		this._loaded[file].src = __datadir__+"/"+file;
		return this._loaded[file];
	}else{
		return this._loaded[file];
	}
};

/*- Function: _isJson
 * 
 * [boolean] This takes a string, checks if it is a string in JSON notation.
 * 
 * Params:
 * 	str			- [string] The string to check.
 * 
 * Returns:
 *	Whether the object can be parsed as json.
 */
dusk.data._isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str).replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
}
