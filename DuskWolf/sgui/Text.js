//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");

dusk.load.provide("dusk.sgui.Label");
dusk.load.provide("dusk.sgui.TextBox");

/* This is just a generic piece of text. Amusing.
 */
dusk.sgui.Label = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
		
		this.text = "";
		this._width = -1;
		
		this.size = 14;
		this.font = "sans";
		this.colour = "#000000";
		this.borderColour = "#000000";
		this.borderSize = 0;
		this.padding = 5;
		
		//Prop masks
		this._registerPropMask("text", "text", true);
		this._registerPropMask("font", "font", true);
		this._registerPropMask("colour", "colour", true);
		this._registerPropMask("color", "colour", true);
		this._registerPropMask("borderColour", "borderColour", true);
		this._registerPropMask("borderColor", "borderColour", true);
		this._registerPropMask("borderSize", "borderSize", true);
		this._registerPropMask("padding", "padding", true);
		this._registerPropMask("size", "size", true);
		this._registerPropMask("width", "width", true, ["font", "text"]);
		this._registerPropMask("height", "height", true, ["font", "text"]);
		
		//Listeners
		this.prepareDraw.listen(this._labelDraw, this);
	}
};
dusk.sgui.Label.prototype = new dusk.sgui.Component();
dusk.sgui.Label.constructor = dusk.sgui.Label;

dusk.sgui.Label.prototype.className = "Label";

dusk.sgui.Label.prototype._labelDraw = function(e) {
	if(this.text){
		e.c.fillStyle = this.colour;
		e.c.font = this.size + "px "+this.font;
		if(e.c.textBaseline != "middle") e.c.textBaseline = "middle";
		if(this._width > -1) {
			e.c.fillText(this.text, e.d.destX + this.padding, e.d.destY + (this.height>>1) + (this.padding>>1), ~~this._width-(this.padding<<1));
			if(this.borderSize > 0) {
				e.c.strokeStyle = this.borderColour;
				e.c.strokeText(this.text, e.d.destX + this.padding, e.d.destY + (this.height>>1) + (this.padding>>1), ~~this._width-(this.padding<<1));
			}
		}else{
			e.c.fillText(this.text, e.d.destX + this.padding, e.d.destY + (this.height>>1) + (this.padding>>1));
			if(this.borderSize > 0) {
				e.c.strokeStyle = this.borderColour;
				e.c.strokeText(this.text, e.d.destX + this.padding, e.d.destY + (this.height>>1) + (this.padding>>1));
			}
		}
	}
};

//Width
Object.defineProperty(dusk.sgui.Label.prototype, "width", {
	get: function() {return this.measure(this.text)+(this._padding<<1);},
	set: function(value) {this._width = value-(this._padding<<1);}
});

//Height
Object.defineProperty(dusk.sgui.Label.prototype, "height", {
	get: function() {return this.size + (this._padding<<1);},
	set: function(value) {this.size = value - (this._padding<<1);}
});

dusk.sgui.Label.prototype.measure = function(test) {
	if(this._width != -1) return this._width;
	
	var c = $("#"+dusk.canvas)[0].getContext("2d");
	
	c.save();
	c.font = this.size+"px "+this.font;
	var hold = c.measureText(test).width;
	c.restore();
	
	return hold;
};

Object.seal(dusk.sgui.Label);
Object.seal(dusk.sgui.Label.prototype);

dusk.sgui.registerType("Label", dusk.sgui.Label);

// -----

dusk.sgui.TextBox = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Label.call(this, parent, comName);
		
		this.border = "#cccccc";
		this.borderActive = "#ff5555";
		
		//Prop masks
		this._registerPropMask("border", "border", true);
		this._registerPropMask("borderActive", "borderActive", true);
		
		//Listeners
		this.prepareDraw.listen(this._boxDraw, this);
		this.keyPress.listen(this._boxKey, this, {"ctrl":false});
	}
};
dusk.sgui.TextBox.prototype = new dusk.sgui.Label();
dusk.sgui.TextBox.constructor = dusk.sgui.TextBox;

dusk.sgui.TextBox.prototype.className = "TextBox";

dusk.sgui.TextBox.prototype._boxDraw = function(e) {
	e.c.strokeStyle = this._active?this.borderActive:this.border;
	
	e.c.strokeRect(e.d.destX, e.d.destY, e.d.width, e.d.height);
};

dusk.sgui.TextBox.prototype._boxKey = function(e) {
	var keyDat = dusk.keyboard.lookupCode(e.key);
	
	//Check if the user has mapped any inputs to the key...
	if(dusk.controls.checkKey("sgui_up", e.key)) return true;
	if(dusk.controls.checkKey("sgui_down", e.key)) return true;
	if(dusk.controls.checkKey("sgui_left", e.key)) return true;
	if(dusk.controls.checkKey("sgui_right", e.key)) return true;
	
	if(keyDat[1]) {
		this.text += e.shift?keyDat[0].toUpperCase():keyDat[0];
		return false;
	}
	
	if(keyDat[0] == "BACKSPACE") {
		this.text = this.text.substr(0, this.text.length-1);
		return false;
	}
	
	if(keyDat[0] == "ENTER") {
		this.action.fire(e);
		return false;
	}
	
	return true;
};

Object.seal(dusk.sgui.TextBox);
Object.seal(dusk.sgui.TextBox.prototype);

dusk.sgui.registerType("TextBox", dusk.sgui.TextBox);
