//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.InheritableContainer", (function() {
	var utils = load.require("dusk.utils");
	var Inheritable = load.require(">dusk.utils.Inheritable", function(p) {Inheritable = p});
	
	/** Inheritable objects are essentially objects which inherit properties from other objects. Think OOP style-
	 *  inheritance mixed with objects.
	 * 
	 * Every "type" is "linked" to another object, if a property is not found on an object then the object it is linked
	 *  to ("inherited from") is checked for that property.
	 * 
	 * This class can create regular JavaScript objects that have all the properties that the specified type had when it
	 *  was created. It can also can create instances of `{@link dusk.utils.Inheritable}` which update automatically, however 
	 *  are not normal JavaScript objects.
	 * 
	 * The base type, that all inheritables are linked to, is named `"root"`, and can be modified as any other type.
	 * @param {string} name A unique name for the container; used for identifying it while saving.
	 * @constructor
	 * @since 0.0.17-alpha
	 */
	var InheritableContainer = function(name) {
		/** The name of the container.
		 * 
		 * @type string
		 */
		this.name = name;
		
		/** Stores all the type data.
		 * The key is the string name of the type, and the value is an object specifying all it's properties.
		 * 
		 * @type object
		 * @private
		 */
		this._objectData = {};
		/** Stores information on what type is linked to what.
		 * The key name is the string name of the object, and the value is the name of the object it is linked to.
		 * 
		 * @type object
		 * @private
		 */
		this._objectChain = {};
		
		//Create the root type
		this.createNewType("root", {});
		
		//Add this to the list of containers
		_containers[name] = this;
	};
	
	/** Creates a new type, with the specified data and base type.
	 * 
	 * @param {string} name The name of the type to create.
	 * @param {object} data The object to set as the type.
	 * @param {?string} extendee The name of the base object.
	 * 	If this is not specified and the name you are setting is not root, this will be `"root"`
	 */
	InheritableContainer.prototype.createNewType = function(name, data, extendee) {
		this._objectChain[name] = extendee===undefined?"root":extendee;
		if(name === "root") this._objectChain[name] = null;
		
		this._objectData[name] = data;
	};
	
	/** Gets a single property from a type.
	 * 
	 * This will check if any "parent" types have it as well.
	 * @param {string} name The type to look up the property on.
	 * @param {string} key The key of the type to look up.
	 * @return {?*} The value of the key on the specified type, or undefined if either the type or the key was not found.
	 */
	InheritableContainer.prototype.get = function(name, key) {
		if(!(name in this._objectData)) return undefined;
		//if(key === undefined) return dusk.items._itemData[name];
		
		var frags = key.split(".").reverse();
		var hold = this._objectData[name];
		
		var now;
		while(now = frags.pop()) {
			if(now in hold) {
				hold = hold[now];
			}else if(name in this._objectChain && this._objectChain[name]) {
				return this.get(this._objectChain[name], key);
			}else{
				return undefined;
			}
		}
		
		if(name in this._objectChain && this._objectChain[name] && this.get(this._objectChain[name], key)) {
			return utils.merge(this.get(this._objectChain[name], key), hold);
		} 
		
		return hold;
	};
	
	/** Sets a single property onto a type.
	 * 
	 * @param {string} name The type to set the property on.
	 * @param {string} key The name of the property on the type to set.
	 * @param {*} value The value to set the specified property.
	 * @return {?*} The set value if the setting was successfull, or undefined if the type does not exist.
	 */
	InheritableContainer.prototype.set = function(name, key, value) {
		if(!(name in this._objectData)) return undefined;
		
		this._objectData[name][key] = value;
		
		return value;
	};
	
	/** Returns an object containing all the properties of the specified type, and all it's parents.
	 * 
	 * @param {string} name The type to get.
	 * @return {object} An object containing all the properties that the specified type has.
	 */
	InheritableContainer.prototype.getAll = function(name) {
		if(!(name in this._objectData)) return undefined;
		
		if(name in this._objectChain && this._objectChain[name])
			return utils.merge(this.getAll(this._objectChain[name]), this._objectData[name]);
		
		return this._objectData[name];
	};
	
	/** Returns an object containing all the properties of the specified type, but none from it's parents.
	 * 
	 * @param {string} name The type to get.
	 * @return {object} An object containing all the properties that the specified type has.
	 * @since 0.0.20-alpha
	 */
	InheritableContainer.prototype.getRaw = function(name) {
		if(!(name in this._objectData)) return undefined;
		
		return this._objectData[name];
	};
	
	/** Creates a new instance of `{@link dusk.utils.Inheritable}` of the specified type, which is linked to this.
	 * 
	 * If the type is not found, then the Inheritable will use the type `"root"` instead.
	 * 
	 * @param {string} type The name of the type to create the inheritable for.
	 * @param {?object} extraData Any extra properties that this specific instance of the item should have.
	 * @return {dusk.utils.Inheritable} An inheritable of the specified type.
	 */
	InheritableContainer.prototype.create = function(type, extraData) {
		if(!(type in this._objectData)) {
			console.warn("Tried to create Inheritable of unknown type "+type+".");
			return new Inheritable("root", this, extraData);
		}
		
		return new Inheritable(type, this, extraData);
	};

	/** Checks if the specified type exists.
	 * 
	 * @param {string} name The name to check.
	 * @return {boolean} Whether the specified type exists.
	 */
	InheritableContainer.prototype.isValidType = function(name) {
		if(!(name in this._objectData)) return false;
		
		return true;
	};

	/** Gets the extendee of the current type.
	 * 
	 * @param {string} name The name to look up.
	 * @return {string} The type the specified type is linked to.
	 * @since 0.0.20-alpha
	 */
	InheritableContainer.prototype.getExtendee = function(name) {
		if(!(name in this._objectData)) return "";
		
		return this._objectChain[name];
	};

	/** Returns an array of all the names of the types in this container.
	 * 
	 * @return {array} All the names of types in this container, as strings.
	 */
	InheritableContainer.prototype.getAllNames = function() {
		var out = [];
		
		for(var p in this._objectData) {
			out.push(p);
		}
		
		return out;
	};
	
	/** Object containing all the containers. Key is the container name, while the value is the container.
	 * @type object
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _containers = {};
	
	/** Given a name, gets the container with that name.
	 * @param {string} name The name to look up.
	 * @return {dusk.utils.InheritableContainer} The container with that name.
	 * @since 0.0.21-alpha
	 */
	InheritableContainer.getContainer = function(name) {
		return _containers[name];
	};
	
	return InheritableContainer;
})());


load.provide("dusk.utils.Inheritable", (function(){
	var utils = load.require("dusk.utils");
	var InheritableContainer = load.require("dusk.utils.InheritableContainer");
	var save = load.suggest("dusk.save", function(p) {save = p});
	var containerUtils = load.require("dusk.utils.containerUtils");
	
	/** Inheritables are created by instances of `dusk.utils.InheritableContainer` and generally serve to provide dynamic
	 *  access to a type.
	 * 
	 * They can also contain their own "extra" data which is not linked to the type data in the container. All of the
	 *  IContainer methods except `get` work only on the "extra data". `get` will first check if the key is in the extra
	 *  data, and then looks to the container for the property.
	 * 
	 * @param {string} type The type to create the Inheritable of. Must be a valid type in the container.
	 * @param {dusk.utils.InheritableContainer} container The container this is "connected to".
	 * @param {?object} extraData Any data that is unique to this specific instance of the type.
	 * @constructor
	 * @implements dusk.utils.IContainer
	 * @since 0.0.17-alpha
	 */
	var Inheritable = function(type, container, extraData) {
		/** The type of the inheritable.
		 * @type string
		 */
		this.type = type;
		/** The container this inheritable is connected to.
		 * @type dusk.utils.InheritableContainer}
		 */
		this.container = container;
		/** This inheritable's "extra data".
		 * @type object
		 * @private
		 */
		this._extraData = extraData?extraData:{};
		
		if(!this.container.isValidType(type)) {
			console.warn("Tried to create an Inheritable of unknown type "+this.type+".");
			this.type = "root";
		}
	};
	
	containerUtils.implementIContainer(Inheritable.prototype, "_extraData");

	/** Returns the value specified by the supplied key name.
	 * 
	 * This will be from either this inheritable's extra data, or anywhere in the type's data.
	 * 
	 * @param {string} key The name of the property to get.
	 * @return {*} The value specified by the key.
	 */
	Inheritable.prototype.get = function(key) {
		if(key in this._extraData) return this._extraData[key];
		
		return this.container.get(this.type, key);
	};
	
	/** Gets the unique data that this inheritable has, this will not necessarily be the same as the type data.
	 * 
	 * @return {object} The inheritable's extra data.
	 */
	Inheritable.prototype.getUnique = function() {
		return this._extraData;
	};
	
	/** Returns a string representation of the inheritable. 
	 * 
	 * @return {string} A string representation of the inheritable.
	 */
	Inheritable.prototype.toString = function() {return "[Inheritable "+this.type+"]";};
	
	/** Makes a copy of the inheritable, of the same type, linked to the same container and with the same extra data.
	 * 
	 * @return {dusk.utils.Inheritable} A copy of this inheritable.
	 */
	Inheritable.prototype.copy = function() {
		return new Inheritable(this.type, this.container, utils.clone(this._extraData));
	};
	
	/** Saves this to an object that can then be loaded with `{@link dusk.utils.Inheritable#refLoad}`.
	 * 
	 * This requires `{@link dusk.save}` to be imported.
	 * @return {object} This inheritable, as an object.
	 * @since 0.0.21-alpha
	 */
	Inheritable.prototype.refSave = function(ref) {
		return [this.type, this.container.name, ref(this._extraData)];
	};
	
	/** Given a previously saved inventory (via `{@link dusk.utils.Inheritable#refSave}`) will create a inheritable for this 
	 *  object.
	 * @param {object} data The saved data.
	 * @return {dusk.utils.Inheritable} An inheritable from the saved data.
	 * @since 0.0.21-alpha
	 * @static
	 */
	Inheritable.refLoad = function(data, unref) {
		return new Inheritable(data[0], InheritableContainer.getContainer(data[1]), unref(data[2]));
	};
	
	/** Returns the name of the class for use in saving.
	 * @return {string} The string "dusk.utils.Inheritable".
	 * @since 0.0.21-alpha
	 */
	Inheritable.prototype.refClass = Inheritable.refClass = function() {
		return "dusk.utils.Inheritable";
	};
	
	return Inheritable;
})());
