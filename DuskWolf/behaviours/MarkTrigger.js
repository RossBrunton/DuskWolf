//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.plat");

dusk.load.provide("dusk.behave.MarkTrigger");

dusk.behave.MarkTrigger = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._markAt = "";
		this._coolDown = 5;
		
		if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1) {
			this._markAt = this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0];
		}
		
		this._listenEvent("frame", this._markTriggerFrame);
	}
};
dusk.behave.MarkTrigger.prototype = new dusk.behave.Behave();
dusk.behave.MarkTrigger.constructor = dusk.behave.MarkTrigger;

dusk.behave.MarkTrigger.prototype._markTriggerFrame = function(name, e) {
	if(this._coolDown) this._coolDown --;
	
	if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] != 1) {
		this._markAt = -1;
	}
	
	if(this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1
	&& this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0] != this._markAt) {
		this._markAt = this._entity.path("../../scheme").tilePointIn(this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0];
		
		if(!this._coolDown) {
			dusk.plat.markTrigger.fire({"up":false, "mark":this._markAt, "activator":this._entity.comName, "room":this._entity.path("../..").roomName});
			this._coolDown = 5;
		}
	}
};
