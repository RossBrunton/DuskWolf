//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.text.standardFormatBlocks", function() {
	var FormatBlock = load.require("dusk.text.FormatBlock");
	var Image = load.require("dusk.utils.Image");
	
	// Bold
	var BoldBlock = function() {FormatBlock.apply(this, arguments); this._name = "BoldBlock";};
	BoldBlock.prototype = Object.create(FormatBlock.prototype);
	
	BoldBlock.prototype._alterContext = function(ctx, settings) {
		if(!ctx.font.includes("bold")) {
			this._old = ctx.font;
			ctx.font = "bold "+ctx.font;
		}
	};
	
	BoldBlock.prototype._resetContext = function(ctx, settings) {
		if(this._old) ctx.font = this._old;
	};
	
	FormatBlock.register("b", BoldBlock);
	
	
	// Italics
	var ItalicBlock = function() {FormatBlock.apply(this, arguments); this._name = "ItalicBlock";};
	ItalicBlock.prototype = Object.create(FormatBlock.prototype);
	
	ItalicBlock.prototype._alterContext = function(ctx, settings) {
		if(!ctx.font.includes("italic")) {
			this._old = ctx.font;
			ctx.font = "italic "+ctx.font;
		}
	};
	
	ItalicBlock.prototype._resetContext = function(ctx, settings) {
		if(this._old) ctx.font = this._old;
	};
	
	FormatBlock.register("i", ItalicBlock);
	
	
	// Colour
	var ColourBlock = function(body, colour) {
		FormatBlock.call(this, body);
		this._colour = colour;
		this._name = "ColourBlock";
	};
	ColourBlock.prototype = Object.create(FormatBlock.prototype);
	
	ColourBlock.prototype._alterContext = function(ctx, settings) {
		this._old = ctx.fillStyle;
		ctx.fillStyle = this._colour;
	};
	
	ColourBlock.prototype._resetContext = function(ctx, settings) {
		ctx.fillStyle = this._old;
	};
	
	FormatBlock.register("colour", ColourBlock);
	FormatBlock.register("color", ColourBlock);
	
	
	// Font
	var FontBlock = function(body, font) {
		FormatBlock.call(this, body);
		this._font = font;
		this._name = "FontBlock";
	};
	FontBlock.prototype = Object.create(FormatBlock.prototype);
	
	FontBlock.prototype._alterContext = function(ctx, settings) {
		this._old = ctx.font;
		ctx.font = ctx.font.split(" ").slice(0, -1).join(" ") + " " + this._font;
	};
	
	FontBlock.prototype._resetContext = function(ctx, settings) {
		ctx.font = this._old;
	};
	
	FormatBlock.register("font", FontBlock);
	
	
	// bsize
	var BorderSizeBlock = function(body, size) {
		FormatBlock.call(this, body);
		this._size = size;
		this._name = "BorderSizeBlock";
	};
	BorderSizeBlock.prototype = Object.create(FormatBlock.prototype);
	
	BorderSizeBlock.prototype._alterContext = function(ctx, settings) {
		this._old = ctx.lineWidth;
		this._oldDb = settings.drawBorder;
		
		ctx.lineWidth = this._size;
		settings.drawBorder = this._size > 0;
	};
	
	BorderSizeBlock.prototype._resetContext = function(ctx, settings) {
		ctx.lineWidth = this._old;
		settings.drawBorder = this._oldDb;
	};
	
	FormatBlock.register("bsize", BorderSizeBlock);
	
	
	// bcolour
	var BorderColourBlock = function(body, colour) {
		FormatBlock.call(this, body);
		this._colour = colour;
		this._name = "BorderColourBlock";
	};
	BorderColourBlock.prototype = Object.create(FormatBlock.prototype);
	
	BorderColourBlock.prototype._alterContext = function(ctx, settings) {
		this._old = ctx.strokeStyle;
		ctx.strokeStyle = this._colour;
	};
	
	BorderColourBlock.prototype._resetContext = function(ctx, settings) {
		ctx.strokeStyle = this._old;
	};
	
	FormatBlock.register("bcolour", BorderColourBlock);
	FormatBlock.register("bcolor", BorderColourBlock);
	
	// Underline
	var UnderlineBlock = function(body, thickness, colour) {
		FormatBlock.call(this, body);
		this._thickness = thickness !== undefined ? thickness : 1;
		this._colour = colour;
		this._useCtxColour = colour === undefined;
		this._name = "UnderlineBlock";
	};
	UnderlineBlock.prototype = Object.create(FormatBlock.prototype);
	
	UnderlineBlock.prototype.print = function(ctx, location, chars, settings) {
		var height = location.lineHeight();
		var startX = location.x;
		var startLine = location.lines - 1;
		var startY = location.y;
		
		var ret = FormatBlock.prototype.print.apply(this, arguments);
		
		var resetColour = ctx.strokeStyle;
		if(!this._useCtxColour) {
			ctx.strokeStyle = this._colour;
		}else{
			ctx.strokeStyle = ctx.fillStyle;
		}
		var resetThickness = ctx.lineWidth;
		ctx.lineWidth = this._thickness;
		
		if(location.lines === startLine + 1) {
			// Single line
			ctx.beginPath();
			
			ctx.moveTo(startX, startY + (height/2));
			ctx.lineTo(location.x, location.y + (height/2));
			ctx.stroke();
		}else{
			// Multiline
			ctx.beginPath();
			
			// Initial line
			ctx.moveTo(startX, startY + height/2);
			ctx.lineTo(location.lineWidths[startLine] + location.padding(), startY + height/2);
			
			// Inner lines
			for(var i = startLine+1; i < location.lineWidths.length; i ++) {
				ctx.moveTo(location.padding(), location.padding() + ((i + 1) * height));
				ctx.lineTo(location.lineWidths[i] + location.padding(), location.padding() + ((i + 1) * height));
			}
			
			// Final line
			ctx.moveTo(location.padding(), location.y + (height/2));
			ctx.lineTo(location.x, location.y + (height/2));
			
			ctx.stroke();
		}
		
		ctx.strokeStyle = resetColour;
		ctx.lineWidth = resetThickness;
		
		return ret;
	};
	
	FormatBlock.register("u", UnderlineBlock);
	
	
	// img
	var ImgBlock = function(body) {
		FormatBlock.call(this, body);
		this._src = Array.prototype.slice.call(arguments, 1).join(" ");
		this._body = [""];
		this._name = "ImgBlock";
		
		this._image = new Image(this._src);
		this._cclear = null;
	};
	ImgBlock.prototype = Object.create(FormatBlock.prototype);
	
	ImgBlock.prototype.print = function(ctx, location, chars, settings) {
		this._cclear = settings.clear;
		
		if(!this._image.isReady()) {
			this._image.loadPromise().then(this._cclear);
			return FormatBlock.prototype.print.apply(this, arguments);
		}else{
			var hfrags = ctx.font.split("px")[0].split(" ");
			var height = +hfrags[hfrags.length-1];
			
			var width = this._image.width() * (height / this._image.height());
			
			if(location.lineTooLong(ctx, "", width)) location.newline();
			
			if(!settings.scanOnly) {
				this._image.paint(
					ctx, [], false, 0, 0, this._image.width(), this._image.height(),
					location.x, location.y - ~~(height/2), width, height
				);
			}
			
			location.advanceRaw(width, 1);
			
			return chars - 1;
		}
	};
	
	FormatBlock.register("img", ImgBlock);
});
