//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.pbehave.PBehave");

dusk.load.provide("dusk.pbehave.SimpleAni");

dusk.pbehave.SimpleAni = function(entity) {
	if(entity !== undefined){
		dusk.pbehave.PBehave.call(this, entity);
		
		this.listenEvent("frame", this._simpleAniFrame);
	}
};
dusk.pbehave.SimpleAni.prototype = new dusk.pbehave.PBehave();
dusk.pbehave.SimpleAni.constructor = dusk.pbehave.SimpleAni;

dusk.pbehave.SimpleAni.prototype._simpleAniFrame = function(name, e) {
	if(this._entity.dx > 0) {
		this._entity.setAnimation("walk-r");
	}else if(this._entity.dx < 0) {
		this._entity.setAnimation("walk-l");
	}else{
		if(this._entity.aniName.indexOf("-l") !== -1) {
			this._entity.setAnimation("stationary-l");
		}else{
			this._entity.setAnimation("stationary-r");
		}
	}
	
	if(this._entity.dy < 0) {
		if(this._entity.dx > 0) {
			this._entity.setAnimation("jump-r");
		}else if(this._entity.dx < 0) {
			this._entity.setAnimation("jump-l");
		}else{
			if(this._entity.aniName.indexOf("-l") !== -1) {
				this._entity.setAnimation("jump-l");
			}else{
				this._entity.setAnimation("jump-r");
			}
		}
	}
	
	if(this._entity.dy > 0) {
		if(this._entity.dx > 0) {
			this._entity.setAnimation("fall-r");
		}else if(this._entity.dx < 0) {
			this._entity.setAnimation("fall-l");
		}else{
			if(this._entity.aniName.indexOf("-l") !== -1) {
				this._entity.setAnimation("fall-l");
			}else{
				this._entity.setAnimation("fall-r");
			}
		}
	}
};
