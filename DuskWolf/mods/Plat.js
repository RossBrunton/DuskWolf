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
	dusk.actions.setVar("plat.seek", "hero");
	dusk.actions.setVar("plat.seektype", "player");
	
	dusk.actions.setVar("plat.skill.jump", true);
	dusk.actions.setVar("plat.skill.dubjump", true);
	dusk.actions.setVar("plat.skill.infinijump", false);
	
	dusk.actions.setVar("pentity.default.data.hp", 1);
	dusk.actions.setVar("pentity.default.data.gravity", 1);
	dusk.actions.setVar("pentity.default.data.terminal", 9);
	dusk.actions.setVar("pentity.default.behaviours", {});
	dusk.actions.setVar("pentity.default.animation", {"stationary":"0,0"});
	dusk.actions.setVar("pentity.default.data.haccel", 2);
	dusk.actions.setVar("pentity.default.data.hspeed", 7);
	dusk.actions.setVar("pentity.default.data.jump", 15);
	dusk.actions.setVar("pentity.default.data.slowdown", 1);
	dusk.actions.setVar("pentity.default.data.img", "pimg/hero.png");
	dusk.actions.setVar("pentity.default.data.solid", true);
	dusk.actions.setVar("pentity.default.data.anchor", false);
	
	dusk.actions.setVar("plat.ssize", 4);
	dusk.actions.setVar("plat.swidth", 16);
	dusk.actions.setVar("plat.sheight", 16);
	
	dusk.actions.setVar("plat.tsize", 5);
	dusk.actions.setVar("plat.twidth", 32);
	dusk.actions.setVar("plat.theight", 32);
	
	dusk.actions.setVar("plat.mode", "BINARY");
	
	dusk.actions.registerStartHandler(this._onStart, this);
	
	dusk.actions.registerAction("plat-room", this._setRoom, this, [["room", true, "STR"], ["spawn", true, "NUM"]]);
	dusk.actions.registerAction("plat-drop", this._setDrop, this, [["slot", true, "NUM"], ["type", true, "STR"]]);
	dusk.actions.registerAction("plat-name", this._nextName, this, [["name", true, "STR"]]);
	dusk.actions.registerAction("plat-edit", function(a){dusk.actions.setVar("plat.edit.active", !dusk.actions.getVar("plat.edit.active"));}, this, []);
};

/** Function: addActions
 * 
 * Registers the actions this uses, see the class description for a list.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
dusk.mods.plat._onStart = function() {
	dusk.actions.run([
	{"a":"listen", "event":"sys-event-load", "actions":[
		{"a":"pane", "active":true, "focus":"mainContainer", "name":"plat-main", "children":[
			{"name":"mainContainer", "focus":"main", "type":"CentreScroller", "width":dusk.actions.getVar("sys.sg.width"), "height":dusk.actions.getVar("sys.sg.height"), "child":{"name":"main", "type":"PlatMain"}}
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
	
	dusk.actions.run([{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
		{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer", "fade":{"from":1, "end":0, "speed":-0.05}}
	]}], dusk.actions.thread);
	console.log("Setting room "+a.room+".");
	dusk.data.download("prooms/"+a.room.replace(/\-/g, "_")+".json", "text", function(d, s) {
		dusk.actions.run(dusk.utils.jsonParse(d, true), dusk.actions.thread);
		dusk.actions.run([
			{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer/main", "room":a.room, "spawn":a.spawn},
			{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
				{"a":"sg-path", "pane":"plat-main", "path":"/mainContainer", "fade":{"from":0, "end":1, "speed":0.05}}
			]},
			{"a":"fire", "event":"plat-room-load", "room":a.room}], dusk.actions.thread);
	});
};

dusk.mods.plat._setDrop = function(a) {
	if(!("slot" in a)){throw new dusk.errors.PropertyMissing(a.a, "slot");}
	if(!("type" in a)){throw new dusk.errors.PropertyMissing(a.a, "type");}
	
	dusk.actions.setVar("plat.edit.droppers."+a.slot, a.type);
};

dusk.mods.plat._nextName = function(a) {
	if(!("name" in a)){throw new dusk.errors.PropertyMissing(a.a, "name");}
	
	dusk.actions.setVar("plat.edit.nextName", a.name);
};

dusk.mods.plat.init();
