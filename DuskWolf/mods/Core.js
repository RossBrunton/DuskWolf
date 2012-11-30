//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.mods.core");

/** @namespace dusk.mods.core
 * @name dusk.mods.core
 * 
 * @description This module contains several usefull functions, like maths and logging.
 * 
 * This namespace has no public members.
 */

 /* > {"a":"print", "text":"..."}
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

/** This initiates the module, registering all the actions and variables. This is called automatically when the file is loaded.
 * @private
 */
dusk.mods.core._init = function() {
	dusk.actions.registerAction("print", function(a) {console.log(a.text);return true;}, this, [["text", true, "STR"]]);
	dusk.actions.registerAction("error", function(a) {console.error(a.text);return true;}, this, [["text", true, "STR"]]);
	dusk.actions.registerAction("warn", function(a) {console.warn(a.text);return true;}, this, [["text", true, "STR"]]);
	dusk.actions.registerAction("inc", this._increment, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	dusk.actions.registerAction("mul", this._multiply, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	dusk.actions.registerAction("div", this._divide, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	dusk.actions.registerAction("modulo", this._modulo, this, [["var", true, "STR"], ["by", false, "NUM"]]);
	dusk.actions.registerAction("jsprofile", function(a) {if("profile" in console) console.profile(a.label?a.label:"DuskWolf Profile");}, this, [["label", true, "STR"]]);
	dusk.actions.registerAction("jsprofile-end", function(a) {if("profileEnd" in console) console.profileEnd();}, this, []);
	
	dusk.actions.registerHashFunct("/", this._div, this);
	dusk.actions.registerHashFunct("%", this._mod, this);
	dusk.actions.registerHashFunct("+", this._sum, this);
	dusk.actions.registerHashFunct("*", this._prod, this);
};

/** Used internally to handle the `inc` action. This should not be called by anything else.
 * @param {object} data An `inc` action.
 * @private
 */
dusk.mods.core._increment = function(data) {
	if(data["var"] === undefined){throw new dusk.errors.PropertyMissing(data.a, "var");}
	if(data.by === undefined) data.by = 1;
	
	dusk.actions.setVar(data["var"], +dusk.actions.getVar(data["var"])+data.by);
};

/** Used internally to handle the `mul` action. This should not be called by anything else.
 * @param {object} data A `mul` action.
 * @private
 */
dusk.mods.core._multiply = function(data) {
	if(data["var"] === undefined){throw new dusk.errors.PropertyMissing(data.a, "var");}
	if(data.by === undefined) data.by = 2;
	
	dusk.actions.setVar(data["var"], +dusk.actions.getVar(data["var"])*data.by);
};

/** Used internally to handle the `modulo` action. This should not be called by anything else.
 * @param {object} data A `modulo` action.
 * @private
 */
dusk.mods.core._modulo = function(data) {
	if(data["var"] === undefined){throw new dusk.errors.PropertyMissing(data.a, "var");}
	if(data.by === undefined) data.by = 10;
	
	dusk.actions.setVar(data["var"], Number(dusk.actions.getVar(data["var"]))%Number(data.by));
};

/** Used internally to handle the `+` hashfunction. This should not be called by anything else.
 * @param {string} name The hashfunct name.
 * @param {array} args The arguments of the hashfunction.
 * @return {number} The hasfunction output.
 * @private
 */
dusk.mods.core._sum = function(name, args) {
	if(args.length < 1){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	var total = 0;
	for(var i = args.length-1; i >= 0; i--){
		total += Number(args[i]);
	}
	
	return total;
};

/** Used internally to handle the `*` hashfunction. This should not be called by anything else.
 * @param {string} name The hashfunct name.
 * @param {array} args The arguments of the hashfunction.
 * @return {number} The hasfunction output.
 * @private
 */
dusk.mods.core._prod = function(name, args) {
	if(args.length < 1){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	var total = 1;
	for(var i = args.length-1; i >= 0; i--){
		total *= Number(args[i]);
	}
	
	return total;
};

/** Used internally to handle the `/` hashfunction. This should not be called by anything else.
 * @param {string} name The hashfunct name.
 * @param {array} args The arguments of the hashfunction.
 * @return {number} The hasfunction output.
 * @private
 */
dusk.mods.core._div = function(name, args) {
	if(args[0] === undefined){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	if(args[1] === undefined) args[1] = 2;
	
	return Number(args[0])/Number(args[1]);
};

/** Used internally to handle the `MOD` hashfunction. This should not be called by anything else.
 * @param {string} name The hashfunct name.
 * @param {array} args The arguments of the hashfunction.
 * @return {number} The hasfunction output.
 * @private
 */
dusk.mods.core._mod = function(name, args) {
	if(args[0] === undefined){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	if(args[1] === undefined) args[1] = 10;
	
	return Number(args[0])%Number(args[1]);
};

dusk.mods.core._init();
