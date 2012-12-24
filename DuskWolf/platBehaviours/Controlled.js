//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.Controlled");

dusk.pbehave.Controlled = function(entity) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity);
		
		this._jumps = 0;
		
		this._listenEvent("frame", this._controlledFrame);
		this._listenEvent("land", function(name, e) {this._jumps = 0;});
		this._listenEvent("collideBottom", function(name, e) {this._jumps = 0;});
	}
};
dusk.pbehave.Controlled.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.Controlled.constructor = dusk.pbehave.Controlled;

dusk.pbehave.Controlled.prototype._controlledFrame = function(name, e) {
	if(dusk.mods.keyboard.isKeyPressed(37) && this._entity.dx > -this._entity.eProp("hspeed")) {
		this._entity.dx -= this._entity.eProp("haccel");
	}else if(dusk.mods.keyboard.isKeyPressed(39) && this._entity.dx < this._entity.eProp("hspeed")) {
		this._entity.dx += this._entity.eProp("haccel");
	}
	
	if(dusk.mods.keyboard.isKeyPressed(38) && this._entity.dy > -4) {
		if((this._jumps == 0 && dusk.mods.plat.hasSkill("jump"))
		|| (this._jumps == 1 && dusk.mods.plat.hasSkill("dubjump"))
		|| dusk.mods.plat.hasSkill("infinijump")) {
			this._entity.dy = -this._entity.behaviourData.jump;
			this._jumps ++;
		}
	}
};
