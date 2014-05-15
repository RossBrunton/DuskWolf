//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk", (function() {
	var EventDispatcher = load.require("dusk.EventDispatcher");
	load.require("dusk.advancedLoad");
	
	/** @namespace dusk
	 * 
	 * @description This is the "root" package for DuskWolf, and provides a few functions and configuration thingies.
	 */
	//var dusk; //Change when ready
	
	/** Version of the DW engine.
	 *  Must contain at least one number, and numbers furthest to the left indicate newer versions.
	 * @type string
	 */
	dusk.ver = "0.0.21-alpha";

	/** The frame rate, in frames per second.
	 * 
	 * If it exists, this is set the value of the DuskWolf element's "frameRate" property.
	 * 
	 * Currently unused, always the refresh rate of the monitor (60fps).
	 * @type integer
	 * @default 60
	 */
	dusk.frameRate = 60; 

	/** The path to the data directory,
	 *   this is where the game will look for all it's data (like images) if given a relative URL.
	 * 
	 * If it exists, this is set the value of the DuskWolf element's "data" property.
	 * @type string
	 * @defualt "Data/"
	 */
	dusk.dataDir = "Data/";

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
	 * @type dusk.EventDispatcher
	 * @since 0.0.14-alpha
	 */
	dusk.onLoad = new dusk.EventDispatcher("dusk.onLoad");

	/** Call this to start the game, and fire the dusk.onLoad EventDispatcher. */
	dusk.startGame = function() {
		dusk.started = true;
		dusk.onLoad.fire();
	};

	dusk.HTMLDuskwolfElement = null;
	if("register" in document) {
		dusk.HTMLDuskwolfElement = document.register("swo-duskwolf", {
			prototype: Object.create(HTMLDivElement.prototype),
			extends: "div",
			attributeChangedCallback:function(attrName, oldVal, newVal) {
				function toPx(a) {
					if((""+a).slice(-2) != "px") return a+"px";
					return ""+a;
				}
				
				switch(attrName) {
					case "data-width":
					case "data-height":
						this.style[attrName] = toPx(newVal);
						document.getElementById(this.id+"-canvas").style[attrName] = toPx(newVal);
						break;
				}
			}
		});
	}

	//We seem to be already loaded here
	function toPx(a) {
		if((""+a).slice(-2) != "px") return a+"px";
		return ""+a;
	}
	
	if(document.getElementsByTagName("swo-duskwolf").length) {
		var elem = document.getElementsByTagName("swo-duskwolf")[0];
		if(elem.getAttribute("data-frameRate")) dusk.frameRate = elem.getAttribute("data-frameRate");
		if(elem.getAttribute("data-data")) dusk.dataDir = elem.getAttribute("data-data");
		if(elem.getAttribute("data-dev") !== undefined) dusk.dev = true;
		
		elem.style.display = "block";
		if(!elem.style.width) elem.style.width = toPx(elem.getAttribute("data-width"));
		if(!elem.style.height) elem.style.height = toPx(elem.getAttribute("data-height"));
		
		if(!elem.id) elem.id = "swo-duskwolf";
		elem.innerHTML = "<textarea id='"+elem.id+"-input' type='text'\
		style='position:absolute;visibility:hidden;background:transparent;border:none;resize:none;overflow:hidden;'>";
		elem.innerHTML += "<canvas id='"+elem.id+"-canvas' style='image-rendering: -webkit-optimize-contrast;'\
		width='"+elem.getAttribute("data-width")+"' height='"+elem.getAttribute("data-height")+"'\
		></canvas>";
		dusk.elemPrefix = elem.id;
		
		dusk.load.importList(elem.getAttribute("data-deps")).then(function() {
			dusk.load.import(elem.getAttribute("data-package"));
		});
	}
	
	return dusk;
})());
