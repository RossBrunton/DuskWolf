//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.options.OptionType", (function() {
	/** An OptionType is a handler for an option key which handles validation and casting
	 * 
	 * It has two main methods, `validate` which returns whether the value is valid or not, and `cast` which converts
	 *  an arbitary valid value to the appropriate type to be stored in the option.
	 * 
	 * @param {string} name The name of the type, as displayed to the user if needed.
	 * @param {function(*, *):boolean} validate The validation function, takes a potential new option value and an
	 *  argument set at register, and should return true iff it is a valid value for this option.
	 * @param {function(*, *):*} cast The casting function, takes the same arguments as `validate` and should return a 
	 *  value cast to the appropriate type for the option.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var OptionType = function(name, validate, cast) {
		this._validator = validate;
		this.name = name;
		this._cast = cast;
	};
	
	/** Returns true iff the given value is a valid value.
	 * @param {*} value The value to check.
	 * @param {*} arg A value stored when the option is registered.
	 * @return {boolean} Whether this value is valid.
	 */
	OptionType.prototype.validate = function(value, arg) {
		return this._validator(value, arg);
	};
	
	/** Converts the value to the correct type for this option.
	 * @param {*} value The value to convert.
	 * @param {*} arg A value stored when the option is registered.
	 * @return {*} The appropriate value in its correct type.
	 */
	OptionType.prototype.cast = function(value, arg) {
		return this._cast(value, arg);
	};
	
	OptionType.prototype.toString = function() {
		return "[OptionType "+this.name+"]";
	};
	
	return OptionType;
})());

load.provide("dusk.options", (function() {
	var OptionType = load.require("dusk.options.OptionType");
	
	/** Options provide a simple way to allow user or per-game configurable settings on how DuskWolf runs
	 * 
	 * Options are identified by a string name in "category.key" format, where category is generally something like
	 *  "graphics" or "gamepad". They also have a type, a default value and a description for the user. To register new
	 *  options, `options.register` must be called with these values.
	 * 
	 * Options may be set by the user, or by the engine. Settings set by the user take priority, so you should not
	 *  assume that just because you set a specific option it will actually be that value.
	 * 
	 * The possible types available are defined as OptionTypes, members of this namespace are as follows:
	 * - positiveInteger: An integer > 0, non-integer values will be converted to ints.
	 * - natural: An integer >= 0, again, non-integer values will be converted.
	 * - positiveOrZeroFloat: A number >= 0.
	 * - integer: An integer, non-integer values will be converted to ints.
	 * - float: A number.
	 * - string: A string.
	 * - boolean: A boolean, the string "false" evaluates to false for the purposes of this type.
	 * - select: A string value from a list provided (as the `values` parameter to the register function) when the
	 *  option was registered.
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
	 * @param {dusk.options.OptionType} type The type of the option.
	 * @param {*} def The default value of the option.
	 * @param {string} desc The description of the option, this will be shown to the user.
	 * @param {?*} values An argument for the OptionType instance, provided as the second argument to `validate` and
	 *  `cast`.
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
		
		if(_options[name][0].validate(value, _options[name][3])) {
			_optionSelected[name] = _options[name][0].cast(value, _options[name][3]);
			_optionSetPriority[name] = priority;
			return;
		}else{
			console.warn("Option invalid for "+name+": "+value);
			return;
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
		var tstr = " {type:"+_options[name][0].name+"; default:"+_options[name][1];
		if(_options[name][3]) {
			tstr += "; options: "+_options[name][3];
		}
		tstr += "; current:"+_optionSelected[name]; 
		tstr += "}";
		
		console.log(name+": "+_options[name][2]+tstr);
	};
	
	// Here are the option types
	/** Type for an integer > 0.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.positiveInteger =
		new OptionType("positiveInteger", function(x, a) {return ~~+x > 0}, function(x, a) {return ~~+x});
	
	/** Type for an integer >= 0.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.natural =
		new OptionType("natural", function(x, a) {return ~~+x >= 0}, function(x, a) {return ~~+x});
	
	/** Type for any integer.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.integer =
		new OptionType("integer", function(x, a) {return ~~+x != NaN}, function(x, a) {return ~~+x});
	
	/** Type for a number >= 0.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.positiveOrZeroFloat =
		new OptionType("positiveOrZeroFloat", function(x, a) {return +x >= 0}, function(x, a) {return +x});
	
	/** Type for a boolean.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.boolean =
		new OptionType("boolean", function(x, a) {return true}, function(x, a) {return x != "false" && x});
	
	/** Type for a string.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.string =
		new OptionType("string", function(x, a) {return typeof a !== "symbol"}, function(x, a) {return ""+x});
	
	/** Type for a selection.
	 * @type dusk.options.OptionType
	 * @since 0.0.21-alpha
	 */
	options.select =
		new OptionType("select", function(x, a) {return a.includes(x)}, function(x, a) {return x});
	
	return options;
})());
