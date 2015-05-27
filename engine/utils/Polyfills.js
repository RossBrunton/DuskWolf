//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.polyfills", (function() {
	/** This namespace includes general functions for manipulating data, nothing specific to any other namespace.
	 */
	var polyfills = {};
	
	var browser = "unknown";
	
	var browserData = {
		"firefox":["Firefox", "https://support.mozilla.org/en-US/kb/update-firefox-latest-version"],
		"chrome":["Chrome", "https://support.google.com/chrome/answer/95414"],
		"ie":["Internet Explorer", "http://windows.microsoft.com/en-us/internet-explorer/download-ie"],
		"safari":["Safari", "https://support.apple.com/en-gb/HT204416"],
		"opera":["Opera", "http://www.opera.com/computer/"]
	};
	
	// String.includes
	if(!("includes" in String.prototype)) {
		console.warn("String.includes not found, doing workaround.");
		String.prototype.includes = function(str, index) {
			return this.indexOf(str, +index || 0) !== -1;
		}
	}
	
	// Browser detection
	if(navigator.userAgent.includes("Firefox/")) {
		browser = "firefox";
	}else if(navigator.userAgent.includes("Opera/") || navigator.userAgent.includes("OPR/")) {
		browser = "opera";
	}else if(navigator.userAgent.includes("Chrome/")) {
		browser = "chrome";
	}else if(navigator.userAgent.includes("Safari/")) {
		browser = "safari";
	}else if(navigator.userAgent.includes("; MSIE")) {
		browser = "ie";
	}
	
	var fail = function(feature, versions) {
		var msg = "Sorry, your browser doesn't support ";
		msg += feature;
		if(!versions[browser]) {
			msg += ". \n\nYou will have to switch browser to Firefox or Chrome";
		}else if(browser === "unknown") {
			msg += ". \n\nPlease update your browser.";
			alert(msg);
		}else{
			msg += ", which is required. You need at least ";
			msg += browserData[browser][0];
			msg += " version ";
			msg += versions[browser];
			msg += ".\n\nPlease update your browser; click OK to do so.";
			if(confirm(msg)) {
				document.location = browserData[browser][1];
			}
		}
	};
	
	
	// String functions
	if(!("endsWith" in String.prototype)) {
		console.warn("String.endsWith not found, doing workaround.");
		String.prototype.endsWith = function(pattern) {
			var start = this.length - pattern.length;
			for(var i = 0; i < pattern.length; i ++) {
				if(this.charAt(start+i) !== pattern.charAt(i)) {
					return false;
				}
			}
			return true;
		}
	}
	
	if(!("startsWith" in String.prototype)) {
		console.warn("String.startsWith not found, doing workaround.");
		String.prototype.startsWith = function(pattern, start) {
			for(var i = 0; i < pattern.length; i ++) {
				if(this.charAt((+start || 0)+i) !== pattern.charAt(i)) {
					return false;
				}
			}
			return true;
		}
	}
	
	if(!("repeat" in String.prototype)) {
		console.warn("String.repeat not found, doing workaround.");
		String.prototype.repeat = function(count) {
			if(count < 0) throw RangeError("String.repeat: Range must be greater than 0.");
			
			var s = "";
			while(count--) {
				s += this;
			}
			return s;
		}
	}
	
	
	// Array methods
	if(!("includes" in Array.prototype)) {
		console.warn("Array.includes not found, doing workaround.");
		Array.prototype.includes = function(searchElement, fromIndex) {
			for(var i = +fromIndex || 0; i < this.length; i ++) {
				if(this[i] === searchElement) return true;
			}
			return false;
		};
	}
	
	if(!("copyWithin" in Array.prototype)) {
		console.warn("Array.copyWithin not found, doing workaround.");
		Array.prototype.copyWithin = function(target, source, end) {
			if(end === undefined) end = this.length;
			target = ~~+target;
			source = ~~+source;
			end = ~~+end;
			if(source < 0) source = this.length + source;
			if(end < 0) end = this.length + end;
			
			while(source < end) {
				this[target++] = this[source++];
			}
		};
	}
	
	if(!("fill" in Array.prototype)) {
		console.warn("Array.fill not found, doing workaround.");
		Array.prototype.fill = function(value, start, end) {
			if(end === undefined) end = this.length;
			start = ~~+start;
			end = ~~+end;
			if(start < 0) start = this.length + start;
			if(end < 0) end = this.length + end;
			
			while(start < end) {
				this[start++] = value;
			}
		};
	}
	
	if(!("findIndex" in Array.prototype)) {
		console.warn("Array.findIndex not found, doing workaround.");
		Array.prototype.findIndex = function(callback, thisArg) {
			var arr = this.slice();
			
			for(var i = 0; i < arr.length; i ++) {
				if(callback.call(thisArg, arr[i], i, this)) {
					return i;
				}
			}
			
			return -1;
		};
	}
	
	if(!("find" in Array.prototype)) {
		console.warn("Array.find not found, doing workaround.");
		Array.prototype.find = function(callback, thisArg) {
			return this.findIndex(callback, thisArg) !== -1;
		};
	}
	
	// Iterators
	try {
		eval("for(x of []);");
	} catch(e) {
		fail("for..of", {"Chrome":38, "firefox":13, "ie":null, "opera":25, "safari":"7.1"});
	}
	
	// Maps
	if(!("Map" in window)) {
		fail("Map", {"Chrome":38, "firefox":13, "ie":11, "opera":25, "safari":"7.1"});
	}
	
	// Sets
	if(!("Set" in window)) {
		fail("Set", {"Chrome":38, "firefox":13, "ie":11, "opera":25, "safari":"7.1"});
	}
	
	// Promise
	if(!("Promise" in window)) {
		fail("Promise", {"Chrome":32, "firefox":29, "ie":11, "opera":19, "safari":"7.1"});
	}
	
	// ArrayBuffers
	if(!("Uint8Array" in window)) {
		fail("Typed Arrays", {"Chrome":7, "firefox":4, "ie":10, "opera":"11.6", "safari":"5.1"});
	}
	
	// Object
	if(!("assign" in Object)) {
		console.warn("Object.assign not found, doing workaround.");
		Object.assign = function(target) {
			for(var a = 1; a < arguments.length; a ++) {
				if(arguments[a] !== null && arguments[a] !== undefined) {
					var arg = Object(arguments[a]);
					for(var p in arg) {
						var desc = Object.getOwnPropertyDescriptor(arg, p);
						if(desc !== undefined && desc.enumerable) {
							target[p] = arg[p];
						}
					}
				}
			}
			
			return target;
		};
	}
	
	// Object
	if(!("is" in Object)) {
		console.warn("Object.is not found, doing workaround.");
		Object.is = function(x, y) {
			if(x === y) {
				return x !== 0 || 1/x === 1/y;
			}else{
				return x !== x;
			}
		};
	}
	
	// Number
	if(!("isNaN" in Number)) {
		console.warn("Number.isNaN not found, doing workaround.");
		Number.isNaN = function(x) {
			return typeof x === "number" && x !== x;
		};
	}
	
	if(!("isFinite" in Number)) {
		console.warn("Number.isFinite not found, doing workaround.");
		Number.isFinite = function(x) {
			typeof x === "number" && isFinite(x);
		};
	}
	
	if(!("isInteger" in Number)) {
		console.warn("Number.isInteger not found, doing workaround.");
		Number.isInteger = function(x) {
			return typeof x === "number" && isFinite(x) && ~~x === x;
		};
	}
	
	if(!("parseFloat" in Number)) {
		console.warn("Number.parseFloat not found, doing workaround.");
		Number.parseFloat = window.parseFloat;
	}
	
	if(!("parseInt" in Number)) {
		console.warn("Number.parseInt not found, doing workaround.");
		Number.parseInt = window.parseInt;
	}
	
	if(!("EPSILON" in Number)) {
		console.warn("Number.EPSILON not found, doing workaround.");
		Number.EPSILON = 2.2204460492503130808472633361816E-16;
	}
	
	if(!("MAX_SAFE_INTEGER" in Number)) {
		console.warn("Number.MAX_SAFE_INTEGER not found, doing workaround.");
		Number.MAX_SAFE_INTEGER = 9007199254740991;
	}
	
	if(!("MIN_SAFE_INTEGER" in Number)) {
		console.warn("Number.MIN_SAFE_INTEGER not found, doing workaround.");
		Number.MIN_SAFE_INTEGER = -9007199254740991;
	}
	
	// Math
	if(!("hypot" in Math)) {
		console.warn("Math.hypot not found, doing workaround.");
		math.hypot = function() {
			var sum = 0;
			for(var a = 0; a < arguments.length; a ++) {
				sum += arguments[a] * arguments[a];
			}
			return Math.sqrt(sum);
		}
	}
	
	if(!("sign" in Math)) {
		console.warn("Math.sign not found, doing workaround.");
		math.sign = function(x) {
			x = +x;
			if(x === 0 || Math.isNaN(x)) {
				return x;
			}else{
				return x < 0 ? -1 : +1;
			}
		}
	}
	
	if(!("trunc" in Math)) {
		console.warn("Math.trunc not found, doing workaround.");
		math.trunc = function(x) {
			return x < 0 ? Math.ceil(x) : Math.floor(x);
		}
	}
	
	return polyfills;
})());
