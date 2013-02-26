//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");
dusk.load.require("dusk.controls");
dusk.load.require("dusk.skills");

dusk.load.provide("dusk.behave.Controlled");

dusk.behave.Controlled = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._jumps = 0;
		
		this.entityEvent.listen(this._controlledFrame, this, {"name":"frame"});
		this.entityEvent.listen(function(e) {this._jumps = 0;}, this, {"name":"collide", "dir":"b"});
		
		dusk.controls.addControl("entity_left", 37, "0-0.5");
		dusk.controls.addControl("entity_right", 39, "0+0.5");
		dusk.controls.addControl("entity_jump", 65, 0);
	}
};
dusk.behave.Controlled.prototype = new dusk.behave.Behave();
dusk.behave.Controlled.constructor = dusk.behave.Controlled;

dusk.behave.Controlled.prototype._controlledFrame = function(e) {
	if(this._isControlActive("entity_left") && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(this._isControlActive("entity_right") && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
	
	if(this._isControlActive("entity_jump") && this._entity.dy > -4) {
		if((this._jumps == 0 && dusk.skills.hasSkill("jump"))
		|| (this._jumps == 1 && dusk.skills.hasSkill("dubjump"))
		|| dusk.skills.hasSkill("infinijump")) {
			this._entity.dy = -this._entity.behaviourData.jump;
			this._jumps ++;
		}
	}
};

dusk.behave.Controlled.prototype._isControlActive = function(name) {
	return dusk.controls.controlActive(name);
};
