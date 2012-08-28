//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

var dusk = {};
dusk.load = {};

/** @namespace dusk.load
 * @description This file initiates the DuskWolf engine, and when included the engine is started.
 * 
 * It provides the functions required to import files and resolve dependancies.
 * 
 * JavaScript files imported by DuskWolf consist of adding them to the page's head tab, one after the other.
 * Before a new file is added to the head, the old one must have been finished downloading, and call `{dusk.load.provide}` with it's namespace name.
 * 
 * This namespace will also add keyboard listeners to the page, which stop you scrolling using the arrow keys, and send any keypresses to the engine.
 * 
 * @see {@dusk.deps}
 */

//Block keys from moving page
document.onkeydown = function(e) {
	if(e.keyCode >= 37 && e.keyCode <= 40) return false;
};

/** Containes all the dependancy information for the files.
 * 
 * Each key is an import name, and the value is an array.
 * The first element is the filename that provides the file, the second is a state value, as shown below, and the third is an array of all the dependancies of the namespace.
 * 
 * Possible values for the state are either 0 (not imported), 1 (currently in the proccess of importing) or 2 (successfully imported and ran).
 * 
 * @type object.<array.<string, number, array.<string>>>
 * @private
 * @since 0.0.12-alpha
 */
dusk.load._names = {};

/** All the namespaces that are waiting to be downloaded.
 * 
 * What happens is the first element in the list is downloaded, and removed, then the new first element and so on. New namespaces are added to the end of the array.
 * 
 * Each element of the array consists of two elements; the first is a boolean indicating if the file is added to the file (but has not finished downloading) the second is the actual namespace to download.
 * 
 * @type array.<array.<boolean, string>>
 * @see {@dusk.load._repeat}
 * @private
 * @since 0.0.12-alpha
 */
dusk.load._files = [];

/** Marks that the namespace `name` has been provided. This tells the engine to download the next file in the list, and it also creates the namespace if it doesn't already exist.
 * 
 * @param {string} name The namespace to provide.
 * @since 0.0.12-alpha
 */
dusk.load.provide = function(name) {
	var fragments = name.split(".");
	window[fragments[0]] = window[fragments[0]] || {};
	var obj = window;
	if(fragments.length > 1){
		for(var point = 0; point < fragments.length; point ++) {
			if(obj[fragments[point]] === undefined) obj[fragments[point]] = {};
			obj = obj[fragments[point]];
		}
	}
	
	for(var i = this._files.length-1; i >= 0; i--) {
		if(this._files[i][1] == name) {
			this._files.splice(i, 1);
		}
	}
};

/** Adds a dependency. This tells the engine the file in which the namespaces are provided, and what other files must be imported before it.
 * 
 * @param {string} file The file name which the namespaces reside. It is relative to `{@link __duskdir__}`.
 * @param {array.<string>} provided An array of namespace names which are provided by the file.
 * @param {array.<string>} required An array of namespace names that are required for this file to run. These will be downloaded before this one if any provided namespaces are requested.
 * @since 0.0.12-alpha
 */
dusk.load.addDependency = function(file, provided, required) {
	for(var i = provided.length-1; i >= 0; i--) {
		this._names[provided[i]] = [file, 0, required];
	}
};

/** Imports a namespace. The namespace must have been previously registered using {@link dusk.load.addDependency}.
 * 
 * The namespace will NOT be immediately available after this function call unless it has already been imported (in which case the call does nothing).
 * 
 * @param {string} name The namespace to import.
 * @since 0.0.12-alpha
 */
dusk.load.require = function(name) {
	if(!(name in this._names)) throw Error("Could not import "+name+" as it is not recognised.");
	if(this._names[name][1] !== 0) return;
	
	for(var i in this._names) {
		if(this._names[i][0] === this._names[name][0] && this._names[i][0][1] > 0) return;
	}
	
	this._names[name][1] = 1;
	for(var i = this._names[name][2].length-1; i >= 0; i --) {
		if(this._names[this._names[name][2][i]][1] === 0) {
			dusk.load.require(this._names[name][2][i]);
		}
	}
	
	dusk.load._files.push([false, name]);
	
};

/** This is called every 10ms or so. It checks `{@link dusk.load._files}` to see if there are any new files that need downloading, and if so downloads them.
 * @private
 * @since 0.0.12-alpha
 */
dusk.load._repeat = function() {
	if(dusk.load._files.length && dusk.load._files[0][0] === false) {
		var js = document.createElement("script");
		js.src = dusk.load._names[dusk.load._files[0][1]][0];
		document.head.appendChild(js);
		dusk.load._names[dusk.load._files[0][1]][1] = 2;
		dusk.load._files[0][0] = true;
	}
};
setInterval(dusk.load._repeat, 10);

/** This is the location of the DuskWolf engine's core files. Every namespace is inside this folder, or any of it's subfolders.
 * @type {string="DuskWolf"}
 */
var __duskdir__ = __duskdir__?__duskdir__:"DuskWolf";


dusk.load.addDependency(__duskdir__+"/deps.js", ["dusk.deps"], []);
dusk.load.require("dusk.deps");

$(document).bind("keydown", function(e){try {dusk.game.keypress(e);} catch(e) {console.error(e.name+", "+e.message);}});
$(document).bind("keyup", function(e){try {dusk.game.keyup(e);} catch(e) {console.error(e.name+", "+e.message);}});

//Replaced in StartGame.js
dusk.startGame = function() {
	setTimeout(dusk.startGame, 100);
}
