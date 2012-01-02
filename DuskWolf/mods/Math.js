//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Math
 * 
 * This provides a few useful mathematical actions and variables.
 * 	That's it, nothing fancy.
 * 
 * Inheritance:
 * 	mods.Math { <mods.IModule>
 * 
 * Provided Actions:
 * 
 * > {"a":"sin", "to":"...", "value":"...", ("deg":true)}
 * Takes the sine of the value specified and stores it in "to".
 * 	Uses radians unless "deg" is specified, in which case degrees are used.
 * 	For convenience, it is rounded to 10 decimal places.
 * 
 * > {"a":"cos", "to":"...", "value":"...", ("deg":true)}
 * Takes the cosine of the value specified and stores it in "to".
 * 	Similar to the sin action.
 * 
 * > {"a":"tan", "to":"...", "value":"...", ("deg":true)}
 * Takes the tangent of the value specified and stores it in "to".
 * 	Similar to the sin action.
 * 	If the value is Pi/2, then Infinity is stored.
 * 
 * > {"a":"asin", "to":"...", "value":"...", ("deg":true)}
 * Takes the inverse sine of the value specified and stores it in "to".
 * 	Uses radians unless "deg" is specified, in which case degrees are used.
 * 	For convenience, it is rounded to 10 decimal places.
 * 
 * > {"a":"acos", "to":"...", "value":"...", ("deg":true)}
 * Takes the inverse cosine of the value specified and stores it in "to".
 * 	Similar to the asin action.
 * 
 * > {"a":"atan", "to":"...", "value":"...", ("deg":true)}
 * Takes the inverse tangent of the value specified and stores it in "to".
 * 	Similar to the asin action.
 * 	If the value given is Infinity, then this will store pi/2.
 * 
 * > {"a":"round", "to":"...", "value":"...", ("places":123)}
 * Rounds the value to the specified number of decimal places, 0 by defualt.
 * 
 * Variables:
 * 
 * > pi
 * The constant pi, same as JavaScript's Math.PI constant.
 * 
 * > e
 * The constant e, same as JavaScript's Math.E constant.
 * 
 * > phi
 * The constant phi, the golden ratio. The value is 1.61803398874989.
 * 
 * > infinity
 * JavaScript's Infinity constant. A number becomes this when it gets too large or small to handle.
 */
mods.Math = function(events) {
	mods.IModule.call(this, events);
};
mods.Math.prototype = new mods.IModule();
mods.Math.constructor = mods.Math;

/** Function: addActions
 * 
 * Registers the actions and sets the vars this uses, see the class description for a list of avalable ones.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Math.prototype.addActions = function() {
	this._events.registerAction("sin", this._trig, this);
	this._events.registerAction("cos", this._trig, this);
	this._events.registerAction("tan", this._trig, this);
	this._events.registerAction("asin", this._untrig, this);
	this._events.registerAction("acos", this._untrig, this);
	this._events.registerAction("atan", this._untrig, this);
	this._events.registerAction("round", this._round, this);
	
	//Constants
	this._events.setVar("pi", Math.PI);
	this._events.setVar("e", Math.E);
	this._events.setVar("phi", 1.61803398874989);
	this._events.setVar("infinity", Infinity);
};

/** Function: _trig
 * 
 * Used internally to handle the "sin", "cos" and "tan" actions.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] A "sin", "cos" or "tan" action.
 */
mods.Math.prototype._trig = function(data) {
	if(data.to === null){duskWolf.error("No target to act to.");return;}
	if(data.value === null){duskWolf.error("No value to act on.");return;}
	
	if(data.deg) data.value = (data.value/180)*Math.PI;
	
	var tmp = 0;
	
	switch(data.a){
		case "sin":
			tmp = Math.sin(data.value);
			break;
		
		case "cos":
			tmp = Math.cos(data.value);
			break;
		
		case "tan":
			tmp = Math.tan(data.value);
			if(tmp == Math.cos(Math.PI/2)) tmp = Infinity;
			break;
	}
	
	this._events.setVar(data.to, Math.round(tmp*10000000000)/10000000000);
};

/** Function: _untrig
 * 
 * Used internally to handle the "asin", "acos" and "atan" actions.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] An "asin", "acos" or "atan" action.
 */
mods.Math.prototype._untrig = function(data) {
	if(data.to === null){duskWolf.error("No target to act to.");return;}
	if(data.value === null){duskWolf.error("No value to act on.");return;}
	
	var tmp = 0;
	
	switch(data.a){
		case "asin":
			tmp = Math.asin(data.value);
			break;
		
		case "acos":
			tmp = Math.acos(data.value);
			break;
		
		case "atan":
			tmp = Math.atan(data.value);
			break;
	}
	
	tmp = Math.round(tmp*10000000000)/10000000000;
	
	this._events.setVar(data.to, data.deg?Math.round(tmp*(180/Math.PI)):tmp);
};

/** Function: _round
 * 
 * Used internally to handle the "round" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] A "round" action.
 */
mods.Math.prototype._round = function(data) {
	if(!data.to){duskWolf.error("No target to round to.");return;}
	if(!data.value){duskWolf.error("No value to round.");return;}
	if(!data.places) data.places = 1; else data.places = Math.pow(10, data.places);
	
	this._events.setVar(data.to, Math.round(data.value*data.places)/data.places);
};
