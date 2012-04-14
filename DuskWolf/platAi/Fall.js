//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

pai.Fall = function(entity, events) {
	if(parent !== undefined){
		pai.Pai.call(this, entity, events);
		
		if(!this._entity.eProp("activates")) this._entity.eProp("activates", "b");
		if(!this._entity.eProp("travels")) this._entity.eProp("travels", "d");
		if(!this._entity.eProp("speed") && this._entity.eProp("speed") !== 0) this._entity.eProp("speed", 2);
	}
};
pai.Fall.prototype = new pai.Pai();
pai.Fall.constructor = pai.Fall;

pai.Fall.prototype.everyFrame = function() {
	
};

pai.Fall.prototype.onCollideLeft = function(collider) {
	if(this._entity.eProp("dirs").indexOf("l") !== -1) {
		this._go();
	}
};

pai.Fall.prototype.onCollideRight = function(collider) {
	if(this._entity.eProp("dirs").indexOf("r") !== -1) {
		this._go();
	}
};

pai.Fall.prototype.onCollideUp = function(collider) {
	if(this._entity.eProp("dirs").indexOf("u") !== -1) {
		this._go();
	}
};

pai.Fall.prototype.onCollideBottom = function(collider) {
	if(this._entity.eProp("activates").indexOf("b") !== -1) {
		this._go();
	}
};

pai.Fall.prototype._go = function() {
	switch(this._entity.eProp("travels")) {
		case "u":
			this._entity.y -= this._entity.eProp("speed");
			break;
		
		case "d":
			this._entity.y += this._entity.eProp("speed");
			break;
		
		case "l":
			this._entity.x -= this._entity.eProp("speed");
			break;
		
		case "r":
			this._entity.x += this._entity.eProp("speed");
			break;
		
		default:
			duskWolf.warn("Unknown direction for "+this._entity.comName+": "+this._entity.eProp("travels"));
	}
};
