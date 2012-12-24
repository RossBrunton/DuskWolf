//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.BackForth");

dusk.pbehave.BackForth = function(entity, events) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity, events);
		
		this._listenEvent("collideLeft", this._bfCollideLeft);
		this._listenEvent("collideRight", this._bfCollideRight);
	}
};
dusk.pbehave.BackForth.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.BackForth.constructor = dusk.pbehave.BackForth;

dusk.pbehave.BackForth.prototype._bfHitWall = function(name, side) {
	if(side == "r") this._entity.dx = -this._entity.behaviourData.hspeed;
	if(side == "l") this._entity.dx = this._entity.behaviourData.hspeed;
};

dusk.pbehave.BackForth.prototype._bfCollideLeft = function(name, collider) {
	this._entity.dx = this._entity.behaviourData.hspeed;
};

dusk.pbehave.BackForth.prototype._bfCollideRight = function(name, collider) {
	this._entity.dx = -this._entity.behaviourData.hspeed;
};
