//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save.SaveSource", (function() {
	/** Base class for objects that wish to save and load save data from a specific source.
	 * 
	 * Inheriters must replace the `save` and `load` functions with their own versions, and not call the versions on
	 *  this class.
	 * 
	 * SaveSources can "support" identifiers or not. Generally, if identifiers are supported then attempting to load
	 *  with identifier `n` will always load the last save data that was saved using identifier `n`. If they are not
	 *  supported, then identifiers may be provided to give a hint to what name the data should be saved as.
	 * 
	 * This class must be subclassed, and cannot be used on it's own.
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var SaveSource = function() {
		
	};
	
	/** Given a save data, saves it to this source.
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving.
	 * @return {Promise(boolean)} A promise that fullfills with the value true when saving is complete.
	 */
	SaveSource.prototype.save = function(saveData, spec, identifier) {
		console.warn("Save Source "+this+" doesn't support saving.");
		return Promise.reject(Error("Save Source "+this+" doesn't support saving."));
	};
	
	/** Similar to `{@link dusk.save.SaveSource#save}`, only this is called in cases where saving should be done without
	 *  interrupting the user. By default, this calls the normal save function.
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving.
	 * @return {Promise(boolean)} A promise that fullfills with the value true when saving is complete.
	 */
	SaveSource.prototype.autoSave = function(saveData, spec, identifier) {
		return this.save(saveData, spec, identifier);
	};
	
	/** Loads save data from this source.
	 * 
	 * @param {dusk.save.SaveSpec} spec The spec to be used to load this data.
	 * @param {?string} identifier An identifier for loading from.
	 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data when it has been loaded.
	 */
	SaveSource.prototype.load = function(spec, identifier) {
		console.warn("Save Source "+this+" doesn't support loading.");
		return Promise.reject(Error("Save Source "+this+" doesn't support loading."));
	};
	
	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	SaveSource.prototype.toString = function() {
		return "[SaveSource]";
	};
	
	/** True if this source supports identifiers, as in, loading and saving with the same identifiers load and save the
	 *  same data. This is on the prototye of the source.
	 * 
	 * @type boolean
	 * @default true
	 * @static
	 */
	SaveSource.prototype.identifierSupport = true;
	
	return SaveSource;
})());


load.provide("dusk.save.LocalStorageSource", (function() {
	var SaveSource = load.require("dusk.save.SaveSource");
	var SaveData = load.require("dusk.save.SaveData");

	/** A basic save source that saves and loads from local storage.
	 * 
	 * @extends dusk.save.SaveSource
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var LocalStorageSource = function() {
		
	};
	LocalStorageSource.prototype = Object.create(SaveSource.prototype);

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
		return Promise.resolve(new SaveData(spec, localStorage[spec.name+"_"+identifier]));
	};

	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	LocalStorageSource.prototype.toString = function() {
		return "[LocalStorageSource]";
	};
	
	return LocalStorageSource;
})());


load.provide("dusk.save.ConsoleSource", (function() {
	var SaveSource = load.require("dusk.save.SaveSource");
	var SaveData = load.require("dusk.save.SaveData");
	
	/** A save source that logs it's save data to the console, and puts it on the `data` property of it's constructor.
	 * 
	 * This should only be used for testing, obviously.
	 * 
	 * @extends dusk.save.SaveSource
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var ConsoleSource = function() {
		
	};
	ConsoleSource.prototype = Object.create(SaveSource.prototype);
	
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
	 * @param {?string} identifier An identifier for loading from. Combined with the spec name to give the key to load
	 *  from.
	 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data.
	 */
	ConsoleSource.prototype.load = function(spec, identifier) {
		console.log("<< Load <<");
		return Promise.resolve(new SaveData(spec, JSON.parse(ConsoleSource.data)));
	};
	
	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	ConsoleSource.prototype.toString = function() {
		return "[ConsoleSource]";
	};
	
	/** Save data!
	 * 
	 * @type string
	 * @static
	 */
	ConsoleSource.data = "";
	
	return ConsoleSource;
})());
