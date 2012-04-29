//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** This is just a generic piece of text. Amusing.
 */
sgui.Label = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
		
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
		
		window.hook = this;
		
		this._registerDrawHandler(this._labelDraw);
	}
};
sgui.Label.prototype = new sgui.Component();
sgui.Label.constructor = sgui.Label;

sgui.Label.prototype.className = "Label";

sgui.Label.prototype._labelDraw = function(c) {
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

sgui.Label.prototype._getWidth = function(name) {
	return this.measure(this.prop("text"))+(this._padding<<1);
}

sgui.Label.prototype._setWidth = function(name, value) {
	this._width = value-(this._padding<<1);
	
	return value;
}

sgui.Label.prototype._getHeight = function(name) {
	return this.prop("size")+(this._padding<<1);
}

sgui.Label.prototype._setHeight = function(name, value) {
	this.prop("size", value-(this._padding<<1));
	
	return this.prop("size")+(this._padding<<1);
}

sgui.Label.prototype.measure = function(test) {
	if(this._width != -1) return this._width;
	
	var c = $("#"+duskWolf.canvas)[0].getContext("2d");
	
	var state = c.save();
	c.font = this.prop("size")+"px "+this.prop("font");
	var hold = c.measureText(test).width;
	c.restore(state);
	
	return hold;
};

// -----

sgui.Text = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Label.call(this, parent, events, comName);
		
		this._watch = "";
		
		this._registerPropMask("watch", "_watch", true);
		
		this._registerFrameHandler(this._checkUpdate);
	}
};

sgui.Text.prototype = new sgui.Label();
sgui.Text.constructor = sgui.Text;

sgui.Text.prototype.className = "Text";

sgui.Text.prototype._checkUpdate = function(e) {
	if(this.prop("watch") && this._events.getVar(this.prop("watch")) !== undefined && this._events.getVar(this.prop("watch")) != this.prop("text")) {
		this.prop("text", this._events.getVar(this.prop("watch")));
	}
};

// -----

sgui.TextBox = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Text.call(this, parent, events, comName);
		
		this._registerPropMask("border", "_border", true);
		this._registerPropMask("border-active", "_borderActive", true);
		
		this._border = this._theme("border");
		this._borderActive = this._theme("borderActive");
		
		this._registerDrawHandler(this._boxDraw);
		this._registerKeyHandler(-1, false, false, this._boxKey, this);
	}
};

sgui.TextBox.prototype = new sgui.Text();
sgui.TextBox.constructor = sgui.TextBox;

sgui.TextBox.prototype.className = "TextBox";

sgui.TextBox.prototype._boxDraw = function(c) {
	c.strokeStyle = this._active?this.prop("border-active"):this.prop("border");
	
	c.strokeRect (0, 0, this.prop("width"), this.prop("height"));
};

sgui.TextBox.prototype._boxKey = function(e) {
	var keyDat = this._events.getMod("Keyboard").lookupCode(e.keyCode);
	
	if(this._events.getVar(this.prop("watch")) === undefined) this._events.setVar(this.prop("watch"), "");
	
	if(keyDat[1]) {
		this._events.setVar(this.prop("watch"), this._events.getVar(this.prop("watch"))+(e.shiftKey?keyDat[0].toUpperCase():keyDat[0]));
		return true;
	}
	
	if(keyDat[0] == "BACKSPACE") {
		this._events.setVar(this.prop("watch"), this._events.getVar(this.prop("watch")).substr(0, this._events.getVar(this.prop("watch")).length-1));
		return true;
	}
	
	return false;
};
