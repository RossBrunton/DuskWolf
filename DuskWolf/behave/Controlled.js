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
		this._jumping = 0;
		this._jumpReleased = false;
		
		this.entityEvent.listen(this._controlledFrame, this, {"name":"frame"});
		this.entityEvent.listen(function(e) {
			this._jumps = 0;
			this._jumping = 0;
		}, this, {"name":"collide", "dir":dusk.sgui.c.DIR_DOWN});
		
		dusk.controls.addControl("entity_left", 37, "0-0.5");
		dusk.controls.addControl("entity_right", 39, "0+0.5");
		dusk.controls.addControl("entity_jump", 65, 0);
	}
};
dusk.behave.Controlled.prototype = new dusk.behave.Behave();
dusk.behave.Controlled.constructor = dusk.behave.Controlled;

dusk.behave.Controlled.prototype._controlledFrame = function(e) {
	if(this._isControlActive("entity_left")) {
		//this._entity.dx -= this._entity.eProp("haccel");
		this._entity.applyDx("control_move", 0, 1, -this._entity.eProp("haccel"), -this._entity.eProp("hspeed"), true);
	}else if(this._isControlActive("entity_right")) {
		this._entity.applyDx("control_move", 0, 1, this._entity.eProp("haccel"), this._entity.eProp("hspeed"), true);
	}
	
	if(this._isControlActive("entity_jump")) {
		if(this._jumpReleased && ((this._entity.touchers(dusk.sgui.c.DIR_DOWN).length && dusk.skills.hasSkill("jump"))
		|| (this._jumps == 0 && dusk.skills.hasSkill("dubjump"))
		|| dusk.skills.hasSkill("infinijump"))) {
			this._entity.applyDy("control_jump", -15, 15, 1, 0);
			if(!this._entity.touchers(dusk.sgui.c.DIR_DOWN).length) {
				this._jumps ++;
				this._entity.performAnimation("airjump");
			}else{
				this._entity.performAnimation("groundjump");
			}
			this._jumping = 10;
			this._jumpReleased = false;
		}else if(this._jumping) {
			this._entity.applyDy("control_jump", -15, 15, 1, 0);
			this._jumping --;
		}
	}else{
		//this._entity.applyDy("control_jump", 0);
		this._jumping = 0;
		this._jumpReleased = true;
	}
};

dusk.behave.Controlled.prototype._isControlActive = function(name) {
	return dusk.controls.controlActive(name);
};

Object.seal(dusk.behave.Controlled);
Object.seal(dusk.behave.Controlled.prototype);

dusk.entities.registerBehaviour("Controlled", dusk.behave.Controlled);
