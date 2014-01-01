//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("test");

/** @namespace test
 * @name test
 * 
 * @description This is a namespace that allows tests to be ran.
 * @since 0.0.20-alpha
 */
 
/** Initiates this, setting up all the variables.
 *
 * @private
 */
test._init = function() {
	/** An array of strings, each string is the name of a package that when imported will do tests.
	 * @type array
	 * @private
	 */
	this._testPackages = [];
	
	/** The currently running test package, should be set at the top of every testing package.
	 * @type string
	 */
	this.package = "";
	
	/** The test results, as an object, where each key is a package name, and each key of each
	 * package is a test name. The result is a boolean which says whether the test passed or not.
	 * @type object
	 */
	this.results = {};
	
	/** The currently running test name.
	 * @type string
	 * @private
	 */
	this._current = "";
	
	/** Whether to invoke the debugger if a test fails.
	 * @type boolean
	 * @default false
	 */
	this.debug = false;
};

/** Loads a dependancy file that contains only tests. This will be used with `{@link test.testAll}`
 * to run all the tests.
 * @param {string} url The url of the file.
 */
test.loadTests = function(url) {
	dusk.load.importList(url, function(data, textStatus, url) {
		for(var i = data.length-1; i >= 0; i--) {
			test._testPackages = test._testPackages.concat(data[i][1]);
		}
	});
};

/** Imports all testing packages, in effect running all the tests. */
test.doAllTests = function() {
	for(var i = this._testPackages.length-1; i >= 0; i--) {
		dusk.load.import(this._testPackages[i]);
	}
};

/** Starts running a test, it is assumed it passes unless it explictly fails.
 * @param {string} name The name of the test.
 */
test.start = function(name) {
	if(!(this.package in this.results)) this.results[this.package] = {};
	this.results[this.package][name] = true;
	this._current = name;
};

/** Fails a test, with the given reason.
 * @param {string} reason The reason for failure.
 */
test.fail = function(reason) {
	this.results[this.package][this._current] = false;
	
	console.warn("***** Test '"+this._current+"' of "+this.package+" failed!");
	console.warn(reason);
	if(this.debug) debugger;
};

/** Fails the test if the assertion that the arguments are equal fails.
 * @param {*} a The first object.
 * @param {*} b The second object.
 */
test.assertEqual = function(a, b) {
	if(!this._equals(a, b)) {
		test.fail("Assertion "+a+" = "+b+" failed.");
	}
};

/** Fails the test if the assertion that the arguments are not equal fails.
 * @param {*} a The first object.
 * @param {*} b The second object.
 */
test.assertNotEqual = function(a, b) {
	if(this._equals(a, b)) {
		test.fail("Assertion "+a+" != "+b+" failed.");
	}
};

/** Fails the test if the assertion that the argument is not null or undefined fails.
 * @param {*} a The object to check.
 */
test.assertExists = function(a) {
	if(a === undefined || a === null) {
		test.fail("Assertion "+a+" exists failed.");
	}
};

/** Fails the test if the assertion that the argument is true fails.
 * @param {*} a The object to check.
 */
test.assertTrue = function(a) {
	if(!a) {
		test.fail("Assertion "+a+" is true failed.");
	}
};

/** Fails the test if the assertion that the argument is false fails.
 * @param {*} a The object to check.
 */
test.assertFalse = function(a) {
	if(a) {
		test.fail("Assertion "+a+" is false failed.");
	}
};

/** Returns true if the two arguments are equal, this works intuitivley, and compares the elements
 *  for objects and arrays.
 * @param {*} a The first object.
 * @param {*} b The second object.
 * @return {boolean} Whether they are equal.
 * @private
 */
test._equals = function(a, b) {
	if(a == b) return true;
	
	if(typeof a != typeof b) return false;
	
	if(a instanceof HTMLCanvasElement && b instanceof HTMLCanvasElement)
		return a.toDataURL() == b.toDataURL();
	
	if(Array.isArray(a) && !Array.isArray(b)) return false;
	if(!Array.isArray(a) && Array.isArray(b)) return false;
	if(Array.isArray(a) && Array.isArray(b)) {
		if(a.length != b.length) return false;
		for(var i = a.length-1; i >= 0; i --) {
			if(!test._equals(a[i], b[i])) return false;
		}
		return true;
	}else if(typeof a == "object" && typeof b == "object") {
		if(Object.keys(a).length != Object.keys(b).length) return false;
		for(var p in a) {
			if(!test._equals(a[p], b[p])) return false;
		}
		return true;
	}
	
	return false;
};

test._init();
