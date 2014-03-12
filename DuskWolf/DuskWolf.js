//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.advancedLoad");

dusk.load.provide("dusk");

/** @namespace dusk
 * 
 * @description This is the "root" object for DuskWolf, and provides a few functions and configuration thingies.
 */

/** Version of the DW engine.
 *  Must contain at least one number, and numbers furthest to the left indicate newer versions.
 * @type string
 */
dusk.ver = "0.0.21-alpha";

/** The frame rate, in frames per second.
 * 
 * If it exists, this is set the value of the DuskWolf element's "frameRate" property.
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
 * @default "canvas"
 */
dusk.elemPrefix = "";

/** If true, then some features for developers are added, such as no caching for scripts and FPS info.
 * 
 * If it exists, this is set the value of the DuskWolf element's "dev" property.
 * @type boolean
 * @default true
 */
dusk.dev = true;

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
				case "width":
				case "height":
					this.style[attrName] = toPx(newVal);
					$("#"+this.id+"-canvas")[0].style[attrName] = toPx(newVal);
					break;
			}
		}
	});
}

$(document).ready(function(e) {
	function toPx(a) {
		if((""+a).slice(-2) != "px") return a+"px";
		return ""+a;
	}
	
	if($("swo-duskwolf").length) {
		var elem = $("swo-duskwolf")[0];
		if(elem.getAttribute("frameRate")) dusk.frameRate = elem.getAttribute("frameRate");
		if(elem.getAttribute("data")) dusk.dataDir = elem.getAttribute("data");
		if(elem.getAttribute("dev")) dusk.dev = true;
		
		elem.style.display = "block";
		if(!elem.style.width) elem.style.width = toPx(elem.getAttribute("width"));
		if(!elem.style.height) elem.style.height = toPx(elem.getAttribute("height"));
		
		if(!elem.id) elem.id = "swo-duskwolf";
		elem.innerHTML = "<input id='"+elem.id+"-input' type='text'\
		style='position:absolute; visibility:hidden; background:transparent; border:none;'>";
		elem.innerHTML += "<canvas id='"+elem.id+"-canvas' style='image-rendering: -webkit-optimize-contrast;'\
		width='"+elem.getAttribute("width")+"' height='"+elem.getAttribute("height")+"'\
		></canvas>";
		dusk.elemPrefix = elem.id;
		
		dusk.load.importList(elem.getAttribute("deps")).then(function() {
			dusk.load.import(elem.getAttribute("package"));
		});
	}
});
