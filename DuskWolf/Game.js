//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: Game
 * 
 * This is the main game class, it doesn't do anything in this game much than add the events system to the stage and starts it up.
 * 
 * See:
 * 	<Events>
 */
window.Game = function() {
	/** Variable: _events
	 * [<Events>] This is the current events system.
	 **/
	this._events;
	
	duskWolf.info(duskWolf.gameName+" ver "+duskWolf.ver+" is starting.");

	window.data = new Data();
	this.start();
};
	
/** Function: start
 * 
 * This starts (or restarts) the events system, it is automatically called when this is constructed.
 * 
 * Once the events system has been inited, the event "sys-event-load" event is fired, then "sys-event-start", both on the thread main.
 * You should listen for these rather than doing actions directly at the start, this guaruntees that all JSONS and modules and such have loaded correctly.
 */
Game.prototype.start = function() {
	duskWolf.info("Creating new game.");
	
	this._events = new Events(this);
	this._events.run([
	{"a":"fire", "ver":duskWolf.ver, "ver-id":duskWolf.verId, "gameName":duskWolf.NAME, "event":"sys-event-load"},
	{"a":"fire", "ver":duskWolf.ver, "ver-id":duskWolf.verId, "gameName":duskWolf.NAME, "event":"sys-event-start"},
	{"a":"var", "name":"_started", "value":"1"}]);
};

/** Function: everyFrame
 * 
 * This is called every frame based on the frame rate, it doesn't do anything besides call this._events.everyFrame().
 * 
 * See:
 * 	<DuskWolf.frameRate>
 */
Game.prototype.everyFrame = function() {
	try {
		this._events.everyFrame();
		//setTimeout("try {game.everyFrame()} catch(e) {duskWolf.error(e.message);}", 1000/duskWolf.frameRate);
		framesRan++;
		if(framesRan == 100){
			duskWolf.info("100 frames took "+((new Date()).getTime()-timo)+"ms, "+(100/(((new Date()).getTime()-timo)/1000))+"fps.");
			timo = (new Date()).getTime();
			framesRan = 0;
		}
	} catch(e) {duskWolf.error(e.message);};
};

window.framesRan = 0;
window.timo = (new Date()).getTime();

Game.prototype.keyPress = function(e) {
	this._events.keyPress(e);
};
