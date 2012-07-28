//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk.errors");

dusk.errors.PropertyMissing = function(action, prop) {
	this.name = "DuskPropertyMissingError";
	this.action = action;
	this.property = prop;
	this.message = "Action "+action+" is missing property "+prop;
};
dusk.errors.PropertyMissing.prototype = new Error();
dusk.errors.PropertyMissing.prototype.constructor = dusk.errors.PropertyMissing;

dusk.errors.ArgLengthWrong = function(hash, length, expected) {
	this.name = "DuskArgLengthWrongError";
	this.hash = hash;
	this.length = length;
	this.expected = expected;
	this.message = "Hashfunction expected at least "+expected+" args, but only got "+length;
};
dusk.errors.ArgLengthWrong.prototype = new Error();
dusk.errors.ArgLengthWrong.prototype.constructor = dusk.errors.ArgLengthWrong;
