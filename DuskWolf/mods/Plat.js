//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.mods.simpleGui");
dusk.load.require("dusk.sgui.PlatMain");
dusk.load.require("dusk.sgui.CentreScroller");

dusk.load.provide("dusk.mods.plat");

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
	
	dusk.events.setVar("pentity.default.data.gravity", 1);
	dusk.events.setVar("pentity.default.data.terminal", 9);
	dusk.events.setVar("pentity.default.behaviours", {});
	dusk.events.setVar("pentity.default.animation", {"stationary":"0,0"});
	dusk.events.setVar("pentity.default.data.haccel", 2);
	dusk.events.setVar("pentity.default.data.hspeed", 7);
	dusk.events.setVar("pentity.default.data.jump", 15);
	dusk.events.setVar("pentity.default.data.slowdown", 1);
	dusk.events.setVar("pentity.default.data.img", "pimg/hero.png");
	dusk.events.setVar("pentity.default.data.solid", true);
	dusk.events.setVar("pentity.default.data.anchor", false);
	
	dusk.events.setVar("plat.ssize", 4);
	dusk.events.setVar("plat.tsize", 5);
	
	dusk.events.registerStartHandler(this._onStart, this);
	
	dusk.events.registerAction("plat-room", this._setRoom, this, [["room", true, "STR"], ["spawn", true, "NUM"]]);
	dusk.events.registerAction("plat-drop", this._setDrop, this, [["slot", true, "NUM"], ["type", true, "STR"]]);
	dusk.events.registerAction("plat-name", this._nextName, this, [["name", true, "STR"]]);
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
	dusk.events.run([
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
	
	dusk.events.run([{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
		{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer", "fade":{"from":1, "end":0, "speed":-0.05}}
	]}], dusk.events.thread);
	console.log("Setting room "+a.room+".");
	dusk.data.download("prooms/"+a.room.replace(/\-/g, "_")+".json", "text", function(d, s) {
		dusk.events.run(dusk.utils.jsonParse(d, true), dusk.events.thread);
		dusk.events.run([
			{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer/main", "room":a.room, "spawn":a.spawn},
			{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
				{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer", "fade":{"from":0, "end":1, "speed":0.05}}
			]},
			{"a":"fire", "event":"plat-room-load", "room":a.room}], dusk.events.thread);
	});
};

dusk.mods.plat._setDrop = function(a) {
	if(!("slot" in a)){throw new dusk.errors.PropertyMissing(a.a, "slot");}
	if(!("type" in a)){throw new dusk.errors.PropertyMissing(a.a, "type");}
	
	dusk.events.setVar("plat.edit.droppers."+a.slot, a.type);
};

dusk.mods.plat._nextName = function(a) {
	if(!("name" in a)){throw new dusk.errors.PropertyMissing(a.a, "name");}
	
	dusk.events.setVar("plat.edit.nextName", a.name);
};

dusk.mods.plat.init();
