//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.require("dusk.utils");

load.provide("dusk.save", (function() {
	var load = window.load.require("load");
	var utils = load.require("dusk.utils");
	var dusk = load.require("dusk");
	
	/** Provides an interface for saving game data to various sources.
	 * 
	 * The saving system has three main parts, the interface `{@link dusk.save.ISavable}` should be implemented by
	 *  namespaces that wish to be saved and loaded. Instances of `{@link dusk.save.SaveSpec}` are used to list what
	 *  exactly should be saved. Lastly, `{@link dusk.save.SaveSource}` instances describe a location to save or load
	 *  from, such as local storage or cloud based systems.
	 * 
	 * For objects that do not have a static location, it gets more complicated. Generally, they are saved in a long
	 *  list of "references", which contain an object representation of the object, and the class used to construct it.
	 *  If you want to save an object which isn't simple (i.e. has a prototype), then, providing it implements
	 *  dusk.save.IRefSavable you can call `dusk.save.saveRef` and `dusk.save.loadRef` with it.
	 * 
	 * Likewise, if you wish to create a class which can be saved, it should implement both `dusk.save.IRefSavable`
	 * and `dusk.save.IRefSavableInstance`.
	 * 
	 * @since 0.0.21-alpha
	 */
	var save = {};
	
	/** Saves data from the specified spec into the specified source.
	 * @param {dusk.save.SaveSpec} spec The specification of what to save.
	 * @param {dusk.save.SaveSource} source The source to save to.
	 * @param {string} identifier The identifier at which to save the file.
	 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if the save failed.
	 */
	save.save = function(spec, source, identifier) {
		var saveData = spec.save();
		return source.save(saveData, spec, identifier);
	};
	
	/** Loads data from a specified spec and source.
	 * @param {dusk.save.SaveSpec} spec The specification to use when loading.
	 * @param {dusk.save.SaveSource} source The source to load from.
	 * @param {string} identifier An identifier of what you want to load.
	 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if load fails.
	 */
	save.load = function(spec, source, identifier) {
		return new Promise(function(fullfill, reject) {
			return source.load(spec, identifier).then(function(saveData) {
				if(saveData) {
					spec.load(saveData);
					fullfill(true);
				}
			});
		});
	};
	
	
	/** Creates a new save source, which is unable to save and load.
	 * 
	 * @class dusk.save.SaveSource
	 * 
	 * @classdesc Base class for objects that wish to save and load save data from a specific source.
	 * 
	 * Inheriters must replace the `save` and `load` functions with their own versions, and not call the versions on
	 *  this class.
	 * 
	 * SaveSources can "support" identifiers or not. Generally, if identifiers are supported then attempting to load
	 *  with identifier `n` will always load the last save data that was saved using identifier `n`. If they are not
	 *  supported, then identifiers may be provided to give a hint to what the data should be saved as.
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveSource = function() {
		
	};
	
	/** Given a save data, saves it to this source.
	 * 
	 * @param {dusk.save.SaveData} saveData The save data to save.
	 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
	 * @param {?string} identifier An identifier for saving.
	 * @return {Promise(boolean)} A promise that fullfills with the value true when saving is complete.
	 */
	save.SaveSource.prototype.save = function(saveData, spec, identifier) {
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
	save.SaveSource.prototype.autoSave = function(saveData, spec, identifier) {
		return this.save(saveData, spec, identifier);
	};
	
	/** Loads save data from this source.
	 * 
	 * @param {dusk.save.SaveSpec} spec The spec to be used to load this data.
	 * @param {?string} identifier An identifier for loading from.
	 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data when it has been loaded.
	 */
	save.SaveSource.prototype.load = function(spec, identifier) {
		console.warn("Save Source "+this+" doesn't support loading.");
		return Promise.reject(Error("Save Source "+this+" doesn't support loading."));
	};
	
	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	save.SaveSource.prototype.toString = function() {
		return "[SaveSource]";
	};
	
	/** True if this source supports identifiers, as in, loading and saving with the same identifiers load and save the
	 *  same data. This is on the prototye of the source.
	 * 
	 * @type boolean
	 * @default true
	 * @static
	 */
	save.SaveSource.prototype.identifierSupport = true;
	
	
	/** Represents save data. Either data loaded or data that has been saved.
	 * 
	 * It contains a `{@link dusk.save.SaveData#data}` property, which is the object that should be saved and loaded. The 
	 *  keys of this object are the class or namespace name of the thing that saved them, and the value contains both the
	 *  actual data and parameters. The `data` object is the object that should actually be saved and loaded.
	 * 
	 * A `meta` property is available on the data, and also via the `{@link dusk.save.SaveData#meta}` method. This is an
	 *  object containing the following values:
	 * 
	 * - `saved`: The date on which the data was saved or loaded.
	 * - `name`: The name of the specification that saved this data.
	 * - `ver`: The version of DuskWolf that saved the data.
	 * 
	 * The constructor accepts initial data, which should almost always be data that was loaded from the source.
	 *  This can be either a string or an object. If it is an object, the `data` property is set to it. If it is a string,
	 *  it is parsed as if it was created by `{@link dusk.save.SaveData#toDataUrl}`, and then set to `data`.
	 * 
	 * @param {dusk.save.SaveSpec} spec The specification thihs data is using.
	 * @param {?object|string} initial Any initial data that this save data should use.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveData = function(spec, initial) {
		/** The spec that this data is using.
		 * @type {dusk.save.SaveSpec}
		 */
		this.spec = spec;
		
		if(typeof initial == "string") {
			if(initial.indexOf(",") !== -1) initial = initial.split(",")[1];
			try{
				initial = JSON.parse(atob(initial));
			}catch(e){
				throw new save.SaveIntegrityError();
			}
		}
		
		/** The actual save data, as a basic, simple, object.
		 * @type {object}
		 */
		this.data = initial?initial:{};
		
		if(!initial) {
			this.data.meta = {};
			this.data.meta.saved = new Date();
			this.data.meta.spec = spec.name;
			this.data.meta.ver = dusk.ver;
			this.data.meta.refs = save._refs;
		}else if(!("meta" in this.data)) {
			throw new save.SaveIntegrityError();
		}
	};
	
	/** Returns the meta object of this save data.
	 * @return {object} The meta property of the save data.
	 */
	save.SaveData.prototype.meta = function() {
		return this.data.meta;
	};
	
	/** Converts the save data to a data URL.
	 * @return {string} The save data.
	 */
	save.SaveData.prototype.toDataUrl = function() {
		return "data:application/json;base64,"+btoa(JSON.stringify(this.data));
	};
	
	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	save.SaveData.prototype.toString = function() {
		return "[SaveData "+this.spec.name+"]";
	};
	
	/** Save reference.
	 * @return {object} This SaveData's save data.
	 */
	save.SaveData.prototype.refSave = function() {
		// Not implemented yet
	}
	
	
	/** @class dusk.save.ISavable
	 * 
	 * @classdesc Objects implementing this interface will be able to load and save data.
	 *
	 * An interface; it is expected all subclasses of this supply the methods on this class.
	 * 
	 * Generally, objects have a certain number of features that can be saved; the "type" of thing. Loading the same
	 *  data that was saved previously should restore what was saved to the state it was when it was saved.
	 * 
	 * Basically, `ISavable#load'('ISavable#save'("x"), "x") should not change anything.
	 * 
	 * List of methods required:
	 * 
	 * - `save`
	 * - `load`
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.ISavable = {};

	/** Should save data of the specified type, and return what was saved.
	 * 
	 * @param {string} type The type of thing to save, will be supplied to the load function.
	 * @param {?*} args Any extra data required to save. This is set when this is added to the scheme, and is also sent
	 *  to the load function.
	 * @param {function(*):integer|array} ref A function that takes in a basic object or an IRefSavable returns a
	 *  reference to that variable which will be stored in the save data.
	 * @return {object} The data that was saved. When it's time to load, this object will be the one loaded. Must be a
	 *  simple object (no prototypes).
	 */
	save.ISavable.save = function(type, args, ref) {};
	/** Should load previously saved data of the specified type.
	 * 
	 * @param {object} data The data that was previously saved.
	 * @param {string} type The type of thing to load.
	 * @param {function(integer|array):*} unref A function that takes in a reference saved with the ref function on
	 *  saving, and returns the object that was saved.
	 * @param {?*} args The arguments to load, this will be the same as the `args` parameter used in the saving
	 *  function.
	 */
	save.ISavable.load = function(data, type, args, unref) {};
	
	if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.ISavable");
	
	
	/** Implementers of this interface must be able to load a previously saved instance of this class, restoring its
	 *  state.
	 * 
	 * The difference between this and `ISavable` is that with this interface, instances of classes are saved, rather
	 *  than whole namespaces.
	 * 
	 * Properties of this namespace must be on the constructor of the function, and instances must implement
	 *  `IRefSavableInstance`.
	 * 
	 * List of methods required:
	 * 
	 * - `refLoad`
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.IRefSavable = {};
	
	/** Should load previously saved data of the specified type.
	 * 
	 * The data comes from `IRefSavableInstance#refSave`, and loading should create an equivalent object.
	 * 
	 * @param {function(integer|array):*} unref A function that takes in a reference saved with the ref function on
	 *  saving, and returns the object that was saved.
	 * @param {*} data The data that was previously saved.
	 */
	save.IRefSavable.refLoad = function(data, unref) {};
	
	if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.IRefSavable");
	
	
	/** Implementers of this interface must be able to save themselves to be loaded later.
	 * 
	 * The difference between this and `ISavable` is that with this class, instances are saved, rather than whole
	 *  namespaces.
	 * 
	 * Properties of this namespace must be on instances of the object to be saved, and the package must implement
	 *  `IRefSavable`.
	 * 
	 * List of methods required:
	 * 
	 * - `refSave`
	 * - `refClass`
	 * 
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.IRefSavableInstance = {};
	
	/** Should save this object such that it can be loaded via `{@link dusk.save.IRefSavable#refLoad}` of its
	 *  constructor.
	 * 
	 * @param {function(*):integer|array} ref A function that takes in a basic object or an IRefSavable returns a
	 *  reference to that variable which will be stored in the save data.
	 * @return {*} A representation of this object. Must be a simple object (no prototypes).
	 */
	save.IRefSavableInstance.refSave = function(ref) {};
	
	/** Should return the path (from window) of this object's constructor. This object must implement
	 *  `{@link dusk.save.IRefSavable}`. This will be used to load this object.
	 * 
	 * @return {string} Path to this object's constructor.
	 */
	save.IRefSavableInstance.refClass = function() {};
	
	if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.IRefSavableInstance");
	
	
	/** Exception representing that save data is invalid or corrupt.
	 * 
	 * @extends Error
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveIntegrityError = function(parent, comName) {
		Error.call(this);
		
		this.name = "SaveIntegrityError";
		this.message = "The save data is corrupt";
	};
	save.SaveIntegrityError.prototype = Object.create(Error.prototype);
	
	return save;
})(), {"alsoSeal":["SaveIntegrityError", "SaveSource", "SaveData", "ISavable", "IRefSavable"]});
