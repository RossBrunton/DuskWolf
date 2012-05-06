//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

__import__("platAi/__init__.js");
loadPai("Pai");

/** Class: mods.Plat
 * 
 * This is a module that lets the user develop platformers simply using the SGui System.
 * 
 * Inheritance:
 * 	mods.Plat { <mods.IModule>
 * 
 */

/** Function: mods.Plat
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
 */
mods.Plat = function(events) {
	mods.IModule.call(this, events);
	
	//Vars
	this._events.setVar("plat.seek", "hero");
	this._events.setVar("plat.seektype", "player");
	
	this._events.setVar("plat.skill.jump", true);
	this._events.setVar("plat.skill.dubjump", true);
	
	this._events.setVar("pentity.default.gravity", 1.5);
	this._events.setVar("pentity.default.terminal", 10);
	this._events.setVar("pentity.default.pai", "Stayer");
	this._events.setVar("pentity.default.haccel", 4);
	this._events.setVar("pentity.default.hspeed", 10);
	this._events.setVar("pentity.default.jump", 17);
	this._events.setVar("pentity.default.slowdown", 2);
	this._events.setVar("pentity.default.img", "pimg/hero.png");
	this._events.setVar("pentity.default.solid", true);
	this._events.setVar("pentity.default.anchor", false);
	
	this._events.setVar("plat.ssize", 4);
	this._events.setVar("plat.tsize", 5);
	
	this._events.run([
	{"a":"listen", "event":"sys-event-load", "actions":[
		{"a":"pane", "name":"plat-main", "children":[
			{"name":"main", "type":"PlatMain"}
		]}
	]}], "_plat");
};
mods.Plat.prototype = new mods.IModule();
mods.Plat.constructor = mods.Plat;

/** Function: addActions
 * 
 * Registers the actions this uses, see the class description for a list.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.Plat.prototype.addActions = function() {
	this._events.registerAction("plat-room", this._setRoom, this);
};

/*- Function: _setRoom
 * 
 * Used internally to handle the "plat-room" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] A "plat-room" action.
 */
mods.Plat.prototype._setRoom = function(dat) {
	if(!("room" in dat)){duskWolf.error("No room to load.");return;}
	
	duskWolf.info("Setting room "+dat.room+".");
	this._events.run(data.grabJson("prooms/"+dat.room.replace(/\-/g, "_")), this._events.thread);
	this._events.run([
		/*{"a":"if", "cond":(dat.nofade?"0","1"), "then":[*/
			{"a":"sg-path", "pane":"plat-main", "path":"/main", "fade":{"from":1, "to":0, "speed":-0.05}},
		/*]},*/
		{"a":"sg-path", "pane":"plat-main", "path":"/main", "room":dat.room, "spawn":dat.spawn},
		/*{"a":"if", "cond":(dat.nofade?"0","1"), "then":[*/
			{"a":"sg-path", "pane":"plat-main", "path":"/main", "fade":{"from":0, "to":1, "speed":0.05}},
		/*]},*/
		{"a":"fire", "event":"plat-room-load", "room":dat.room}], this._events.thread);
};
