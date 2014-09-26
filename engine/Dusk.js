//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk", (function() {
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var utils = load.require("dusk.utils");
	
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
	var _toPx = function(a) {
		if((""+a).slice(-2) != "px") return a+"px";
		return ""+a;
	}
	
	var _elem;
	if(document.getElementsByTagName("swo-duskwolf").length) {
		_elem = document.getElementsByTagName("swo-duskwolf")[0];
		if(_elem.getAttribute("data-frameRate")) dusk.frameRate = _elem.getAttribute("data-frameRate");
		if(_elem.getAttribute("data-data")) dusk.dataDir = _elem.getAttribute("data-data");
		if(_elem.getAttribute("data-dev") !== undefined) dusk.dev = true;
		
		_elem.style.display = "block";
		if(!_elem.style.width) _elem.style.width = _toPx(_elem.getAttribute("data-width"));
		if(!_elem.style.height) _elem.style.height = _toPx(_elem.getAttribute("data-height"));
		
		_elem.tabIndex = 0;
		
		if(!_elem.id) _elem.id = "swo-duskwolf";
		_elem.innerHTML = "<textarea id='"+_elem.id+"-input' type='text'\
		style='position:absolute;visibility:hidden;background:transparent;border:none;resize:none;overflow:hidden;'>";
		_elem.innerHTML += "<canvas id='"+_elem.id+"-canvas' style='image-rendering: -webkit-optimize-contrast;'\
		width='"+_elem.getAttribute("data-width")+"' height='"+_elem.getAttribute("data-height")+"'\
		></canvas>";
		dusk.elemPrefix = _elem.id;
		
		var pack = _elem.getAttribute("data-package");
		if(_elem.getAttribute("data-url-override") !== undefined && utils.urlGet("dwpack")) {
			pack = utils.urlGet("dwpack");
			console.log("Using alternate package "+pack);
		}
		
		load.importList(_elem.getAttribute("data-deps")).then(function() {
			load.import(pack);
		});
	}
	
	/** Returns the DuskWolf element.
	 * @return dusk.HTMLDuskWolfElement
	 * @since 0.0.21-alpha
	 */
	dusk.getElement = function() {
		return document.getElementsByTagName("swo-duskwolf")[0];
	};
	
	/** Returns the DuskWolf element's canvas.
	 * @return HTMLCanvasElement
	 * @since 0.0.21-alpha
	 */
	dusk.getElementCanvas = function() {
		return document.getElementsByTagName("swo-duskwolf")[0].getElementsByTagName("canvas")[0];
	};
	
	/** Returns the DuskWolf element's textarea.
	 * @return HTLMTextareaElement
	 * @since 0.0.21-alpha
	 */
	dusk.getElementTextarea = function() {
		return document.getElementsByTagName("swo-duskwolf")[0].getElementsByTagName("textarea")[0];
	};
	return dusk;
})());
