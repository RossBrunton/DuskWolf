//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.EventDispatcher", (function() {
	/** An EventDispatcher essentially manages events.
	 * 
	 * Code registeres a "listen" function in the dispatcher that is called when the event is fired.
	 * 
	 * If a filter value is fired with the event, and the listener has a not-undefined value, they must satisfy one
	 *  another given by the dispatcher's `filterType`.
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
	 * @param {integer=dusk.utils.EventDispatcher.FILTER_EQUALS} filterType The current filter type.
	 * @since 0.0.14-alpha
	 * @constructor
	 */
	var EventDispatcher = function(name, filterType) {
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
		
		/** The filter type of the EventDispatcher
		 * 
		 * This must be an integer equal to one of the FILTER_* constants.
		 * 
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.filterType = (filterType === undefined)?EventDispatcher.FILTER_EQUALS:filterType;
	};
	
	
	/** For a listener to fire, the value of the listener's filter must equal that of the fired event.
	 * 
	 * @type integer
	 * @constant
	 * @value 0
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.FILTER_EQUALS = 0;
	/** For a listener to fire, the value of the listener's filter bitwise and the value of the fired filter must be
	 *  greater than one.
	 * 
	 * Basically, a bitmask of a number of options, at least one must be common to both the listener and the event.
	 * 
	 * @type integer
	 * @constant
	 * @value 1
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.FILTER_MULTI = 1;
	/** For a listener to fire, the value of the listener's filter must be in the array that the listener fires.
	 * 
	 * @type integer
	 * @constant
	 * @value 2
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.FILTER_ISIN = 2;
	
	
	/** Registers a listener for the event; this function will be called if an event is fired and the properties match
	 *  up as described in the class description are correct.
	 * 
	 * @param {function(object):*} callback The function that will be called when an event is fired. It will be given a
	 *  single argument; the event object. If you want the function to run in a scope, then you should bind it with
	 *  `bind`.
	 * @param {*} filter If defined, this must be correct with regards to the EventDispatcher's `filterType` property.
	 * @param {?object} propsYes The listener will only fire if every property of this object
	 *  is equal to the same named property in the event object.
	 * @param {?object} propsNo The listener will only fire if every property of this object
	 *  is not equal to the same named property in the event object.
	 * @return {integer} A unique ID for the listener, call this when it should be deleted. 
	 */
	EventDispatcher.prototype.listen = function(callback, filter, propsYes, propsNo) {
		if(!callback || typeof callback != "function") {
			throw new TypeError("EventDispatcher "+this.name+" did not get a valid function.");
		}
		
		if(propsYes || propsNo) console.error("PropsYes or propsNo in use");
		
		this._listeners.push([
			callback, filter
		]);
		return this._listeners.length-1;
	};
	
	/** Removes a listener.
	 * 
	 * @param {integer} id The id that was given when the listener was registered.
	 * @since 0.0.18-alpha
	 */
	EventDispatcher.prototype.unlisten = function(id) {
		this._listeners.splice(id, 1);
	};
	
	/** Checks whether "test" should trigger the given filter based on this' filter type.
	 * 
	 * @param {*} filter The filter.
	 * @param {*} test The value to check.
	 * @return {boolean} Whether an event should be fired.
	 * @since 0.0.21-alpha
	 * @private
	 */
	EventDispatcher.prototype._checkFilter = function(filter, test) {
		return (this.filterType == EventDispatcher.FILTER_EQUALS && filter == test)
		|| (this.filterType == EventDispatcher.FILTER_MULTI && (filter & test))
		|| (this.filterType == EventDispatcher.FILTER_ISIN && filter.indexOf(test) !== -1);
	};
	
	/** Fires an event; triggering all the listeners that apply.
	 * 
	 * @param {?object} event The event object to fire, and pass to all listeners. This may be undefined.
	 * @param {?*} filter The filter that listeners must adhere to.
	 */
	EventDispatcher.prototype.fire = function(event, filter) {
		for(var i = 0; i < this._listeners.length; i ++) {
			if(this._listeners[i] === null) continue;
			
			var l = this._listeners[i];
			
			//Check filter
			if(l[1] !== undefined && !this._checkFilter(filter, l[1])) {
				continue;
			}
			
			//Fire listener
			l[0](event);
		}
	};
	
	/** Fires an event; triggering all the listeners that apply, and returns true iff all of the listeners returned
	 *  true.
	 * 
	 * @param {?object} event The event object to fire, and pass to all listeners. This may be undefined.
	 * @param {?*} filter The filter that listeners must adhere to.
	 * @param {?boolean} short If true, then this will return false when a listener returns false without calling the
	 *  rest of the listeners.
	 * @return {boolean} Whether all listeners returned true.
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.prototype.fireAnd = function(event, filter, short) {
		var ret = true;
		
		for(var i = 0; i < this._listeners.length; i ++) {
			if(this._listeners[i] === null) continue;
			
			var l = this._listeners[i];
			
			//Check filter
			if(l[1] !== undefined && !this._checkFilter(filter, l[1])) {
				continue;
			}
			
			//Fire listener
			var ret = l[0](event) && ret;
			if(short && !ret) return false;
		}
		
		return ret;
	};
	
	/** Fires an event; triggering all the listeners that apply, and returns true iff at least one of the listeners
	 *  returned true.
	 * 
	 * @param {?object} event The event object to fire, and pass to all listeners. This may be undefined.
	 * @param {?*} filter The filter that listeners must adhere to.
	 * @param {?boolean} short If true, then this will return true when a listener returns true without calling the
	 *  rest of the listeners.
	 * @return {boolean} Whether one or more listeners returned true.
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.prototype.fireOr = function(event, filter, short) {
		var ret = false;
		
		for(var i = 0; i < this._listeners.length; i ++) {
			if(this._listeners[i] === null) continue;
			
			var l = this._listeners[i];
			
			//Check filter
			if(l[1] !== undefined && !this._checkFilter(filter, l[1])) {
				continue;
			}
			
			//Fire listener
			var ret = ret || l[0](event);
			if(short && ret) return true;
		}
		
		return ret;
	};
	
	/** Fires an event; triggering all the listeners that apply. With this function, the event object for a listener is
	 * the return value of the previous listener.
	 * 
	 * @param {?object} event The event object to pass to the first listener.
	 * @param {?*} filter The filter that listeners must adhere to.
	 * @return {object} The value of the last listener's return value.
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.prototype.firePass = function(event, filter) {
		for(var i = 0; i < this._listeners.length; i ++) {
			if(this._listeners[i] === null) continue;
			
			var l = this._listeners[i];
			
			//Check filter
			if(l[1] !== undefined && !this._checkFilter(filter, l[1])) {
				continue;
			}
			
			//Fire listener
			var ret = l[0](event);
			if(ret !== undefined) event = ret;
		}
		
		return event;
	};
	
	/** Fires an event; triggering all the listeners that apply and returns the value of one of the listeners return
	 *  values.
	 * 
	 * @param {?object} event The event object to pass to the first listener.
	 * @param {?*} filter The filter that listeners must adhere to.
	 * @param {boolean} short If true, then only one listener will fire (the first valid one found), otherwise all are
	 *  fired.
	 * @return {object} The value of the last listener's return value.
	 * @since 0.0.21-alpha
	 */
	EventDispatcher.prototype.fireOne = function(event, filter, short) {
		var majorRet = undefined;
		for(var i = 0; i < this._listeners.length; i ++) {
			if(this._listeners[i] === null) continue;
			
			var l = this._listeners[i];
			
			//Check filter
			if(l[1] !== undefined && !this._checkFilter(filter, l[1])) {
				continue;
			}
			
			//Fire listener
			var ret = l[0](event);
			if(ret !== undefined) majorRet = ret;
			if(short) return majorRet;
		}
		
		return majorRet;
	};
	
	/** Returns whether this EventDispatcher has any listeners or not.
	 * 
	 * @return {boolean} Whether any listeners are registered.
	 */
	EventDispatcher.prototype.hasListeners = function() {
		return this._listeners.length > 0;
	};
	
	/** Returns a string representation of the EventDispatcher.
	 * 
	 * @return {string} A representation of the EventDispatcher.
	 */
	EventDispatcher.prototype.toString = function() {
		return "[EventDispatcher "+this._name+"]";
	};
	
	return EventDispatcher;
})());
