//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save.SaveData", (function() {
	var save = load.require("dusk.save");
	var dusk = load.require("dusk");
	
	/** Represents save data. Either data loaded or data that has been saved.
	 * 
	 * It contains a `{@link dusk.save.SaveData#data}` property, which is the object that should be saved and loaded.
	 *  The keys of this object are the class or namespace name of the thing that saved them, and the value contains
	 *  both the actual data and parameters. The `data` object is the object that should actually be saved and loaded.
	 * 
	 * A `meta` property is available on the data, and also via the `{@link dusk.save.SaveData#meta}` method. This is an
	 *  object containing the following values:
	 * 
	 * - `saved`: The date on which the data was saved or loaded.
	 * - `name`: The name of the specification that saved this data.
	 * - `ver`: The version of DuskWolf that saved the data.
	 * 
	 * The constructor accepts initial data, which should almost always be data that was loaded from the source.
	 *  This can be either a string or an object. If it is an object, the `data` property is set to it. If it is a
	 *  string, it is parsed as if it was created by `{@link dusk.save.SaveData#toDataUrl}`, and then set to `data`.
	 * 
	 * @param {dusk.save.SaveSpec} spec The specification thihs data is using.
	 * @param {?object|string} initial Any initial data that this save data should use.
	 * @implements dusk.save.refSavable
	 * @implements dusk.save.refSavableInstance
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var SaveData = function(spec, initial) {
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
	SaveData.prototype.meta = function() {
		return this.data.meta;
	};
	
	/** Converts the save data to a data URL.
	 * @return {string} The save data.
	 */
	SaveData.prototype.toDataUrl = function() {
		return "data:application/json;base64,"+btoa(JSON.stringify(this.data));
	};
	
	/** Returns a string representation of this object.
	 * @return {string} A string representation of this object.
	 */
	SaveData.prototype.toString = function() {
		return "[SaveData "+this.spec.name+"]";
	};
	
	/** Save reference.
	 * @param {function(*):array|integer} ref Ref function.
	 * @return {object} This SaveData's save data.
	 */
	SaveData.prototype.refSave = function(ref) {
		return [ref(this.spec), this.data];
	}
	
	/** Get package for loading.
	 * @return {string} This package.
	 */
	SaveData.prototype.refClass = function() {
		return "dusk.save.SaveData";
	}
	
	/** Load reference.
	 * @param {object} data Saved data.
	 * @param {function(array|integer):*} unref Unref function.
	 * @return {object} This SaveData's save data.
	 */
	SaveData.refLoad = function(data, unref) {
		return new SaveData(data[0], data[1]);
	}
	
	return SaveData;
})());
