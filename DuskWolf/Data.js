//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk");
dusk.load.require("dusk.utils");

dusk.load.provide("dusk.data");

/** @namespace dusk.data
 * 
 * @description This module provides the ability to download files.
 * 
 * Files downloaded are cached, so that if a file has already been downloaded, it isn't downloaded again.
 * 
 * All relative URLs are resolved relative to `{@link dusk.dataDir}`.
 */

/** This initiates all the variables in this namespace, and is automatically called.
 * @private
 */
dusk.data._init = function() {
	/** This is an object, containing all the files that have been downloaded.
	 *   The key is the filename, and the value is ether a string, or a HTML Image tag, depending on filetype.
	 * @type object
	 * @private
	 */
	dusk.data._loaded = {};
	
	//Enable/disable cache
	$.ajaxSetup({"cache": !dusk.dev});
};

/* * Downloads a file, and returns its contents.
 * 
 * @param {string} file The file name, realtive to {@link dusk.dataDir}.
 * @param {string=""} type The file type, this may be any value for <code>"dataType"</code> 
 * that JQuery's ajax method supports.
 * @param {function(object, *):undefined} 
 * /
dusk.data.download = function(file, type, callback, state) {
	var url = dusk.util.resolveRelative(file, dusk.dataDir);
	
	if(this._loaded[url] === undefined) {
		console.log("Downloading file "+url+"...");
		this._loaded[url] = [false, [[callback, state]]];
		
		$.ajax({"async":true, "dataType":(type!==undefined?type:"text"),
			"error":function(jqXHR, textStatus, errorThrown) {
				console.error("Error getting "+file+", "+errorThrown);
			}, "success":function(data, textStatus, jqXHR) {
				this.url = this.url.split("?_=")[0];
				for(var i = dusk.data._loaded[this.url][1].length-1; i >= 0; i --) {
					dusk.data._loaded[this.url][1][i][0](data, dusk.data._loaded[this.url][1][i][1]);
				}
				dusk.data._loaded[this.url] = data;
			}, "url":url
		});
	}else if(typeof this._loaded[url] === "array" && !this._loaded[url][0]){
		this._loaded[url][1].push([callback, state]);
	}else{
		callback(this._loaded[url], state);
	}
};*/

/** Returns a HTML image object with the specified path.
 * 
 * If there is an image that has already been created with this path then it is returned
 *  so a new one is not created every time.
 * 
 * If you call this without asigning the return value to anything, the image should download in the background.
 * 
 * The path may be relative to `{@link dusk.dataDir}`.
 * 
 * @param {string} file The image file to set as the src value of the image.
 * @return {HTMLImageElement} A HTML Image tag with the src set to the path requested.
 */
dusk.data.grabImage = function(file) {
	if(!file) {
		//Blank image
		return new Image();
	}
	
	if(!(file in this._loaded)) {
		console.log("Downloading image "+file+"...");
		
		this._loaded[file] = new Image();
        this._loaded[file].src = dusk.utils.resolveRelative(file, dusk.dataDir) 
        /*+ (dusk.dev?"?_="+(new Date()).getTime():"")*/;
		return this._loaded[file];
	}
	return this._loaded[file];
};

dusk.data._init();

Object.seal(dusk.data);
