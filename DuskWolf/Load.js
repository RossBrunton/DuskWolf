//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

if(!dusk) var dusk = {};
if(!dusk.load) dusk.load = {};

/** @namespace dusk.load
 * @description This namespace provides the functions required to import files and resolve dependancies.
 * 
 * JavaScript files imported by DuskWolf consist of adding them to the page's head tab, one after the other.
 * Before a new file is added to the head, the old one must have been finished downloading, and call `{@link dusk.load.provide}` with it's namespace name.
 */

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

/** The currently observed dependancies, used for creating dependancy lists.
 * 
 * Each key is the "true" filename, the value is an array of the form `[provided, requires]`.
 * 
 * @type object
 * @private
 * @since 0.0.15-alpha
 */
dusk.load._observedDeps = {};
 
/** The currently imported package which is running now, or ran last.
 * 
 * @type string
 * @private
 * @since 0.0.15-alpha
 */
dusk.load._current = "";

/** An event dispatcher which is fired when a package is imported and then calls `{@link dusk.load.provide}`.
 * 
 * The event will be fired after the script is ran; so you can be sure that the module has been initiated.
 * 
 * The event object has only one property, a string with the package name in it.
 * 
 * This object will be `null` until `dusk.EventDispatcher` is imported; and this namespace will not make any attempt to import it.
 * 
 * @type null|EventDispatcher
 * @since 0.0.14-alpha
 */
dusk.load.onProvide = null;

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
	
	if(dusk.load.onProvide) setTimeout ("dusk.load.onProvide.fire({'package':'"+name+"'});", 1);
};

/** Adds a dependency. This tells the engine the file in which the namespaces are provided, and what other files must be imported before it.
 * 
 * @param {string} file The file name which the namespaces reside. It is relative to `__duskdir__`.
 * @param {array.<string>} provided An array of namespace names which are provided by the file.
 * @param {array.<string>} required An array of namespace names that are required for this file to run. These will be downloaded before this one if any provided namespaces are requested.
 * @since 0.0.12-alpha
 */
dusk.load.addDependency = function(file, provided, required) {
	for(var i = provided.length-1; i >= 0; i--) {
		this._names[provided[i]] = [file, 0, required];
	}
};

/** Marks the current file as requiring the specified namespace as a dependency, used for generating dependancy information.
 * 
 * @param {string} name The namespace to import.
 * @since 0.0.15-alpha
 */
dusk.load.require = function(name) {
	if(dusk.load._current) {
		for(var p in dusk.load._observedDeps) {
			if(dusk.load._observedDeps[p][0].indexOf(dusk.load._current) !== -1) {
				dusk.load._observedDeps[p][1].push(name);
			}
		}
	}
};

/** Imports a namespace. The namespace must have been previously registered using `{@link dusk.load.addDependency}`.
 * 
 * The namespace will NOT be immediately available after this function call unless it has already been imported (in which case the call does nothing).
 * 
 * @param {string} name The namespace to import.
 * @since 0.0.15-alpha
 */
dusk.load.import = function(name) {
	if(!(name in this._names)) {
		console.error("Could not import "+name+" as it is not recognised.");
		return;
	}
	
	if(this._names[name][1] !== 0) return;
	
	for(var i in this._names) {
		if(this._names[i][0] === this._names[name][0] && this._names[i][0][1] > 0) return;
	}
	
	this._names[name][1] = 1;
	for(var i = this._names[name][2].length-1; i >= 0; i --) {
		if(this._names[this._names[name][2][i]][1] === 0) {
			dusk.load.import(this._names[name][2][i]);
		}
	}
	
	dusk.load._files.push([false, name]);
};

/** Imports all packages, usefull for debugging or generating dependancy files.
 * @since 0.0.15-alpha
 */
dusk.load.importAll = function() {
	console.log("Importing everything...");
	for(var f in dusk.load._names) {
		console.log(f);
		dusk.load.import(f);
	}
};

/** Returns a JSON string containing all the dependancy information of all the elements matching the regexp specified.
 * 
 * This should be importable using `{@link dusk.load.import}`.
 * 
 * @param {regex} patt The pattern to match.
 * @return {string} A list of dependancies.
 * @since 0.0.15-alpha
 */
dusk.load.buildDeps = function(patt) {
	var holdString = "[\n\t";
	var first = true;
	for(var d in dusk.load._observedDeps) {
		for(var i = dusk.load._observedDeps[d][0].length-1; i >= 0; i --) {
			if(patt.test(dusk.load._observedDeps[d][0][i])) {
				if(!first) holdString += ",\n\t";
				first = false;
				var holdArray = [];
				holdArray[0] = d;
				holdArray[1] = dusk.load._observedDeps[d][0];
				holdArray[1].sort();
				holdArray[2] = dusk.load._observedDeps[d][1];
				holdArray[2].sort();
				holdString += JSON.stringify(holdArray);
				break;
			}
		}
	}
	holdString += "\n]";
	return holdString;
};

/** Download a JSON containing an array of dependancies. These will be looped through, and the entries will be given to `{@link dusk.load.addDependency}`.
 * 
 * Each entry of the array must itself be an array of the form `[file, provided, required]`.
 * 
 * @param {string} path The path to the JSON file.
 * @param {function()} callback Will be called when the imports are completed.
 * @since 0.0.15-alpha
 */
dusk.load.importList = function(path, callback) {
	$.ajax({"async":true, "dataType":"JSON", "error":function(jqXHR, textStatus, errorThrown) {
		console.error("Error getting file, "+errorThrown);
	}, "success":[function importSuccess(data, textStatus, jqXHR){
		var relativePath = jqXHR.responseURL.split("/");
		relativePath.splice(-1, 1);
		relativePath = relativePath.join("/")+"/";
		for(var i = data.length-1; i >= 0; i--) {
			dusk.load._observedDeps[data[i][0]] = [data[i][1], []];
			if(data[i][0].indexOf(":") === -1 && data[i][0][0] != "/") data[i][0] = relativePath + data[i][0];
			dusk.load.addDependency(data[i][0], data[i][1], data[i][2]);
		}
	}, callback], "beforeSend":function(jqXHR, settings) {jqXHR.responseURL = path},
	"url":path});
};

/** This is called every 10ms or so. It checks `{@link dusk.load._files}` to see if there are any new files that need downloading, and if so downloads them.
 * @private
 * @since 0.0.12-alpha
 */
dusk.load._repeat = function() {
	if(dusk.load._files.length && dusk.load._files[0][0] === false) {
		dusk.load._current = dusk.load._files[0][1];
		var js = document.createElement("script");
		js.src = dusk.load._names[dusk.load._files[0][1]][0];
		document.head.appendChild(js);
		dusk.load._names[dusk.load._files[0][1]][1] = 2;
		dusk.load._files[0][0] = true;
		//dusk.load._current = "";
	}
};
setInterval(dusk.load._repeat, 10);

/** This is the location of the DuskWolf engine's core files. Every namespace is inside this folder, or any of it's subfolders.
 * @type {string}
 * @default "DuskWolf"
 */
var __duskdir__ = __duskdir__?__duskdir__:"DuskWolf";

/** Called every 100ms to check if dusk.EventDispatcher is imported; if so, initiates `{@link dusk.load.onProvide}`.
 * @private
 */
dusk.load._checkIfHandleable = function() {
	if("EventDispatcher" in dusk) {
		dusk.load.onProvide = new dusk.EventDispatcher();
	}else{
		setTimeout(dusk.load._checkIfHandleable, 100);
	}
};
dusk.load._checkIfHandleable();

dusk.load.provide("dusk.load");
