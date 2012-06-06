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
 * Provided HashFunctions:
 * 
 * > #SIN(value, (deg));
 * > #COS(value, (deg));
 * > #TAN(value, (deg));
 * > #ASIN(value, (deg));
 * > #ACOS(value, (deg));
 * > #ATAN(value, (deg));
 * Returns the trig operation of the specified value.
 *	The functions use radians, unless deg, a boolean, is true.
 *	The values are rounded to 10 decimal places for convienience, exceyt inverses in degrees, which are rounded to the nearest degree.
 *	ASIN, ACOS and ATAN are inverses of their respective functions.
 *	TAN will return Infinity where approprate, and atan will return PI/2 when given Infinity.
 * 
 * > #ROUND(value, places);
 *	Rounds the value to the specified number of decimal places, no decimal places by defualt.
 * 
 * Variables:
 * 
 * > math.pi
 * The constant pi, same as JavaScript's Math.PI constant.
 * 
 * > math.e
 * The constant e, same as JavaScript's Math.E constant.
 * 
 * > math.phi
 * The constant phi, the golden ratio. The value is 1.61803398874989.
 * 
 * > math.infinity
 * JavaScript's Infinity constant. A number becomes this when it gets too large or small to handle.
 */

/** Function: mods.Math
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
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
	this._events.registerHashFunct("SIN", this._trig, this);
	this._events.registerHashFunct("COS", this._trig, this);
	this._events.registerHashFunct("TAN", this._trig, this);
	this._events.registerHashFunct("ASIN", this._untrig, this);
	this._events.registerHashFunct("ACOS", this._untrig, this);
	this._events.registerHashFunct("ATAN", this._untrig, this);
	this._events.registerHashFunct("ROUND", this._round, this);
	
	//Constants
	this._events.setVar("math.pi", Math.PI);
	this._events.setVar("math.e", Math.E);
	this._events.setVar("math.phi", 1.61803398874989);
	this._events.setVar("math.infinity", Infinity);
};

/*- Function: _trig
 * 
 * [number] Used internally to handle the trig hashfunctions.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 *	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Math.prototype._trig = function(name, args) {
	if(args.length < 1){duskWolf.error("No argument to trig function.");return;}
	if(args.length >= 2 && args[1]) args[0] = (args[0]/180)*Math.PI;
	
	var tmp = 0;
	
	switch(name){
		case "sin":
			tmp = Math.sin(args[0]);
			break;
		
		case "cos":
			tmp = Math.cos(args[0]);
			break;
		
		case "tan":
			tmp = Math.tan(args[0]);
			if(tmp == Math.tan(Math.PI/2)) tmp = Infinity;
			break;
	}
	
	return Math.round(tmp*10000000000)/10000000000;
};

/*- Function: _untrig
 * 
 * [number] Used internally to handle the inverse trig hashfunctions.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 *	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Math.prototype._untrig = function(name, args) {
	if(args.length < 1){duskWolf.error("No argument to trig function.");return;}
	
	var tmp = 0;
	
	switch(name){
		case "asin":
			tmp = Math.asin(args[0]);
			break;
		
		case "acos":
			tmp = Math.acos(args[0]);
			break;
		
		case "atan":
			tmp = Math.atan(args[0]);
			break;
	}
	
	tmp = Math.round(tmp*10000000000)/10000000000;
	
	return (args.length >= 2 && args[1])?Math.round(tmp*(180/Math.PI)):tmp;
};

/*- Function: _round
 * 
 * [number] Used internally to handle the round hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 *	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Math.prototype._round = function(name, args) {
	var places = 1;
	if(args.length < 1){duskWolf.error("Nothing to round.");return;}
	if(args.length >= 2 && args[1]) places = Math.pow(10, args[1]);
	
	return Math.round(args[0]*places)/places;
};
