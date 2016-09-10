//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.save.SaveSpec", function() {
	var load = window.load.require("load");
	var utils = load.require("dusk.utils");
	var save = load.require("dusk.save");
	var SaveData = load.require("dusk.save.SaveData");
	
	/** Specifies what to save.
	 * 
	 * Generally, a save spec is a list of classes to save, what data those classes have to save and any arguments to
	 *  give to the saving function.
	 * 
	 * New things to save are added to the saving specification via `#add`.
	 * 
	 * @implements dusk.save.refSavable
	 * @implements dusk.save.refSavableInstance
	 * @memberof dusk.save
	 * @since 0.0.21-alpha
	 */
	class SaveSpec {
		/** Creates a new SaveSpec
		 * 
		 * @param {string} name A name for the specification.
		 * @param {?string} prettyName A pretty name (for displaying to the user) of this specification. If omited, this
		 *  will be the same as `name`.
		 */
		constructor(name, prettyName) {
			/** Name of the save specification.
			 * @type string
			 * @memberof! dusk.save.SaveSpec#
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
			 * @memberof! dusk.save.SaveSpec#
			 */
			this._toSave = [];
		}
		
		/** Adds a new namespace or class that will be saved when this specification saves.
		 * 
		 * The package must be a string, and the name of the package to save from and load into. The package to be saved
		 *  must implement `ISavable`.
		 * 
		 * @param {string} pack The package containing the object to save.
		 * @param {string} type The type of thing to save, passed to the save function of the object.
		 * @param {?*} args Arguments to the save function, passed to the save function of the object.
		 */
		add(pack, type, args) {
			this._toSave.push([pack, type, args]);
		}
		
		/** Saves the data represented by this save spec.
		 * 
		 * This same data can be called using `#load` to restore the state that this was calledin.
		 * 
		 * @return {dusk.save.SaveData} The data that was saved.
		 */
		save() {
			var saveData = new SaveData(this);
			var refs = [];
			var saveRef = this._saveRef.bind(refs);
			
			for(var i = this._toSave.length-1; i >= 0; i --) {
				// Get the package
				var ob = load.evaluate(this._toSave[i][0]);
				
				if(ob) {
					// Create the "slot" to save into if it doesn't exist
					if(saveData.data[this._toSave[i][0]] === undefined) {
						saveData.data[this._toSave[i][0]] = [];
					}
					
					// And then push this save data to it
					saveData.data[this._toSave[i][0]].push(
						[this._toSave[i][1], this._toSave[i][2], ob.save(this._toSave[i][1], this._toSave[i][2], saveRef)]
					);
				}else{
					console.error("Tried to save from "+this._toSave[i][0]+", but it doesn't exist!");
				}
			}
			
			saveData.meta().refs = utils.copy(refs, true);
			
			return saveData;
		}
		
		/** Loads the data represented by this save spec.
		 * 
		 * This accepts saveData and calls all the load functions of all the relevent things with the same arguments that
		 *  were used to save them.
		 * 
		 * @param {dusk.save.SaveData} saveData The data to load from.
		 * @return {Promise(boolean)} A promise that resolves to true when everything is finished loading.
		 */
		load(saveData) {
			var refs = saveData.meta().refs;
			var loaded = [];
			var loadRef = this._loadRef.bind(refs, loaded);
			var out = [];
			
			for(var p in saveData.data) {
				if(p != "meta") {
					// Get package
					var ob = load.evaluate(p);
					
					if(ob) {
						if(!Array.isArray(saveData.data[p])) throw new save.SaveIntegrityError();
						
						// Loop through all the things this package saved
						for(var i = saveData.data[p].length -1; i >= 0; i --) {
							if(!Array.isArray(saveData.data[p][i]) || saveData.data[p][i].length != 3)
								throw new save.SaveIntegrityError();
							
							// And actually load the thing
							out.push(
								ob.load(saveData.data[p][i][2], saveData.data[p][i][0], saveData.data[p][i][1], loadRef)
							);
						}
					}else{
						console.error("Tried to load into "+this._toSave[i][0]+", but it doesn't exist!");
						throw new save.SaveIntegrityError();
					}
				}
			}
			
			return Promise.all(out);
		}
		
		/** Returns a string representation of this object.
		 * @return {string} A string representation of this object.
		 */
		toString() {
			return "[SaveSpec "+name+"]";
		}
		
		/** Save reference to this save spec.
		 * @param {function(*):(array|integer)} ref Ref function.
		 * @return {object} This SaveData's save data.
		 */
		refSave(ref) {
			return [this.name, this.prettyName, this._toSave];
		}
		
		/** Get package for loading.
		 * @return {string} This package.
		 */
		refClass() {
			return "dusk.save.SaveSpec";
		}
		
		/** Load reference.
		 * @param {object} data Saved data.
		 * @param {function((array|integer)):*} unref Unref function.
		 * @return {object} This SaveData's save data.
		 */
		static refLoad(data, unref) {
			var ss = new SaveSpec(data[0], data[1]);
			
			for(var i = 0; i < data[2].length; i ++) {
				ss.add(data[2][i][0], data[2][i][1], data[2][i][2]); 
			}
			
			return ss;
		}
		
		
		/** Saves a reference to the object. If the object already exists, a previously used reference will be returned.
		 *  References can be generated for any object, they don't have to implement any particular interface.
		 * 
		 * `{@link dusk.save.loadRef}` must be used to load the reference back again.
		 * @param {*} obj The object to generate a reference for.
		 * @return {(integer|array)} An integer or `[id, class]` pair for the reference.
		 * @private
		 */
		_saveRef(obj) {
			if((typeof obj != "object" && typeof obj != "number") || obj === null) return obj;
			
			// Check if it implements IRefSavable
			var imps = false;
			if(typeof obj != "number")
				imps = "refSave" in obj && "refClass" in obj;
			
			// Check if it has already been saved
			for(var i = 0; i < this.length; i ++) {
				if(this[i] == obj) {
					if(imps) {
						return [i, obj.refClass()];
					}else{
						return i;
					}
				}
			}
			
			// And then return the ref
			if(imps) {
				this.push(obj.refSave(this._saveRef.bind(this)));
				return [this.length-1, obj.refClass()];
			}else{
				this.push(utils.copy(obj, true));
				return this.length-1;
			}
		}
		
		/** Loads a previously saved reference. References are generated by `{@link dusk.save.saveRef}`.
		 * @param {array} loaded An array used for storing the loaded refs; will be bound to an empty array by the saving
		 *  system before this function starts its use.
		 * @param {(integer|array)} ref An id or `[id, class]` pair for loading.
		 * @return {*} The object that was referred to.
		 * @private
		 */
		_loadRef(loaded, ref) {
			if((typeof ref != "number" && !Array.isArray(ref)) || ref === null) return ref;
			
			if(typeof ref == "number") {
				// Already loaded? Return
				if(loaded[ref]) return loaded[ref];
				
				if(ref >= this.length) throw new save.SaveIntegrityError();
				
				loaded[ref] = this[ref];
				return loaded[ref];
				
			}else if(Array.isArray(ref) && ref.length == 2) {
				// Already loaded? Return
				if(loaded[ref[0]]) return loaded[ref[0]];
				
				if(ref[0] >= this.length) throw new save.SaveIntegrityError();
				
				// Import package
				var o = load.getPackage(ref[1]);
				//if(!utils.doesImplement(o, save.IRefSavable)) throw new save.SaveIntegrityError();
				
				// And actually load
				loaded[ref[0]] = o.refLoad(this[ref[0]], this._loadRef.bind(this, loaded));
				return loaded[ref[0]];
			}else{
				throw new save.SaveIntegrityError();
			}
		}
	}
	
	return SaveSpec;
});
