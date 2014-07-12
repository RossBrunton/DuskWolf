//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.EventDispatcher", (function() {
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
	 * @param {integer=dusk.EventDispatcher.MODE_NONE} mode The current behaviour used for managing return values.
	 * @param {integer=dusk.EventDispatcher.FILTER_EQUALS} filterType The current filter type.
	 * @since 0.0.14-alpha
	 * @constructor
	 */
	var EventDispatcher = function(name, mode, filterType) {
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
		 * This will determine the return value of `{@link dusk.EventDispatcher.fire}`, and what the listeners should 
		 *  return.
		 * @type integer
		 */
		this.mode = (mode === undefined)?EventDispatcher.MODE_NONE:mode;
		
		/** The filter type of the EventDispatcher
		 * 
		 * This must be an integer equal to one of the FILTER_* constants.
		 * 
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.filterType = (filterType === undefined)?EventDispatcher.FILTER_EQUALS:filterType;
	};

	/** The default return mode, this will cause the fire method to return nothing.
	 * 
	 * @type integer
	 * @constant
	 * @value 0
	 */
	EventDispatcher.MODE_NONE = 0;

	/** The "and" mode, this will cause the fire method to return true only if all the listeners return true.
	 * 
	 * @type integer
	 * @constant
	 * @value 1
	 */
	EventDispatcher.MODE_AND = 1;

	/** The "or" mode, this will cause the fire method to return true only if at least one of the listeners return true.
	 * 
	 * @type integer
	 * @constant
	 * @value 2
	 */
	EventDispatcher.MODE_OR = 2;

	/** The "pass" mode, this will take the event object returned by a listener
	 *   and then pass it to the next one and so on then finaly return that value.
	 * 
	 * @type integer
	 * @constant
	 * @value 3
	 */
	EventDispatcher.MODE_PASS = 3;

	/** The "last" mode, this will return the last non-undefined result returned by a listener.
	 * 
	 * @type integer
	 * @constant
	 * @value 4
	 */
	EventDispatcher.MODE_LAST = 4;
	
	
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
		
		this._listeners.push([
			callback, filter,
			propsYes?propsYes:null, propsYes?Object.keys(propsYes):[], 
			propsNo?propsNo:null, propsNo?Object.keys(propsNo):[]
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

	/** Fires an event; triggering all the listeners that apply.
	 * 
	 * @param {?object} event The event object to fire, and pass to all listeners. This may be undefined.
	 * @param {?*} filter The filter that listeners must adhere to.
	 * @param {?dusk.Pool} pool If defined, then the event object will be returned to this pool when the firing is
	 *  finished.
	 */
	EventDispatcher.prototype.fire = function(event, filter, pool) {
		if(this.mode == 0) {
			for(var i = 0; i < this._listeners.length; i ++) {
				if(this._listeners[i] === null) continue;
				
				var l = this._listeners[i];
				
				//Check filter
				if(filter !== undefined && l[1] !== undefined) {
					if(this.filterType == EventDispatcher.FILTER_EQUALS && filter != l[1]) {
						continue;
					}else if(this.filterType == EventDispatcher.FILTER_MULTI && (filter & l[1]) == 0){
						continue;
					}else if(this.filterType == EventDispatcher.FILTER_ISIN && filter.indexOf(l[1]) === -1) {
						continue
					}
				}
				
				//Check propsYes
				if(event && l[2]
				&& !_checkPropsPositive(event, l[2], l[3]))
					continue;
				
				//Check propsNo
				if(event && l[4]
				&& !_checkPropsNegative(event, l[4], l[5]))
					continue;
				
				//Fire listener
				l[0](event);
			}
		}else{
			var majorRet = null;
			
			switch(this.mode) {
				case 1: //AND
					majorRet = true;
					break;
				
				case 2: //OR
					majorRet = false;
					break;
				
				case 3: //PASS
					majorRet = event;
					break;
			}
			
			for(var i = 0; i < this._listeners.length; i ++) {
				if(this._listeners[i] === null) continue;
				
				var l = this._listeners[i];
				
				//Check filter
				if(filter !== undefined && l[1]) {
					if(this.filterType == EventDispatcher.FILTER_EQUALS && filter != l[1]) {
						continue;
					}else if(this.filterType == EventDispatcher.FILTER_MULTI && (filter & l[1]) == 0){
						continue;
					}else if(this.filterType == EventDispatcher.FILTER_ISIN && filter.indexOf(l[1]) === -1) {
						continue
					}
				}
				
				//Check propsYes
				if(event && l[2]
				&& !_checkPropsPositive(event, l[2], l[3]))
					continue;
				
				//Check propsNo
				if(event && l[4]
				&& !_checkPropsNegative(event, l[4], l[5]))
					continue;
				
				//Fire listener
				var ret = l[0](event);
			
				switch(this.mode) {
					case 1: //AND
						majorRet = majorRet&&ret;
						break;
					
					case 2: //OR
						majorRet = majorRet||ret;
						break;
					
					case 3: //PASS
						majorRet = ret;
						event = majorRet;
						break;
					
					case 4: //LAST
						majorRet = ret===undefined?majorRet:ret;
						break;
				}
			}
			
			if(pool) pool.free(event);
			return majorRet;
		}
		
		if(pool) pool.free(event);
	};

	var _checkPropsPositive = function(event, props, keys) {
		for(var i = 0; i < keys.length; i ++) {
			if(event[keys[i]] !== props[keys[i]]) {
				return false;
			}
		}
		
		return true;
	};

	var _checkPropsNegative = function(event, props, keys) {
		for(var i = 0; i < keys.length; i ++) {
			if(event[keys[i]] === props[keys[i]]) {
				return false;
			}
		}
		
		return true;
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

	Object.seal(EventDispatcher);
	Object.seal(EventDispatcher.prototype);
	
	return EventDispatcher;
})());
