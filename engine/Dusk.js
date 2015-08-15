//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk", (function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var utils = load.require("dusk.utils");
	var polyfills = load.require("dusk.utils.polyfills");
	
	/** @namespace dusk
	 * 
	 * @description This is the "root" package for DuskWolf, and provides a few functions and configuration thingies.
	 */
	var dusk = {};
	
	/** Version of the DW engine.
	 *  Must contain at least one number, and numbers furthest to the left indicate newer versions.
	 * @type string
	 */
	dusk.ver = "0.0.21-alpha";
	
	/** The path to the data directory,
	 *   this is where the game will look for all it's data (like images) if given a relative URL.
	 * 
	 * If it exists, this is set the value of the DuskWolf element's "data" property.
	 * @type string
	 * @defualt "data/"
	 */
	dusk.dataDir = "data/";
	
	/** The id of the DuskWolf element, used for referencing it's children.
	 * 
	 * This is set automatically.
	 * @type string
	 * @see dusk.sgui
	 */
	dusk.elemPrefix = "";
	
	/** If true, then some features for developers are added, such as no caching for scripts and FPS info.
	 * 
	 * If it exists, this is set the value of the DuskWolf element's "dev" property.
	 * @type boolean
	 */
	dusk.dev = false;
	
	/** If true, then the game has been started (`{@link dusk.startGame}` has been called).
	 * @type boolean
	 */
	dusk.started = false;
	
	/** An event dispatcher which fires when the game engine is ready to go.
	 * 
	 * The events fired have no properties.
	 * 
	 * @type dusk.utils.EventDispatcher
	 * @since 0.0.14-alpha
	 */
	dusk.onLoad = new EventDispatcher("dusk.onLoad");
	
	/** Call this to start the game, and fire the dusk.onLoad EventDispatcher. */
	dusk.startGame = function() {
		if(dusk.started) return;
		_elem.focus();
		dusk.started = true;
		dusk.onLoad.fire();
	};
	
	//We seem to be already loaded here
	var _toPx = function(a) {
		if((""+a).slice(-2) != "px") return a+"px";
		return ""+a;
	}
	
	var _elem;
	if(document.getElementsByTagName("dw-settings").length) {
		_elem = document.getElementsByTagName("dw-settings")[0];
		if(_elem.getAttribute("data-data")) dusk.dataDir = _elem.getAttribute("data-data");
		if(_elem.getAttribute("data-dev") !== undefined) dusk.dev = true;
		
		var pack = _elem.getAttribute("data-package");
		if(_elem.getAttribute("data-url-override") !== undefined && utils.urlGet("dwpack")) {
			pack = utils.urlGet("dwpack");
			console.log("Using alternate package "+pack);
		}
		
		load.importList(_elem.getAttribute("data-deps")).then(function() {
			load.import(pack);
		});
	}
	
	return dusk;
})());
