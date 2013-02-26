//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.controls");
dusk.load.require("dusk.keyboard");

dusk.load.provide("dusk.sgui.ControlConfig");

dusk.sgui.ControlConfig = function (parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this.setting = false;
	this.control = "";
	
	this._keyChild = this.getComponent("key", "Label");
	this._buttonChild = this.getComponent("button", "Tile");
	
	this._keyChild.height = 16;
	this._keyChild.width = 40;
	
	this._buttonChild.src = "sgui/buttons.png";
	this._buttonChild.x = 40;
	this._buttonChild.ssize = 4;
	this._buttonChild.width = 16;
	this._buttonChild.height = 16;
	
	this.border = this._theme("border");
	this.borderActive = this._theme("borderActive");
	
	//Prop masks
	this._registerPropMask("border", "border", true);
	this._registerPropMask("border-active", "borderActive", true);
	this._registerPropMask("control", "control");
	
	//Listeners
	this.frame.listen(this._ccFrame, this);
	this.keyPress.listen(this._ccKey, this);
	this.prepareDraw.listen(this._ccDraw, this);
	this.action.listen(function(e) {this.setting = !this.setting; this.locked = this.setting; return false;}, this);
};
dusk.sgui.ControlConfig.prototype = new dusk.sgui.Group();
dusk.sgui.ControlConfig.constructor = dusk.sgui.ControlConfig;

dusk.sgui.ControlConfig.prototype.className = "ControlConfig";

dusk.sgui.ControlConfig.prototype._ccFrame = function(e) {
	var controls = dusk.controls.lookupControl(this.control);
	
	if(controls) {
		if(controls[0]) {
			this._keyChild.text = dusk.keyboard.lookupCode(controls[0])[2];
		}else{
			this._keyChild.text = "---";
		}
		
		if(controls[1] !== null) {
			if(typeof controls[1] == "string") {
				if(controls[1].indexOf("+") != -1) {
					controls[1] = controls[1].split("+")[0];
					this._buttonChild.tile = [(+controls[1] * 2) + 1, 1];
				}else{
					controls[1] = controls[1].split("-")[0];
					this._buttonChild.tile = [(+controls[1] * 2), 1];
				}
			}else{
				this._buttonChild.tile = [+controls[1] + 1, 0];
			}
		}else{
			this._buttonChild.tile = [0,0];
		}
	}else{
		this._keyChild.text = "---";
		this._buttonChild.tile = [0,0];
	}
};

dusk.sgui.ControlConfig.prototype._ccDraw = function(c) {
	c.strokeStyle = this._active?this.borderActive:this.border;
	
	c.strokeRect(0, 0, this.width, this.height);
};

dusk.sgui.ControlConfig.prototype._ccKey = function(e) {
	if(dusk.controls.checkKey("sgui_action", e.key)) return true;
	if(!this.control) return true;
	if(!this.setting) {
		if(dusk.controls.checkKey("sgui_up", e.key)) return true;
		if(dusk.controls.checkKey("sgui_down", e.key)) return true;
		if(dusk.controls.checkKey("sgui_left", e.key)) return true;
		if(dusk.controls.checkKey("sgui_right", e.key)) return true;
	}
	
	dusk.controls.mapKey(this.control, e.key);
	this.setting = false;
	this.locked = false;
	return false;
};

Object.seal(dusk.sgui.ControlConfig);
Object.seal(dusk.sgui.ControlConfig.prototype);
