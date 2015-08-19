//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.text.location", (function() {
	var Location = function(label) {
		this._label = label;
		
		this.x = 0;
		this.y = 0;
		this.lines = 0;
		this.chars = 0;
		this.maxWidth = 0;
		this.restrictMaxWidth = -1;
		
		this.reset();
	};
	
	Location.prototype.reset = function() {
		this.x = this._label.padding;
		this.y = this._label.padding + (this._label.size)/2;
		this.lines = 1;
		this.chars = 0;
	};
	
	Location.prototype.advance = function(ctx, text) {
		this.x += ctx.measureText(text).width;
		this.chars += text.length;
	};
	
	Location.prototype.newline = function(ctx) {
		this.x = this._label.padding;
		this.y += this._label.size;
		this.lines ++;
	};
	
	Location.prototype.measure = function(ctx, text) {
		return ctx.measureText(text).width;
	};
	
	Location.prototype.needsBreak = function(ctx, text) {
		if(this.restrictMaxWidth < 0) return false;
		if(this._label.multiline && this.x + this.measure(ctx, text) > this.restrictMaxWidth - this._label.padding*2) {
			return true;
		}
		
		return false;
	};
	
	Location.prototype.lineTooLong = function(ctx, text, base) {
		if(this.restrictMaxWidth < 0) return false;
		if(base === undefined) base = 0;
		
		if(this._label.multiline && base + this.measure(ctx, text) > this.restrictMaxWidth - this._label.padding*2) {
			return true;
		}
		
		return false;
	};
	
	Location.prototype.lineWrap = function(ctx, text) {
		if(!this._label.multiline) return [text];
		
		var out = [];
		
		var curLineSize = this.x;
		var curLine = "";
		
		var p = 0;
		while(p < text.length-1) {
			// Consume text
			var word = "";
			while(text[p] && !text[p].match(/\s/gi)) {
				word += text[p];
				p ++;
			}
			
			// Consume white space
			var ws = "";
			while(text[p] && text[p].match(/\s/gi)) {
				ws += text[p];
				p ++;
			}
			
			if(this.lineTooLong(ctx, word + ws, curLineSize)) {
				// Line is too long, wrap it
				out.push(curLine);
				curLine = word;
				curLineSize = this.measure(ctx, word);
			}else{
				curLine += word + ws;
				curLineSize += this.measure(ctx, word + ws);
			}
		};
		
		out.push(curLine);
		return out;
	};
	
	return Location;
})());

load.provide("dusk.text.formatBlock", (function() {
	var FormatBlock = function(body) {
		this.body = body;
	};
	
	FormatBlock.prototype.print = function(ctx, location, chars, scanOnly) {
		ctx = this._alterContext(ctx);
		
		var remainingChars = chars;
		for(var b of this.body) {
			if(typeof b == "string") {
				var lines = location.lineWrap(ctx, b);
				
				var first = true;
				for(var l of lines) {
					if(!first) location.newline();
					first = false;
					
					var t = l.substring(0, remainingChars);
					remainingChars -= l.length;
					
					//if(useBorder)
					//	c.strokeText(textBuffer, cursor, this.padding + (line * this.size) + (this.size >> 1));
					
					if(!scanOnly) ctx.fillText(t, location.x, location.y);
					
					location.advance(ctx, t);
				}
				
				if(remainingChars <= 0) {
					break;
				}
			}else{
				// TODO
			}
		}
	};
	
	FormatBlock.prototype._alterContext = function(ctx) {
		return ctx;
	};
	
	var _registered = new Map();
	FormatBlock.register = function(tag, block) {
		_registered.set(tag, block);
	};
	
	FormatBlock.get = function(tag) {
		_registered.get(tag);
	};
	
	return FormatBlock;
})());
