//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Label.textLocation", (function() {
	var Location = function(label) {
		this._label = label;
		
		this.x = 0;
		this.y = 0;
        this.lines = 0;
        this.chars = 0;
		
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
        if(this._label.width < 0) return false;
		if(this._label.multiline && this.x + this.measure(ctx, text) > this._label.width - this._label.padding*2) {
			return true;
		}
		
		return false;
	};
	
	Location.prototype.lineTooLong = function(ctx, text, base) {
        if(this._label.width < 0) return false;
        if(base === undefined) base = 0;
        
		if(this._label.multiline && base + this.measure(ctx, text) > this._label.width - this._label.padding*2) {
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

load.provide("dusk.sgui.Label.formatBlock", (function() {
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

load.provide("dusk.sgui.Label", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var Location = load.require("dusk.sgui.Label.textLocation");
	var FormatBlock = load.require("dusk.sgui.Label.formatBlock");
	
	/** @class dusk.sgui.Label
	 * 
	 * @classdesc A label is essentially a component that contains formatted text.
	 * 
	 * The default text font and colour can be changed using properties on this object.
	 * 
	 * Formatting, if enabled, works using `"[name]"` tags. Generally, a `"[/name]"` version of the tag will end or
	 *  reverse the formatting of the unslashed equivalent. The tags supported on a label are as follows:
	 * 
	 * - `[b]`, `[/b]` Starts and ends bold text.
	 * - `[i]`, `[/u]` Starts and ends italic text.
	 * - `[colour c]`, `[/colour]` Sets the colour to the value `c`.
	 * - `[font f]`, `[/font]` Sets the font to the value `f`.
	 * - `[bsize b]`, `[/bsize]` Sets the width of the border around the text to `b`.
	 * - `[bcolour c]`, `[/bcolour]` Sets the colour of the border around the text to `c`.
	 * - `[img i]` Displays the image specified by the path at the correct aspect ratio, and at the same height as the
	 *  text the "no available character" character will be displayed while it is loading.
	 * 
	 * Text can have a border round it, using the `{@link dusk.sgui.Label#bsize}` and
	 * `{@link dusk.sgui.Label#borderColour}` properties.
	 * 
	 * Labels with an xDisplay or yDisplay of "expand" are a bit wonky, and will not work correctly.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Component
	 * @constructor
	 */
	var Label = function(parent, name) {
		Component.call(this, parent, name);
		
		/** The stored width of the text. This is generated before the text is drawn so we know how wide the canvas
		 * should be. This is also used when returning the `width` property.
		 * @type integer
		 * @private
		 */
		this._cachedWidth = 0;
		/** The number of lines of text (if multiline). Please do not set this property.
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.lines = 1;
		/** Internal storage for the text this textbox is displaying.
		 * @type string
		 * @private
		 */
		this._text = "";
		/** The text this text box is displaying. Setting this will cause it to update.
		 * @type string
		 */
		this.text = "";
		/** The "signature" of the text box. This essentially is all the properties that would require the box to redraw
		 *  its cache stored in a single string. If any value changes, then the generated signature will not match this
		 *  sig and thus we know to update the cache.
		 * @type string
		 * @private
		 */
		this._sig = "";
		/** The canvas onto which the cache is drawn. Will be null until there is initial text, and then it will store
		 *  the  formatted version of that text.
		 * @type HTMLCanvasElement
		 * @private
		 */
		this._cache = utils.createCanvas(0, 0);
		
		/** The size of the text, in pixels.
		 * @type integer
		 * @default 14
		 */
		this.size = 14;
		/** The font of the text. Should be a CSS font value.
		 * @type string
		 * @default "sans"
		 */
		this.font = "sans";
		/** The colour of the text. This should be a CSS colour value. It can be used with the JSON property `"colour"`
		 * as well.
		 * @type string
		 * @default "#000000"
		 */
		this.colour = "#000000";
		/** The colour of the text border. This should be a CSS colour value. It can be accessed with the JSON property
		 * `"borderColour"` as well.
		 * @type string
		 * @default "#990000"
		 */
		this.borderColour = "#990000";
		/** The thickness of the border, in pixels.
		 * @type integer
		 * @default 0
		 */
		this.borderSize = 0;
		/** The amount of "padding" the text has, in pixels. This is the distance from the borders of the text box to
		 *  when the actual text starts. This allows the tails and other curly bits to fit, and gives a bit of breathing
		 * room from any borders.
		 * @type integer
		 * @default 3
		 */
		this.padding = 3;
		/** Whether the text is formatted or not.
		 * @type boolean
		 * @default true
		 */
		this.format = true;
		/** Used by input boxes, if true text will not be drawn.
		 * @type boolean
		 * @default false
		 * @protected
		 */
		this._supressTextDisplay = false;
		/** If true, this text will support multiple lines. If it is multiline, please set the height.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.multiline = false;
		
		/** Event dispatcher fired when the Label changes it's content. It is in AND mode, and any listener that returns
		 *  false will cause the new text to be "rejected".
		 * 
		 * The event object has two properties; "component", the component that fired the event and "text" the text that
		 *  is being proposed.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.onChange = new EventDispatcher("dusk.sgui.Label.onChange");
		/** Event dispatcher fired after the Label changes its content. There is no way to cancel this, and it is fired
		 *  after `{@link dusk.sgui.Label#onChange}` if the change is to be made.
		 * 
		 * The event object has two properties; "component", the component that fired the event and "text" the text that
		 *  is being proposed.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.postChange = new EventDispatcher("dusk.sgui.Label.postChange");
		
		/** A regular expression. If the text does not match this then it is invalid. If
		 *  `{@link dusk.sgui.Label#validCancel}` is true, then the text will never be set an invalid expression (it
		 *  will revert to the last valid one immediately). If it is false, then when this field looses focus the text
		 *  will be set to `{@link disk.sgui.Label#validDefault}`.
		 * @type RegExp
		 * @default null
		 * @since 0.0.21-alpha
		 */
		this.validFilter = null;
		/** If true then an invalid text string will not be set. If false, then it will be reset to the default when
		 *  this element looses focus.
		 * @type boolean
		 * @since 0.0.21-alpha
		 */
		this.validCancel = false;
		/** Default text to set if the label's text does not validate.
		 * @type string
		 * @since 0.0.21-alpha
		 */
		this.validDefault = "";
		
		this._location = new Location(this);
        this.chars = 0;
        this.displayChars = Number.MAX_SAFE_INTEGER;
        
        this.width = -1;
        this.height = -1;
		
		//Prop masks
		this._mapper.map("text", "text");
		this._mapper.map("font", "font");
		this._mapper.map("colour", "colour");
		this._mapper.map("color", "colour");
		this._mapper.map("borderColour", "borderColour");
		this._mapper.map("borderColor", "borderColour");
		this._mapper.map("borderSize", "borderSize");
		this._mapper.map("padding", "padding");
		this._mapper.map("size", "size");
		this._mapper.map("format", "format");
		this._mapper.map("width", "width", ["font", "text", "multiline"]);
		this._mapper.map("height", "height", ["font", "text", "multiline"]);
		this._mapper.map("multiline", "multiline");
		this._mapper.map("validFilter", "validFilter");
		this._mapper.map("validCancel", "validCancel");
		this._mapper.map("validDefault", "validDefault");
		this._mapper.map("shadowText", "shadowText");
		
		//Listeners
		this.onPaint.listen(_draw.bind(this));
		this.onActiveChange.listen(_activeChange.bind(this), false);
	};
	Label.prototype = Object.create(Component.prototype);
	
	/** A validator that checks whether the text is a valid number or not (I.E. isNaN(n) will return false).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	Label.VALID_NUMBER = /^[+-]?(?:\d+|\d*(?:\.\d+)?)(?:[Ee][+-]?(?:\d+|\d*(?:\.\d+)?))?$/;
	
	/** A validator that checks whether the text is a valid integer (I.E. isNaN(n) will return false and n % 1 is 0).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	Label.VALID_INTEGER = /^[+-]?\d+(?:[Ee][+-]?\d+)?$/;
	/** A validator that checks whether the text is a valid alphanumeric string (a-z and 0-9).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	Label.VALID_ALPHANUMERIC = /^[a-zA-Z0-9]*$/;
	/** A validator that checks whether the text is a valid alphanumeric string that can contain underscores 
	 *  (a-z, 0-9 and _).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	Label.VALID_ALPHANUMERIC_UNDERSCORES = /^[a-zA-Z0-9_]*$/;
	/** A validator that checks whether the text is a valid alphanumeric string that can contain underscores and spaces
	 *  (a-z, 0-9, _ and space).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	Label.VALID_ALPHANUMERIC_SPACE = /^[a-zA-Z0-9_ ]*$/;
	
	/** Draws the current label, updating the cache if needed.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#onPaint}`.
	 * @private
	 */
	var _draw = function(e) {
		if(this.text !== "" && !this._supressTextDisplay){
			if(this._sig != this._genSig(e)) {
				//Rebuild the text cache
				this._processText(false, undefined, e.d.origin.width);
			}
			
			var xDelta = 0;
			var yDelta = 0;
			if(e.d.slice.width > this._cache.width) {
				xDelta = this._cache.width - e.d.slice.width;
			}
			if(e.d.slice.height > this._cache.height) {
				yDelta = this._cache.height - e.d.slice.height;
			}	
			
			e.c.drawImage(this._cache, e.d.slice.x, e.d.slice.x, e.d.slice.width + xDelta,  e.d.slice.height + yDelta,
				e.d.dest.x, e.d.dest.y, e.d.dest.width + xDelta, e.d.dest.height + yDelta
			);
		}
	};
	
	/** Handles loosing focus, with regards to the validators.
	 * @param {object} e The event object.
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _activeChange = function(e) {
		if(!this.validFilter || this.validCancel) return;
		
		if(!this.validFilter.test(this._text)) this._text = this.validDefault;
	};
    
    Label.prototype._configContext = function(ctx) {
        ctx.font = this.size + "px " + this.font;
		ctx.fillStyle = this.colour;
		ctx.strokeStyle = this.borderColour;
		ctx.lineWidth = this.borderSize;
		ctx.textBaseline = "middle";
    };
	
	/** Either draws onto the cache, or measures some text.
	 * @param {boolean} measure Will only update the dimensions, rather than drawing the text.
	 * @param {?string} text The text to use, defaults to the contents of this text field. Using other text does not
	 *  set the internal storage of this label, obviously.
	 * @param {?integer} knownWidth For multiline text fields only, this is the width of the component (so text wrapping
	 *  works). Defaults to the component's width, and obviously if your component is in expand mode it won't set
	 *  correctly.
	 * @return {Array} A [lines, width] Pair of the dimensions.
	 * @private
	 */
	Label.prototype._processText = function(measure, text, knownWidth) {
		var textHold = text !== undefined?text:this._text;
		var textBuffer = "";
		
		//Create the cache
		var cache = this._cache;
		
		var c = cache.getContext("2d");
		
        this._configContext(c);
		
		var useBorder = this.borderSize > 0;
        
		var f = new FormatBlock([this.text]);
        
        this._location.reset();
        f.print(c, this._location, Infinity, true);
        this._cachedWidth = this._location.x + this.padding;
        this.lines = this._location.lines;
        this.chars = this._location.chars;
        
        cache.width = this.width >= 0 ? this.width : this._cachedWidth;
        cache.height = this.lines * this.size + (this.padding<<1);
        this._configContext(c);
		
        if(!measure) {
            this._location.reset();
            f.print(c, this._location, this.displayChars);
		}
		
		return [this.lines, this._cachedWidth];
	};
	
	/** Counts the number of lines (if it is a multiline text field) that the given text takes up.
	 * @param {string} Text the text to measure.
	 * @return {integer} The lines the text takes up.
	 * @since 0.0.21-alpha
	 */
	Label.prototype.countLines = function(text) {
		if(!this.multiline) return 1;
		
		return this._processText(true, text)[0];
	};
    
    Label.prototype.getRenderingWidth = function() {
        if(this.width > -1) {
            return this.width
        }else{
            return this._cachedWidth+(this.padding<<1);
        }
    };
    
    Label.prototype.getRenderingHeight = function() {
        if(this.height > -1) {
            return this.height;
        }else{
            return (this.lines ? this.lines : 1) * this.size + (this.padding<<1);
        }
    };
	
	//width
	/*Object.defineProperty(Label.prototype, "width", {
		get: function() {
			if(this._width > -1) {
				return this._width
			}else{
				return this._cachedWidth+(this.padding<<1);
			}
		},
		set: function(value) {
			if(value < 0) this._width = -1;
			else this._width = value-(this.padding<<1);
		}
	});*/
	
	//text
	Object.defineProperty(Label.prototype, "text", {
		get: function() {
			return this._text;
		},
		set: function(value) {
			if(this._text != value) {
				if(!this.validFilter || !this.validCancel || this.validFilter.test(value)) {
					if(this.onChange.fireAnd({"component":this, "text":""+value})) {
						this._text = ""+value;
                        this._processText(true);
						this.postChange.fire({"component":this, "text":""+value});
					}
				}
			}
		}
	});
	
	/** Generates a signature as used by `{@link dusk.sgui.Label#_sig}`.
	 * @return {string} The text's "signature".
	 * @private
	 */
	Label.prototype._genSig = function() {
		return this.size+"/"+this.font+"/"+this.colour+"/"+this.borderColour+"/"+this.padding+"/"+this.borderSize
		+"/"+this.text+"/"+this.format+"/"+this.multiline;
	};
	
	sgui.registerType("Label", Label);
	
	return Label;
})());


load.provide("dusk.sgui.TextBox", (function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var controls = load.require("dusk.input.controls");
	var dusk = load.require("dusk");
	var keyboard = load.require("dusk.input.keyboard");
	var interaction = load.require("dusk.input.interaction");
	
	/** @class dusk.sgui.TextBox
	 * 
	 * @classdesc A textbox is an instance of `{@link dusk.sgui.Label}` that allows the user to change the text inside
	 * it when active.
	 * 
	 * This component sets the `{@link dusk.sgui.Component#allowMouse}` property to true, and the
	 * `{@link dusk.sgui.Component#activeBorder}` property to "#ff5555". It also draws it's own border even when the
	 * component is not active, as a hint to the user.
	 * 
	 * If the user presses a key that is bound to a direction, the direction will not be typed, and focus will try to
	 * switch away from the TextBox.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Label
	 * @constructor
	 */
	var TextBox = function(parent, name) {
		Label.call(this, parent, name);
		
		/** The border of the TextBox when it is not active.
		 * @type string
		 * @default "#cccccc"
		 */
		this.border = "#cccccc";
		
		/** Whether text was manualy changed last frame, so we shouldn't update it here.
		 * @type boolean
		 * @private
		 */
		this._otherUpdate = false;
		
		//Prop masks
		this._mapper.map("border", "border");
		
		//Listeners
		this.onPaint.listen(_draw.bind(this));
		this.onInteract.listen(_key.bind(this), interaction.KEY_DOWN);
		this.onActiveChange.listen(_activeChange.bind(this));
		this.frame.listen((function(e) {
			if(this.active) {
				var e = this.getHtmlElements("textarea")[0];
				
				e.style.position = "absolute";
				e.style.background = "transparent";
				e.style.border = "none";
				e.style.resize = "none";
				e.style.overflow = "hidden";
				
				//I want no newlines
				if(!this.multiline && e.value.indexOf("\n") !== -1) {
					e.value = e.value.replace("\n", "");
				}
				
				if(!this._otherUpdate) {
					this.text = e.value;
				}
				this._otherUpdate = false;
				
				if(e.value != this.text) {
					var start = e.selectionStart;
					var end = e.selectionEnd;
					e.value = this.text;
					e.selectionStart = start-1;
					e.selectionEnd = end-1;
				}
			}
		}).bind(this));
		this.postChange.listen((function(e) {
			this._otherUpdate = true;
		}).bind(this));
		
		//Defaults
		this.activeBorder = "#ff5555";
		this.format = false;
	};
	TextBox.prototype = Object.create(Label.prototype);
	
	/** Draws the border around the text when it is not active.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#onPaint}`.
	 * @private
	 */
	var _draw = function(e) {
		e.c.strokeStyle = this.border;
		e.c.strokeRect(e.d.dest.x, e.d.dest.y, e.d.dest.width, e.d.dest.height);
		
		if(!this.active) return;
		
		var elem = this.getHtmlElements("textarea")[0];
		
		elem.style.width = (e.d.dest.width - (this.padding<<1))+"px";
		elem.style.height = (e.d.dest.height - (this.padding<<1))+"px"; //this.size+"px";
		elem.style.left = e.d.dest.x+"px";
		elem.style.top = e.d.dest.y+"px";
	};
	
	/** Used to handle keypresses.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#keyPress}`.
	 * @private
	 */
	var _key = function(e) {
		if(e.ctrl) return true;
		var keyDat = keyboard.lookupCode(e.key);
		var textElement = this.getHtmlElements("textarea");
		
		//Check if the user has mapped any inputs to the key...
		if(controls.checkKey("sgui_up", e.key)) return true;
		if(controls.checkKey("sgui_down", e.key)) return true;
		if(controls.checkKey("sgui_left", e.key) && textElement.selectionStart == 0) return true;
		if(controls.checkKey("sgui_right", e.key) && textElement.selectionStart == textElement.value.length)return true;
		
		/*if(keyDat[1]) {
			this.text += e.shift?keyDat[0].toUpperCase():keyDat[0];
			return false;
		}
		
		if(keyDat[0] == "BACKSPACE") {
			this.text = this.text.substr(0, this.text.length-1);
			return false;
		}*/
		
		if(keyDat[0] == "ENTER" && !this.multiline) {
			this.action.fire(e);
			return false;
		}
		
		return false;
	};
	
	/** Called when the TextBox loses or gains "activeness". Used to manage the text box appearing.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#activeChange}`.
	 * @private
	 * @since 0.0.20-alpha
	 */
	var _activeChange = function(e) {
		var elem = this.getHtmlElements("textarea")[0];
		
		if(e.active) {
			elem.style.visibility = "visible";
			elem.value = this.text;
			elem.style.padding = this.padding+"px";
			elem.style.font = this.size + "px " + this.font;
			elem.style.lineHeight = "100%";
			elem.style.outline = "none";
			elem.style.color = this.colour;
			elem.tabIndex = 0;
			elem.focus();
			if(this.multiline) {
				elem.style.whiteSpace = "normal";
			}else{
				elem.style.whiteSpace = "nowrap";
			}
			this._supressTextDisplay = true;
		}else{
			elem.style.visibility = "hidden";
			elem.blur();
			this._supressTextDisplay = false;
		}
	}
	
	sgui.registerType("TextBox", TextBox);
	
	return TextBox;
})());


load.provide("dusk.sgui.NumberBox", (function() {
	var TextBox = load.require("dusk.sgui.TextBox");
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var Range = load.require("dusk.utils.Range");
	
	/** @class dusk.sgui.NumberBox
	 * 
	 * @classdesc A number box is a textbox designed for inputting numbers.
	 * 
	 * Based on it's orientation the left and right or up and down input controls increase and decrease the value of the
	 *  textbox.
	 * 
	 * A range is used to store the value of the text.
	 * 
	 * By default this sets it's validator to `{@link dusk.sgui.Label#VALID_NUMBER}`.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.TextBox
	 * @constructor
	 */
	var NumberBox = function(parent, name) {
		TextBox.call(this, parent, name);
		
		/** Internal storage for the range used in this box.
		 * @type dusk.utils.Range
		 * @private
		 */
		this._range = null;
		/** The ID of the range on change listener.
		 * @type integer
		 * @private
		 */
		this._rangeChangedId = 0;
		/** The range used for this box. The value will be in this range, and the increasing and decreasing will be
		 *  based on it.
		 * @type dusk.utils.Range
		 */
		this.range = null;
		
		/** The orientation. If horizontal then left and right will increment and decrement the value of the text field.
		 *  If vertical, then up and down are used instead. Must be one of the dusk.sgui.c.ORIENT_* constants.
		 * @type integer
		 * @deafult dusk.sgui.c.ORIENT_VER
		 */
		this.orientation = c.ORIENT_VER;
		
		//Listeners
		this.onDelete.listen((function(e) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
		}).bind(this));
		this.dirPress.listen(_dirPress.bind(this));
		this.onChange.listen(_onChange.bind(this));
		this.postChange.listen(_postChange.bind(this));
		
		//Prop masks
		this._mapper.map("orientation", "orientation");
		this._mapper.map("range", "range");
	};
	NumberBox.prototype = Object.create(TextBox.prototype);
	
	//range
	Object.defineProperty(NumberBox.prototype, "range", {
		set: function(value) {
			if(this._range) this._range.onChange.unlisten(this._rangeChangedId);
			
			this._range = value;
			
			if(this._range) {
				this._rangeChangedId = this._range.onChange.listen(_rangeChanged.bind(this));
				_rangeChanged.call(this, {});
			}
		},
		
		get: function() {
			return this._range;
		}
	});
	
	/** Used to handle the value of the range changing.
	 * @param {object} e The event object.
	 * @private
	 */
	var _rangeChanged = function(e) {
		this.text = this._range.value;
		return e;
	};
	
	/** Used to handle when the text has changed, to make sure it is valid.
	 * @param {object} e The event object.
	 * @return {boolean} Whether the text is a valid value in the range or not.
	 * @private
	 */
	var _onChange = function(e) {
		if(!this._range || this._reading) return true;
		
		if(+e.text > this._range.max || +e.text < this._range.min) return false;
		return true;
	};
	
	/** Used when the text has been changed, to store the new value in the range.
	 * @param {object} e The event object.
	 * @private
	 */
	var _postChange = function(e) {
		if(!this._range || this._reading) return;
		
		if(+e.text == this._range.value) return;
		
		this._range.value = +this.text;
	};
	
	/** Used when a direction is pushed, to change the value of the text field if needed.
	 * @param {object} e The event object.
	 * @private
	 */
	var _dirPress = function(e) {
		if(!this._range) return true;
		
		if(this.orientation == c.ORIENT_HOR) {
			if(e.dir == c.DIR_LEFT) {
				return !this._range.down();
			}else if(e.dir == c.DIR_RIGHT) {
				return !this._range.up();
			}
		}else if(this.orientation == c.ORIENT_VER) {
			if(e.dir == c.DIR_DOWN) {
				return !this._range.down();
			}else if(e.dir == c.DIR_UP) {
				return !this._range.up();
			}
		}
		
		return true;
	};
	
	sgui.registerType("NumberBox", NumberBox);
	
	return NumberBox;
})());
