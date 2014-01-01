//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.utils");

/** @namespace dusk.utils
 * 
 * @description This namespace contains general functions
 *  for manipulating data, nothing specific to any other namespace.
 */

/** Makes a simple copy of the parameter object, and returns it.
 *   This will only work for simple objects, and not anything with prototypes and such like.
 *   Anything which isn't a basic object will have it's reference copied, rather than it's value.
 * @param {*} o The source object to copy.
 * @return {object} A copy of the source object.
 */
dusk.utils.clone = function(o) {
	if(o == null || typeof(o) != 'object') return o;

	var tmp = o.constructor(); 
	for(var p in o) {
		if(typeof o[p] == "object" && Object.getPrototypeOf(o[p]) != Object.prototype && !Array.isArray(o[p])) {
			tmp[p] = o[p];
		}else{
			tmp[p] = this.clone(o[p]);
		}
	}

	return tmp;
};

/** Merges two objects together, combining their properties.
 * 
 * Note that b takes priority, so if a and b both have the same property, b's will be set.
 * 
 * @param {object} a The first object.
 * @param {object} b The second object.
 * @return {object} A new object, containing all the properties of the two source objects.
 */
dusk.utils.merge = function(a, b) {
	a = dusk.utils.clone(a);
	for(var p in b) {
		if(b[p].constructor == Object && p in a) {
			a[p] = dusk.utils.merge(a[p], b[p]);
		}else{
			a[p] = b[p];
		}
	}
	
	return a;
};

/** Returns whether an object implements a specified interface.
 * 
 * The interface is an object where the enumerable property names 
 *  with any value equivalent to true represent functions.
 * 
 * Arrays of string names of all the functions are accepted and preferable.
 * 
 * The object wishing to implement this interface must have all the specified property names be functions.
 * 
 * @param {object} obj The object you wish to check.
 * @param {object|function()|array} inter The interface that you want to check the object by.
 * @return {boolean} Whether the object implements the interface or not.
 * @since 0.0.18-alpha
 */
dusk.utils.doesImplement = function(obj, inter) {
	if(Array.isArray(inter)) {
		for(var i = inter.length-1; i > 0; i --) {
			if(!(inter[i] in obj)) {
				return false;
			}
		}
	}else{
		for(var p in inter) {
			if(!(p in obj)) {
				return false;
			}
		}
	}
	return true;
};

/** Creates a new canvas with a specified height and width.
 * 
 * @param {integer} width The width of the canvas.
 * @param {integer} height The height of the canvas.
 * @return {HTMLCanvasElement} A canvas with those dimensions.
 * @since 0.0.12-alpha
 */
dusk.utils.createCanvas = function(width, height) {
	var hold = document.createElement("canvas");
	hold.width = width;
	hold.height = height;
	hold.style.imageRendering = "-webkit-optimize-contrast";
	hold.getContext("2d").textBaseline = "middle";
	return hold;
};

/** Retrieves a HTTP get var (the ?name=value part of the URL).
 * @param {string} name The name of the var to get.
 * @return {?string} The value of the requested var.
 * 
 * @since 0.0.12-alpha
 */
dusk.utils.urlGet = function(name) {
	var vars = window.location.search.substring(1).split("&");
	for(var i = vars.length-1; i >= 0; i--) {
		var pair = vars[i].split("=");
		if(pair[0] == name) return decodeURIComponent(pair[1]);
	}
	
	return null;
};

/** Returns if the object can be parsed as a JSON string.
 *   If it returns true, then it can be assumed that `JSON.parse` will not throw any error
 *   when trying to parse the string.
 * @param {string} str The string to test.
 * @return {boolean} Whether the string is a valid JSON string.
 */
/*dusk.utils.isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str)
		.replace(/\\["\\\/bfnrtu]/g, '@')
		.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
		.replace(/(?:^|:|,)(?:\s*\[)+/g, '')
	);
}; Doesn't work */

/** Strips anything that looks like a comment from a JSON string.
 * 
 * If, after removing the comment, the string is valid JSON, then it will be parsed, else this will return null.
 * 
 * @param {string} json The JSON string.
 * @return {?object} The JSON, or `null` if it couldn't be parsed.
 * @since 0.0.12-alpha
 */
dusk.utils.jsonParse = function(json) {
	json = json.replace(/\t/g, " ").replace(/\/\*(?:.|\n)*?\*\//g, "").replace(/\n/g, " ");
	
	/*if(dusk.utils.isJson(json))*/ return JSON.parse(json);
	return null;
};

/** Takes two version strings, and returns whether the first is higher than the second (1),
 *  they are the same (0) or the later is (-1).
 * 
 * It looks for the first integer it can find in each argument, and if one is higher returns the relevent value.
 *  If both numbers are the same, then the next number is searched and checked.
 *  If all the numbers are the same, returns 0. Non-numerical characters are ignored.
 * 
 * @param {string} a The first version string.
 * @param {string} b The second version string.
 * @return {integer} 1, 0 or -1 depending on how the versions compare.
 * @since 0.0.12-alpha
 */
dusk.utils.verCompare = function(a, b) {
	var pa = 0;
	var pb = 0;
	
	var c = 100;
	while(c --) {
		var ca = "";
		var cb = "";
		do {
			if(isNaN(a[pa]) && ca) break;
			if(!isNaN(a[pa])) ca += ""+a[pa];
		} while(pa++ < a.length-1);
		do {
			if(isNaN(b[pb]) && cb) break;
			if(!isNaN(b[pb])) cb += ""+b[pb];
		} while(pb++ < b.length-1);
		
		if(+ca > +cb) return 1;
		if(+ca < +cb) return -1;
		if(ca === "" || cb === "") return 0;
	}
};

/** Resolves a relative URL into an absolute one.
 * 
 * If the URL provided is relative, then the base URL will be prepended to it.
 * 
 * @param {string} url The URL to resolve.
 * @param {string} base The base to set if the URL is relative. This must be a directory (ends with a "/").
 * @return {string} The URL, converted to absolute if needed.
 */
dusk.utils.resolveRelative = function(url, base) {
	if(url.indexOf(":") === -1 && url[0] != "/") url = base+url;
	return url;
};

/** Returns whether two arrays are equal (have the same elements at the same indexes).
 * 
 * @param {array} a The first array.
 * @param {array} b The second array.
 * @return {boolean} Whether both arrays are equal.
 */
dusk.utils.arrayEqual = function(a, b) {
	if(a.length !== b.length) return false;
	
	for(var i = a.length-1; i >= 0; i --) {
		if(a[i] !== b[i]) return false;
	}
	
	return true;
};

/** Returns a new array containing all that occur at least once in a and b in no order.
 * 
 * @param {array} a The first array.
 * @param {array} b The second array.
 * @return {array} The union of both arrays.
 */
dusk.utils.arrayUnion = function(a, b) {
	var out = [];
	
	for(var i = a.length-1; i >= 0; i --) {
		if(b.indexOf(a[i]) != -1) out[out.length] = a[i];
	}
	
	return out;
};

/** A conversion type that converts the data to and from a hexadecimal string.
 * @type string
 * @constant
 * @value "0x"
 */
dusk.utils.SD_HEX = "0x";

/** A conversion type that does simple compression that is optimised if 
 *   the array buffer has sequential repeating elements in it.
 * 
 * It optimises based on patterns; if it sees the same sequence of two bytes (16 bits), then it will compress them down.
 * @type string
 * @constant
 * @value "BC16"
 */
dusk.utils.SD_BC16 = "BC16";

/** Converts a byte buffer to a string.
 * 
 * What this string looks like depends on the co
 * @param {ArrayBuffer} arr The array buffer to stringify.
 * @param {string=dusk.utils.SD_HEX} type The method to stringify.
 * @return {string} A string representing the data.
 */
dusk.utils.dataToString = function(arr, type) {
	if(type === undefined) type = dusk.utils.SD_HEX;
	
	var out = type+":";
	
	if(type === dusk.utils.SD_HEX) {
		var buff = new Uint8Array(arr);
		for(var i = 0; i < buff.length; i ++) {
			var chr = buff[i].toString(16);
			if(chr.length == 1) chr = "0"+chr;
			out += chr;
		}
	}else if(type === dusk.utils.SD_BC16) {
		// 1 100000 00000000 Marked, patternId, count
		// First two bytes are the size of the uncompressed data. Then the next byte is the pattern count
		var hold = new ArrayBuffer(arr.byteLength*2);
		var patterns = [];
		var currentlyFeeding = -1;
		var counted = 0;
		var point = 0;
		
		var holdv = new Uint16Array(hold);
		var buff = new Uint16Array(arr);
		for(var i = 0; i < buff.length; i ++) {
			if(currentlyFeeding !== -1 && buff[i] === patterns[currentlyFeeding]) {
				//Still found it
				counted ++;
				if(counted === 0x00ff) {
					//console.log("A lot of them were found; starting again.");
					holdv[point++] = 0x8000 | (currentlyFeeding << 8) | counted;
					counted = 0;
				}
				continue;
			}else if(currentlyFeeding !== -1 && buff[i] !== patterns[currentlyFeeding]) {
				//console.log("Found a total of "+counted+" of pattern "+currentlyFeeding+
				//" which is "+patterns[currentlyFeeding]);
				holdv[point++] = 0x8000 | (currentlyFeeding << 8) | counted;
				currentlyFeeding = -1;
				i --;
				continue;
			}else if(buff[i+1] !== undefined && buff[i+2] !== undefined
			&& buff[i] === buff[i+1] && buff[i+1] === buff[i+2]) {
				//console.log("Found pattern "+buff[i]);
				for(var j = 0; j < 0x007f; j ++) {
					if(patterns[j] === undefined || patterns[j] === buff[i]) {
						//console.log("Storing it as "+j);
						currentlyFeeding = j;
						patterns[j] = buff[i];
						break;
					}
				}
				counted = 1;
				
				if(currentlyFeeding === -1) { 
					//console.log("Unfortunatley, out of slots... Whoops!");
				}else{
					continue;
				}
			}
			
			if(buff[i] & 0x8000) {
				//console.log("Large value found: "+buff[i]);
				holdv[point++] = 0xffff;
				holdv[point++] = buff[i];
			}else{
				holdv[point++] = buff[i];
			}
		}
		
		if(currentlyFeeding !== -1) {
			//console.log("Finished, and found a total of "+counted+" of pattern "+
			//currentlyFeeding+" which is "+patterns[currentlyFeeding]);
			holdv[point++] = 0x8000 | (currentlyFeeding << 8) | counted;
		}
		
		
		//Good, now let's build the final data
		var outB = new ArrayBuffer(((point+patterns.length)*2)+4);
		var view = new Uint16Array(outB);
		var p = 0;
		view[p++] = arr.byteLength;
		view[p++] = patterns.length;
		for(var i = 0; i < patterns.length; i ++) {
			view[p++] = patterns[i];
		}
		for(var i = 0; i <= point; i ++) {
			view[p++] = holdv[i];
		}
		
		return out+dusk.utils.dataToString(outB, dusk.utils.SD_HEX);
	}
	
	return out;
};

/** Converts a string to an arraybuffer, provided the string was converted using `{@link dusk.utils.dataToString}`.
 *  The method is autodetected.
 * 
 * @param {string} str The string to recover.
 * @return {ArrayBuffer} The data the string represents.
 */
dusk.utils.stringToData = function(str) {
	var type = str.split(":")[0];
	var data = str.substr(type.length+1);
	
	if(type === dusk.utils.SD_HEX) {
		var ab = new ArrayBuffer(data.length/2);
		var v = new Uint8Array(ab);
		for(var p = 0; p < data.length; p += 2) {
			v[p/2] = parseInt(data[p] + data[p+1], 16);
		}
		
		return ab;
	}else if(type === dusk.utils.SD_BC16) {
		var input = dusk.utils.stringToData(data);
		var view = new Uint16Array(input);
		var p = 0;
		
		var output = new ArrayBuffer(view[p++]);
		var ov = new Uint16Array(output);
		
		//Patterns
		var patterns = [];
		var numPatt = view[p++];
		for(var i = 0; i < numPatt; i ++) {
			patterns[i] = view[p++];
		}
		
		//Data
		for(var i = 0; i <= ov.length; i ++) {
			var current = view[p++];
			
			if(!(current & 0x8000)) {
				ov[i] = current;
			}else if(current === 0xffff) {
				ov[i] = view[p++];
			}else{
				var pid = (current & 0x7f00) >> 8;
				for(var j = current & 0x00ff; j > 0; j --) {
					ov[i++] = patterns[pid];
				}
				i --;
			}
		}
		
		return output;
	}
};

Object.seal(dusk.utils);
