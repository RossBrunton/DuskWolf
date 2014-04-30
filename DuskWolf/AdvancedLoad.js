//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");

dusk.load.provide("dusk.advancedLoad");

//Takes dusk.load, and adds stuff to it

/** Set by dusk.advancedLoad; it's the original function `{@link dusk.load.importList}`. This class replaces it with a
 *  more sophisticated version.
 * @type function(string, function(*), function(*))
 * @private
 */
dusk.load._importListClassic = dusk.load.importList;

dusk.load.importList = function(path, callback, errorCallback) {
	return new Promise(function(fullfill, reject) {
		var union = function(data) {
			callback(data);
			fullfill(data);
		}
		
		var unione = function(data) {
			errorCallback(data);
			reject(data);
		}
		
		dusk.load._importListClassic(path, callback?union:fullfill, errorCallback?unione:reject);
	});
};

dusk.load.onProvide = new dusk.EventDispatcher("dusk.load.onProvide");

dusk.load.addDependency("", ["dusk.load"], []);
dusk.load.provide("dusk.load");
