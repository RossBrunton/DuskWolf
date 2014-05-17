//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save.LocalStorageSource", (function() {
	var save = load.require("dusk.save");

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
	var LocalStorageSource = function() {
		
	};
	LocalStorageSource.prototype = Object.create(save.SaveSource.prototype);

	/** Saves the save data to local storage
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving. Combined with the spec name to give the key to save under.
	 * @return {Promise(boolean)} A promise that fullfills with true.
	 */
	LocalStorageSource.prototype.save = function(saveData, spec, identifier) {
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
	LocalStorageSource.prototype.load = function(spec, identifier) {
		return Promise.resolve(new save.SaveData(spec, localStorage[spec.name+"_"+identifier]));
	};

	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	LocalStorageSource.prototype.toString = function() {
		return "[LocalStorageSource]";
	};

	Object.seal(LocalStorageSource);
	
	return LocalStorageSource;
})());


load.provide("dusk.save.ConsoleSource", (function() {
	var save = load.require("dusk.save");
	
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
	var ConsoleSource = function() {
		
	};
	ConsoleSource.prototype = Object.create(save.SaveSource.prototype);

	/** Saves the save data to local storage
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving. Combined with the spec name to give the key to save under.
	 * @return {Promise(boolean)} A promise that fullfills with true.
	 */
	ConsoleSource.prototype.save = function(saveData, spec, identifier) {
		ConsoleSource.data = JSON.stringify(saveData.data);
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
	ConsoleSource.prototype.load = function(spec, identifier) {
		console.log("<< Load <<");
		return Promise.resolve(new save.SaveData(spec, JSON.parse(save.ConsoleSource.data)));
	};

	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	ConsoleSource.prototype.toString = function() {
		return "[ConsoleSource]";
	};

	/** Save data!
	 * 
	 * @type ?object
	 * @static
	 */
	ConsoleSource.data = null;

	Object.seal(ConsoleSource);
	
	return ConsoleSource;
})());
