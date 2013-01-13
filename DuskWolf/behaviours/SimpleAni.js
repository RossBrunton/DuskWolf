//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.behave.Behave");

dusk.load.provide("dusk.behave.SimpleAni");

dusk.behave.SimpleAni = function(entity) {
	if(entity !== undefined){
		dusk.behave.Behave.call(this, entity);
		
		this._listenEvent("frame", this._simpleAniFrame);
	}
};
dusk.behave.SimpleAni.prototype = new dusk.behave.Behave();
dusk.behave.SimpleAni.constructor = dusk.behave.SimpleAni;

dusk.behave.SimpleAni.prototype._simpleAniFrame = function(name, e) {
	if(this._entity.dx > 0) {
		this._entity.setAnimation("walk", {"flags":["r"]});
	}else if(this._entity.dx < 0) {
		this._entity.setAnimation("walk", {"flags":["l"]});
	}else{
		if(this._entity.aniFlagActive("l")) {
			this._entity.setAnimation("stationary", {"flags":["l"]});
		}else{
			this._entity.setAnimation("stationary", {"flags":["r"]});
		}
	}
	
	if(this._entity.dy < 0) {
		if(this._entity.dx > 0) {
			this._entity.setAnimation("jump", {"flags":["r"]});
		}else if(this._entity.dx < 0) {
			this._entity.setAnimation("jump", {"flags":["l"]});
		}else{
			if(this._entity.aniFlagActive("l")) {
				this._entity.setAnimation("jump", {"flags":["l"]});
			}else{
				this._entity.setAnimation("jump", {"flags":["r"]});
			}
		}
	}
	
	if(this._entity.dy > 0) {
		if(this._entity.dx > 0) {
			this._entity.setAnimation("fall", {"flags":["r"]});
		}else if(this._entity.dx < 0) {
			this._entity.setAnimation("fall", {"flags":["l"]});
		}else{
			if(this._entity.aniFlagActive("l")) {
				this._entity.setAnimation("fall", {"flags":["l"]});
			}else{
				this._entity.setAnimation("fall", {"flags":["r"]});
			}
		}
	}
};
