//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.EventDispatcher");

/** @class dusk.EventDispatcher
 * 
 * @classdesc An EventDispatcher essentially manages events.
 * 
 * Code registeres a "listen" function in the dispatcher that is called when the event is fired.
 * 
 * More finely tuned event handling is also available, in the form of "propsYes" and "propsNo".
 * 
 * If the listener has a `propsYes` object registered
 *  then the listener will ONLY be called if ALL the properties of `propsYes` have counterparts
 *  that are equal in the event object.
 * 
 * Similarly, `propsNo` will only fire if the properties specified are NOT equal to the event properties.
 * 
 * @param {string} name A name for the event dispatcher; used for identifying it in debbuging.
 * @param {integer=dusk.EventDispatcher.MODE_NONE} mode The current behaviour used for managing return values.
 * @since 0.0.14-alpha
 * @constructor
 */
dusk.EventDispatcher = function(name, mode) {
	/** All the listeners; each element is an array in the form `[callback, propsYes, propsNo, scope]`.
	 * @type array
	 * @private
	 */
	this._listeners = [];
	
	/** The name of the listener.
	 * @type string
	 * @private
	 */
	this._name = name;
    
	/** The current mode of the EventDispatcher.
	 * 
	 * This must be a number equal to one of the MODE_* constants.
	 *
	 * This will determine the return value of `{@link dusk.EventDispatcher.fire}`, and what the listeners should return.
	 * @type integer
	 * @private
	 */
	this.mode = (mode === undefined)?dusk.EventDispatcher.MODE_NONE:mode;
};

/** The default mode, this will cause the fire method to return nothing.
 * 
 * @type integer
 * @constant
 * @value 0
 */
dusk.EventDispatcher.MODE_NONE = 0;

/** The "and" mode, this will cause the fire method to return true only if all the listeners return true.
 * 
 * @type integer
 * @constant
 * @value 1
 */
dusk.EventDispatcher.MODE_AND = 1;

/** The "or" mode, this will cause the fire method to return true only if at least one of the listeners return true.
 * 
 * @type integer
 * @constant
 * @value 2
 */
dusk.EventDispatcher.MODE_OR = 2;

/** The "pass" mode, this will take the event object returned by a listener
 *   and then pass it to the next one and so on then finaly return that value.
 * 
 * @type integer
 * @constant
 * @value 3
 */
dusk.EventDispatcher.MODE_PASS = 3;

/** The "last" mode, this will return the last non-undefined result returned by a listener.
 * 
 * @type integer
 * @constant
 * @value 4
 */
dusk.EventDispatcher.MODE_LAST = 4;

/** Registers a listener for the event;
 *   this function will be called if an event is fired
 *   and the properties match up as described in the class description are correct.
 * 
 * @param {function(object):*} callback The function that will be called when an event is fired.
 *  It will be given a single argument; the event object.
 * @param {object} scope The scope to run the callback in. This will be the value of `this` in the callback function.
 * @param {?object} propsYes The listener will only fire if every property of this object
 *  is equal to the same named property in the event object.
 * @param {?object} propsNo The listener will only fire if every property of this object
 *  is not equal to the same named property in the event object.
 */
dusk.EventDispatcher.prototype.listen = function(callback, scope, propsYes, propsNo) {
	if(!callback) {
		console.error("EventDispatcher "+this.toString()+" did not recieve a valid function.");
		console.log(scope);
		return;
	}
	
	this._listeners.push([callback, propsYes?propsYes:{}, propsNo?propsNo:{}, scope]);
};

/** Fires an event; triggering all the listeners that apply.
 * 
 * @param {?object} event The event object to fire, and pass to all listeners.
 */
dusk.EventDispatcher.prototype.fire = function(event) {
	if(event === undefined) event = {};
	var majorRet = null;
	
	switch(this.mode) {
		case dusk.EventDispatcher.MODE_AND:
			majorRet = true;
			break;
		
		case dusk.EventDispatcher.MODE_OR:
			majorRet = false;
			break;
		
		case dusk.EventDispatcher.MODE_PASS:
			majorRet = event;
			break;
	}
	
	for(var i = 0; i < this._listeners.length; i ++) {
		var valid = true;
		
		//Check propsYes
		for(var p in this._listeners[i][1]) {
			if(event[p] !== this._listeners[i][1][p]) {
				valid = false;
				break;
			}
		}
		
		if(!valid) continue;
		
		//Check propsNo
		for(var p in this._listeners[i][2]) {
			if(event[p] === this._listeners[i][2][p]) {
				valid = false;
				break;
			}
		}
		
		//Fire listener
		if(valid) {
			var ret = null;
			ret = this._listeners[i][0].call(this._listeners[i][3], event);
		
			switch(this.mode) {
				case dusk.EventDispatcher.MODE_AND:
					majorRet = majorRet&&ret;
					break;
				
				case dusk.EventDispatcher.MODE_OR:
					majorRet = majorRet||ret;
					break;
				
				case dusk.EventDispatcher.MODE_PASS:
					majorRet = ret;
					break;
				
				case dusk.EventDispatcher.MODE_LAST:
					majorRet = ret===undefined?majorRet:ret;
					break;
			}
		}
	}
	
	return majorRet;
};

/** Returns whether this EventDispatcher has any listeners or not.
 * 
 * @return {boolean} Whether any listeners are registered.
 */
dusk.EventDispatcher.prototype.hasListeners = function() {
	return this._listeners.length > 0;
};

/** Returns a string representation of the EventDispatcher.
 * 
 * @return {string} A representation of the EventDispatcher.
 */
dusk.EventDispatcher.prototype.toString = function() {
	return "[EventDispatcher "+this._name+"]";
};

Object.seal(dusk.EventDispatcher);
Object.seal(dusk.EventDispatcher.prototype);
