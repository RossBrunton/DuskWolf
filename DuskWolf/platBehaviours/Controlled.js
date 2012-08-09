//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.pbehave.PBehave");

goog.provide("dusk.pbehave.Controlled");

window.pbehave.Controlled = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
		
		this._jumps = 0;
		this._markAt = "";
		this._coolDown = 5;
		
		if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1) {
			this._markAt = this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0];
		}
	}
};
window.pbehave.Controlled.prototype = new window.pbehave.PBehave();
window.pbehave.Controlled.constructor = window.pbehave.Controlled;

window.pbehave.Controlled.prototype.everyFrame = function() {
	if(dusk.mods.keyboard.isKeyPressed(37) && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(dusk.mods.keyboard.isKeyPressed(39) && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
	
	if(dusk.mods.keyboard.isKeyPressed(38) && this._entity.dy > -4) {
		if((this._jumps == 0 && dusk.events.getVar("plat.skill.jump"))
		|| (this._jumps == 1 && dusk.events.getVar("plat.skill.dubjump"))
		|| dusk.events.getVar("plat.skill.infinijump")) {
			this._entity.dy = -this._entity.eProp("jump");
			this._jumps ++;
		}
	}
	
	if(this._coolDown) this._coolDown --;
	
	if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] != 1) {
		this._markAt = -1;
	}
	
	if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1
	&& this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0] != this._markAt) {
		this._markAt = this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0];
		
		if(!this._coolDown) {
			dusk.events.run([
				{"a":"fire", "up":false, "mark":this._markAt, "activator":this._entity.comName, "room":this._entity.path("../..").prop("room"), "event":"plat-mark"}
			], dusk.events.thread);
			this._coolDown = 5;
		}
	}
};

window.pbehave.Controlled.prototype.onLand = function() {
	this._jumps = 0;
};

window.pbehave.Controlled.prototype.onCollideBottom = function() {
	this._jumps = 0;
};
