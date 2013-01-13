//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.BackForth");

dusk.behave.BackForth = function(entity, events) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity, events);
		
		this._listenEvent("collideLeft", this._bfCollideLeft);
		this._listenEvent("collideRight", this._bfCollideRight);
	}
};
dusk.behave.BackForth.prototype = new dusk.behave.Behave();
dusk.behave.BackForth.constructor = dusk.behave.BackForth;

dusk.behave.BackForth.prototype._bfHitWall = function(name, side) {
	if(side == "r") this._entity.dx = -this._entity.behaviourData.hspeed;
	if(side == "l") this._entity.dx = this._entity.behaviourData.hspeed;
};

dusk.behave.BackForth.prototype._bfCollideLeft = function(name, collider) {
	this._entity.dx = this._entity.behaviourData.hspeed;
};

dusk.behave.BackForth.prototype._bfCollideRight = function(name, collider) {
	this._entity.dx = -this._entity.behaviourData.hspeed;
};
