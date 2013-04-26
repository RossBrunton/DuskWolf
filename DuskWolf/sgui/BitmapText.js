//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require(">dusk.utils");

dusk.load.provide("dusk.sgui.BitmapLabel");

dusk.sgui.BitmapLabel = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	this._cachedWidth = 0;
	this._text = "";
	this.text = "";
	this._width = -1;
	this._table = null;
	this._cache = null;
	
	this.size = 14;
	this.font = "sans";
	this.colour = "#000000";
	this.borderColour = "#990000";
	this.borderSize = 0;
	this.padding = 3;
	
	this._command = new dusk.EventDispatcher("dusk.sgui.BitmapLabel.command", dusk.EventDispatcher.MODE_LAST);
	this._command.listen(function(e){return [null, ""];}, this);
	this._command.listen(function(e){return [null, "["];}, this, {"command":"["});
	
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
	this.prepareDraw.listen(this._blDraw, this);
	
	//Render support
	this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
};
dusk.sgui.BitmapLabel.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.BitmapLabel.prototype._symbols = {};

dusk.sgui.BitmapLabel.prototype._blDraw = function(e) {
	if(this.text !== ""){
		if(this._table != this._getTable() || (this.borderSize && this._btable != this._getTable(true))) {
			//Rebuild the text cache
			var textHold = this._text;
			var table = this._table = this._getTable();
			var btable = this._btable = null;
			if(this.borderSize) btable = this._btable = this._getTable(true);
			
			this._cache = dusk.utils.createCanvas(this.width, this.height);
			var c = this._cache.getContext("2d");
			
			var cursor = this.padding;
			while(textHold !== "") {
				var charData = this._nextChar(textHold);
				var char = charData[1];
				if(charData[0] == null) {
					this._addToTable(char);
				}
				
				if(char !== "") {
					c.drawImage(table.segments[table[char][0]].canvas,
						table[char][1], 0, table[char][2], this.size + (this.padding<<1),
						cursor, 0, table[char][2], this.size + (this.padding<<1)
					);
					
					if(this.borderSize) {
						this._addToTable(this.text[i], true);
						c.drawImage(btable.segments[btable[char][0]].canvas,
							btable[char][1], 0, btable[char][2], this.size + (this.padding<<1),
							cursor, 0, btable[char][2], this.size + (this.padding<<1)
						);
					}
					cursor += table[char][2];
				}
				textHold = textHold.substr(charData[2]);
			}
			
			this._cachedWidth = cursor + this.padding;
		}
		
		e.c.drawImage(this._cache, e.d.sourceX, e.d.sourceY, e.d.width, e.d.height,
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	}
};

//hidth
Object.defineProperty(dusk.sgui.BitmapLabel.prototype, "width", {
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
Object.defineProperty(dusk.sgui.BitmapLabel.prototype, "height", {
	get: function() {
		return this.size + (this.padding<<1);
	},
	set: function(value) {
		this.size = value - (this.padding<<1);
	}
});

//Text
Object.defineProperty(dusk.sgui.BitmapLabel.prototype, "text", {
	get: function() {
		return this._text;
	},
	set: function(value) {
		this._text = ""+value;
		this._cachedWidth = this.measure(this._text);
		this._table = null; //Force a reset
	}
});

dusk.sgui.BitmapLabel.prototype._getTable = function(border) {
	if(!border) {
		if(!((this.size+"/"+this.font+"/"+this.colour+"/"+(this.padding<<1)) in this._symbols)) {
			this._symbols[this.size+"/"+this.font+"/"+this.colour+"/"+(this.padding<<1)] = {};
			this._symbols[this.size+"/"+this.font+"/"+this.colour+"/"+(this.padding<<1)].segments = [];
			this._symbols[this.size+"/"+this.font+"/"+this.colour+"/"+(this.padding<<1)].segmentFree = new Uint8Array(50);
		}
		return this._symbols[this.size+"/"+this.font+"/"+this.colour+"/"+(this.padding<<1)];
	}else{
		if(!((this.size+"/"+this.font+"/"+this.borderColour+"/"+(this.padding<<1)+"/"+this.borderSize)
			in this._symbols)) {
			this._symbols[this.size+"/"+this.font+"/"+this.borderColour+"/"+(this.padding<<1)+"/"+this.borderSize]
				= {};
			this._symbols[this.size+"/"+this.font+"/"+this.borderColour+"/"+(this.padding<<1)+"/"+this.borderSize]
				.segments = [];
			this._symbols[this.size+"/"+this.font+"/"+this.borderColour+"/"+(this.padding<<1)+"/"+this.borderSize]
				.segmentFree = new Uint8Array(50);
		}
		return this._symbols[this.size+"/"+this.font+"/"+this.borderColour+"/"+(this.padding<<1)+"/"+this.borderSize];
	}
};

dusk.sgui.BitmapLabel.prototype._addToTable = function(char, border) {
	if(char in this._getTable(border)) return false;
	
	var table = this._getTable(border);
	if(!table.segments[0]) {
		table.segments[0] = dusk.utils.createCanvas(255, (this.padding<<1) + this.size).getContext("2d");
		table.segments[0].font = this.size + "px " + this.font;
		table.segments[0].fillStyle = this.colour;
		table.segments[0].strokeStyle = this.borderColour;
		table.segments[0].lineWidth = this.borderSize;
	}
	
	var width = table.segments[0].measureText(char).width;
	var seg = -1;
	
	for(var i = 0; i < table.segmentFree.length; i ++) {
		if(width + table.segmentFree[i] + 3 < 255) {
			seg = i;
			break;
		}
	}
	
	if(seg == -1) {
		console.warn("Out of space for character "+char+"!");
		return true;
	}
	
	if(!table.segments[seg]) {
		table.segments[seg] = dusk.utils.createCanvas(255, (this.padding<<1) + this.size).getContext("2d");
		table.segments[seg].font = this.size + "px " + this.font;
		table.segments[seg].fillStyle = this.colour;
		table.segments[seg].strokeStyle = this.borderColour;
		table.segments[seg].lineWidth = this.borderSize;
	}
	
	table[char] = new Uint8Array(3);
	table[char][0] = seg;
	table[char][1] = table.segmentFree[seg];
	table[char][2] = width;
	
	table.segmentFree[seg] += width + 3;
	
	if(!border) {
		table.segments[seg].fillText(char, table[char][1], this.padding + (this.size>>1));
	}else{
		table.segments[seg].strokeText(char, table[char][1], this.padding + (this.size>>1));
	}
};

dusk.sgui.BitmapLabel.prototype.measure = function(test) {
	if(this._width != -1) return this._width;
	
	var hold = this.padding<<1;
	for(var i = 0; i < this.text.length; i ++) {
		this._addToTable(this.text.charAt(i));
		hold += this._getTable()[this.text.charAt(i)][2];
	}
	
	return hold;
};

dusk.sgui.BitmapLabel.prototype._nextChar = function(text) {
	if(text.charAt(0) == "[") {
		var commandStr = text.match(/^\[([^\]]*?)\]/);
		
		return this._command.fire({"command":commandStr[1]}).concat([commandStr[0].length]);
	}else{
		return [null, text.charAt(0), 1];
	}
};

Object.seal(dusk.sgui.BitmapLabel);
Object.seal(dusk.sgui.BitmapLabel.prototype);

dusk.sgui.registerType("BitmapLabel", dusk.sgui.BitmapLabel);
