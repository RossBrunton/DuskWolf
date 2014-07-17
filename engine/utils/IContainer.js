//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.IContainer", (function() {
	/** The IContainer interface is an interface for objects that contain other objects. It provides a standard set of
	 *  functions that they should implement.
	 * 
	 * In addition, containers must have the property `implementsIContainer` set to true, to allow quickly checking if
	 *  something implements this interface or not.
	 * 
	 * @interface
	 * @since 0.0.21-alpha
	 */
	var IContainer = {};
	
	/** Get the named element. If it does not exist (or cannot be retreived for some reason), this should return
	 *  `undefined`.
	 * @param {*} key The key to look up, can be any type.
	 * @return {?*} The value of that key.
	 */
	IContainer.get = function(key) {};
	
	/** Set the named element. Should return `true` on success, or `false` on failure.
	 * @param {*} key The key to set, can be any type.
	 * @param {*} value The value to set.
	 * @return {boolean} Whether setting was successfull.
	 */
	IContainer.set = function(key, value) {};
	
	/** Should return the number of elements in this container.
	 * @return {int} The number of elements in this container.
	 */
	IContainer.length = function() {};
	
	/** Return an iterator that iterates through all elements. This should return an object with a method `next`.
	 *  Calling `next` will return an object with up to three properties. `value` which is the current value, and `done`
	 *  which is true iff there are no more elements. `value` must not exist if `done` is true. As a non-standard 
	 *  addition to the spec, iterators here may set the property `key` which is the key of the element (if available).
	 * 
	 * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/The_Iterator_protocol
	 * @return {object} The iterator.
	 */
	IContainer.iterate = function() {};
	
	/** Return true if the provided object can be stored in this container.
	 * @param {*} element The object to test validity.
	 * @return {*} Whether the object can be stored in this container.
	 */
	IContainer.valid = function(element) {};
	
	return Object.keys(IContainer);
})());


load.provide("dusk.containerUtils", (function() {
	/** This namespace provides a number of methods that operate on objects implementing IContainer, objects themselves
	 *  and arrays.
	 * 
	 * @namespace
	 * @since 0.0.21-alpha
	 */
	var containerUtils = {};
	
	/** Takes an element that is either an IContainer, object or array, and returns a "wrapper" around it making it
	 *  implement IContainer. IContainer instances are just passed straight through, but arrays and objects are 
	 *  given "wrappers".
	 * @param {object|array|IContainer} container The object to wrap.
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
				"toString":function() {return "[IContainer wrapped "+container+"]";},
				"implementsIContainer": true
			};
		}
		
		return {
			"get":function(key) {return container[key];},
			"set":function(key, value) {container[key] = value; return true;},
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
			"toString":function() {return "[IContainer wrapped "+container+"]";},
			"implementsIContainer": true
		};
	};
	
	/** For each element in the container, it calls the callback once. The function will be provided with three
	 *  arguments. The first is the value of the element, the second is the key of the element (if available), and the
	 *  third is the container being used. The third element may be either an IContainer, an object or an array.
	 * @param {object|array|IContainer} container The object iterate.
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
	
	return containerUtils;
})());
