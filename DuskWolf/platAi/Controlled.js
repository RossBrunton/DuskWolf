//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

pai.Controlled = function(entity, events) {
	if(parent !== undefined){
		pai.Pai.call(this, entity, events);
		
		this._jumps = 0;
		this._markAt = "";
	}
};
pai.Controlled.prototype = new pai.Pai();
pai.Controlled.constructor = pai.Controlled;

pai.Controlled.prototype.everyFrame = function() {
	if(this._events.getMod("Keyboard").isKeyPressed(37) && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(this._events.getMod("Keyboard").isKeyPressed(39) && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
	
	if(this._events.getMod("Keyboard").isKeyPressed(38) && this._entity.dy > -4) {
		if((this._jumps == 0 && this._events.getVar("plat.skill.jump"))
		|| (this._jumps == 1 && this._events.getVar("plat.skill.dubjump"))) {
			this._entity.dy = -this._entity.eProp("jump");
			this._jumps ++;
		}
	}
	
	if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1
	&& this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0] != this._markAt) {
		this._markAt = this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0];
		this._events.run([
			{"a":"fire", "up":false, "mark":this._markAt, "event":"plat-mark"}
		], this._events.thread);
	}
};

pai.Controlled.prototype.onLand = function() {
	this._jumps = 0;
};

pai.Controlled.prototype.onCollideTop = function() {
	this._jumps = 0;
};
