//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.errors");

/** @namespace dusk.errors
 * 
 * @description This provides any error classes that may be used by DuskWolf.
 */

/** Creates a new PropertyMissingError.
 * @param {string} action The action on which the property is missing.
 * @param {string} prop The name of the property which is missing.
 * 
 * @constructor
 * 
 * @classdesc Thrown if the Events system tried to run an action, but did not provide an expected property.
 */
dusk.errors.PropertyMissing = function(action, prop) {
	this.name = "DuskPropertyMissingError";
	this.action = action;
	this.property = prop;
	this.message = "Action "+action+" is missing property "+prop;
};
dusk.errors.PropertyMissing.prototype = new Error();
dusk.errors.PropertyMissing.prototype.constructor = dusk.errors.PropertyMissing;

/** Creates a new PropertyMissingError.
 * @param {string} action The action on which the property is missing.
 * @param {string} prop The name of the property which is missing.
 * 
 * @constructor
 * 
 * @classdesc <p>Thrown if the Events system tried to run an action, but did not provide an expected property.</p>
 */
dusk.errors.ArgLengthWrong = function(hash, length, expected) {
	this.name = "DuskArgLengthWrongError";
	this.hash = hash;
	this.length = length;
	this.expected = expected;
	this.message = "Hashfunction expected at least "+expected+" args, but only got "+length;
};
dusk.errors.ArgLengthWrong.prototype = new Error();
dusk.errors.ArgLengthWrong.prototype.constructor = dusk.errors.ArgLengthWrong;
