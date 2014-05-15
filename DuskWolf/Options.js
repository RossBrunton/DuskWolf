//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.options");

/* @namespace dusk.quest
 * @name dusk.quest
 * 
 * @description Plat is a simple platforming engine that uses `{@link dusk.sgui}`.
 * 
 * Importing this package will automatically set up a pane and stuff that a platformer can be used in.
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
dusk.options._init = function() {
	this._options = {};
	this._optionSelected = {};
	this._optionSetPriority = {}; //0 = never set; 1 = set by game engine; 2 = set by user
	
	//Function in window
	if(!("option" in window)) {
		window.option = function(name, value) {
			if(name === undefined) dusk.options.list();
			else if(value === undefined) dusk.options._listLine(name);
			else dusk.options.set(name, value, 2);
		}
	}
	
	if(!("optionClear" in window)) {
		window.optionClear = function(name) {
			dusk.options.reset(name);
		}
	}
};

dusk.options.register = function(name, type, def, desc, values) {
	this._options[name] = [type, def, desc, values];
	this._optionSelected[name] = def;
	this._optionSetPriority[name] = 0;
};

dusk.options.get = function(name) {
	if(!(name in this._options)) {
		return;
	}
	
	return this._optionSelected[name];
};

dusk.options.reset = function(name) {
	if(!(name in this._options)) {
		return;
	}
	
	this._optionSelected[name] = this._options[name][1];
	this._optionSetPriority[name] = 0;
};

dusk.options.set = function(name, value, priority) {
	if(priority === undefined) priority = 1;
	if(!(name in this._options)) {
		console.error("Option "+name+" does not exist.");
		return;
	}
	
	if(priority < this._optionSetPriority) return;
	
	switch(this._options[name][0]) {
		case "positiveInteger":
			if(!isNaN(+value) && value >= 0) {
				this._optionSelected[name] = ~~+value;
				this._optionSetPriority[name] = priority;
			}
			break;
		
		case "positiveFloat":
			if(!isNaN(+value) && value >= 0) {
				this._optionSelected[name] = +value;
				this._optionSetPriority[name] = priority;
			}
			break;
		
		case "integer":
			if(!isNaN(+value)) {
				this._optionSelected[name] = ~~+value;
				this._optionSetPriority[name] = priority;
			}
			break;
		
		case "float":
			if(!isNaN(+value)) {
				this._optionSelected[name] = +value;
				this._optionSetPriority[name] = priority;
			}
			break;
		
		case "string":
			this._optionSelected[name] = ""+value;
			this._optionSetPriority[name] = priority;
			break;
		
		case "boolean":
			this._optionSelected[name] = value && value !== "false";
			this._optionSetPriority[name] = priority;
			break;
		
		case "selection":
			if(this._options[name][3].indexOf(value) !== -1) {
				this._optionSelected[name] = value;
				this._optionSetPriority[name] = priority;
			}
			break;
	}
	
	//Option invalid, do nothing
};

dusk.options.list = function() {
	var options = Object.keys(dusk.options._options).sort();
	
	console.log("---- Options Set By User ----");
	var none = true;
	for(var i = 0; i < options.length; i ++) {
		if(this._optionSetPriority[options[i]] == 2) {
			dusk.options._listLine(options[i]);
			none = false;
		}
	}
	if(none) console.log("(none)");
	
	console.log("---- Options Set By Game ----");
	none = true;
	for(var i = 0; i < options.length; i ++) {
		if(this._optionSetPriority[options[i]] == 1) {
			dusk.options._listLine(options[i]);
			none = false;
		}
	}
	if(none) console.log("(none)");
	
	console.log("---- Options Set By Default ----");
	none = true;
	for(var i = 0; i < options.length; i ++) {
		if(this._optionSetPriority[options[i]] == 0) {
			dusk.options._listLine(options[i]);
			none = false;
		}
	}
	if(none) console.log("(none)");
};

dusk.options._listLine = function(name) {
	var tstr = " {type:"+this._options[name][0]+"; default:"+this._options[name][1];
	if(this._options[name][0] == "selection") tstr += "; values: "+this._options[name][3].join(", ");
	tstr += "; current:"+this._optionSelected[name]; 
	tstr += "}";
	
	console.log(name+": "+this._options[name][2]+tstr);
};

dusk.options._init();
