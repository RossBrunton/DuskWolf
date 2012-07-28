//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.pbehave.PBehave");

goog.provide("dusk.pbehave.Fade");

/* DOES NOT WORK */

window.pbehave.Fade = function(entity, events) {
	if(entity !== undefined){
		window.pbehave.PBehave.call(this, entity, events);
		
		if(!this._entity.eProp("dirs")) this._entity.eProp("dirs", "b");
		if(!this._entity.eProp("speed") && this._entity.eProp("speed") !== 0) this._entity.eProp("speed", 0.1);
	}
};
window.pbehave.Fade.prototype = new window.pbehave.PBbehave();
window.pbehave.Fade.constructor = window.pbehave.Fade;

window.pbehave.Fade.prototype.everyFrame = function() {
	if(this._entity.alpha == 1) {
		this._entity.eProp("solid", true);
	}else if(this._entity.alpha == 0){
		this._entity.eProp("solid", false);
	}
	
	if(this._entity.alpha < 1) {
		this._entity.alpha += this._entity.eProp("speed");

	}
	
	if(this._entity.alpha > 1) {
		this._entity.alpha = 1;
	}else if(this._entity.alpha < 0) {
		this._entity.alpha = 0;
	}
};

window.pbehave.Fade.prototype.onCollideLeft = function() {
	if(this._entity.eProp("dirs").indexOf("l") !== -1) {
		this._entity.alpha -= this._entity.eProp("speed")*2;
	}
};

window.pbehave.Fade.prototype.onCollideRight = function() {
	if(this._entity.eProp("dirs").indexOf("r") !== -1) {
		this._entity.alpha -= this._entity.eProp("speed")*2;
	}
};

window.pbehave.Fade.prototype.onCollideUp = function() {
	if(this._entity.eProp("dirs").indexOf("u") !== -1) {
		this._entity.alpha -= this._entity.eProp("speed")*2;
	}
};

window.pbehave.Fade.prototype.onCollideBottom = function() {
	if(this._entity.eProp("dirs").indexOf("b") !== -1) {
		this._entity.alpha -= this._entity.eProp("speed")*2;
	}
};
