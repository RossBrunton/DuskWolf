//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: Data
 * 
 * This class provides the ability to download stuff such as images.
 * 
 * It is created as the global variable "data" when <Game> is constructed.
 * 
 * All paths it uses are relative to the global constant __domain__ and <DuskWolf.gameDir>.
 * 
 * See:
 * * <Events>
 * * <Game>
 */

/** Function: Data
 * 
 * [undefined] Creates a new instance of this.
 * 
 * It downloads the root json, and does everything that it needs to do.
 */
window.Data = function() {
	/** Variable: _loaded
	 * [object] This is all the files that have been downloaded, it is ether a string (for text based files) or a HTML img tag (for images). The name of the file is the property name, for example _loaded["test.json"] would be the file "test.json".
	 */
	this._loaded = {};
	/** Variable: scripts
	 * [array] This is an array of arrays consisting of all the files specified in the root JSON. <Events> loops through these and runs them when it is constructed.
	 */
	this.scripts = [];
	
	/** Variable: _root
	 * [object] This is the root JSON, it is obtained from root.json and provides all the basic stuff that describes the game.
	 */
	this._root = this.grabJson("root");
	
	if(!this._root) {duskWolf.error("Root json could not be loaded. Oh dear..."); return;}
	if(!("files" in this._root)) {duskWolf.error("Root json does not specify a list of files..."); return;}
	for(var i = this._root.files.length-1; i>= 0; i--) {
		if(this.grabJson(this._root.files[i])) {
			this.scripts[this.scripts.length] = this.grabJson(this._root.files[i]);
		}
	}
	
	if("mods" in this._root) modsAvalable = this._root.mods;
	
	//Import modules
	var ims = ["mods/IModule.js"];

	for(var i = modsAvalable.length-1; i >= 0; i--) {
		ims[ims.length] = "mods/"+modsAvalable[i]+".js";
	}

	__import__(ims);
}
/** Variable: __hold__
 * [string] This is a global temporary variable used when retrieving files from AJAX, it's a horrible hack... Ugh...
 */
var __hold__;
//See mods/__init__.js for documentation.
var modsAvalable;

/** Function: grabJson
 * 
 * [object] This downloads and parses a JSON file from an online place. It blocks until the file is downloaded, and returns that file.
 * 
 * This is a little more lax than usual, before the file is parsed, tabs and newlines are replaced by spaces, and /* comments are removed, letting you use them.
 * 
 * Params:
 * 	file - [string] The name of the file to load, is relative to <__domain__> / <DuskWolf.gameDir> and the "json" file extension is added by this.
 * 	async - [boolean] Not implemented yet.
 * 
 * Return:
 * 	The contents of the file file, parsed as a JSON object.
 */
Data.prototype.grabJson = function(file, async) {
	if(this._loaded[file+".json"] === undefined) {
		duskWolf.info("Downloading JSON "+file+"...");
		
		$.ajax({"async":async==true, "dataType":"text", "error":function(jqXHR, textStatus, errorThrown) {
			duskWolf.error("Error getting "+file+", "+errorThrown);
			__hold__ = null;
		}, "success":function(json, textStatus, jqXHR) {
			__hold__ = json;
		}, "url":__domain__+"/"+duskWolf.gameDir+"/"+file+".json"});
		
		this._loaded[file+".json"] = __hold__.replace(/\t/g, " ").replace(/\/\*(?:.|\n)*?\*\//g, "").replace(/\n/g, " ");
	}
	
	return JSON.parse(this._loaded[file+".json"]);
}

/** Function: grabImage
 * 
 * [Image] This downloads an image from a remote location. It downloads without blocking, so be aware of that!
 * 
 * If you call this without asigning the return value to anything, the image should download in the background.
 * 
 * Params:
 * 	file - [string] A path to the file located in <__domain__> / <DuskWolf.gameDir>.
 * 	The file extension is not added automatically.
 * 
 * Return:
 * 	A DOM image object with the src attribute set to the image path.
 */
Data.prototype.grabImage = function(file) {
	if(this._loaded[file] === undefined) {
		duskWolf.info("Downloading image "+file+"...");
		
		this._loaded[file] = new Image()
		this._loaded[file].src = __domain__+"/"+duskWolf.gameDir+"/"+file;
		return this._loaded[file];
	}else{
		return this._loaded[file];
	}
}
