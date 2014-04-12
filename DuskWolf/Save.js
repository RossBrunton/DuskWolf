//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");

dusk.load.provide("dusk.save");

/** @namespace dusk.save
 * @name dusk.save
 * 
 * @description Provides an interface for saving game data to various sources.
 * 
 * The saving system has three main parts, the interface `{@link dusk.save.ISavable}` should be implemented by
 *  namespaces and classes that wish to be saved and loaded. Instances of `{@link dusk.save.SaveSpec}` are used to
 *  list what exactly should be saved. Lastly, `{@link dusk.save.SaveSource}` instances describe a location to save or
 *  load from, such as local storage or cloud based systems.
 * 
 * @since 0.0.21-alpha
 */

/** Initiates the save system.
 * @private
 */
dusk.save._init = function() {
	dusk.save._refOrigins = [];
	dusk.save._refs = [];
	dusk.save._refsLoaded = [];
	
	dusk.save._refSources = {};
};

/** Saves data from the specified spec into the specified source.
 * @param {dusk.save.SaveSpec} spec The specification of what to save.
 * @param {dusk.save.SaveSource} source The source to save to.
 * @param {string} identifier The identifier at which to save the file.
 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if the save failed.
 */
dusk.save.save = function(spec, source, identifier) {
	var saveData = spec.save();
	return source.save(saveData, spec, identifier);
};

/** Loads data from a specified spec and source.
 * @param {dusk.save.SaveSpec} spec The specification to use when loading.
 * @param {dusk.save.SaveSource} source The source to load from.
 * @param {string} identifier An identifier of what you want to load.
 * @return {Promise(boolean)} A promise that fullfills the constant true, or rejects if load fails.
 */
dusk.save.load = function(spec, source, identifier) {
	return new Promise(function(fullfill, reject) {
		return source.load(spec, identifier).then(function(saveData) {
			if(saveData) {
				spec.load(saveData);
				fullfill(true);
			}
		});
	});
};

dusk.save.saveRef = function(obj) {
	if(typeof obj != "object" || obj === null) return obj;
	
	var imps = dusk.utils.doesImplement(obj, dusk.save.IRefSavable);
	
	for(var i = 0; i < this._refOrigins.length; i ++) {
		if(this._refOrigins[i] == obj) {
			if(imps) {
				return {"id":i, "type":imps.refClass()};
			}else{
				return {"id":i};
			}
		}
	}
	
	if(imps) {
		this._refs.push(obj.refSave());
		return {"id":this._refs.length-1, "type":imps.refClass()};
	}else{
		this._refs.push(obj);
		return {"id":this._refs.length-1};
	}
};

dusk.save.loadRef = function(ref) {
	if(typeof ref != "object" || ref === null) return ref;
	
	if(this._refsLoaded[ref.id]) return this._refsLoaded[ref.id];
	
	if("type" in ref) {
		this._refsLoaded[ref.id] = this._refSources[ref.type].refLoad(this._refs[ref.id]);
	}else{
		this._refsLoaded[ref.id] = this._refs[ref.id];
	}
	
	return this._refsLoaded[ref.id];
};

dusk.save.addRefSource = function(obj) {
	this._refSources[obj.refClass()] = obj;
};


/** Creates a new save spec.
 * 
 * @class dusk.save.SaveSpec
 * 
 * @classdesc Specifies what to save.
 * 
 * Generally, a save spec is a list of classes to save, what data those classes have to save and any arguments to give
 *  to the saving function.
 * 
 * New things to save are added to the saving specification via `{@link dusk.save.SaveSpec#add}`.
 * 
 * @param {string} name A name for the specification.
 * @param {?string} prettyName A pretty name (for displaying to the user) of this specification. If omited, this will be
 *  the same as `name`.
 * 
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.SaveSpec = function(name, prettyName) {
	/** Name of the save specification.
	 * @type string
	 */
	this.name = name;
	/** Pretty name of the save specification.
	 * @type string
	 */
	this.prettyName = prettyName?prettyName:name;
	
	/** Array of all the things that will be saved by this spec.
	 * 
	 * Each entry is an array in the form `[path, type, args]`.
	 * @type array
	 * @private
	 */
	this._toSave = [];
};

/** Adds a new namespace or class that will be saved when this specification saves.
 * 
 * The path must be a string, and is the path from the `window` object to the thing that is to be saved. The thing to
 *  be saved must implement `{@link dusk.save.ISavable}`.
 * 
 * @param {string} path The path to the object to save.
 * @param {string} type The type of thing to save, passed to the save function of the object.
 * @param {?*} args Arguments to the save function, passed to the save function of the object.
 */
dusk.save.SaveSpec.prototype.add = function(path, type, args) {
	this._toSave.push([path, type, args]);
};

/** Saves the data represented by this save spec.
 * 
 * This same data can be called using `{@link dusk.save.SaveSpec#load}` to restore the state that this was called in.
 * 
 * @return {dusk.save.SaveData} The data that was saved.
 */
dusk.save.SaveSpec.prototype.save = function() {
	var saveData = new dusk.save.SaveData(this);
	dusk.save._refs = [];
	dusk.save._refOrigins = [];
	
	for(var i = this._toSave.length-1; i >= 0; i --) {
		var ob = dusk.utils.lookup(window, this._toSave[i][0]);
		if(ob) {
			if(saveData.data[this._toSave[i][0]] === undefined) {
				saveData.data[this._toSave[i][0]] = [];
			}
			
			saveData.data[this._toSave[i][0]].push(
				[this._toSave[i][1], this._toSave[i][2], ob.save(this._toSave[i][1], this._toSave[i][2])]
			);
		}else{
			console.error("Tried to save from "+this._toSave[i][0]+", but it doesn't exist!");
		}
	}
	
	return saveData;
};

/** Loads the data represented by this save spec.
 * 
 * This accepts saveData and calls all the load functions of all the relevent things with the same arguments that were
 *  used to save them.
 * 
 * @param {dusk.save.SaveData} saveData The data to load from.
 */
dusk.save.SaveSpec.prototype.load = function(saveData) {
	this._refs = saveData.meta().refs;
	this._refsLoaded = [];
	
	for(var p in saveData.data) {
		if(p != "meta") {
			var ob = dusk.utils.lookup(window, p);
			if(ob) {
				for(var i = saveData.data[p].length -1; i >= 0; i --) {
					ob.load(saveData.data[p][i][2], saveData.data[p][i][0], saveData.data[p][i][2]);
				}
			}else{
				console.error("Tried to load into "+this._toSave[i][0]+", but it doesn't exist!");
			}
		}
	}
};

/** Returns a string representation of this object.
 * @return {string} A string representation of this object.
 */
dusk.save.SaveSpec.prototype.toString = function() {
	return "[SaveSpec "+name+"]";
};

Object.seal(dusk.save.SaveSpec);


/** Creates a new save source, which is unable to save and load.
 * 
 * @class dusk.save.SaveSource
 * 
 * @classdesc Base class for objects that wish to save and load save data from a specific source.
 * 
 * Inheriters must replace the `save` and `load` functions with their own versions, and not call the versions on this
 *  class.
 * 
 * SaveSources can "support" identifiers or not. Generally, if identifiers are supported then attempting to load with
 *  identifier `n` will always load the last save data that was saved using identifier `n`. If they are not supported,
 *  then identifiers may be provided to give a hint to what the data should be saved as.
 * 
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.SaveSource = function() {
	
};

/** Given a save data, saves it to this source.
 * 
 * @param {dusk.save.SaveData} saveData The save data to save.
 * @param {dusk.save.SaveSpec} spec The spec that was used to save this data.
 * @param {?string} identifier An identifier for saving.
 * @return {Promise(boolean)} A promise that fullfills with the value true when saving is complete.
 */
dusk.save.SaveSource.prototype.save = function(saveData, spec, identifier) {
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
dusk.save.SaveSource.prototype.autoSave = function(saveData, spec, identifier) {
	return this.save(saveData, spec, identifier);
};

/** Loads save data from this source.
 * 
 * @param {dusk.save.SaveSpec} spec The spec to be used to load this data.
 * @param {?string} identifier An identifier for loading from.
 * @return {Promise(dusk.save.SaveData)} A promise that fullfills with the save data when it has been loaded.
 */
dusk.save.SaveSource.prototype.load = function(spec, identifier) {
	console.warn("Save Source "+this+" doesn't support loading.");
	return Promise.reject(Error("Save Source "+this+" doesn't support loading."));
};

/** Returns a string representation of this object.
 * @return {string} A string representation of this object.
 */
dusk.save.SaveSource.prototype.toString = function() {
	return "[SaveSource]";
};

/** True if this source supports identifiers, as in, loading and saving with the same identifiers load and save the same
 *  data. This is on the prototye of the source.
 * 
 * @type boolean
 * @default true
 * @static
 */
dusk.save.SaveSource.prototype.identifierSupport = true;

Object.seal(dusk.save.SaveSource);


/** Creates a new save data object.
 * 
 * @class dusk.save.SaveSource
 * 
 * @classdesc Represents save data. Either data loaded or data that has been saved.
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
 * @param {?object | string} initial Any initial data that this save data should use.
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.SaveData = function(spec, initial) {
	/** The spec that this data is using.
	 * @type {dusk.save.SaveSpec}
	 */
	this.spec = spec;
	
	if(typeof initial == "string") {
		if(initial.indexOf(",") != -1) {
			initial = JSON.parse(atob(initial.split(",", 2)[1]));
		}else{
			initial = JSON.parse(atob(initial));
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
		this.data.meta.refs = dusk.save._refs;
	}
};

/** Returns the meta object of this save data.
 * @return {object} The meta property of the save data.
 */
dusk.save.SaveData.prototype.meta = function() {
	return this.data.meta;
};

/** Converts the save data to a data URL.
 * @return {string} The save data.
 */
dusk.save.SaveData.prototype.toDataUrl = function() {
	return "data:application/json;base64,"+btoa(JSON.stringify(this.data));
};

/** Returns a string representation of this object.
 * @return {string} A string representation of this object.
 */
dusk.save.SaveData.prototype.toString = function() {
	return "[SaveData "+this.spec.name+"]";
};

Object.seal(dusk.save.SaveData);


/** @class dusk.save.ISavable
 * 
 * @classdesc Objects implementing this interface will be able to load and save data.
 *
 * An interface; it is expected all subclasses of this supply the methods on this class.
 * 
 * Generally, objects have a certain number of features that can be saved; the "type" of thing. Loading the same data 
 *  that was saved previously should restore what was saved to the state it was when it was saved.
 * 
 * Basically, `{@link dusk.save.ISavable#load}({@link dusk.save.ISavable#save}("x"), "x")` should not change anything.
 * 
 * List of methods required:
 * 
 * - {@link dusk.save.ISavable#save}
 * - {@link dusk.save.ISavable#load}
 * 
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.ISavable = {};

/** Should save data of the specified type, and return what was saved.
 * 
 * @param {string} type The type of thing to save, will be supplied to the load function.
 * @param {?*} args Any extra data required to save. This is set when this is added to the scheme, and is also sent to
 *  the load function.
 * @return {object} The data that was saved. When it's time to load, this object will be the one loaded.
 */
dusk.save.ISavable.save = function(type, args) {};
/** Should load previously saved data of the specified type.
 * 
 * @param {object} data The data that was previously saved.
 * @param {string} type The type of thing to load.
 * @param {?*} args The arguments to load, this will be the same as the `args` parameter used in the saving function.
 */
dusk.save.ISavable.load = function(data, type, args) {};

if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.ISavable");

Object.seal(dusk.save.ISavable);


/* @class dusk.save.IRefSavable
 * 
 * @classdesc 
 * 
 * List of methods required:
 * 
 * - {@link dusk.save.IRefSavable#refSave}
 * - {@link dusk.save.IRefSavable#refLoad} (static)
 * - {@link dusk.save.IRefSavable#refClass} (static)
 * 
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.save.IRefSavable = {};

/* Should save data of the specified type, and return what was saved.
 * 
 * @param {string} type The type of thing to save, will be supplied to the load function.
 * @param {?*} args Any extra data required to save. This is set when this is added to the scheme, and is also sent to
 *  the load function.
 * @return {object} The data that was saved. When it's time to load, this object will be the one loaded.
 */
dusk.save.IRefSavable.refSave = function(type, args) {};
/* Should load previously saved data of the specified type.
 * 
 * @param {object} data The data that was previously saved.
 * @param {string} type The type of thing to load.
 * @param {?*} args The arguments to load, this will be the same as the `args` parameter used in the saving function.
 */
dusk.save.IRefSavable.refLoad = function(data, type, args) {};
/* Should load previously saved data of the specified type.
 * 
 * @param {object} data The data that was previously saved.
 * @param {string} type The type of thing to load.
 * @param {?*} args The arguments to load, this will be the same as the `args` parameter used in the saving function.
 */
dusk.save.IRefSavable.refClass = function() {};

if("tcheckIgnore" in window) window.tcheckIgnore("dusk.save.IRefSavable");

Object.seal(dusk.save.IRefSavable);

dusk.save._init();
