//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.save");

dusk.load.provide("dusk.save.LocalStorageSource");
dusk.load.provide("dusk.save.ConsoleSource");

/** Creates a new local storage source
 * 
 * @class dusk.save.LocalStorageSource
 * 
 * @classdesc A basic save source that saves and loads from local storage.
 * 
 * @extends dusk.save.SaveSource
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.LocalStorageSource = function() {
	
};
dusk.save.LocalStorageSource.prototype = Object.create(dusk.save.SaveSource.prototype);

/** Saves the save data to local storage
 * 
 * @param {dusk.save.SaveData} saveData The save data to save.
 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
 * @param {?string} identifier An identifier for saving. Combined with the spec name to give the key to save under.
 * @return {Promise(boolean)} A promise that fullfills with true.
 */
dusk.save.LocalStorageSource.prototype.save = function(saveData, spec, identifier) {
	saveData.meta().identifier = identifier;
	localStorage[saveData.meta().spec+"_"+identifier] = saveData.toDataUrl();
	return Promise.resolve(true);
};

/** Loads save data from local storage
 * 
 * @param {dusk.save.SaveSpec} spec The spec to be used to load this data.
 * @param {?string} identifier An identifier for loading from. Combined with the spec name to give the key to load from.
 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data.
 */
dusk.save.LocalStorageSource.prototype.load = function(spec, identifier) {
	return Promise.resolve(new dusk.save.SaveData(spec, localStorage[spec.name+"_"+identifier]));
};

/** Returns a string representation of this object.
 * @return {string} A string representation of this object.
 */
dusk.save.LocalStorageSource.prototype.toString = function() {
	return "[LocalStorageSource]";
};

Object.seal(dusk.save.LocalStorageSource);

// ----

/** Creates a new console source
 * 
 * @class dusk.save.ConsoleSource
 * 
 * @classdesc A save source that logs it's save data to the console, and puts it on
 *  `{@link dusk.save.ConsoleSource#data}`.
 * 
 * This should not be used in production, obviously.
 * 
 * @extends dusk.save.SaveSource
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.ConsoleSource = function() {
	
};
dusk.save.ConsoleSource.prototype = Object.create(dusk.save.SaveSource.prototype);

/** Saves the save data to local storage
 * 
 * @param {dusk.save.SaveData} saveData The save data to save.
 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
 * @param {?string} identifier An identifier for saving. Combined with the spec name to give the key to save under.
 * @return {Promise(boolean)} A promise that fullfills with true.
 */
dusk.save.ConsoleSource.prototype.save = function(saveData, spec, identifier) {
	dusk.save.ConsoleSource.data = saveData;
	console.log(">> Save >>");
	console.log(saveData);
	return Promise.resolve(true);
};

/** Loads save data from local storage
 * 
 * @param {dusk.save.SaveSpec} spec The spec to be used to load this data.
 * @param {?string} identifier An identifier for loading from. Combined with the spec name to give the key to load from.
 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data.
 */
dusk.save.ConsoleSource.prototype.load = function(spec, identifier) {
	console.log("<< Load <<");
	console.log(dusk.save.ConsoleSource.data);
	return Promise.resolve(new dusk.save.SaveData(spec, dusk.save.ConsoleSource.data));
};

/** Returns a string representation of this object.
 * @return {string} A string representation of this object.
 */
dusk.save.ConsoleSource.prototype.toString = function() {
	return "[ConsoleSource]";
};

/** Save data!
 * 
 * @type ?object
 * @static
 */
dusk.save.ConsoleSource.data = null;

Object.seal(dusk.save.ConsoleSource);
