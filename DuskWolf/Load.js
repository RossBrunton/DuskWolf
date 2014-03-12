//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

//Testing; remove this
window.Promise = null;

if(!dusk) var dusk = {};
if(!dusk.load) dusk.load = {};

/** @namespace dusk.load
 * @description This namespace provides the functions required to import files and resolve dependancies.
 * 
 * JavaScript files imported by DuskWolf consist of adding them to the page's head tab, one after the other.
 * Before a new file is added to the head, the old one must have been finished downloading,
 *  and call `{@link dusk.load.provide}` with it's namespace name.
 * 
 * A package name may contain as the first character a ">".
 *  This indicates that it should be downloaded AFTER the current package.
 *  This should be used to fix circular dependancies by marking the one that should be ran first with this.
 * 
 * There exists a package `dusk.advancedLoad` that adds new functionality to this class.
 */

/** Inits the `dusk.load` namespace.
 * @since 0.0.17-alpha
 * @private
 */
dusk.load._init = function() {
	/** Containes all the dependancy information for the files.
	 * 
	 * Each key is an import name, and the value is an array.
	 *  The first element is the filename that provides the file, 
	 *  the second is a state value, as shown below, 
	 *  the third is an array of all the dependancies of the namespace,
	 *  and the fourth is the size of the file.
	 * 
	 * Possible values for the state are either 0 (not imported), 
	 *  1 (currently in the proccess of importing) or 2 (successfully imported and ran).
	 * @type object
	 * @private
	 * @since 0.0.12-alpha
	 */
	dusk.load._names = {};
	 
	/** The currently imported package which is running now, or ran last.
	 * @type string
	 * @private
	 * @since 0.0.15-alpha
	 */
	dusk.load._current = "";
	
	/** An array of all the files and their dependancies that are waiting to be imported.
	 * @type array
	 * @private
	 * @since 0.0.17-alpha
	 */
	dusk.load._currentlyImporting = [];

	/** An event dispatcher which is fired when a package is imported and then calls `{@link dusk.load.provide}`.
	 * 
	 * The event will be fired after the script is ran; so you can be sure that the module has been initiated.
	 * 
	 * The event object has only one property, package, a string with the package name in it.
	 * 
	 * This object will be `null` unless `dusk.advancedLoad` is imported; 
	 *  and this namespace will not make any attempt to import it.
	 * @type null|EventDispatcher
	 * @since 0.0.14-alpha
	 */
	dusk.load.onProvide = null;
	
	/** This is any detected issue with the capabilities of the client.
	 * 
	 * This will be a description of only one issue, such as lack of canvas or strict mode support.
	 * 	If there are no issues this will be an empty string.
	 * 
	 * If there is any issue, then DuskWolf will continue to run.
	 * @type string
	 * @since 0.0.17-alpha
	 */
	dusk.load.capabilityIssue = dusk.load._capability();
};


/** Checks capability of the user agent.
 * 
 * If there is any issue, then this returns a string description of the problem.
 *  It will only return one problem; the first one found.
 * 	DuskWolf will ignore any problems, "just in case".
 * 
 * @return {string} A problem description, or an empty string.
 * @private
 * @since 0.0.17-alpha
 */
dusk.load._capability = function() {
	if(!("$" in window)) return "JQuery not included!";
	if(!("getContext" in document.createElement("canvas"))) return "Canvas not supported!";
	
	if(!(window.requestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.msRequestAnimationFrame
	|| null))
		return "requestAnimationFrame not supported!";
	
	if(!("defineProperty" in Object)) {
		console.warn("Object.defineProperty is not defined! Doing a workaround...");
		Object.defineProperty = function(obj, prop, descriptor) {
			if("get" in descriptor) obj.__defineGetter__(prop, descriptor.get);
			if("set" in descriptor) obj.__defineSetter__(prop, descriptor.set);
			if("value" in descriptor) obj[prop] = descriptor.value;
			return obj;
		};
	}
	
	if(!("seal" in Object)) {
		console.warn("Object.seal is not defined! Doing a workaround...");
		Object.seal = function(obj) {return obj;};
	}
	
	if(!("create" in Object)) return "Object.create not supported!";
	
	if(!("ArrayBuffer" in window)) return "Typed arrays not supported!";
	
	if(!("Promise" in window) || typeof Promise != "function") {
		console.warn("Promise not available, importing polyfill.");
		var js = document.createElement("script");
		js.src = "DuskWolf/Promise.js";
		document.head.appendChild(js);
	}
	
	if (!("slice" in ArrayBuffer.prototype)) {
		console.warn("ArrayBuffer.prototype.slice not supported, doing workaround.");
		ArrayBuffer.prototype.slice = function (start, end) {
			var that = new Uint8Array(this);
			if (end == undefined) end = that.length;
			var result = new ArrayBuffer(end - start);
			var resultArray = new Uint8Array(result);
			for (var i = 0; i < resultArray.length; i++)
				resultArray[i] = that[i + start];
			return result;
		}
	}
	
	if(!("endsWith" in String.prototype)) {
		console.warn("String.endsWith not found, doing workaround.");
		String.prototype.endsWith = function(pattern) {
			for (var i = pattern.length, l = this.length; i--;) {
				if (this.charAt(--l) != pattern.charAt(i)) {
					return false;
				}
			}
			return true;
		}
	}
	
	if((function() {"use strict";return this;})() !== undefined) return "Strict mode not supported!";
	
	if(!(navigator.getGamepads || navigator.webkitGetGamepads)) return "Gamepad API not supported!";
	
	return "";
};

/** Marks that the namespace `name` has been provided.
 *   This tells the engine to download the next file in the list,
 *   and it also creates the namespace object if it doesn't already exist.
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
	
	dusk.load._names[name][1] = 2;
	
	if(dusk.load.onProvide) {
		var to = (function(pakName) {
			return function() {
				dusk.load.onProvide.fire({'package':pakName});
			};
		})(name);
		setTimeout(to, 1);
	}
};

/** Adds a dependency.
 * 
 *  This tells the engine the file in which the namespaces are provided,
 *  and what other files must be imported before it.
 * 
 * @param {string} file The file name which the namespaces reside. It is relative to `__duskdir__`.
 * @param {array} provided An array of namespace names which are provided by the file.
 * @param {array} required An array of namespace names that are required for this file to run.
 *  These will be downloaded before this one if any provided namespaces are requested.
 * @param {integer=0} size The size of the file, in bytes. Optional.
 * @since 0.0.12-alpha
 */
dusk.load.addDependency = function(file, provided, required, size) {
	if(!size) size = 0;
	for(var i = provided.length-1; i >= 0; i--) {
		this._names[provided[i]] = [file, 0, required, size];
	}
};

/** Marks the current file as requiring the specified namespace as a dependency, 
 *  used for generating dependancy information.
 * 
 * @param {string} name The namespace to add as a dependency.
 * @since 0.0.15-alpha
 */
dusk.load.require = function(name) {
	//Do nothing
};

/** Imports a package.
 * 
 * The package must have been previously registered
 *  using `{@link dusk.load.addDependency}` or `{@link dusk.load.importList}`.
 * 
 * The namespace will NOT be immediately available after this function call
 *  unless it has already been imported (in which case the call does nothing).
 * @param {string} name The package to import, as a string name.
 * @since 0.0.15-alpha
 */
dusk.load.import = function(name) {
	if(this._currentlyImporting.indexOf(name) !== -1) return;
	
	if(!(name in this._names) && name.charAt(0) != "@") {
		console.error("Package "+name+" not found; could not be imported.");
		return;
	}
	this._currentlyImporting.push(name);
	if(name.charAt(0) != "@") {
		for(var i = this._names[name][2].length-1; i >= 0; i --) {
			dusk.load.import(this._names[name][2][i].replace(">", ""));
		}
	}
	
	dusk.load._repeat();
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

/** Download a JSON containing an array of dependancies. These will be looped through,
 *  and the entries will be given to `{@link dusk.load.addDependency}`.
 * 
 * Each entry of the array must itself be an array of the form `[file, provided, required]`.
 * 
 * If `dusk.advancedLoad` is imported, this returns a promise that resolves when the file is downloaded or fails to
 *  download.
 * @param {string} path The path to the JSON file.
 * @param {function()} callback Will be called when the file load is completed.
 * @param {function()} errorCallback Will be called if there is an error.
 * @returns {undefined|Promise(object)} Undefined or a promise.
 * @since 0.0.15-alpha
 */
dusk.load.importList = function(path, callback, errorCallback) {
	$.ajax({"async":true, "dataType":"JSON", "error":function(jqXHR, textStatus, errorThrown) {
		console.error("Error getting import file, "+errorThrown);
		if(errorCallback) errorCallback(errorThrown);
	}, "success":function importSuccess(data, textStatus, jqXHR){
		var relativePath = jqXHR.responseURL.split("/");
		relativePath.splice(-1, 1);
		relativePath = relativePath.join("/")+"/";
		for(var i = data.length-1; i >= 0; i--) {
			if(data[i][0].indexOf(":") === -1 && data[i][0][0] != "/") data[i][0] = relativePath + data[i][0];
			dusk.load.addDependency(data[i][0], data[i][1], data[i][2], data[i][3]);
		}
		if(callback) callback(data);
	}, "beforeSend":function(jqXHR, settings) {jqXHR.responseURL = path;},
	"url":path});
};

/** Used internally to import a package, will fail if dependancies are not met.
 * @param {string} name The name of the package to attempt to import.
 * @param {boolean} ignoreDefer In the case where no packages can be imported at the moment,
 *  this parameter can be set to true so that dependancies starting with ">" are ignored.
 * @return {boolean} True if the package and all of it's dependancies are imported.
 * @private
 * @since 0.0.17-alpha
 */
dusk.load._tryToImport = function(name, ignoreDefer) {
	if(dusk.load._names[name][1] == 2) return true;
	
	if(name.charAt(0) != "@") {
		if(dusk.load._names[name][1] != 0) return false;
		
		for(var i = dusk.load._names[name][2].length-1; i >= 0; i --) {
			if(!(dusk.load._names[name][2][i].replace(">", "") in dusk.load._names)) {
				console.warn("Dependency "+dusk.load._names[name][2][i].replace(">", "")+" for "+name+" not found!");
			}else if(!(dusk.load._names[name][2][i].charAt(0) === ">" && ignoreDefer)
				&& dusk.load._names[dusk.load._names[name][2][i].replace(">", "")][1] < 2)
				return false;
		}
	
		console.log("Now importing: "+name);
		dusk.load._current = name;
		var js = document.createElement("script");
		js.src = dusk.load._names[name][0];// + ((!("dev" in dusk) || dusk.dev)?"?_="+(new Date()).getTime():"");
		document.head.appendChild(js);
		dusk.load._names[name][1] = 1;
	}else{
		console.log("Now importing from "+name.substring(1));
		dusk.load._current = name;
		var js = document.createElement("script");
		js.src = name.substring(1);
		document.head.appendChild(js);
		dusk.load._names[name] = [name, 2, [], 0];
	}
	
	return true;
};

/** This is called every 100ms or so. It checks if any packages are being imported, and attempts to import them.
 * @private
 * @since 0.0.12-alpha
 */
dusk.load._repeat = function() {
	if(dusk.load._currentlyImporting.length) {
		for(var i = dusk.load._currentlyImporting.length-1; i >= 0; i --) {
			if(dusk.load._tryToImport(dusk.load._currentlyImporting[i])) {
				dusk.load._currentlyImporting.splice(i, 1);
				return;
			}
		}
		
		for(var i = dusk.load._currentlyImporting.length-1; i >= 0; i --) {
			if(dusk.load._tryToImport(dusk.load._currentlyImporting[i], true)) {
				dusk.load._currentlyImporting.splice(i, 1);
				return;
			}
		}
		
		setTimeout(dusk.load._repeat, 100);
	}
};

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

/** Stops all currently importing packages.
 * @since 0.0.20-alpha
 */
dusk.load.abort = function() {
	dusk.load._currentlyImporting = [];
	dusk.load._current = "";
};

/** Checks if the specified package is imported.
 * @param {string} name The package name to check.
 * @return {boolean} Whether the package is imported.
 * @since 0.0.20-alpha
 */
dusk.load.isImported = function(name) {
	if(name in dusk.load._names && dusk.load._names[name][1] == 2) {
		return true;
	}
	
	return false;
};

/** Returns the total size of files that are being downloaded, if the deps file has this information.
 * @return {integer} The total download remaining, in kilobytes.
 * @private
 * @since 0.0.20-alpha
 */
dusk.load._getBytes = function() {
	var seen = [];
	var sum = 0;
	for(var i = dusk.load._currentlyImporting.length-1; i >= 0; i --) {
		if(dusk.load._names[dusk.load._currentlyImporting[i]].length > 3
		&& seen.indexOf(dusk.load._names[dusk.load._currentlyImporting[i]][0]) === -1) {
			sum += dusk.load._names[dusk.load._currentlyImporting[i]][3];
			seen[seen.length] = dusk.load._names[dusk.load._currentlyImporting[i]][0];
		}
	};
	return ~~(sum/1024);
};

/** Called on requestAnimationFrame to display the loading text untill the game has loaded. 
 * @private
 * @since 0.0.17-alpha
 */
dusk.load._displayLoad = function() {
	if(!dusk.started && dusk.elemPrefix) {
		$("#"+dusk.elemPrefix+"-canvas")[0].getContext("2d").clearRect(0, 0, 
			$("#"+dusk.elemPrefix+"-canvas")[0].width, $("#"+dusk.elemPrefix+"-canvas")[0].height
		);
		var textY = 0;
		
		$("#"+dusk.elemPrefix+"-canvas")[0].getContext("2d").fillText(
			"Hold on! Loading "+dusk.load._currentlyImporting.length+" files!", 5, textY+=15
		);
		$("#"+dusk.elemPrefix+"-canvas")[0].getContext("2d").fillText("Now loading "+dusk.load._current+"!", 5, textY+=15);
		$("#"+dusk.elemPrefix+"-canvas")[0].getContext("2d").fillText(
			"That's about "+dusk.load._getBytes()+"KiB, excluding image data!", 5, textY+=15
		);
		
		if("onLine" in navigator && !navigator.onLine) {
			$("#"+dusk.elemPrefix+"-canvas")[0].getContext("2d").fillText(
				"You have no internet connection; good luck with that.", 5, textY+=15
			);
		}
		if(dusk.load.capabilityIssue) {
			$("#"+dusk.elemPrefix+"-canvas")[0].getContext("2d").fillText(dusk.load.capabilityIssue, 5, textY+=15);
		}
	}
	
	if(!dusk.started) {
		var raf = window.requestAnimationFrame
		|| window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame
		|| window.msRequestAnimationFrame;
		raf(dusk.load._displayLoad);
	}
};
window.raf = window.requestAnimationFrame || window.mozRequestAnimationFrame
|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
raf(dusk.load._displayLoad);
delete window.raf;

dusk.load._init();

dusk.load.addDependency("", ["dusk.load"], []);
dusk.load.provide("dusk.load");


// Object pools
/** @class dusk.Pool
 * 
 * @classdesc Object pools, for static memory allocation.
 * 
 * Objects are taken from this pool when allocated, and returned when freed. This means that the object that is
 *  allocated is not a new one, but it cuts down on memory allocations and garbadge collection.
 * 
 * This class is included with `{@link dusk.load}`, and thus is always available.
 * 
 * @param {class(...)} constructor The constructor for the object in the pool.
 * @param {function(*, args):*} onAlloc Called with the object and specified arguments every time the object is
 *  allocated. This should return the object to allocate.
 * @param {function(*):*} onFree Called when the object is freed; should return the object to return to the pool.
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.Pool = function(constructor, onAlloc, onFree) {
	this._constructor = constructor;
	this._onAlloc = onAlloc?onAlloc:function(o, args){return o;};
	this._onFree = onFree?onFree:function(o) {return o;};
	
	this._inPool = 0;
	this._objects = [];
	this.highestCount = 0;
	this._mlWarning = false;
};

dusk.Pool.prototype.alloc = function(args) {
	if(this._inPool == 0) {
		var o = new this._constructor();
		return this._onAlloc(o, args);
	}else{
		this._inPool --;
		return this._onAlloc(this._objects[this._inPool], args);
	}
};

dusk.Pool.prototype.free = function(object) {
	this._inPool ++;
	if(this._inPool > this.highestCount) this.highestCount ++;
	object = this._onFree(object);
	this._objects[this._inPool-1] = object;
	
	if(this._inPool > 0xffff && !this._mlWarning) {
		console.log("**** MEMORY LEAK WARNING ****");
		console.log(this);
		this._mlWarning = true;
	}
};
