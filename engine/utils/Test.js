//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("test", (function() {
	/** @namespace test
	 * @name test
	 * 
	 * @description This is a namespace that allows tests to be ran.
	 * @since 0.0.20-alpha
	 */
	var test = {};
	
	/** The currently running test package, should be set at the top of every testing package.
	 * @type string
	 */
	test.package = "";
	
	/** The test results, as an object, where each key is a package name, and each key of each
	 * package is a test name. The result is a boolean which says whether the test passed or not.
	 * @type object
	 */
	test.results = {};
	
	/** The currently running test name.
	 * @type string
	 * @private
	 */
	var _current = "";
	
	/** Whether to invoke the debugger if a test fails.
	 * @type boolean
	 * @default false
	 */
	test.debug = false;
	
	/** An array of all testing functions. Each value is a pair of `[packageName, function]`
	 * @type array
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _tests = [];
	
	/** Loads a dependancy file that contains only tests. This will be used with `{@link test.testAll}`
	 * to run all the tests.
	 * @param {string} url The url of the file.
	 * @return {Promise()} A promise that fullfills when downloading is complete.
	 */
	test.loadTests = function(url) {
		return load.importList(url).then(function(data, textStatus, url) {
			var importl = [];
			
			for(var i = data.length-1; i >= 0; i--) {
				importl.push(new Promise(function(f, r) {
					load.import(data[i][1][0], f);
				}));
			}
			
			return Promise.all(importl);
		});
	};
	
	/** Registers a function as a test; it will be called when tests are ran.
	 * @param {string} pack The package name of the test function.
	 * @param {function():undefined} test The test function.
	 */
	test.registerTestFunction = function(pack, test) {
		_tests.push([pack, test]);
	};
	
	/** Calls all testing functions; running all tests. 
	 * @since 0.0.21-alpha
	 */
	test.testAll = function() {
		for(var i = _tests.length-1; i >= 0; i --){
			try {
				_tests[i][1](new test.Tester(_tests[i][0]));
			}catch (e) {
				console.error(e);
				test.fail(e.message);
			}
		}
	};
	
	/** Calls `{@link test.loadTests}` followed by `{@link test.testAll}`.
	 * 
	 * @param {string} url The url of the deps file for the tests.
	 * @since 0.0.21-alpha
	 */
	test.loadAndTestAll = function(url) {
		test.loadTests(url).then(test.testAll);
	}
	
	test.Tester = function(pack) {
		this.package = pack;
	}
	
	/** Starts running a test, it is assumed it passes unless it explictly fails.
	 * @param {string} name The name of the test.
	 */
	test.Tester.prototype.start = function(name) {
		if(!(this.package in test.results)) test.results[this.package] = {};
		
		console.log("Running test \""+name+"\" of "+this.package);
		test.results[this.package][name] = true;
		this._current = name;
	};
	
	/** Fails a test, with the given reason.
	 * @param {string} reason The reason for failure.
	 */
	test.Tester.prototype.fail = function(reason) {
		test.results[this.package][this._current] = false;
		
		console.error("***** Test '"+this._current+"' of "+this.package+" failed!");
		console.error(reason);
		if(test.debug) debugger;
	};
	
	/** Fails the test if the assertion that the arguments are equal fails.
	 * @param {*} a The first object.
	 * @param {*} b The second object.
	 */
	test.Tester.prototype.assertEqual = function(a, b) {
		if(!_equals(a, b)) {
			this.fail("Assertion "+a+" = "+b+" failed.");
		}
	};
	
	/** Fails the test if the assertion that the arguments are not equal fails.
	 * @param {*} a The first object.
	 * @param {*} b The second object.
	 */
	test.Tester.prototype.assertNotEqual = function(a, b) {
		if(_equals(a, b)) {
			this.fail("Assertion "+a+" != "+b+" failed.");
		}
	};
	
	/** Fails the test if the assertion that the argument is not null or undefined fails.
	 * @param {*} a The object to check.
	 */
	test.Tester.prototype.assertExists = function(a) {
		if(a === undefined || a === null) {
			this.fail("Assertion "+a+" exists failed.");
		}
	};
	
	/** Fails the test if the assertion that the argument is not null or undefined fails.
	 * @param {*} a The object to check.
	 * @since 0.0.21-alpha
	 */
	test.Tester.prototype.assertNotExists = function(a) {
		if(!(a === undefined || a === null)) {
			this.fail("Assertion "+a+" does not exist failed.");
		}
	};
	
	/** Fails the test if the assertion that the argument is true fails.
	 * @param {*} a The object to check.
	 */
	test.Tester.prototype.assertTrue = function(a) {
		if(!a) {
			this.fail("Assertion "+a+" is true failed.");
		}
	};
	
	/** Fails the test if the assertion that the argument is false fails.
	 * @param {*} a The object to check.
	 */
	test.Tester.prototype.assertFalse = function(a) {
		if(a) {
			this.fail("Assertion "+a+" is false failed.");
		}
	};
	
	/** Returns true if the two arguments are equal, this works intuitivley, and compares the elements
	 *  for objects and arrays.
	 * @param {*} a The first object.
	 * @param {*} b The second object.
	 * @return {boolean} Whether they are equal.
	 * @private
	 */
	var _equals = function(a, b) {
		if(a == b) return true;
		
		if(typeof a != typeof b) return false;
		
		if(a instanceof HTMLCanvasElement && b instanceof HTMLCanvasElement)
			return a.toDataURL() == b.toDataURL();
		
		if(Array.isArray(a) && !Array.isArray(b)) return false;
		if(!Array.isArray(a) && Array.isArray(b)) return false;
		if(Array.isArray(a) && Array.isArray(b)) {
			if(a.length != b.length) return false;
			for(var i = a.length-1; i >= 0; i --) {
				if(!_equals(a[i], b[i])) return false;
			}
			return true;
		}else if(typeof a == "object" && typeof b == "object") {
			if(Object.keys(a).length != Object.keys(b).length) return false;
			for(var p in a) {
				if(!_equals(a[p], b[p])) return false;
			}
			return true;
		}
		
		return false;
	};
	
	Object.seal(test);
	Object.seal(test.Tester);
	Object.seal(test.Tester.prototype);
	
	return test;
})());
