//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.Core
 * 
 * This provides a few actions that are not necessary for operation of the Events system, but are useful nonetheless.
 * 	It generally contains action that do things for your convenience.
 * 
 * Inheritance:
 * 	mods.Core { <mods.IModule>
 * 
 * Provided Actions:
 * 
 * > {"a":"print", "text":"..."}
 * 	Prints the text to the normal log locations if <DuskWolf.logLevel> or <DuskWolf.htmlLogLevel> are greater than or equal to 3.
 * 	All it does is call <DuskWolf.info>, and should be used in the same places.
 * 
 * > {"a":"error", "text":"..."}
 * 	Prints the text to the normal log locations if <DuskWolf.logLevel> or <DuskWolf.htmlLogLevel> are greater than or equal to 1.
 * 	All it does is call <DuskWolf.error>, and should be used in the same places.
 * 
 * > {"a":"warn", "text":"..."}
 * 	Prints the text to the normal log locations if <DuskWolf.logLevel> or <DuskWolf.htmlLogLevel> are greater than or equal to 2.
 * 	All it does is call <DuskWolf.warn>, and should be used in the same places.
 * 
 * > {"a":"inc", "var":"...", ("by":123)}
 * 	Increments the "var" value by "by", which is 1 by default.
 * 
 * > {"a":"mul", "var":"...", ("by":123)}
 *	Multiplies the "var" value by "by", and stores it back into the var, "by" is 2 if not specified. You can do division by using fractional multipliers.
 * 
 * > {"a":"modulo", "var":"...", ("by":123)}
 *	Modulos the "var" value by "by", and stores it back into the var, "by" is 10 if not specified.
 * 
 * Provided HashFunctions:
 * 
 * > #+(a, b, (c, (d, ...)));
 * 	Returns the sum of all the numbers!
 *
 * > #*(a, b, (c, (d, ...)));
 * 	Returns the product of all the numbers!
 * 
 * > #/(original, by);
 * 	Divides the original number by the "by" value, which is 2 if ommited.
 * 
 * > #%(original, by);
 * 	Takes "original" modulo "by", in which "by" is 10 if ommited.
 */

/** Function: mods.Core
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
 */
mods.Core = function(events) {
	mods.IModule.call(this, events);
};
mods.Core.prototype = new mods.IModule();
mods.Core.constructor = mods.Core;

/** Function: addActions
 * 
 * Registers the actions and sets the vars this uses, see the class description for a list of avalable ones.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Core.prototype.addActions = function() {
	this._events.registerAction("print", function(a) {duskWolf.info(a.text);return true;}, this, [["text", true, "STR"]]);
	this._events.registerAction("error", function(a) {duskWolf.error(a.text);return true;}, this, [["text", true, "STR"]]);
	this._events.registerAction("warn", function(a) {duskWolf.warn(a.text);return true;}, this, [["text", true, "STR"]]);
	this._events.registerAction("inc", this._increment, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	this._events.registerAction("mul", this._multiply, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	this._events.registerAction("div", this._divide, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	this._events.registerAction("modulo", this._modulo, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	
	this._events.registerHashFunct("/", this._div, this);
	this._events.registerHashFunct("%", this._mod, this);
	this._events.registerHashFunct("+", this._sum, this);
	this._events.registerHashFunct("*", this._prod, this);
};

/*- Function: _increment
 * 
 * Used internally to handle the "inc" action.
 *	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 *	data		- [object] A "inc" action.
 */
mods.Core.prototype._increment = function(data) {
	if(data["var"] === undefined){duskWolf.error("No var to increment.");return;}
	if(data.by === undefined) data.by = 1;
	
	this._events.setVar(data["var"], Number(events.getVar(data["var"]))+Number(data.by));
};

/*- Function: _multiply
 * 
 * Used internally to handle the "mul" action.
 *	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 *	data		- [object] A "mul" action.
 */
mods.Core.prototype._multiply = function(data) {
	if(data["var"] === undefined){duskWolf.error("No var to multiply.");return;}
	if(data.by === undefined) data.by = 2;
	
	this._events.setVar(data["var"], Number(events.getVar(data["var"]))*Number(data.by));
};

/*- Function: _modulo
 * 
 * Used internally to handle the "modulo" action.
 *	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 *	data		- [object] An "modulo" action.
 */
mods.Core.prototype._modulo = function(data) {
	if(data["var"] === undefined){duskWolf.error("No var to modulo.");return;}
	if(data.by === undefined) data.by = 10;
	
	this._events.setVar(data["var"], Number(events.getVar(data["var"]))%Number(data.by));
};

/*- Function: _sum
 * 
 * [number] Used internally to handle the "+" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 *	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Core.prototype._sum = function(name, args) {
	if(args.length < 1){duskWolf.error("Nothing to sum.");return;}
	var total = 0;
	for(var i = args.length-1; i >= 0; i--){
		total += Number(args[i]);
	}
	
	return total;
};

/*- Function: _prod
 * 
 * [number] Used internally to handle the "*" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 *	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Core.prototype._prod = function(name, args) {
	if(args.length < 1){duskWolf.error("Nothing to product.");return;}
	var total = 1;
	for(var i = args.length-1; i >= 0; i--){
		total *= Number(args[i]);
	}
	
	return total;
};

/*- Function: _div
 * 
 * [number] Used internally to handle the "/" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 *	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Core.prototype._div = function(name, args) {
	if(args[0] === undefined){duskWolf.error("Nothing to divide.");return;}
	if(args[1] === undefined) args[1] = 2;
	
	return Number(args[0])/Number(args[1]);
};

/*- Function: _mod
 * 
 * [number] Used internally to handle the "MOD" hashfunction.
 *	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 * 	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
mods.Core.prototype._mod = function(name, args) {
	if(args[0] === undefined){duskWolf.error("Nothing to modulo.");return;}
	if(args[1] === undefined) args[1] = 10;
	
	return Number(args[0])%Number(args[1]);
};
