//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.Mapper", function() {
	/** Mappers are essentially objects that can be attached to another object, and allow that object to be controlled
	 *  using JSON and basic objects.
	 * 
	 * To use this, the object that is being mapped must "register" mappings using `{@link dusk.mapper#map}`, this links
	 *  a key for the JSON representation to a key for the "real" representation.
	 * 
	 * Mapping to something with a "." in it's name works as expected, that is, "a.b" will set the property "b" of the
	 *  property "a" of the object that this mapper is attached to.
	 * 
	 * @since 0.0.18-alpha
	 * @memberof dusk.utils
	 */
	class Mapper {
		/** Creates a new mapper.
		 * 
		 * @param {*} target The object this mapper is mapping.
		 * @since 0.0.18-alpha
		 */
		constructor(target) {
			/** The target that this mapper is mapping.
			 * @type *
			 * @private
			 * @memberof! dusk.utils.Mapper#
			 */
			this._target = target;
			
			/** An object describing all the mappings.
			 *  Keys are the property name, and the value is an array like `[to, type, depends, complex]`. Complex is true
			 *  if the "to" value contains a ".".
			 * @type object
			 * @private
			 * @memberof! dusk.utils.Mapper#
			 */
			this._maps = {};
		}
		
		/** This maps a property from the JSON representation of the object "real" representation of the object.
		 * 
		 * @param {string} from The name in the JSON representation.
		 * @param {string|array} to The property name that that name shall be mapped to in the "real" representation. If it
		 *  is a string, it will map to that property, if it is an array, it will be a `[get, set]` pair of functions to
		 *  call with `this._target` as the `this` value. The getter should return a value (the value to get), and the
		 *  setter will be given the set value as an argument.
		 * @param {?array} depends An array of "dependencies" of the property.
		 * 	All the properties in this array will be set (if they exist in the JSON) before this one.
		 */
		map(from, to, depends) {
			if(Array.isArray(to)) {
				this._maps[from] = [to, depends];
			}else{
				this._maps[from] = [to, depends, to.indexOf(".") !== -1];
			}
		}
		
		/** Adds new dependancies to an existing mask.
		 * 
		 * @param {string} name The property to add dependencies of.
		 * @param {string|array} depends A string name, or array of such, of dependancies to add.
		 */
		addDepends(name, depends) {
			if(name in this._maps) {
				if(typeof depends == "string") depends = [depends];
				
				this._maps[name][1] = this._maps[name][1].concat(depends);
			}
		}
		
		/** Sets the property of the "real" representation that is mapped by the specified name.
		 * 
		 * @param {string} name The property to set.
		 * @param {*} value The new value to set.
		 * @return {?*} The value of the object, or `undefined` if no property with that name is masked.
		 */
		set(name, value) {
			if(this._maps[name] !== undefined) {
				if(Array.isArray(this._maps[name][0])) {
					this._maps[name][0][1].call(this._target, value);
				}else if(this._maps[name][2]) {
					var o = this._target;
					var frags = this._maps[name][0].split(".");
					var p = 0;
					while(p < frags.length-1) {
						o = o[frags[p]];
						p ++;
					}
					o[frags[p]] = value;
				}else{
					this._target[this._maps[name][0]] = value;
				}
				return value;
			}
			
			return undefined;
		}
		
		/** Given an object, sets all the properties of that object to their respective mappings on the target object.
		 * 
		 * @param {object} props The object to read the properties from.
		 */
		update(props) {
			var toProcess = [];
			for(var p in props) {
				toProcess[toProcess.length] = p;
			}
			
			//Dependancies system
			while(toProcess.length) {
				//loop through all props needing to be processed
				for(var i = toProcess.length-1; i >= 0; i--) {
					if(this._maps[toProcess[i]] && this._maps[toProcess[i]][1]) {
						//Loop to see if dependancies need processing
						for(var j = this._maps[toProcess[i]][1].length-1; j >= 0; j--) {
							if(toProcess.indexOf(this._maps[toProcess[i]][1][j]) !== -1) {
								//If so, then skip this one
								j = -2;
							}
						}
						
						if(j < -1) continue;
					}
					
					this.set(toProcess[i], props[toProcess[i]]);
					
					toProcess.splice(i, 1);
				}
			}
		}
		
		/** Returns the value on the target object that has been mapped to the specified key.
		 * 
		 * @param {string} name The name to look up the mapping for.
		 * @returns {*} The value on the target object that is mapped to.
		 */
		get(name) {
			if(this._maps[name] !== undefined) {
				if(Array.isArray(this._maps[name][0])) {
					return this._maps[name][0][0].call(this._target);
				}else if(this._maps[name][2]) {
					var o = this._target;
					var frags = this._maps[name][0].split(".");
					var p = 0;
					while(p < frags.length-1) {
						o = o[frags[p]];
						p ++;
					}
					return o[frags[p]];
				}else{
					return this._target[this._maps[name][0]];
				}
			}
			
			return undefined;
		}
		
		/** Loops through all the mappings this has been given, adds their value to an object, and returns that object.
		 * 
		 * @return {object} An object with all the mappings this has been given, with the values from the target object.
		 */
		massGet() {
			var hold = {};
			for(var p in this._maps) {
				hold[p] = this.get(p);
			}
			return hold;
		}
		
		/** Returns a string representation of this object.
		 * @returns {string} A string representation of this object.
		 */
		toString() {
			return "[Mapper for "+this._target.toString()+"]";
		}
	}
	
	return Mapper;
});
