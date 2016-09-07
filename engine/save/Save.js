//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save", function() {
	var load = window.load.require("load");
	var utils = load.require("dusk.utils");
	var dusk = load.require("dusk");
	
	/** Provides an interface for saving game data to various sources.
	 * 
	 * The saving system has three main parts, the interface `{@link dusk.save.ISavable}` should be implemented by
	 *  namespaces that wish to be saved and loaded. Instances of `{@link dusk.save.SaveSpec}` are used to list what
	 *  exactly should be saved. Lastly, `{@link dusk.save.sources.SaveSource}` instances describe a location to save or load
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
	 * @param {dusk.save.sources.SaveSource} source The source to save to.
	 * @param {string} identifier The identifier at which to save the file.
	 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if the save failed.
	 */
	save.save = function(spec, source, identifier) {
		var saveData = spec.save();
		return source.save(saveData, spec, identifier);
	};
	
	/** Loads data from a specified spec and source.
	 * @param {dusk.save.SaveSpec} spec The specification to use when loading.
	 * @param {dusk.save.sources.SaveSource} source The source to load from.
	 * @param {string} identifier An identifier of what you want to load.
	 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if load fails.
	 */
	save.load = function(spec, source, identifier) {
		return source.load(spec, identifier).then(function(saveData) {
			if(saveData) {
				return spec.load(saveData)
			}else{
				return Promise.reject(new Error("No save data available."));
			}
		}).then(function(v) {return true;});
	};
	
	
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
	 * @return {?promise(*)} A promise that resolves when the data is loaded, if undefined is returned, it will be
	 *  considered loaded.
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
	save.SaveIntegrityError = function() {
		Error.call(this);
		
		this.name = "SaveIntegrityError";
		this.message = "The save data is corrupt";
	};
	save.SaveIntegrityError.prototype = Object.create(Error.prototype);
	
	/** Exception representing some error loading from or saving to a source.
	 * 
	 * @extends Error
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	save.SaveSourceError = function(msg) {
		Error.call(this);
		
		this.name = "SaveSourceError";
		this.message = msg;
	};
	save.SaveSourceError.prototype = Object.create(Error.prototype);
	
	return save;
}, {"alsoSeal":["SaveIntegrityError", "SaveSourceError", "ISavable", "IRefSavable", "IRefSavableInstance"]});
