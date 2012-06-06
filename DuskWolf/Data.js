//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
//"use strict";

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
window.Data = function() {
	/*- Variable: _loaded
	 * [object] This is all the files that have been downloaded, it is ether a string (for text based files) or a HTML img tag (for images). The name of the file is the property name, for example _loaded["test.json"] would be the file "test.json".
	 */
	this._loaded = {};
	/** Variable: scripts
	 * [array] This is an array of arrays consisting of all the files specified in the root JSON. <Events> loops through these and runs them when it is constructed.
	 */
	this.scripts = [];
	
	/** Variable: root
	 * [object] This is the root JSON, it is obtained from root.json and provides all the basic stuff that describes the game.
	 */
	this.root = this.grabJson("root");
	
	//Enable/disable cache
	$.ajaxSetup({"cache": !duskWolf.dev});
	
	if(!this.root) {duskWolf.error("Root json could not be loaded."); return;}
	if(this.root.duskVer > duskWolf.verId) {duskWolf.error("DuskWolf version is incompatable with this program."); return;}
	duskWolf.info(this.root.name+" is loading."); 
};

/*- Variable: __hold__
 * [string] This is a global temporary variable used when retrieving files from AJAX, it's a horrible hack... Ugh...
 */
var __hold__;

//See mods/__init__.js for documentation.
var modsAvalable;

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
Data.prototype.grabJson = function(file, useDwc) {
	if(file.indexOf(".") === -1) file += ".json";
	if(file.match(/\.dws$/i) && useDwc) return this.grabDws(file);
	
	if(this._loaded[file] === undefined) {
		duskWolf.info("Downloading JSON "+file+"...");
		
		$.ajax({"async":false, "dataType":"text", "error":function(jqXHR, textStatus, errorThrown) {
			if(!useDwc) duskWolf.error("Error getting "+file+", "+errorThrown);
			__hold__ = "";
		}, "success":function(json, textStatus, jqXHR) {
			__hold__ = json;
		}, "url":__datadir__+"/"+file});
		
		this._loaded[file] = __hold__.replace(/\t/g, " ").replace(/\/\*(?:.|\n)*?\*\//g, "").replace(/\n/g, " ");
	}
	
	if(this._isJson(this._loaded[file])) return JSON.parse(this._loaded[file]);
	if(useDwc) return this.grabDws(file.replace(/\.json$/i, ""));
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
Data.prototype.grabDws = function(file) {
	if(file.indexOf(".") === -1) file += ".dws";
	
	if(this._loaded[file] === undefined) {
		duskWolf.info("Downloading DWS "+file+"...");
		
		$.ajax({"dataType":"text", "error":function(jqXHR, textStatus, errorThrown) {
			duskWolf.error("Error getting "+file+", "+errorThrown+". This may also have affected any attempts to get a JSON file beforehand.");
			__hold__ = null;
		}, "success":function(json, textStatus, jqXHR) {
			__hold__ = json;
		}, "url":__datadir__+"/"+file});
		
		this._loaded[file] = __hold__;
	}
	
	try {
		return JSON.parse(dwc.compile(this._loaded[file]));
	} catch (e) {
		duskWolf.error("Could not parse "+file+" as DWS.");
		duskWolf.error(e);
		duskWolf.log(dwc.compile(this._loaded[file]));
		return {};
	}
};

/** Function: grabFile
 * 
 * This downloads a file, and returns the contents. It blocks until the file is downloaded, and returns that file.
 * 
 * Params:
 * 	file - [string] The name of the file to load, is relative to <__datadir__>.
 * 	async - [boolean] Not implemented yet.
 * 
 * Return:
 * [string] The contents of the file.
 */
Data.prototype.grabFile = function(file, async) {
	if(this._loaded[file] === undefined) {
		duskWolf.info("Downloading file "+file+"...");
		
		$.ajax({"async":async==true, "dataType":"text", "error":function(jqXHR, textStatus, errorThrown) {
			duskWolf.error("Error getting "+file+", "+errorThrown);
			__hold__ = null;
		}, "success":function(json, textStatus, jqXHR) {
			__hold__ = json;
		}, "url":__datadir__+"/"+file});
		
		this._loaded[file] = __hold__;
	}
	
	return this._loaded[file];
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
Data.prototype.grabImage = function(file) {
	if(this._loaded[file] === undefined) {
		duskWolf.info("Downloading image "+file+"...");
		
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
Data.prototype._isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str).replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
}
