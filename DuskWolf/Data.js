//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk");
dusk.load.require("dusk.utils");
dusk.load.require("dusk.EventDispatcher");

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
	
	/** Fired once when an image has completed loading.
	 * 
	 * The event object has two properties; `src`, the full src of the image, and `img`, the actual image object.
	 * @type dusk.EventDispatcher
	 * @since 0.0.19-alpha
	 */
	dusk.data.imgLoad = new dusk.EventDispatcher("dusk.data.imgLoad");
	
	//Enable/disable cache
	$.ajaxSetup({"cache": !dusk.dev});
};

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
		this._loaded[file].src = dusk.utils.resolveRelative(file, dusk.dataDir);
        this._loaded[file].onload = dusk.data._imgOnLoad;
        
		return this._loaded[file];
	}
	return this._loaded[file];
};

/** Attached to images' `onLoad` event. Manages firing of `{@link dusk.data.imgLoad}`.
 * 
 * @param {Event} e The image onLoad event.
 * @private
 * @since 0.0.19-alpha
 */
dusk.data._imgOnLoad = function(e) {
	dusk.data.imgLoad.fire({"src":this.src, "img":this});
};

dusk.data._init();

Object.seal(dusk.data);
