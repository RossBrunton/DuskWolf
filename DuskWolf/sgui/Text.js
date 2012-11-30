//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.sgui.Label");
dusk.load.provide("dusk.sgui.Text");
dusk.load.provide("dusk.sgui.TextBox");

/** This is just a generic piece of text. Amusing.
 */
dusk.sgui.Label = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
		
		this._registerPropMask("text", "text", true);
		this._registerPropMask("font", "font", true);
		this._registerPropMask("colour", "colour", true);
		this._registerPropMask("color", "colour", true);
		this._registerPropMask("padding", "padding", true);
		this._registerPropMask("size", "size", true);
		this._registerPropMask("width", "width", true, ["font", "text"]);
		this._registerPropMask("height", "height", true, ["font", "text"]);
		
		this.text = "";
		
		this.size = this._theme("label.size", 14);
		this.font = this._theme("label.font", "sans");
		this.colour = this._theme("label.colour", "#000000");
		this.padding = this._theme("label.padding", 5);
		
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

dusk.sgui.Label.prototype.__defineGetter__("width", function _getWidth() {
	return this.measure(this.text)+(this._padding<<1);
});

dusk.sgui.Label.prototype.__defineSetter__("width", function _setWidth(value) {
	this._width = value-(this._padding<<1);
});

dusk.sgui.Label.prototype.__defineGetter__("height", function _getHeight() {
	return this.size+(this._padding<<1);
});

dusk.sgui.Label.prototype.__defineSetter__("height", function _setHeight(value) {
	this.size = value-(this._padding<<1);
});

dusk.sgui.Label.prototype.measure = function(test) {
	if(this._width != -1) return this._width;
	
	var c = $("#"+dusk.canvas)[0].getContext("2d");
	
	var state = c.save();
	c.font = this.size+"px "+this.font;
	var hold = c.measureText(test).width;
	c.restore(state);
	
	return hold;
};

// -----

dusk.sgui.Text = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Label.call(this, parent, comName);
		
		this.watch = "";
		
		this._registerPropMask("watch", "watch", true);
		
		this._registerFrameHandler(this._checkUpdate);
	}
};

dusk.sgui.Text.prototype = new dusk.sgui.Label();
dusk.sgui.Text.constructor = dusk.sgui.Text;

dusk.sgui.Text.prototype.className = "Text";

dusk.sgui.Text.prototype._checkUpdate = function(e) {
	if(this.watch && dusk.actions.getVar(this.watch) !== undefined && dusk.actions.getVar(this.watch) != this.text) {
		this.text = dusk.actions.getVar(this.watch);
		this.bookRedraw();
	}
};

// -----

dusk.sgui.TextBox = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Text.call(this, parent, comName);
		
		this._registerPropMask("border", "border", true);
		this._registerPropMask("border-active", "borderActive", true);
		
		this.border = this._theme("border");
		this.borderActive = this._theme("borderActive");
		
		this._registerDrawHandler(this._boxDraw);
		this._registerKeyHandler(-1, false, false, this._boxKey, this);
	}
};

dusk.sgui.TextBox.prototype = new dusk.sgui.Text();
dusk.sgui.TextBox.constructor = dusk.sgui.TextBox;

dusk.sgui.TextBox.prototype.className = "TextBox";

dusk.sgui.TextBox.prototype._boxDraw = function(c) {
	c.strokeStyle = this._active?this.borderActive:this.border;
	
	c.strokeRect (0, 0, this.width, this.height);
};

dusk.sgui.TextBox.prototype._boxKey = function(e) {
	var keyDat = dusk.mods.keyboard.lookupCode(e.keyCode);
	
	if(dusk.actions.getVar(this.watch) === undefined) dusk.actions.setVar(this.watch, "");
	
	if(keyDat[1]) {
		dusk.actions.setVar(this.watch, dusk.actions.getVar(this.watch)+(e.shiftKey?keyDat[0].toUpperCase():keyDat[0]));
		return true;
	}
	
	if(keyDat[0] == "BACKSPACE") {
		dusk.actions.setVar(this.watch, dusk.actions.getVar(this.watch).substr(0, dusk.actions.getVar(this.watch).length-1));
		return true;
	}
	
	if(keyDat[0] == "ENTER") {
		this._doAction(e);
		return true;
	}
	
	return false;
};
