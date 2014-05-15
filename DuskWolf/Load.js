//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

//Testing; remove this
//window.Promise = null;

window.load = {};

/** @namespace load
 * @description This namespace provides the functions required to import files and resolve dependancies.
 * 
 * JavaScript files imported by DuskWolf consist of adding them to the page's head tab, one after the other.
 * Before a new file is added to the head, the old one must have been finished downloading,
 *  and call `{@link load.provide}` with it's namespace name.
 * 
 * A package name may contain as the first character a ">".
 *  This indicates that it should be downloaded AFTER the current package.
 *  This should be used to fix circular dependancies by marking the one that should be ran first with this.
 * 
 * A dependency may start with the character "@". If so, then the dependency will be interpreted as the URL of a remote
 *  resource.
 * 
 * There exists a package `dusk.advancedLoad` that adds new functionality to this class.
 */

/** Inits the `load` namespace.
 * @since 0.0.17-alpha
 * @private
 */
load._init = function() {
	/** Containes all the dependancy information for the files.
	 * 
	 * Each key is an import name, and the value is an array.
	 *  The first element is the filename that provides the file, 
	 *  the second is a state value, as shown below, 
	 *  the third is an array of all the dependancies of the namespace,
	 *  the fourth is the size of the file,
	 *  the fifth is the thing that was provided
	 *  and the sixth is an array of functions that should be called when it is imported.
	 * 
	 * Possible values for the state are either 0 (not imported), 
	 *  1 (currently in the proccess of importing) or 2 (successfully imported and ran).
	 * @type object
	 * @private
	 * @since 0.0.12-alpha
	 */
	load._names = {};
	
	/** An object containing the files that can be imported. Key is the file path, first value is an array of the
	 *  packages it provides, second is an array of packages it depends on, and third is a boolean saying whether the
	 *  file has been added to the document head yet.
	 * @type object
	 * @private
	 * @since 0.0.21-alpha
	 */
	load._files = {};
	
	/** If this is true, then the batching is happening. Packages are being imported, and when they are all done, the
	 *  next batch of packages will be imported.
	 * @type boolean
	 * @private
	 * @since 0.0.21-alpha
	 */
	load._batching = false;
	
	/** The number of packages that still need to be provided in the current batch. When this becomes zero, the next
	 *  batch of packages will be imported.
	 * 
	 * The default is 1 since the package `load` will be provided later.
	 * @type int
	 * @private
	 * @default 1
	 * @since 0.0.21-alpha
	 */
	load._provideCount = 1;
	
	/** The set of all package names that need to be imported. This is all the packages that have not been imported, but
	 *  have to be imported to satisfy a package that has been imported by `{@link load.import}`.
	 * 
	 * Packages are moved out of here and into `{@link load._batchSet}` when they are about to be imported.
	 * @type array
	 * @private
	 * @since 0.0.21-alpha
	 */
	load._importSet = [];
	/** The set of package names that are in the current "import batch" and will be added to the document head soon.
	 * @type array
	 * @private
	 * @since 0.0.21-alpha
	 */
	load._batchSet = [];

	/** An event dispatcher which is fired when a package is imported and then calls `{@link load.provide}`.
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
	load.onProvide = null;
	
	/** This is any detected issue with the capabilities of the client.
	 * 
	 * This will be a description of only one issue, such as lack of canvas or strict mode support.
	 * 	If there are no issues this will be an empty string.
	 * 
	 * If there is any issue, then DuskWolf will continue to run.
	 * @type string
	 * @since 0.0.17-alpha
	 */
	load.capabilityIssue = load._capability();
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
load._capability = function() {
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
		js.src = "DuskWolf/lib/promise.js";
		document.head.appendChild(js);
	}else if(!("resolve" in Promise)) {
		console.warn("Promise.resolve does not exist, using Promise.resolved.");
		Promise.resolve = Promise.resolved;
		Promise.reject = Promise.rejected;
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

/** Marks that the namespace `name` has been provided, and associates a given object with it.
 *   This tells the engine to download the next file in the list,
 *   and it also creates the namespace object if it doesn't already exist.
 * 
 * @param {string} name The namespace to provide.
 * @param {?*} pack The object to return when this package is required by other packages.
 * @since 0.0.12-alpha
 */
load.provide = function(name, pack) {
	//Create the object, if no pack (legacy behaviour)
	if(!pack) {
		var fragments = name.split(".");
		window[fragments[0]] = window[fragments[0]] || {};
		var obj = window;
		if(fragments.length > 1){
			for(var point = 0; point < fragments.length; point ++) {
				if(obj[fragments[point]] === undefined) obj[fragments[point]] = {};
				obj = obj[fragments[point]];
			}
		}
	}
	
	//Set imported
	if(name in load._names) {
		load._names[name][1] = 2;
	}
	
	//Set object
	if(pack) {
		load._names[name][4] = pack;
	}
	
	//Fire all the functions
	for(var i = 0; i < load._names[name][5].length; i ++) {
		if(pack) {
			load._names[name][5][i](pack);
		}else{
			load._names[name][5][i](obj);
		}
	}
	
	//Fire Event
	if(load.onProvide) {
		setTimeout(load.onProvide.fire.bind(load.onProvide, {"package":name}), 1);
	}
	
	//And carry on providing
	load._provideCount --;
	if(!load._provideCount && this._batching) {
		load._doBatchSet();
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
load.addDependency = function(file, provided, required, size) {
	if(!size) size = 0;
	for(var i = provided.length-1; i >= 0; i--) {
		this._names[provided[i]] = [file, 0, required, size, undefined, []];
	}
	
	this._files[file] = [provided, required, false];
};

/** Marks the current file as requiring the specified namespace as a dependency, 
 *  used for generating dependancy information.
 * 
 * If there is no garuntee that the package is imported yet either because it starts with ">" or is a suggestion, an
 *  onReady function should be provided, an example pattern to use is
 *  `var myPackage = load.require("project.myPackage", function(p) {myPackage = p});`.
 * 
 * @param {string} name The namespace to add as a dependency.
 * @param {?function(*)} onReady If the package isn't imported yet this will be called with the package when it is.
 * @return {*} An object that is provided by that namespace.
 * @since 0.0.15-alpha
 */
load.require = function(name, onReady) {
	if(name.charAt(0) == ">") name = name.substring(1);
	
	if(onReady) {
		if(load._names[name][1] == 2) {
			onReady(load.require(name));
		}else{
			load._names[name][5].push(onReady);
		}
	}
	
	if(load._names[name][4]) {
		return load._names[name][4];
	}else{
		var o = window;
		var p = 0;
		var frags = name.split(".");
		while(p < frags.length && frags[p] in o) {
			o = o[frags[p]];
			p ++;
		}
		
		return o;
	}
};

/** Identical to `{@link load.require}` in operation, but the package won't be downloaded automatically.
 * 
 * @param {string} name The namespace to add as a dependency.
 * @param {?function(*)} onReady If the package isn't imported yet (via it beginning with ">" for example), this will 
 *  be called with the package when it is.
 * @return {*} An object that is provided by that namespace.
 * @since 0.0.21-alpha
 */
load.suggest = load.require;

/** Imports a package.
 * 
 * The package must have been previously registered
 *  using `{@link load.addDependency}` or `{@link load.importList}`.
 * 
 * The namespace will NOT be immediately available after this function call
 *  unless it has already been imported (in which case the call does nothing).
 * @param {string} name The package to import, as a string name.
 * @since 0.0.15-alpha
 */
load.import = function(name) {
	load._addToImportSet(name);
	
	if(!load._batching) {
		load._batching = true;
		load._doBatchSet();
	}
};

/** Imports all packages, usefull for debugging or something.
 * @since 0.0.15-alpha
 */
load.importAll = function() {
	console.log("Importing everything...");
	for(var f in load._names) {
		console.log(f);
		load.import(f);
	}
};

/** Download a JSON containing an array of dependancies. These will be looped through,
 *  and the entries will be given to `{@link load.addDependency}`.
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
load.importList = function(path, callback, errorCallback) {
	var xhr = new XMLHttpRequest();
	
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4 && xhr.status > 100 && xhr.status < 400) {
			var relativePath = path.split("/");
			relativePath.splice(-1, 1);
			relativePath = relativePath.join("/")+"/";
			
			var data = xhr.response;
			for(var i = data.length-1; i >= 0; i--) {
				if(data[i][0].indexOf(":") === -1 && data[i][0][0] != "/") data[i][0] = relativePath + data[i][0];
				load.addDependency(data[i][0], data[i][1], data[i][2], data[i][3]);
			}
			if(callback) callback(data);
		}else if(xhr.readyState == 4) {
			console.error("Error getting import file, "+xhr.statusText);
			if(errorCallback) errorCallback(xhr);
		}
	}
	
	xhr.open("GET", path, true);
	xhr.responseType = "json";
	xhr.send();
};

/** Given a package, if it has not been imported, it is added to `{@link load._importSet}` and this function is
 *  called on all its dependancies.
 * @param {string} pack The package to add to the import set.
 * @private
 * @since 0.0.21-alpha
 */
load._addToImportSet = function(pack) {
	if(this._importSet.indexOf(pack) !== -1) return;
	if(!(pack in this._names)) {
		console.error(pack + " required but not found.");
		return;
	}
	if(this._names[pack][1] !== 0) return;
	
	this._importSet.push(pack);
	var p = this._names[pack];
	
	for(var i = 0; i < p[2].length; i ++) {
		if(p[2][i].charAt(0) == ">") {
			load._addToImportSet(p[2][i].substring(1));
		}else if(p[2][i].charAt(0) == "@") {
			this._importSet.push(p[2][i]);
		}else{
			load._addToImportSet(p[2][i]);
		}
	}
};

/** Looks through the import set, sees if any can be imported (have no unsatisfied dependancies), generates the batch
 *  set, then calls `{@link load._doImportFile}` to import them.
 * @private
 * @since 0.0.21-alpha
 */
load._doBatchSet = function() {
	if(!this._importSet.length) {
		this._batching = false;
		return;
	}
	
	this._batchSet = [];
	
	//Generate the batch set
	for(var i = 0; i < this._importSet.length; i ++) {
		if(this._importSet[i].charAt(0) == "@") {
			this._batchSet.push(this._importSet[i]);
			this._importSet.splice(i, 1);
			i --;
			continue;
		}
		
		var now = this._names[this._importSet[i]];
		
		var okay = true;
		for(var d = 0; d < now[2].length; d ++) {
			if(now[2][d].charAt(0) == ">") {
				//Okay
			}else if(now[2][d].charAt(0) == "@") {
				//Also Okay
			}else if(this._names[now[2][d]][1] < 2) {
				okay = false;
				break;
			}
		}
		
		if(okay) {
			if(now[1] == 0) 
				this._batchSet.push(this._importSet[i]);
			this._importSet.splice(i, 1);
			i --;
		}
	}
	
	//And then import them all
	console.log("Importing: "+this._batchSet.join(", "));
	
	for(var i = 0; i < this._batchSet.length; i ++) {
		if(this._batchSet[i].charAt(0) == "@") {
			load._doImportFile(this._batchSet[i]);
		}else{
			load._doImportFile(this._names[this._batchSet[i]][0]);
		}
	}
	
	if(!this._provideCount) {
		setTimeout(load._doBatchSet, 100);
	}
};

/** Adds the file to the HTML documents head in a script tag, actually importing the file.
 * 
 * `{@link load._provideCount}` is incremented by the amount of packages the file provides.
 * @param {string} file The file to add. If it starts with "@" that character is stripped.
 * @private
 * @since 0.0.21-alpha
 */
load._doImportFile = function(file) {
	if(file.charAt(0) == "@") file = file.substring(1);
	
	if(!(file in this._files)) {
		this._files[file] = [[], [], false];
	}
	
	var f = this._files[file];
	
	if(f[2]) return;
	f[2] = true;
	
	this._provideCount += f[0].length;
	for(var i = 0; i < f[0].length; i ++) {
		load._names[f[0][i]][1] = 1;
	}
	
	var js = document.createElement("script");
	js.src = file;
	document.head.appendChild(js);
};

/** Called every 100ms to check if dusk.EventDispatcher is imported; if so, initiates `{@link load.onProvide}`.
 * @private
 */
load._checkIfHandleable = function() {
	if("dusk" in window && "EventDispatcher" in dusk) {
		load.onProvide = new dusk.EventDispatcher();
	}else{
		setTimeout(load._checkIfHandleable, 100);
	}
};
load._checkIfHandleable();

/** Stops all currently importing packages, but will not interrupt any currently running files.
 * @since 0.0.20-alpha
 */
load.abort = function() {
	load._batching = false;
	load._importSet = [];
	load._batchSet = [];
};

/** Checks if the specified package is imported.
 * @param {string} name The package name to check.
 * @return {boolean} Whether the package is imported.
 * @since 0.0.20-alpha
 */
load.isImported = function(name) {
	if(name in load._names && load._names[name][1] == 2) {
		return true;
	}
	
	return false;
};

/** Returns the total size of files that are being downloaded, if the deps file has this information.
 * @return {integer} The total download remaining, in kilobytes.
 * @private
 * @since 0.0.20-alpha
 */
load._getBytes = function() {
	var seen = [];
	var sum = 0;
	for(var i = load._importSet.length-1; i >= 0; i --) {
		if(load._names[load._importSet[i]].length > 3
		&& seen.indexOf(load._names[load._importSet[i]][0]) === -1) {
			sum += load._names[load._importSet[i]][3];
			seen[seen.length] = load._names[load._importSet[i]][0];
		}
	};
	return ~~(sum/1024);
};

/** Called on requestAnimationFrame to display the loading text untill the game has loaded. 
 * @private
 * @since 0.0.17-alpha
 */
load._displayLoad = function() {
	if("dusk" in window && !dusk.started && dusk.elemPrefix) {
		var canvas = document.getElementById(dusk.elemPrefix+"-canvas");
		
		canvas.getContext("2d").clearRect(0, 0, 
			canvas.width, canvas.height
		);
		var textY = 0;
		
		canvas.getContext("2d").fillText(
			"Hold on! Loading "+load._importSet.length+" files!", 5, textY+=15
		);
		/*canvas.getContext("2d").fillText(
			"Now loading "+load._current+"!", 5, textY+=15
		);*/
		canvas.getContext("2d").fillText(
			"That's about "+load._getBytes()+"KiB, excluding game data!", 5, textY+=15
		);
		
		if("onLine" in navigator && !navigator.onLine) {
			canvas.getContext("2d").fillText(
				"You have no internet connection; good luck with that.", 5, textY+=15
			);
		}
		if(load.capabilityIssue) {
			canvas.getContext("2d").fillText(load.capabilityIssue, 5, textY+=15);
		}
	}
	
	if(!dusk.started) {
		var raf = window.requestAnimationFrame
		|| window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame
		|| window.msRequestAnimationFrame;
		raf(load._displayLoad);
	}
};
window.raf = window.requestAnimationFrame || window.mozRequestAnimationFrame
|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
raf(load._displayLoad);
delete window.raf;

load._init();

load.addDependency("", ["load"], []);
load.provide("load", "load");

//Legacy
if(!("dusk" in window)) window.dusk = {};
if(!dusk.load) dusk.load = load;
