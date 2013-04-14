//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.Mapper");

/** Creates a new mapper for the specified object.
 * 
 * @class dusk.Mapper
 * 
 * @classdesc Mappers are essentially objects that can be attached to another object, and allow that object to be controlled using JSON and basic objects.
 * 
 * To use this, the object that is being mapped must "register" mappings using `{@link dusk.mapper#map}`, this links a key for the JSON representation to a key for the "real" representation.
 * 
 * @param {*} target The object this mapper is mapping.
 * @constructor
 * @since 0.0.18-alpha
 */
dusk.Mapper = function(target) {
	/** The target that this mapper is mapping.
	 * @type *
	 * @private
	 */
	this._target = target;
	
	/** An object describing all the mappings.
	 *  Keys are the property name, and the value is an array like `[to, type, depends]`.
	 * @type object
	 * @private
	 */
	this._maps = {};
};

/** This maps a property from the JSON representation of the object "real" representation of the object.
 * 
 * @param {string} from The name in the JSON representation.
 * @param {string} to The property name that that name shall be mapped to in the "real" representation.
 * @param {?array} depends An array of "dependencies" of the property.
 * 	All the properties in this array will be set (if they exist in the JSON) before this one.
 */
dusk.Mapper.prototype.map = function(from, to, depends) {
	this._maps[from] = [to, depends];
};

/** Adds new dependancies to an existing mask.
 * 
 * @param {string} name The property to add dependencies of.
 * @param {string|array} depends A string name, or array of such, of dependancies to add.
 */
dusk.Mapper.prototype.addDepends = function(name, depends) {
	if(name in this._maps) {
		if(typeof depends == "string") depends = [depends];
		
		this._maps[name][1] = this._maps[name][1].concat(depends);
	}
};

/** Sets the property of the "real" representation that is mapped by the specified name.
 * 
 * @param {string} name The property to set.
 * @param {*} value The new value to set.
 * @return {?*} The value of the object, or `undefined` if no property with that name is masked.
 */
dusk.Mapper.prototype.set = function(name, value) {
	if(this._maps[name] !== undefined) {
		this._target[this._maps[name][0]] = value;
		return value;
	}
	
	return undefined;
};

/** Given an object, sets all the properties of that object to their respective mappings on the target object.
 * 
 * @param {object} props The object to read the properties from.
 */
dusk.Mapper.prototype.massSet = function(props) {
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
};

/** Returns the value on the target object that has been mapped to the specified key.
 * 
 * @param {string} name The name to look up the mapping for.
 * @returns {*} The value on the target object that is mapped to.
 */
dusk.Mapper.prototype.get = function(name) {
	if(this._maps[name] !== undefined) {
		return this._target[this._maps[name][0]];
	}
	
	return undefined;
};

/** Loops through all the mappings this has been given, adds their value to an object, and returns that object.
 * 
 * @return {object} An object with all the mappings this has been given, with the values from the target object.
 */
dusk.Mapper.prototype.massGet = function() {
	var hold = {};
	for(var p in this._maps) {
		hold[p] = this._target[this._maps[p][0]];
	}
	return hold;
};

/** Returns a string representation of this object.
 * @returns {string} A string representation of this object.
 */
dusk.Mapper.prototype.toString = function() {
	return "[Mapper for "+this._target.toString()+"]";
};

Object.seal(dusk.Mapper);
Object.seal(dusk.Mapper.prototype);
