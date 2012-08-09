//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk.sgui.Label");
goog.provide("dusk.sgui.Text");
goog.provide("dusk.sgui.TextBox");

/** This is just a generic piece of text. Amusing.
 */
dusk.sgui.Label = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
		
		this._registerPropMask("text", "_text", true);
		this._registerPropMask("font", "_font", true);
		this._registerPropMask("colour", "_colour", true);
		this._registerPropMask("color", "_colour", true);
		this._registerPropMask("padding", "_padding", true);
		this._registerPropMask("size", "_size", true);
		this._registerProp("width", this._setWidth, this._getWidth, ["font", "text"]);
		this._registerProp("height", this._setHeight, this._getHeight, ["font", "text"]);
		
		this._text = "";
		this._width = -1;
		
		this._size = this._theme("label.size", 14);
		this._font = this._theme("label.font", "sans");
		this._colour = this._theme("label.colour", "#000000");
		this._padding = this._theme("label.padding", 5);
		
		this._registerDrawHandler(this._labelDraw);
	}
};
dusk.sgui.Label.prototype = new dusk.sgui.Component();
dusk.sgui.Label.constructor = dusk.sgui.Label;

dusk.sgui.Label.prototype.className = "Label";

dusk.sgui.Label.prototype._labelDraw = function(c) {
	if(this._text){
		c.fillStyle = this.prop("colour");
		c.font = this.prop("size")+"px "+this.prop("font");
		if(this.prop("width")>0) {
			c.fillText(this._text, this.prop("padding"), (this.prop("height")>>1)+(this.prop("padding")>>1), ~~this.prop("width")-(this._padding<<1));
		}else{
			c.fillText(this._text, this.prop("padding"), (this.prop("height")>>1)+(this.prop("padding")>>1));
		}
	}
};

dusk.sgui.Label.prototype._getWidth = function(name) {
	return this.measure(this.prop("text"))+(this._padding<<1);
}

dusk.sgui.Label.prototype._setWidth = function(name, value) {
	this._width = value-(this._padding<<1);
	
	return value;
}

dusk.sgui.Label.prototype._getHeight = function(name) {
	return this.prop("size")+(this._padding<<1);
}

dusk.sgui.Label.prototype._setHeight = function(name, value) {
	this.prop("size", value-(this._padding<<1));
	
	return this.prop("size")+(this._padding<<1);
}

dusk.sgui.Label.prototype.measure = function(test) {
	if(this._width != -1) return this._width;
	
	var c = $("#"+dusk.canvas)[0].getContext("2d");
	
	var state = c.save();
	c.font = this.prop("size")+"px "+this.prop("font");
	var hold = c.measureText(test).width;
	c.restore(state);
	
	return hold;
};

// -----

dusk.sgui.Text = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Label.call(this, parent, comName);
		
		this._watch = "";
		
		this._registerPropMask("watch", "_watch", true);
		
		this._registerFrameHandler(this._checkUpdate);
	}
};

dusk.sgui.Text.prototype = new dusk.sgui.Label();
dusk.sgui.Text.constructor = dusk.sgui.Text;

dusk.sgui.Text.prototype.className = "Text";

dusk.sgui.Text.prototype._checkUpdate = function(e) {
	if(this.prop("watch") && dusk.events.getVar(this.prop("watch")) !== undefined && dusk.events.getVar(this.prop("watch")) != this.prop("text")) {
		this.prop("text", dusk.events.getVar(this.prop("watch")));
	}
};

// -----

dusk.sgui.TextBox = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Text.call(this, parent, comName);
		
		this._registerPropMask("border", "_border", true);
		this._registerPropMask("border-active", "_borderActive", true);
		
		this._border = this._theme("border");
		this._borderActive = this._theme("borderActive");
		
		this._registerDrawHandler(this._boxDraw);
		this._registerKeyHandler(-1, false, false, this._boxKey, this);
	}
};

dusk.sgui.TextBox.prototype = new dusk.sgui.Text();
dusk.sgui.TextBox.constructor = dusk.sgui.TextBox;

dusk.sgui.TextBox.prototype.className = "TextBox";

dusk.sgui.TextBox.prototype._boxDraw = function(c) {
	c.strokeStyle = this._active?this.prop("border-active"):this.prop("border");
	
	c.strokeRect (0, 0, this.prop("width"), this.prop("height"));
};

dusk.sgui.TextBox.prototype._boxKey = function(e) {
	var keyDat = dusk.events.getMod("Keyboard").lookupCode(e.keyCode);
	
	if(dusk.events.getVar(this.prop("watch")) === undefined) dusk.events.setVar(this.prop("watch"), "");
	
	if(keyDat[1]) {
		dusk.events.setVar(this.prop("watch"), dusk.events.getVar(this.prop("watch"))+(e.shiftKey?keyDat[0].toUpperCase():keyDat[0]));
		return true;
	}
	
	if(keyDat[0] == "BACKSPACE") {
		dusk.events.setVar(this.prop("watch"), dusk.events.getVar(this.prop("watch")).substr(0, dusk.events.getVar(this.prop("watch")).length-1));
		return true;
	}
	
	if(keyDat[0] == "ENTER") {
		this._doAction(e);
		return true;
	}
	
	return false;
};
