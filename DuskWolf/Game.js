//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk");
dusk.load.require("dusk.data");
dusk.load.require("dusk.actions");

dusk.load.provide("dusk.game");

/** @namespace dusk.game
 * 
 * @description This is the main game class, it downloads all the files that the root.json requests in `coms`, `mods` and `req`.
 * 
 * It does this by adding a dependency for all the files on the namespace `dusk.gameStarter`, which contains a redefintion of {@link dusk.startGame}, and requiring that.
 */
	
/** Initiates all the variables needed, downloads all the files, and starts all the timers.
 * 
 * It also calls {@link dusk.actions.init}
 */
dusk.game.init = function() {
	console.log("DuskWolf ver "+dusk.ver+" is starting.");
	
	//Timer
	this._framesRan = 0;
	this._time = (new Date()).getTime();
	
	this._rframesRan = 0;
	this._rtime = (new Date()).getTime();
	
	/* Game crashed? */
	this._crashed = false;
	
	dusk.actions.init();
	
	var required = [];
	
	//External dependencies
	if("external" in dusk.data.root) {
		for(var i = dusk.data.root.external.length-1; i >= 0; i--) {
			if(typeof dusk.data.root.external[i] == "object"){
				console.log("External import: "+dusk.data.root.external[i][0]+"...");
				dusk.load.addDependency(dusk.data.root.external[i][0], dusk.data.root.external[i][1], dusk.data.root.external[i][2]);
			}
		}
	}
	
	//Mods
	for(var i = dusk.data.root.mods.length-1; i >= 0; i--) {
		console.log("Loading mod "+dusk.data.root.mods[i]+"...");
		required.push("dusk.mods."+dusk.data.root.mods[i]);
	}
	
	//Components
	for(var i = dusk.data.root.coms.length-1; i >= 0; i--) {
		console.log("Loading component "+dusk.data.root.coms[i]+"...");
		required.push("dusk.sgui."+dusk.data.root.coms[i]);
	}
	
	//Other things
	for(var i = dusk.data.root.reqs.length-1; i >= 0; i--) {
		console.log("Loading other file "+dusk.data.root.reqs[i]+"...");
		required.push(dusk.data.root.reqs[i]);
	}
	
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	requestAnimationFrame(this.onRender);
	setInterval(this.everyFrame, 1000/dusk.frameRate);
	
	dusk.load.addDependency(__duskdir__+"/StartGame.js", ['dusk.gameStarter'], required);
	
	dusk.load.require("dusk.gameStarter");
};

/** This is called when the browser wants to render the image (using requestAnimationFrame), and it instructs the simpleGui module to draw all the components.
 * 
 * This is usually called 60 frames a second, but may vary depending on what the browser feels like.
 */
dusk.game.onRender = function() {
	if(dusk.mods && dusk.mods.simpleGui) dusk.mods.simpleGui.draw();
	
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	requestAnimationFrame(dusk.game.onRender, $("#"+dusk.canvas)[0]);
	
	if(dusk.dev) {
		dusk.game._rframesRan++;
		if(dusk.game._rframesRan == 1000){
			console.log("1000 render frames took "+((new Date()).getTime()-dusk.game._rtime)+"ms, "+(Math.round(1000000000/((new Date()).getTime()-dusk.game._rtime))/1000)+"fps.");
			dusk.game._rtime = (new Date()).getTime();
			dusk.game._rframesRan = 0;
		}
	}
};

/** This is called `{@link dusk.frameRate}` times a second, and calls `{@link dusk.actions.everyFrame}`.
 */
dusk.game.everyFrame = function() {
	dusk.actions.everyFrame();
	if(dusk.dev) {
		dusk.game._framesRan++;
		if(dusk.game._framesRan == 1000){
			console.log("1000 frames took "+((new Date()).getTime()-dusk.game._time)+"ms, "+(Math.round(1000000000/((new Date()).getTime()-dusk.game._time))/1000)+"fps.");
			dusk.game._time = (new Date()).getTime();
			dusk.game._framesRan = 0;
		}
	}
};

/** This is called to process a keypress event. It calls `{@dusk.actions.keypress}` with it's argument.
 * 
 * @param {object} e A JQuery keypress event object.
 */
dusk.game.keypress = function(e) {
	dusk.actions.keypress(e);
};

/** This is called to process a keyup event. It calls `{@dusk.actions.keyup}` with it's argument.
 * 
 * @param {object} e A JQuery keyup event object.
 */
dusk.game.keyup = function(e) {
	dusk.actions.keyup(e);
};
