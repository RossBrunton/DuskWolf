//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.Fall");

dusk.behave.Fall = function(entity, events) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity, events);
		
		this._data("fallSpeed", 1, true);
		
		this._listenEvent("collidedInto", this._fallFall);
	}
};
dusk.behave.Fall.prototype = new dusk.behave.Behave();
dusk.behave.Fall.constructor = dusk.behave.Fall;

dusk.behave.Fall.prototype._fallFall = function(name, e) {
	if(e.dir == "d") this._entity.performMotion(0, this._entity.eProp("fallSpeed"));
};
