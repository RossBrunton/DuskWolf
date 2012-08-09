//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.mods.simpleGui");
goog.require("dusk.sgui.PlatMain");
goog.require("dusk.sgui.CentreScroller");

goog.provide("dusk.mods.plat");

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
 * Constructor, creates a new instance of this. It sets up all the variables.
 */
dusk.mods.plat.init = function() {
	//Vars
	dusk.events.setVar("plat.seek", "hero");
	dusk.events.setVar("plat.seektype", "player");
	
	dusk.events.setVar("plat.skill.jump", true);
	dusk.events.setVar("plat.skill.dubjump", true);
	dusk.events.setVar("plat.skill.infinijump", false);
	
	dusk.events.setVar("pentity.default.gravity", 1);
	dusk.events.setVar("pentity.default.terminal", 9);
	dusk.events.setVar("pentity.default.behaviour", "Stayer");
	dusk.events.setVar("pentity.default.haccel", 2);
	dusk.events.setVar("pentity.default.hspeed", 7);
	dusk.events.setVar("pentity.default.jump", 15);
	dusk.events.setVar("pentity.default.slowdown", 1);
	dusk.events.setVar("pentity.default.img", "pimg/hero.png");
	dusk.events.setVar("pentity.default.solid", true);
	dusk.events.setVar("pentity.default.anchor", false);
	
	dusk.events.setVar("plat.ssize", 4);
	dusk.events.setVar("plat.tsize", 5);
	
	dusk.events.registerStartHandler(this._onStart, this);
	
	dusk.events.registerAction("plat-room", this._setRoom, this, [["room", true, "STR"], ["spawn", true, "NUM"]]);
	dusk.events.registerAction("plat-drop", this._setDrop, this, [["slot", true, "NUM"], ["type", true, "STR"]]);
	dusk.events.registerAction("plat-edit", function(a){dusk.events.setVar("plat.edit.active", !dusk.events.getVar("plat.edit.active"));}, this, []);
};

/** Function: addActions
 * 
 * Registers the actions this uses, see the class description for a list.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
dusk.mods.plat._onStart = function() {
	events.run([
	{"a":"listen", "event":"sys-event-load", "actions":[
		{"a":"pane", "active":true, "focus":"mainContainer", "name":"plat-main", "children":[
			{"name":"mainContainer", "focus":"main", "type":"CentreScroller", "width":dusk.events.getVar("sys.sg.width"), "height":dusk.events.getVar("sys.sg.height"), "child":{"name":"main", "type":"PlatMain"}}
		]}
	]}], "_plat");
};

/*- Function: _setRoom
 * 
 * Used internally to handle the "plat-room" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	a			- [object] A "plat-room" action.
 */
dusk.mods.plat._setRoom = function(a) {
	if(!("room" in a)){throw new dusk.errors.PropertyMissing(a.a, "room");}
	
	console.log("Setting room "+a.room+".");
	events.run(dusk.data.grabJson("prooms/"+a.room.replace(/\-/g, "_")), dusk.events.thread);
	events.run([
		/*{"a":"if", "cond":(dat.nofade?"0","1"), "then":[*/
			{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer/main", "fade":{"from":1, "to":0, "speed":-0.05}},
		/*]},*/
		{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer/main", "room":a.room, "spawn":a.spawn},
		/*{"a":"if", "cond":(dat.nofade?"0","1"), "then":[*/
			{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer/main", "fade":{"from":0, "to":1, "speed":0.05}},
		/*]},*/
		{"a":"fire", "event":"plat-room-load", "room":a.room}], events.thread);
};

dusk.mods.plat._setDrop = function(a) {
	if(!("slot" in a)){throw new dusk.errors.PropertyMissing(a.a, "slot");}
	if(!("type" in a)){throw new dusk.errors.PropertyMissing(a.a, "type");}
	
	dusk.events.setVar("plat.edit.droppers."+a.slot, a.type);
};

dusk.mods.plat.init();
