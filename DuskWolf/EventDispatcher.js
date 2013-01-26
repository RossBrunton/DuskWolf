//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.EventDispatcher");

/** Creates a new EventDispatcher.
 * 
 * @param {string} name A name for the event dispatcher; used for identifying it in debbuging.
 * @param {?number} mode The current behaviour used for managing return values, defaults to `{@link dusk.EventDispatcher.MODE_NONE}`.
 * 
 * @class dusk.EventDispatcher
 * 
 * @classdesc An EventDispatcher essentially manages events.
 * 
 * Code registeres a "listen" function in the dispatcher that is called when the event is fired.
 * 
 * More finley tuned event handling is also available, in the form of "propsYes" and "propsNo".
 * 
 * If the listener has a `propsYes` object registered, then the listener will ONLY be called if ALL the properties of propsYes have counterparts that are equal in the event object.
 * 
 * Similarly, `propsNo` will only fire if the properties specified are NOT equal to the event properties.
 * 
 * @since 0.0.14-alpha
 */
dusk.EventDispatcher = function(name, mode) {
	/** All the listeners; each element is an array in the form `[callback, propsYes, propsNo, scope]`.
	 * @type array
	 * @private
	 * @memberof dusk.EventDispatcher
	 */
	this._listeners = [];
	
	/** The name of the listener.
	 * @type string
	 * @private
	 * @memberof dusk.EventDispatcher
	 */
	this._name = name;
    
    /** The current mode of the EventDispatcher.
     * 
     * This must be a number equal to one of the MODE_* constants.
     *
     * This will determine the return value of `{@link dusk.EventDispatcher.fire}`, and what the listeners should return.
     * 
     * @type integer
     * @private
     * @memberof dusk.EventDispatcher
     */
     this._mode = (mode === undefined)?dusk.EventDispatcher.MODE_NONE:mode;
};

/** The default mode, this will cause the fire method to return nothing.
 * 
 * @type integer
 * @constant
 * @value 0
 */
dusk.EventDispatcher.MODE_NONE = 0;

/** Registers a listener for the event; this function will be called if an event is fired and the properties match up as described in the class description are correct.
 * 
 * @param {function(object):undefined} callback The function that will be called when an event is fired. It will be given a single argument; the event object.
 * @param {object} scope The scope to run the callback in. This will be the value of `this` in the callback function.
 * @param {?object} propsYes The listener will only fire if every property of this object is equal to the same named property in the event object.
 * @param {?object} propsNo The listener will only fire if every property of this object is not equal to the same named property in the event object.
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
		if(valid) this._listeners[i][0].call(this._listeners[i][3], event);
	}
};

/** Returns a string representation of the EventDispatcher.
 * 
 * @return {string} A representation of the EventDispatcher.
 */
dusk.EventDispatcher.prototype.toString = function() {
	return "[eventDispatcher "+this._name+"]";
};
