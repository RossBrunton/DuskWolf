//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.options", (function() {
	/* @namespace dusk.quest
	 * @name dusk.quest
	 * 
	 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
	 * 
	 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
	 */
	var options = {};
	
	var _options = {};
	var _optionSelected = {};
	var _optionSetPriority = {}; //0 = never set; 1 = set by game engine; 2 = set by user
	
	//Function in window
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
	
	options.register = function(name, type, def, desc, values) {
		_options[name] = [type, def, desc, values];
		_optionSelected[name] = def;
		_optionSetPriority[name] = 0;
	};
	
	options.get = function(name) {
		if(!(name in _options)) {
			return;
		}
		
		return _optionSelected[name];
	};
	
	options.reset = function(name) {
		if(!(name in _options)) {
			return;
		}
		
		_optionSelected[name] = _options[name][1];
		_optionSetPriority[name] = 0;
	};
	
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
