//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.MarkTrigger");

dusk.pbehave.MarkTrigger = function(entity) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity);
		
		this._markAt = "";
		this._coolDown = 5;
		
		if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1) {
			this._markAt = this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0];
		}
		
		this.listenEvent("frame", this._markTriggerFrame);
	}
};
dusk.pbehave.MarkTrigger.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.MarkTrigger.constructor = dusk.pbehave.MarkTrigger;

dusk.pbehave.MarkTrigger.prototype._markTriggerFrame = function(name, e) {
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
