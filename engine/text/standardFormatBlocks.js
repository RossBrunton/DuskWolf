//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.text.standardFormatBlocks", function() {
	var FormatBlock = load.require("dusk.text.FormatBlock");
	var Image = load.require("dusk.utils.Image");
	
	// Bold
	class BoldBlock extends FormatBlock {
		constructor(body) {super(body); this._name = "BoldBlock";}
		
		_alterContext(ctx, settings) {
			if(!ctx.font.includes("bold")) {
				this._old = ctx.font;
				ctx.font = "bold "+ctx.font;
			}
		}
		
		_resetContext(ctx, settings) {
			if(this._old) ctx.font = this._old;
		}
	}
	
	FormatBlock.register("b", BoldBlock);
	
	
	// Italics
	class ItalicBlock extends FormatBlock {
		constructor(body) {super(body); this._name = "ItalicBlock";}
		
		_alterContext(ctx, settings) {
			if(!ctx.font.includes("italic")) {
				this._old = ctx.font;
				ctx.font = "italic "+ctx.font;
			}
		}
		
		_resetContext(ctx, settings) {
			if(this._old) ctx.font = this._old;
		}
	}
	
	FormatBlock.register("i", ItalicBlock);
	
	
	// Colour
	class ColourBlock extends FormatBlock {
		constructor(body, colour) {
			super(body);
			this._colour = colour;
			this._name = "ColourBlock";
		}
		
		_alterContext(ctx, settings) {
			this._old = ctx.fillStyle;
			ctx.fillStyle = this._colour;
		}
		
		_resetContext(ctx, settings) {
			ctx.fillStyle = this._old;
		}
	}
	
	FormatBlock.register("colour", ColourBlock);
	FormatBlock.register("color", ColourBlock);
	
	
	// Font
	class FontBlock extends FormatBlock {
		constructor(body, font) {
			super(body);
			this._font = font;
			this._name = "FontBlock";
		}
		
		_alterContext(ctx, settings) {
			this._old = ctx.font;
			ctx.font = ctx.font.split(" ").slice(0, -1).join(" ") + " " + this._font;
		}
		
		_resetContext(ctx, settings) {
			ctx.font = this._old;
		}
	}
	
	FormatBlock.register("font", FontBlock);
	
	
	// bsize
	class BorderSizeBlock extends FormatBlock {
		constructor(body, size) {
			super(body);
			this._size = size;
			this._name = "BorderSizeBlock";
		}
		
		_alterContext(ctx, settings) {
			this._old = ctx.lineWidth;
			this._oldDb = settings.drawBorder;
			
			ctx.lineWidth = this._size;
			settings.drawBorder = this._size > 0;
		}
		
		_resetContext(ctx, settings) {
			ctx.lineWidth = this._old;
			settings.drawBorder = this._oldDb;
		}
	}
		
	FormatBlock.register("bsize", BorderSizeBlock);
	
	
	// bcolour
	class BorderColourBlock extends FormatBlock {
		constructor(body, colour) {
			super(body);
			this._colour = colour;
			this._name = "BorderColourBlock";
		}
		
		_alterContext(ctx, settings) {
			this._old = ctx.strokeStyle;
			ctx.strokeStyle = this._colour;
		}
		
		_resetContext(ctx, settings) {
			ctx.strokeStyle = this._old;
		}
	}
	
	FormatBlock.register("bcolour", BorderColourBlock);
	FormatBlock.register("bcolor", BorderColourBlock);
	
	// Underline
	class UnderlineBlock extends FormatBlock {
		constructor(body, thickness, colour) {
			super(body);
			this._thickness = thickness !== undefined ? thickness : 1;
			this._colour = colour;
			this._useCtxColour = colour === undefined;
			this._name = "UnderlineBlock";
		}
		
		print(ctx, location, chars, settings) {
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
		}
	}
	
	FormatBlock.register("u", UnderlineBlock);
	
	
	// img
	class ImgBlock extends FormatBlock {
		constructor(body) {
			super(body);
			this._src = Array.prototype.slice.call(arguments, 1).join(" ");
			this._body = [""];
			this._name = "ImgBlock";
			
			this._image = new Image(this._src);
			this._cclear = null;
		}
		
		print(ctx, location, chars, settings) {
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
		}
	}
	
	FormatBlock.register("img", ImgBlock);
});
