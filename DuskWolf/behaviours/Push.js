//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Push");

dusk.behave.Push = function(entity, events) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity, events);
		
		this._data("speed", 1, true);
		
		this._listenEvent("collidedInto", this._pCollided);
	}
};
dusk.behave.Push.prototype = new dusk.behave.Behave();
dusk.behave.Push.constructor = dusk.behave.Push;

dusk.behave.Push.prototype._pCollided = function(name, e) {
	switch(e.dir) {
		case "d": this._entity.performMotion(0, this._entity.behaviourData.speed);break;
		case "u": this._entity.performMotion(0, -this._entity.behaviourData.speed); break;
		case "r": this._entity.performMotion(this._entity.behaviourData.speed, 0); break;
		case "l": this._entity.performMotion(-this._entity.behaviourData.speed, 0); break;
	}
};
