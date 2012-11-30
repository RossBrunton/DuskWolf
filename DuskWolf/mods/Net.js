//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.mods.net");

/** @namespace dusk.mods.net
 * 
 * @description This allows you to download more JSONS, and prefetch images.
 * 
 * This namespace has no public members.
 */

/*
 * > {"a":"import", "file":"...", ("thread":"...")}
 * Downloads a JSON or DWS from a file relative to the data dir, and runs it.
 * 	The file extension ".json" is added automatically if needed.
 * 	The actions will be ran on <Events.thread>, the current thread, if the thread property is not specified.
 * 
 * > {"a":"fetch-image", "file":"..."}
 * Downloads the specified image in the background, allowing it to appear instantly when needed.
 * 
 * Provided HashFunctions:
 * 
 * > #FILE(location);
 * 	Provided the file has already been downloaded, returns it. This is relative to the data dir.
 */

/** This initiates the module, registering all the actions and variables. This is called automatically when the file is loaded.
 * @private
 */
dusk.mods.net._init = function() {
	dusk.actions.registerAction("import", this._get, this, [["file", true, "STR"], ["thread", false, "STR"]]);
	dusk.actions.registerAction("fetch-image", this._get, this, [["file", true, "STR"]]);
	
	dusk.actions.registerHashFunct("FILE", this._file, this);
};

/** Used internally to handle the `import` and `fetch-image` actions. This should not be called by anything else.
 * @param {object} action An `import` or `fetch-image` action.
 * @private
 */
dusk.mods.net._get = function(action) {
	if(!action.file){throw new dusk.errors.PropertyMissing(action.a, "file");}
	
	if(action.a === "import") {
		console.error("Import is not supported!");
		dusk.actions.run(dusk.data.grabJson(action.file, true), action.thread?action.thread:dusk.actions.thread);
	}else{
		dusk.data.grabImage(action.file);
	}
};

/** Used internally to handle the `FILE` hashfunction. This should not be called by anything else.
 * @param {string} name The hashfunct name.
 * @param {array} args The arguments of the hashfunction.
 * @return {number} The hasfunction output.
 * @private
 */
dusk.mods.net._file = function(name, args) {
	if(!args[0]){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	
	return dusk.data.download(args[0]);
};

dusk.mods.net._init();
