//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.entities");

dusk.load.provide("dusk.behave.MarkTrigger");

dusk.behave.MarkTrigger = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._markAt = "";
		this._coolDown = 5;
		
		if(this._entity.scheme && this._entity.scheme.tilePointIn(
			this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[1] == 1
		) {
			this._markAt = this._entity.scheme.tilePointIn(
				this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
			)[0];
		}
		
		this.entityEvent.listen(this._markTriggerFrame, this, {"name":"frame"});
	}
};
dusk.behave.MarkTrigger.prototype = new dusk.behave.Behave();
dusk.behave.MarkTrigger.constructor = dusk.behave.MarkTrigger;

dusk.behave.MarkTrigger.prototype._markTriggerFrame = function(name, e) {
	if(this._coolDown) this._coolDown --;
	
	if(!this._entity.scheme) return;
	
	if(this._entity.scheme.tilePointIn(
		this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
	)[1] != 1) {
		this._markAt = -1;
	}
	
	if(this._entity.scheme.tilePointIn(
		this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
	)[1] == 1
	&& this._entity.scheme.tilePointIn(this._entity.x+(
		this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2))[0] != this._markAt
	) {
		this._markAt = this._entity.scheme.tilePointIn(
			this._entity.x+(this._entity.prop("width")/2), this._entity.y+(this._entity.prop("height")/2)
		)[0];
		
		if(!this._coolDown) {
			dusk.entities.markTrigger.fire({
				"up":false, "mark":this._markAt, "activator":this._entity.comName, "entity":this._entity,
				"room":this._entity.path("../..").roomName
			});
			this._coolDown = 5;
		}
	}
};

Object.seal(dusk.behave.MarkTrigger);
Object.seal(dusk.behave.MarkTrigger.prototype);

dusk.entities.registerBehaviour("MarkTrigger", dusk.behave.MarkTrigger);
