//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require(">dusk.utils");
dusk.load.require(">dusk.controls");
dusk.load.require(">dusk.data");

dusk.load.provide("dusk.sgui.Label");
dusk.load.provide("dusk.sgui.Textbox");

dusk.sgui.Label = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	this._cachedWidth = 0;
	this._text = "";
	this.text = "";
	this._width = -1;
	this._sig = "";
	this._cache = null;
	
	this.size = 14;
	this.font = "sans";
	this.colour = "#000000";
	this.borderColour = "#990000";
	this.borderSize = 0;
	this.padding = 3;
	this.format = true;
	
	//Formatting commands
	this._command = new dusk.EventDispatcher("dusk.sgui.Label.command", dusk.EventDispatcher.MODE_LAST);
	this._command.listen(function(e){return [null, ""];}, this);
	this._command.listen(function(e){return [null, "["];}, this, {"command":"["});
	this._command.listen(function(e){return [dusk.sgui.Label.EVENT_BOLD, ""];}, this, {"command":"b"});
	this._command.listen(function(e){return [dusk.sgui.Label.EVENT_DEBOLD, ""];}, this, {"command":"/b"});
	this._command.listen(function(e){return [dusk.sgui.Label.EVENT_ITALIC, ""];}, this, {"command":"i"});
	this._command.listen(function(e){return [dusk.sgui.Label.EVENT_DEITALIC, ""];}, this, {"command":"/i"});
	
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_COLOUR, e.args[1]];
	}, this, {"command":"colour"});
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_COLOUR, this.colour];
	}, this, {"command":"/colour"});
	
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_FONT, e.args[1]];
	}, this, {"command":"font"});
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_FONT, this.font];
	}, this, {"command":"/font"});
	
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_BSIZE, e.args[1]];
	}, this, {"command":"bsize"});
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_BSIZE, this.borderSize];
	}, this, {"command":"/bsize"});
	
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_BCOLOUR, e.args[1]];
	}, this, {"command":"bcolour"});
	this._command.listen(function(e){
		return [dusk.sgui.Label.EVENT_BCOLOUR, this.borderColour];
	}, this, {"command":"/bcolour"});
	
	this._command.listen(function(e){
		var img = dusk.data.grabImage(e.args[1]);
		
		return [dusk.sgui.Label.EVENT_IMAGE, [img]];
	}, this, {"command":"img"});
	
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
	this._registerPropMask("format", "format", true);
	this._registerPropMask("width", "width", true, ["font", "text"]);
	this._registerPropMask("height", "height", true, ["font", "text"]);
	
	//Listeners
	this.prepareDraw.listen(this._blDraw, this);
	
	//Render support
	this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
};
dusk.sgui.Label.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.Label.EVENT_TERM = 0;
dusk.sgui.Label.EVENT_COLOUR = 1;
dusk.sgui.Label.EVENT_IMAGE = 2;
dusk.sgui.Label.EVENT_BOLD = 3;
dusk.sgui.Label.EVENT_DEBOLD = 4;
dusk.sgui.Label.EVENT_ITALIC = 5;
dusk.sgui.Label.EVENT_DEITALIC = 6;
dusk.sgui.Label.EVENT_FONT = 7;
dusk.sgui.Label.EVENT_BSIZE = 8;
dusk.sgui.Label.EVENT_BCOLOUR = 9;

dusk.sgui.Label.prototype._blDraw = function(e) {
	if(this.text !== ""){
		if(this._sig != this._genSig()) {
			//Rebuild the text cache
			this._updateCache();
		}
		
		e.c.drawImage(this._cache, e.d.sourceX, e.d.sourceY, e.d.width, e.d.height,
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	}
};

dusk.sgui.Label.prototype._updateCache = function(widthOnly) {
	var textHold = this._text;
	var textBuffer = "";
	
	var cache = dusk.utils.createCanvas((widthOnly?0:this.width), this.height);
	if(!widthOnly) this._cache = cache;
	var c = cache.getContext("2d");
	var font = this.font;
	
	c.font = this.size + "px " + this.font;
	c.fillStyle = this.colour;
	c.strokeStyle = this.borderColour;
	c.lineWidth = this.borderSize;
	
	var useBorder = this.borderSize > 0;
	
	var cursor = this.padding;
	var charData = null;
	while(charData = this._nextChar(textHold)) {
		if(charData[0] == null) {
			textBuffer += charData[1];
		}else{
			if(textBuffer !== "") {
				if(!widthOnly) c.fillText(textBuffer, cursor, this.padding + (this.size>>1));
				if(useBorder && !widthOnly) c.strokeText(textBuffer, cursor, this.padding + (this.size >> 1));
				
				cursor += c.measureText(textBuffer).width;
				textBuffer = "";
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_TERM) {
				break;
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_COLOUR) {
				c.fillStyle = charData[1];
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_BCOLOUR) {
				c.strokeStyle = charData[1];
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_BSIZE) {
				c.lineWidth = charData[1];
				useBorder = charData[1] > 0;
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_BOLD && c.font.indexOf("bold") === -1) {
				if(c.font.indexOf("italic") !== -1) {
					c.font = c.font.replace("italic", "italic bold");
				}else{
					c.font = "bold " + c.font;
				} 
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_DEBOLD && c.font.indexOf("bold") !== -1) {
				c.font = c.font.replace("bold ", "");
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_ITALIC && c.font.indexOf("italic") === -1) {
				c.font = "italic " + c.font;
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_DEITALIC && c.font.indexOf("italic") !== -1) {
				c.font = c.font.replace("italic ", "");
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_FONT) {
				c.font = c.font.replace(font, charData[1]);
				font = charData[1];
			}
			
			if(charData[0] == dusk.sgui.Label.EVENT_IMAGE) {
				if(!charData[1][1]) {
					charData[1][1] = (charData[1][0].width / charData[1][0].height) * this.size;
				}
				
				if(charData[1][0].complete) {
					c.drawImage(charData[1][0], 0, 0, charData[1][0].width, charData[1][0].height,
						cursor, this.padding, charData[1][1], this.size
					);
					
					cursor += charData[1][1];
				}else{
					dusk.data.imgLoad.listen(function(e) {this._updateCache();}, this, {"src":charData[1][0].src});
					
					textBuffer += "\ufffd";
				}
			}
		}
		textHold = textHold.substr(charData[2]);
	}
	
	this._cachedWidth = cursor + this.padding;
	if(isNaN(this._cachedWidth)) this._cachedWidth = this.padding << 1;
	if(!widthOnly) this._sig = this._genSig();
};

//hidth
Object.defineProperty(dusk.sgui.Label.prototype, "width", {
	get: function() {
		if(this._width >=0 ) {
			return this._width+(this.padding<<1)
		}else{
			return this._cachedWidth;
		}
	},
	set: function(value) {
		this._width = value-(this.padding<<1);
	}
});

//height
Object.defineProperty(dusk.sgui.Label.prototype, "height", {
	get: function() {
		return this.size + (this.padding<<1);
	},
	set: function(value) {
		this.size = value - (this.padding<<1);
	}
});

//Text
Object.defineProperty(dusk.sgui.Label.prototype, "text", {
	get: function() {
		return this._text;
	},
	set: function(value) {
		this._text = ""+value;
		this._updateCache(true);
	}
});

dusk.sgui.Label.prototype._genSig = function() {
	return this.size+"/"+this.font+"/"+this.colour+"/"+this.borderColour+"/"+(this.padding<<1)+"/"+this.borderSize
	+"/"+this.text+"/"+this.format;
};

dusk.sgui.Label.prototype._nextChar = function(text) {
	if(text.length <= 0) return [dusk.sgui.Label.EVENT_TERM, "", 0];
	
	if(text.charAt(0) == "[" && text.indexOf("]") != -1 && this.format) {
		var commandStr = text.match(/^\[([^\]]*?)\]/i);
		var commands = commandStr[1].split(/\s/);
		
		return this._command.fire({"command":commands[0].toLowerCase(), "args":commands}).concat([commandStr[0].length]);
	}else{
		return [null, text.charAt(0), 1];
	}
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
dusk.sgui.TextBox.prototype = Object.create(dusk.sgui.Label.prototype);

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
