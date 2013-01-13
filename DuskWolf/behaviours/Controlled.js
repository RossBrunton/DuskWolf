//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.controls");

dusk.load.provide("dusk.behave.Controlled");

dusk.behave.Controlled = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._jumps = 0;
		
		this._listenEvent("frame", this._controlledFrame);
		this._listenEvent("land", function(name, e) {this._jumps = 0;});
		this._listenEvent("collideBottom", function(name, e) {this._jumps = 0;});
		
		dusk.controls.addControl("entity_left", 37, "0-0.5");
		dusk.controls.addControl("entity_right", 39, "0+0.5");
		dusk.controls.addControl("entity_jump", 65, 0);
	}
};
dusk.behave.Controlled.prototype = new dusk.behave.Behave();
dusk.behave.Controlled.constructor = dusk.behave.Controlled;

dusk.behave.Controlled.prototype._controlledFrame = function(name, e) {
	if(this._isControlActive("entity_left") && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(this._isControlActive("entity_right") && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
	
	if(this._isControlActive("entity_jump") && this._entity.dy > -4) {
		if((this._jumps == 0 && dusk.plat.hasSkill("jump"))
		|| (this._jumps == 1 && dusk.plat.hasSkill("dubjump"))
		|| dusk.plat.hasSkill("infinijump")) {
			this._entity.dy = -this._entity.behaviourData.jump;
			this._jumps ++;
		}
	}
};

dusk.behave.Controlled.prototype._isControlActive = function(name) {
	return dusk.controls.controlActive(name);
};
