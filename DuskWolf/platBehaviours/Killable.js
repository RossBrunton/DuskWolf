//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.Killable");

dusk.pbehave.Killable = function(entity) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity);
		
		this._data("hp", 1, true);
		
		this.listenEvent("takeDamage", this._killableTakeDamage);
	}
};
dusk.pbehave.Killable.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.Killable.constructor = dusk.pbehave.Killable;

dusk.pbehave.Killable.prototype._killableTakeDamage = function(name, e) {
	this._data("hp", this._data("hp")-e.damage);
	
	if(this._data("hp") <= 0) console.log("I'm dead! :D");
};
