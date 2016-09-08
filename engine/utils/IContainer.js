//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.IContainer", function() {
	/** The IContainer interface is an interface for objects that contain other objects. It provides a standard set of
	 *  functions that they should implement.
	 * 
	 * In addition, containers must have the property `implementsIContainer` set to true, to allow quickly checking if
	 *  something implements this interface or not.
	 * 
	 * @interface IContainer
	 * @memberof dusk.utils
	 * @since 0.0.21-alpha
	 */
	var IContainer = {};
	
	/** Get the named element. If it does not exist (or cannot be retreived for some reason), this should return
	 *  `undefined`.
	 * @param {*} key The key to look up, can be any type.
	 * @return {?*} The value of that key.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.get = function(key) {};
	
	/** Set the named element. Should return `true` on success, or `false` on failure.
	 * @param {*} key The key to set, can be any type.
	 * @param {*} value The value to set.
	 * @return {boolean} Whether setting was successfull.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.set = function(key, value) {};
	
	/** Remove the named element. Should return `true` on success, or `false` on failure. This should also return
	 *  `false` if the object is not in this container.
	 * @param {*} key The key to remove, can be any type.
	 * @return {boolean} Whether removing was successfull.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.remove = function(key) {};
	
	/** Should return the number of elements in this container.
	 * @return {int} The number of elements in this container.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.length = function() {};
	
	/** Return an iterator that iterates through all elements. This should return an object with a method `next`.
	 *  Calling `next` will return an object with up to three properties. `value` which is the current value, and `done`
	 *  which is true iff there are no more elements. `value` must not exist if `done` is true. As a non-standard 
	 *  addition to the spec, iterators here may set the property `key` which is the key of the element (if available).
	 * 
	 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/The_Iterator_protocol
	 * @return {object} The iterator.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.iterate = function() {};
	
	/** Return true if the provided object can be stored in this container.
	 * @param {*} element The object to test validity.
	 * @return {*} Whether the object can be stored in this container.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.valid = function(element) {};
	
	/** Return true if the provided object is in this container.
	 * @param {*} element The object to test if it is in this container.
	 * @return {boolean} Whether the specified object is in this container.
	 * @memberof dusk.utils.IContainer
	 */
	IContainer.contains = function(element) {};
	
	return Object.keys(IContainer);
});


load.provide("dusk.utils.containerUtils", function() {
	/** This namespace provides a number of methods that operate on objects implementing IContainer, objects themselves
	 *  and arrays.
	 * 
	 * @namespace
	 * @memberof dusk.utils
	 * @since 0.0.21-alpha
	 */
	var containerUtils = {};
	
	/** Takes an element that is either an IContainer, object or array, and returns a "wrapper" around it making it
	 *  implement IContainer. IContainer instances are just passed straight through, but arrays and objects are 
	 *  given "wrappers".
	 * @param {(object|array|IContainer)} container The object to wrap.
	 * @return {IContainer} The wrapped container.
	 */
	containerUtils.wrap = function(container) {
		if(container.implementsIContainer) return container;
		
		if(Array.isArray(container)) {
			return {
				"get":function(key) {return container[key];},
				"set":function(key, value) {
					if(isNaN(+key)) {
						return false;
					}else{
						container[key] = value;
						return true;
					}
				},
				"remove":function(key) {
					if(key > 0 && key < container.length-1) {
						container[key] = undefined;
						return true;
					}else if(key > 0 && key == container.length-1) {
						container.length --;
						return true;
					}else{
						return false;
					}
				},
				"length":function() {return container.length},
				"iterate":function() {
					var i = -1;
					return {
						"next":function(){
							i ++;
							if(i < container.length){
								return {"done":false, "value":container[i], "key":i};
							}else{
								return {"done":true};
							}
						}
					};
				},
				"valid":function() {return true;},
				"contains":function(element) {return container.indexOf() !== -1},
				"toString":function() {return "[IContainer wrapped "+container+"]";},
				"implementsIContainer": true
			};
		}
		
		return {
			"get":function(key) {return container[key];},
			"set":function(key, value) {container[key] = value; return true;},
			"remove":function(key) {if(container[key]) {delete container[key]; return true;}else{return false;}},
			"length":function() {return Object.keys(container).length},
			"iterate":function() {
				var i = -1;
				var keys = Object.keys(container);
				return {
					"next":function(){
						i ++;
						if(i < keys.length){
							return {"done":false, "value":container[keys[i]], "key":keys[i]};
						}else{
							return {"done":true};
						}
					}
				};
			},
			"valid":function() {return true;},
			"contains":function(element) {
				for(var p in container) {
					if(container[p] === element) return true; 
				}
				return false;
			},
			"toString":function() {return "[IContainer wrapped "+container+"]";},
			"implementsIContainer": true
		};
	};
	
	/** For each element in the container, it calls the callback once. The function will be provided with three
	 *  arguments. The first is the value of the element, the second is the key of the element (if available), and the
	 *  third is the container being used. The third element may be either an IContainer, an object or an array.
	 * @param {(object|array|IContainer)} container The object to iterate.
	 * @param {function(*, ?*, array|object|IContainer)} callback The function to call for each element.
	 * @param {*} thisArg Will be the "this" value of the function called.
	 */
	containerUtils.forEach = function(container, callback, thisArg) {
		if(container.implementsIContainer) {
			var iterator = container.iterate();
			
			for(var e = iterator.next(); !e.done; e = iterator.next()) {
				callback.call(thisArg, e.value, e.key, container);
			}
		}else if(Array.isArray(container)) {
			container.forEach(callback, thisArg);
		}else{
			for(var p in container) {
				callback.call(thisArg, container[p], p, container);
			}
		}
	};
	
	/** Takes an IContainer, array or object and returns an object obtained by iterating through the container and
	 *  setting each property.
	 * 
	 * If the parameter is an object and does not implement IContainer, it's returned exactly. If it's an IContainer it
	 *  must supply keys; any entry without a key will be skipped.
	 * @param {object|array|IContainer} container The container to create an object from.
	 * @return {object} An object with all the objects being those in the container.
	 */
	containerUtils.toObject = function(container) {
		if(container.implementsIContainer) {
			var iterator = container.iterate();
			var out = {};
			
			for(var e = iterator.next(); !e.done; e = iterator.next()) {
				if(e.key) {
					out[e.key] = e.value;
				}
			}
			
			return out;
		}else if(Array.isArray(container)) {
			var out = {};
			for(var i = 0; i < container.length; i ++) {
				out[i] = container[i];
			}
			return out;
		}else{
			return container;
		}
	};
	
	/** Takes an IContainer, object or array and returns an array containing the properties of the container.
	 * 
	 * Arrays are returned exactly.
	 * @param {(object|array|IContainer)} container The container to create an object from.
	 * @return {object} An object with all the objects being those in the container.
	 */
	containerUtils.toArray = function(container) {
		if(container.implementsIContainer) {
			var iterator = container.iterate();
			var out = [];
			
			for(var e = iterator.next(); !e.done; e = iterator.next()) {
				out.push(e.value);
			}
			
			return out;
		}else if(Array.isArray(container)) {
			return container;
		}else{
			var out = [];
			for(var p in container) {
				if(container.hasOwnProperty(p))
					out.push(container[p]);
			}
			return out;
		}
	};
	
	/** Takes in an object, a package (which must not be sealed yet) and a validation function and implements
	 *  `IContainer` on that object so you don't have to.
	 * 
	 * It adds all the methods of `IContainer` to the package which operate on the object. For example, calling
	 *  `get("key")` on the package would get the key on the object.
	 * 
	 * @param {object} pack The package to implement.
	 * @param {(object|string)} object The object to forward the methods to. If it is a string, then `this[object]` will
	 *  be set rather than `object`.
	 * @param {?function(*):boolean} validate The (optional) value to set as the `valid` function.
	 * @param {?function(string, *):boolean} onSet A function called just before the value is set. If this returns
	 *  false, then the object will not be set.
	 */
	containerUtils.implementIContainer = function(pack, object, validate, onSet) {
		var stringMode = typeof object == "string";
		if(!validate) validate = function(ob) {return true;}
		
		pack.implementsIContainer = true;
		
		if(!("get" in pack)) pack.get = function(name) {
			if(stringMode) {
				return this[object][name];
			}else{
				return object[name];
			}
		};
		
		if(!("set" in pack)) pack.set = function(name, value) {
			if(!pack.valid(value)) return false;
			if(onSet && !onSet(name, value)) return false;
			
			if(stringMode) {
				this[object][name] = value;
			}else{
				object[name] = value;
			}
			return true;
		};
		
		if(!("remove" in pack)) pack.remove = function(name) {
			if(name in object) {
				if(stringMode) {
					delete this[object][name];
				}else{
					delete object[name];
				}
				return true;
			}else{
				return false;
			}
		};
		
		if(!("length" in pack)) pack.length = function() {
			if(stringMode) {
				return Object.keys(this[object]).length;
			}else{
				return Object.keys(object).length;
			}
		};
		
		if(!("iterate" in pack)) pack.iterate = function() {
			var i = -1;
			var keys = [];
			if(stringMode) {
				keys = Object.keys(this[object]);
			}else{
				keys = Object.keys(object);
			}
			
			return {
					"next":(function(){
						i ++;
						if(i < keys.length){
							return {"done":false, "value":this.get(keys[i]), "key":keys[i]};
						}else{
							return {"done":true};
						}
					}).bind(this)
				};
		};
		
		pack.valid = validate;
		
		if(!("contains" in pack)) pack.contains = function(value) {
			if(stringMode) {
				for(var p in this[object]) {
					if(this[object][p] == value) return true;
				}
			}else{
				for(var p in object) {
					if(object[p] == value) return true;
				}
			}
			
			return false;
		};
	};
	
	return containerUtils;
});
