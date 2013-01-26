//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.BackForth");

dusk.behave.BackForth = function(entity, events) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity, events);
		
		this._data("hspeed", 1, true);
		
		this._listenEvent("collide", this._bfCollide);
	}
};
dusk.behave.BackForth.prototype = new dusk.behave.Behave();
dusk.behave.BackForth.constructor = dusk.behave.BackForth;

dusk.behave.BackForth.prototype._bfCollide = function(name, e) {
	if(e.dir == "l") {
		this._entity.dx = this._entity.behaviourData.hspeed;
	}
	if(e.dir == "r") {
		this._entity.dx = -this._entity.behaviourData.hspeed;
	}
};
