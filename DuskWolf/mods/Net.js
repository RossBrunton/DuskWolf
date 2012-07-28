//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk.mods.net");

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
 * Downloads a JSON or DWS from a file relative to the data dir, and runs it.
 * 	The file extension ".json" is added automatically if needed.
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
 */
dusk.mods.net.init = function() {
	dusk.events.registerAction("import", this._get, this, [["file", true, "STR"], ["thread", false, "STR"]]);
	dusk.events.registerAction("fetch", this._get, this, [["file", true, "STR"]]);
	
	dusk.events.registerHashFunct("FILE", this._file, this);
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
dusk.mods.net._get = function(action) {
	if(!action.file){throw new dusk.errors.PropertyMissing(action.a, "file");}
	
	if(action.a === "import") {
		dusk.events.run(dusk.data.grabJson(action.file, true), action.thread?action.thread:dusk.events.thread);
	}else{
		dusk.data.grabImage(action.file);
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
dusk.mods.net._file = function(name, args) {
	if(!args[0]){dusk.error("No file to retreive.");return;}
	
	return dusk.data.download(args[0], args[1]);
};

dusk.mods.net.init();
