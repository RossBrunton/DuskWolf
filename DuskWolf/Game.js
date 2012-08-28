//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk");
dusk.load.require("dusk.data");
dusk.load.require("dusk.events");

dusk.load.provide("dusk.game");

/** Class: Game
 * 
 * This is the main game class, it doesn't do anything much besides add the events system to the window object and starts it up.
 * 
 * It can restart the events system though, that's probably worth something, maybe...
 * 
 * See:
 * 	<Events>
 */
	
/** Function: start
 * 
 * This starts (or restarts) the events system, it is automatically called when this is constructed.
 * 
 * Once the events system has been inited, the event "sys-event-load" event is fired, then "sys-event-start", both on the thread "_init".
 * You should listen for these rather than doing actions directly at the start, this guarantees that all JSONS and modules and such have loaded correctly.
 */
/** Function: Game
 * 
 * This just creates a new instance of this. It will create a new <Data> object on the main window, and then call <start>.
 */
dusk.game.init = function() {
	console.log("DuskWolf ver "+dusk.ver+" ["+dusk.verId+"] is starting.");
	
	//Timer
	this._framesRan = 0;
	this._time = (new Date()).getTime();
	
	this._rframesRan = 0;
	this._rtime = (new Date()).getTime();
	
	/*- Variable: _crashed
	 * [Boolean] If true, then an error has occured, and no more everyFrame events will be performed.
	 **/
	this._crashed = false;
	
	/*- Variable: _counter
	 * [Number] Used to keep track of time.
	 **/
	this._counter = 0;
	
	dusk.events.init();
	
	//Import modules
	window.mods = {};
	
	var required = [];
	
	for(var i = dusk.data.root.mods.length-1; i >= 0; i--) {
		console.log("Loading mod "+dusk.data.root.mods[i]+"...");
		required.push("dusk.mods."+dusk.data.root.mods[i]);
	}
	
	for(var i = dusk.data.root.coms.length-1; i >= 0; i--) {
		console.log("Loading component "+dusk.data.root.coms[i]+"...");
		required.push("dusk.sgui."+dusk.data.root.coms[i]);
	}
	
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

/** Function: onRender
 * 
 * This is called 60 times a second (or less, if the computer is laggy).
 * 	It manages the frame rate, and calls <Events.everyFrame> of the events system in use every frame.
 * 
 * See:
 * 	<DuskWolf.frameRate>
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

dusk.game.everyFrame = function() {
	//if(game._crashed) return;
	/*dusk.game._counter += dusk.frameRate/60;
	while(dusk.game._counter > 1) {*/
		dusk.game._counter --;
		dusk.events.everyFrame();
		if(dusk.dev) {
			dusk.game._framesRan++;
			if(dusk.game._framesRan == 1000){
				console.log("1000 frames took "+((new Date()).getTime()-dusk.game._time)+"ms, "+(Math.round(1000000000/((new Date()).getTime()-dusk.game._time))/1000)+"fps.");
				dusk.game._time = (new Date()).getTime();
				dusk.game._framesRan = 0;
			}
		}
	//}
};

/** Function: keypress
 * 
 * This should be called (and is automatically) to process a keypress event. It just basically calls <Events.keypress> of the current Events system.
 * 
 * Params:
 * 	e		- [object] A JQuery keypress event to handle.
 */
dusk.game.keypress = function(e) {
	dusk.events.keypress(e);
};

/** Function: keyup
 * 
 * This should be called (and is automatically) to process a keyup event. It just basically calls <Events.keyup> of the current Events system.
 * 
 * Params:
 * 	e		- [object] A JQuery keyup event to handle.
 */
dusk.game.keyup = function(e) {
	dusk.events.keyup(e);
};
