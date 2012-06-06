//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Net
 * 
 * This allows you to download more JSONS, and prefetch images.
 * 
 * Inheritance:
 * 	mods.Net { <mods.IModule>
 * 
 * Provided Actions:
 * 
 * > {"a":"import", "file":"...", ("thread":"...")}
 * Downloads a JSON from a file relative to the data dir, and runs it.
 * 	The file extension ".json" or ".dws" is added automatically if needed.
 * 	The actions will be ran on <Events.thread>, the current thread, if the thread property is not specified.
 * 
 * > {"a":"fetch", "file":"..."}
 * Downloads the specified image in the background, allowing it to appear instantly when needed.
 * 
 * Provided HashFunctions:
 * 
 * > #FILE(location);
 * 	Provided the file has already been downloaded, returns it. This is relative to the data dir.
 */

/** Function: mods.Data
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
 */
mods.Net = function(events) {
	mods.IModule.call(this, events);
};
mods.Net.prototype = new mods.IModule();
mods.Net.constructor = mods.Data;

/** Function: addActions
 * 
 * Registers the actions and sets the vars this uses, see the class description for a list of avalable ones.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Net.prototype.addActions = function() {
	this._events.registerAction("import", this._get, this, [["file", true, "STR"], ["thread", false, "STR"]]);
	this._events.registerAction("fetch", this._get, this, [["file", true, "STR"]]);
	
	this._events.registerHashFunct("FILE", this._file, this);
};

/*- Function: _get
 * 
 * Used internally to handle both "get" like actions.
 * 	You should use the standard ways of running actions, or the <Data> class rather than calling this directly.
 * 
 * Params:
 *	data		- [object] A "import" or "fetch" action.
 * 
 * See:
 * * <Data>
 */
mods.Net.prototype._get = function(action) {
	if(!action.file){duskWolf.error("No file to retreive.");return;}
	
	if(action.a === "import") {
		this._events.run(data.grabJson(action.file, true), action.thread?action.thread:this._events.thread);
	}else{
		data.grabImage(action.file);
	}
};

/*- Function: _file
 * 
 * [string] Used internally to handle the "FILE" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 * 	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Net.prototype._file = function(name, args) {
	if(!args[0]){duskWolf.error("No file to retreive.");return;}
	
	return data.grabFile(args[0]);
};
