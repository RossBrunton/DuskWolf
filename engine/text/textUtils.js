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
			
			if(ws.includes("\n")) {
				out.push(curLine);
				curLine = "";
				curLineSize = 0;
				for(var i = ws.split("\n").length; i > 2; i --) out.push("");
			}
			
		};
		
		out.push(curLine);
		return out;
	};
	
	return Location;
})());

load.provide("dusk.text.FormatBlock", (function() {
	/** Represents a node of a parsed text entry.
	 * 
	 * It should be subclassed, each subclass should add different formatting and function as a tag. For example, one
	 *  subclass could be for italics, one for bold and so on.
	 * 
	 * It is given an array, each entry of the array is either a string (representing raw text) or a `FormatBlock`
	 *  (representing a child node). The entries are in order of the text appearing in the raw string.
	 * 
	 * The block must be registered using `FormatBlock.register` so the parser can use it. If a given block is
	 *  registered using "i", for example, the parser will use that block to handle the children of an "i" tag.
	 * 
	 * @param {array<dusk.text.FormatBlock|string>} The children of this node, as described above.
	 * @since 0.0.21-alpha
	 * @constructor
	 */
	var FormatBlock = function(body) {
		/** The array of children.
		 * @type array<dusk.text.FormatBlock|string>
		 * @protected
		 */
		this._body = body;
	};
	
	/** Prints all the children of this node onto the context at the given location.
	 * @param {CanvasRenderingContext2D} ctx The rendering context on which to paint.
	 * @param {dusk.text.Location} location The location on which to paint, this will be advanced.
	 * @param {integer} chars The number of characters to draw. Once this "runs out" no further characters will be
	 *  drawn.
	 * @param {boolean=false} scanOnly If true, then nothing will be actually drawn. The only side effect will be that
	 *  the location is advanced.
	 */
	FormatBlock.prototype.print = function(ctx, location, chars, scanOnly) {
		ctx = this._alterContext(ctx);
		
		var remainingChars = chars;
		for(var b of this._body) {
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
	
	/** Convienience method to alter the context before the main paint logic.
	 * 
	 * For subclasses to override.
	 * @param {CanvasRenderingContext2D} ctx The rendering context provided by the paint function.
	 * @return {CanvasRenderingContext2D} The rendering context which will be used.
	 * @protected
	 */
	FormatBlock.prototype._alterContext = function(ctx) {
		return ctx;
	};
	
	/** Map of all registered tags.
	 * @type Map<string, class extends FormatBlock>
	 * @private
	 */
	var _registered = new Map();
	
	/** Registeres a format block to be used with the given tag.
	 * @param {string} tag The tag to register for.
	 * @param {class extends FormatBlock} block The FormatBlock to use for that tag.
	 */
	FormatBlock.register = function(tag, block) {
		_registered.set(tag, block);
	};
	
	/** Gets a previously registered block for the given tag.
	 * @param {string} tag The tag to look for.
	 * @return {class extends FormatBlock} block The FormatBlock for that tag.
	 */
	FormatBlock.get = function(tag) {
		_registered.get(tag);
	};
	
	return FormatBlock;
})());
