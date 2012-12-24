//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.mods.simpleGui");
dusk.load.require("dusk.sgui.PlatMain");
dusk.load.require("dusk.sgui.CentreScroller");

dusk.load.provide("dusk.mods.plat");

/** Namespace: mods.Plat
 * 
 * This is a module that lets the user develop platformers simply using the SGui System.
 */

/** Function: mods.Plat
 * 
 * Constructor, creates a new instance of this. It sets up all the variables.
 */
dusk.mods.plat._init = function() {
	//Vars
	this._skills = [];
	this.giveSkill("jump");
	this.giveSkill("dubjump");
	//this.giveSkill("infinijump");
	
	this.ssize = 4;
	this.swidth = 16;
	this.sheight = 16;
	
	this.tsize = 5;
	this.twidth = 32;
	this.theight = 32;
	
	this.mode = "BINARY";
	
	this.seek = "hero";
	this.seekType = "player";
	
	this.editing = false;
	this.editDroppers = [];
	this.editNext = "";
	
	this._rooms = {};
	
	this.roomLoaded = new dusk.EventDispatcher("dusk.mods.plat.roomLoaded");
	this.markTrigger = new dusk.EventDispatcher("dusk.mods.plat.markTrigger");
	this.persistDataUpdate = new dusk.EventDispatcher("dusk.mods.plat.persistDataUpdate");
	
	this._persistData = {};
	
	this._entityData = {};
	this._entityData["default"] = {
		"data":{"hp":1, "gravity":1, "terminal":9, "haccel":2, "hspeed":7, "jump":15, "slowdown":1, "img":"pimg/hero.png", "solid":true, "anchor":false},
		"animation":{"stationary":"0,0"},
		"behaviours":{}
	};
	
	var main = dusk.mods.simpleGui.getPane("plat-main");
	main.children = {"name":"mainContainer", "focus":"main", "type":"CentreScroller", "width":dusk.mods.simpleGui.width, "height":dusk.mods.simpleGui.height, "child":{"name":"main", "type":"PlatMain"}};
	main.active = true;
	main.focus = "mainContainer";
};

dusk.mods.plat.createRoom = function(name, data) {
	this._rooms[name] = data;
};

dusk.mods.plat.getRoomData = function(name) {
	return this._rooms[name];
};

/*- Function: _setRoom
 * 
 * Used internally to handle the "plat-room" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	a			- [object] A "plat-room" action.
 */
dusk.mods.plat.setRoom = function(room, spawn) {
	if(!room) {
		console.error("No room specified to set!");
		return;
	}
	console.log("Setting room "+room);
	
	dusk.mods.simpleGui.getPane("plat-main").path("/mainContainer/main").createRoom(room, spawn);
	this.roomLoaded.fire({"room":room, "spawn":spawn});
	
	/*dusk.actions.run([{"a":"if", "cond":(a.nofade?"0":"1"), "then":[
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
	});*/
};

dusk.mods.plat.modifyEntityType = function(name, data) {
	if(!(name in this._entityData)) {
		this._entityData[name] = dusk.utils.merge(this._entityData["default"], data);
	}else{
		this._entityData[name] = dusk.utils.merge(this._entityData[name], data);
	}
};

dusk.mods.plat.getEntityType = function(name) {
	return this._entityData[name];
};

dusk.mods.plat.giveSkill = function(skillName) {
	if(this._skills.indexOf(skillName) === -1) {
		this._skills.push(skillName);
		return true;
	}else{
		return false;
	}
};

dusk.mods.plat.hasSkill = function(skillName) {
	return this._skills.indexOf(skillName) !== -1;
};

dusk.mods.plat.revokeSkill = function(skillName) {
	if(this._skills.indexOf(skillName) === -1) {
		return false;
	}else{
		this._skills.splice(this._skills.indexOf(skillName), 1);
		return true;
	}
};

dusk.mods.plat.storePersist = function(name, data) {
	this._persistData[name] = data;
	data.entityName = name;
	this.persistDataUpdate.fire(data);
};

dusk.mods.plat.getPersist = function(name) {
	return this._persistData[name];
};

dusk.mods.plat._init();
