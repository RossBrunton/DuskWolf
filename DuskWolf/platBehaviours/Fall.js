//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.Fall");

dusk.pbehave.Fall = function(entity, events) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity, events);
		
		if(!("speed" in this._entity.behaviourData)) this._entity.behaviourData.speed = 1;
		this.listenEvent("collidedTop", this._fallFall);
	}
};
dusk.pbehave.Fall.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.Fall.constructor = dusk.pbehave.Fall;

dusk.pbehave.Fall.prototype._fallFall = function(name, collider) {
	this._entity.performMotion(0, this._entity.eProp("speed"));
};
