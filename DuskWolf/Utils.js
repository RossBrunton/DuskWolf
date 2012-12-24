//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.utils");

/** @namespace dusk.utils
 * 
 * @description This namespace contains general functions for manipulating data, nothing specific to any other namespace.
 */

/** Returns if the object can be parsed as a JSON string. If it returns true, then it can be assumed that `JSON.parse` will not throw any error when trying to parse the string.
 * @param {string} str The string to test.
 * @return {boolean} Whether the string is a valid JSON string.
 */
dusk.utils.isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str).replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
};

/** Makes a simple copy of the parameter object, and returns it. This will only work for simple objects, and not anything with prototypes and such like.
 * @param {object} o The source object to copy.
 * @return {object} A copy of the source object.
 */
dusk.utils.clone = function(o) {
	if(o == null || typeof(o) != 'object') return o;

	var tmp = o.constructor(); 
	for(var p in o) tmp[p] = this.clone(o[p]);

	return tmp;
};

/** Merges two objects together.
 * @param {object} a The first object.
 * @param {object} b The second object.
 * @return {object} A new object, containing all the properties of the two source objects. Note that b takes priority.
 */
dusk.utils.merge = function(a, b) {
	a = dusk.utils.clone(a);
	for(var p in b) {
		//Property in destination object set; update its value.
		if(b[p].constructor == Object && p in a) {
			a[p] = dusk.utils.merge(a[p], b[p]);
		}else{
			a[p] = b[p];
		}
	}
	
	return a;
};

/** Creates a new canvas with a specified height and width.
 * @param {number} width The width of the canvas.
 * @param {number} height The height of the canvas.
 * @return {Canvas} A canvas with those dimensions.
 * @since 0.0.12-alpha
 */
dusk.utils.createCanvas = function(width, height) {
	var hold = document.createElement("canvas");
	hold.width = width;
	hold.height = height;
	hold.style.imageRendering = "-webkit-optimize-contrast";
	return hold;
};

/** Retrieves a HTTP get var (the ?name=value part of the URL).
 * @param {string} name The name of the var to get.
 * @return {string} The value of the requested var.
 * @since 0.0.12-alpha
 */
dusk.utils.urlGet = function(name) {
	var vars = window.location.search.substring(1).split("&");
	for(var i = vars.length-1; i >= 0; i--) {
		var pair = vars[i].split("=");
		if(pair[0] == name) return decodeURIComponent(pair[1]);
	}
	
	return false;
};

/** Strips anything that looks like a comment from a JSON string, and also compile the file as DWS if neccissary.
 * @param {string} json The JSON or DWS string.
 * @param {boolean=false} dws Allow compiling as DWS if the string doesn't look like a JSON string.
 * @return {?object} a de-commented and potentially compiled object.
 * @since 0.0.12-alpha
 */
dusk.utils.jsonParse = function(json) {
	json = json.replace(/\t/g, " ").replace(/\/\*(?:.|\n)*?\*\//g, "").replace(/\n/g, " ");
	
	if(dusk.utils.isJson(json)) return JSON.parse(json);
};

/** Takes two version strings, and returns whether the first is higher than the second (1), they are the same (0) or the later is (-1).
 * 
 * It looks for the first integer it can find in each argument, and if one is higher returns the relevent value. If both numbers are the same, then the next number is searched and checked. If all the numbers are the same, returns 0. Non-numerical characters are ignored.
 * 
 * @param {string} a The first version string.
 * @param {string} b The second version string.
 * @return {number} 1, 0 or -1 depending on how the versions compare.
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
