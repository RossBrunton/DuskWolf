//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.advancedLoad", (function(){
	var EventDispatcher = dusk.load.require("dusk.EventDispatcher");

	//Takes dusk.load, and adds stuff to it

	/** Set by dusk.advancedLoad; it's the original function `{@link dusk.load.importList}`. This class replaces it with a
	 *  more sophisticated version.
	 * @type function(string, function(*), function(*))
	 * @private
	 */
	load._importListClassic = dusk.load.importList;

	load.importList = function(path, callback, errorCallback) {
		return new Promise(function(fullfill, reject) {
			var union = function(data) {
				callback(data);
				fullfill(data);
			}
			
			var unione = function(data) {
				errorCallback(data);
				reject(data);
			}
			
			load._importListClassic(path, callback?union:fullfill, errorCallback?unione:reject);
		});
	};

	load.onProvide = new EventDispatcher("dusk.load.onProvide");

	//No idea why it does this.
	dusk.load.addDependency("", ["load"], []);
	dusk.load.provide("load", load);

	return load;
})());
