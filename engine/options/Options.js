//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.options", (function() {
	/** Options provide a simple way to allow user or per-game configurable settings on how DuskWolf runs
	 * 
	 * Options are identified by a string name in "category.key" format, where category is generally something like
	 *  "graphics" or "gamepad". They also have a type, a default value and a description for the user. To register new
	 *  options, `options.register` must be called with these values.
	 * 
	 * Options may be set by the user, or by the engine. Settings set by the user take priority, so you should not
	 *  assume that just because you set a specific option it will actually be that value.
	 * 
	 * The possible types available are:
	 * - positiveInteger: An integer >= 0, non integer values will be converted to ints.
	 * - positiveFloat: A number >= 0.
	 * - integer: An integer, non-integer values will be converted to ints.
	 * - float: A number.
	 * - string: A string.
	 * - boolean: A boolean, the string "false" evaluates to false for the purposes of this type.
	 * - selection: A string value from a list provided when the option was registered.
	 * 
	 * Trying to set an option to an invalid value will log a warning and do nothing.
	 * 
	 * This package also creates a function called `option` on the global window object if it doesn't exist for easy
	 *  changing of options for the user. How this function acts is based on how many arguments it is given:
	 * With no arguments, it prints a list of options to the console.
	 * With an option name argument, it prints the value of that option to the console.
	 * With an option name and a value, it sets the option to that value.
	 * 
	 * It also creates a function called "optionClear" on window if it doesn't exist. This is given an option name and
	 *  resets it to default.
	 */
	
	var options = {};
	
	/** Storage for the actual option data
	 * 
	 * key is the name of the option, value is a [type, default, description, values] array, where "values" may be
	 *  undefined if this isn't a selection type.
	 * 
	 * @type object
	 * @private
	 */
	var _options = {};
	
	/** Current values for options
	 * 
	 * key is option name and value is the set value of the option
	 * @type object
	 * @private
	 */
	var _optionSelected = {};
	/** Current priorities of the set options, to set new values their priority must be the same or higher
	 * 
	 * Key is option name and value is an int as follows:
	 * 0 - Never set (default)
	 * 1 - Set by the current game
	 * 2 - Set by the user
	 * 
	 * @type object
	 * @private
	 */
	var _optionSetPriority = {}; //0 = never set; 1 = set by game engine; 2 = set by user
	
	// Add functions to window
	if(!("option" in window)) {
		window.option = function(name, value) {
			if(name === undefined) options.list();
			else if(value === undefined) _listLine(name);
			else options.set(name, value, 2);
		}
	}
	
	if(!("optionClear" in window)) {
		window.optionClear = function(name) {
			options.reset(name);
		}
	}
	
	/** Registers a new option and sets its current value to the default
	 * 
	 * Any existing option will be replaced.
	 * 
	 * @param {string} name The name of the option.
	 * @param {string} type The type of the option, as described in the module docs.
	 * @param {*} def The default value of the option.
	 * @param {string} desc The description of the option, this will be shown to the user.
	 * @param {?array<string>} values The possible values of the option if it is a "selection" type.
	 */
	options.register = function(name, type, def, desc, values) {
		_options[name] = [type, def, desc, values];
		_optionSelected[name] = def;
		_optionSetPriority[name] = 0;
	};
	
	/** Returns the value of a given option
	 * 
	 * Returns undefined if there is no such option.
	 * @param {string} name The option to get.
	 */
	options.get = function(name) {
		if(!(name in _options)) {
			return;
		}
		
		return _optionSelected[name];
	};
	
	/** Resets an option to it's default value
	 * 
	 * If the option does not exist, an error is printed to the console.
	 * 
	 * @param {string} name The option to reset.
	 */
	options.reset = function(name) {
		if(!(name in _options)) {
			console.error("Option "+name+" does not exist.");
			return;
		}
		
		_optionSelected[name] = _options[name][1];
		_optionSetPriority[name] = 0;
	};
	
	/** Sets the value of an option
	 * 
	 * The priority should be `1` for values set by the game engine, and `2` for values set by the user. If you try to
	 * set an option using a lower priority than the one it was set with, this function does nothing.
	 * 
	 * If the option does not exist or the value is invalid this logs an error to the console.
	 * 
	 * @param {string} The option to set.
	 * @param {*} The value to set the option.
	 * @param {integer=1} The priority on which to set the option.
	 */
	options.set = function(name, value, priority) {
		if(priority === undefined) priority = 1;
		if(!(name in _options)) {
			console.error("Option "+name+" does not exist.");
			return;
		}
		
		if(priority < _optionSetPriority) return;
		
		var invalid = false;
		
		switch(_options[name][0]) {
			case "positiveInteger":
				if(!isNaN(+value) && value >= 0) {
					_optionSelected[name] = ~~+value;
					_optionSetPriority[name] = priority;
				}else{
					invalid = true;
				}
				break;
			
			case "positiveFloat":
				if(!isNaN(+value) && value >= 0) {
					_optionSelected[name] = +value;
					_optionSetPriority[name] = priority;
				}
				break;
			
			case "integer":
				if(!isNaN(+value)) {
					_optionSelected[name] = ~~+value;
					_optionSetPriority[name] = priority;
				}else{
					invalid = true;
				}
				break;
			
			case "float":
				if(!isNaN(+value)) {
					_optionSelected[name] = +value;
					_optionSetPriority[name] = priority;
				}else{
					invalid = true;
				}
				break;
			
			case "string":
				_optionSelected[name] = ""+value;
				_optionSetPriority[name] = priority;
				break;
			
			case "boolean":
				_optionSelected[name] = value && value !== "false";
				_optionSetPriority[name] = priority;
				break;
			
			case "selection":
				if(_options[name][3].indexOf(value) !== -1) {
					_optionSelected[name] = value;
					_optionSetPriority[name] = priority;
				}else{
					invalid = true;
				}
				break;
			
			default:
				invalid = true;
		}
		
		//Option invalid, do nothing and warn
		if(invalid) {
			console.warn("Option invalid for "+name+": "+value);
		}
	};
	
	/** Displays a list of options and their values to the console */
	options.list = function() {
		var options = Object.keys(_options).sort();
		
		console.log("---- Options Set By User ----");
		var none = true;
		for(var i = 0; i < options.length; i ++) {
			if(_optionSetPriority[options[i]] == 2) {
				_listLine(options[i]);
				none = false;
			}
		}
		if(none) console.log("(none)");
		
		console.log("---- Options Set By Game ----");
		none = true;
		for(var i = 0; i < options.length; i ++) {
			if(_optionSetPriority[options[i]] == 1) {
				_listLine(options[i]);
				none = false;
			}
		}
		if(none) console.log("(none)");
		
		console.log("---- Options Set By Default ----");
		none = true;
		for(var i = 0; i < options.length; i ++) {
			if(_optionSetPriority[options[i]] == 0) {
				_listLine(options[i]);
				none = false;
			}
		}
		if(none) console.log("(none)");
	};
	
	var _listLine = function(name) {
		var tstr = " {type:"+_options[name][0]+"; default:"+_options[name][1];
		if(_options[name][0] == "selection") tstr += "; values: "+_options[name][3].join(", ");
		tstr += "; current:"+_optionSelected[name]; 
		tstr += "}";
		
		console.log(name+": "+_options[name][2]+tstr);
	};
	
	return options;
})());
