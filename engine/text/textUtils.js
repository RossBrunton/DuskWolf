//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.text.Location", (function() {
	/** Represents a location to draw text while drawing it.
	 * 
	 * This is like a "cursor". Text is drawn at the cursor's point, and then the cursor is advanced to after that text
	 *  in preperation for the next text.
	 * 
	 * @param {dusk.sgui.Label} label The label this location is being used with.
	 * @since 0.0.21-alpha
	 * @constructor
	 */
	var Location = function(label) {
		/** The label for this cursor.
		 * @type dusk.sgui.Label
		 * @private
		 */
		this._label = label;
		
		/** The current x location.
		 * @type integer
		 */
		this.x = 0;
		/** The current y location.
		 * @type integer
		 */
		this.y = 0;
		/** When rendering is complete this will be the total number of lines.
		 * @type integer
		 */
		this.lines = 0;
		/** When rendering is complete this will be the total number of characters.
		 * @type integer
		 */
		this.chars = 0;
		/** When rendering is complete this will be the width of the widest line.
		 * @type integer
		 */
		this.maxWidth = 0;
		/** Set this to a value of greater than -1 to restrict lines to this length; longer lines will be wrapped.
		 * @type integer
		 */
		this.restrictMaxWidth = -1;
		
		// And reset it to start with
		this.reset();
	};
	
	/** Resets the cursor, bringing it back to the beginning. */
	Location.prototype.reset = function() {
		this.x = this._label.padding;
		this.y = this._label.padding + (this._label.size)/2;
		this.lines = 1;
		this.chars = 0;
	};
	
	/** Advance the cursor the width of the given text with the given context.
	 * @param {CanvasRenderingContext2D} ctx The context that will be used to draw the text.
	 * @param {string} text The text to draw.
	 */
	Location.prototype.advance = function(ctx, text) {
		this.x += ctx.measureText(text).width;
		this.chars += text.length;
	};
	
	/** Takes a new line and moves the cursor to the start of it. */
	Location.prototype.newline = function() {
		this.x = this._label.padding;
		this.y += this._label.size;
		this.lines ++;
	};
	
	/** Returns the width that the text would take up with the given context.
	 * @param {CanvasRenderingContext2D} ctx The context to test the text with.
	 * @param {string} text The text to measure.
	 * @return {integer} The width of the text.
	 */
	Location.prototype.measure = function(ctx, text) {
		return ctx.measureText(text).width;
	};
	
	/** Returns true iff drawing the text at the cursor's position would result in the line being too long.
	 * @param {CanvasRenderingContext2D} ctx The context to test the text with.
	 * @param {string} text The text to check.
	 * @return {boolean} Whether the text is too long to append to the current line.
	 */
	Location.prototype.needsBreak = function(ctx, text) {
		if(this.restrictMaxWidth < 0) return false;
		if(this._label.multiline && this.x + this.measure(ctx, text) > this.restrictMaxWidth - this._label.padding*2) {
			return true;
		}
		
		return false;
	};
	
	/** Returns true iff the given text is too long to fit on a single line.
	 * @param {CanvasRenderingContext2D} ctx The context to test the text with.
	 * @param {string} text The text to check.
	 * @param {integer=0} base This will be added to the width of `text` before comparison.
	 * @return {boolean} Whether the given text is too long to fit on a line.
	 */
	Location.prototype.lineTooLong = function(ctx, text, base) {
		if(this.restrictMaxWidth < 0) return false;
		if(base === undefined) base = 0;
		
		if(this._label.multiline && base + this.measure(ctx, text) > this.restrictMaxWidth - this._label.padding*2) {
			return true;
		}
		
		return false;
	};
	
	/** Splits the text into lines starting from the current location.
	 * @param {CanvasRenderingContext2D} ctx The context to test the text with.
	 * @param {string} text The text to check.
	 * @return {array<string>} An array of lines. The first entry will fit at the current cursor location without being
	 *  too long, while each element after it can be fit on a whole line without wrapping.
	 */
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

load.provide("dusk.text.FormatBlock", (function() {
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
