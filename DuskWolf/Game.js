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

/** Function: Game
 * 
 * [undefined] this just creates a new instance of this. It will create a new <Data> object on the main window, and then call <Game.start> ().
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
 * [undefined] This starts (or restarts) the events system, it is automatically called when this is constructed.
 * 
 * Once the events system has been inited, the event "sys-event-load" event is fired, then "sys-event-start", both on the thread "_init".
 * You should listen for these rather than doing actions directly at the start, this guaruntees that all JSONS and modules and such have loaded correctly.
 */
Game.prototype.start = function() {
	this._events = new Events(this);
	this._events.run([
	{"a":"fire", "ver":duskWolf.ver, "ver-id":duskWolf.verId, "gameName":duskWolf.NAME, "event":"sys-event-load"},
	{"a":"fire", "ver":duskWolf.ver, "ver-id":duskWolf.verId, "gameName":duskWolf.NAME, "event":"sys-event-start"},
	{"a":"var", "name":"_started", "value":"1"}], "_init");
};

/** Function: everyFrame
 * 
 * [undefined] This is called every frame based on the frame rate, it doesn't do anything besides call <Events.everyFrame> () of the events system in use.
 * 
 * See:
 * 	<DuskWolf.frameRate>
 */
Game.prototype.everyFrame = function() {
	try {
		this._events.everyFrame();
		framesRan++;
		if(framesRan == 100){
			duskWolf.info("100 frames took "+((new Date()).getTime()-timo)+"ms, "+(100/(((new Date()).getTime()-timo)/1000))+"fps.");
			timo = (new Date()).getTime();
			framesRan = 0;
		}
	} catch(e) {duskWolf.error(e);};
};

//Timer stuff, temporary
window.framesRan = 0;
window.timo = (new Date()).getTime();

Game.prototype.keyPress = function(e) {
	this._events.keyPress(e);
};
