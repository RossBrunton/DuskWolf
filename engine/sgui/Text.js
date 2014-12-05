//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Label", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.utils.Image");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	
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
		this.lines = 0;
		/** Internal storage for the text this textbox is displaying.
		 * @type string
		 * @private
		 */
		this._text = "";
		/** The text this text box is displaying. Setting this will cause it to update.
		 * @type string
		 */
		this.text = "";
		/** Internal storage for the width of the component that the user has set. It is -1 if the user has set no width.
		 * This value does not include the padding.
		 * @type integer
		 * @private
		 */
		this._width = -1;
		/** Internal storage for the height of the component that the user has set. It is -1 if the user has set no
		 *  height.
		 * This value does not include the padding.
		 * @type integer
		 * @private
		 */
		this._height = -1;
		/** The "signature" of the text box. This essentially is all the properties that would require the box to redraw
		 * it's cache stored in a single string. If any value changes, then the generated signature will not match this sig
		 * and thus we know to update the cache.
		 * @type string
		 * @private
		 */
		this._sig = "";
		/** The canvas onto which the cache is drawn. Will be null until there is initial text, and then it will store the 
		 * formatted version of that text.
		 * @type HTMLCanvasElement
		 * @private
		 */
		this._cache = utils.createCanvas(0, 0);
		/** A canvas which is used to measure the width of text. Never actually displayed.
		 * @type HTMLCanvasElement
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._widthCache = utils.createCanvas(0, 0);
		
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
		
		//Formatting commands
		/** This is fired when a formatting tag is detected. A listener, which uses the `propsYes` to listen for a
		 *  specific command, then returns an array. The first element being a "formatting constant" from this class
		 *  starting with `_EVENT_*` or null if none are to be used. The second element is text to insert at the current
		 *  location if the formatting constant is null, or some argument if the constant is some value or "".
		 * 
		 * The event object contains two properties, `"command"` is the command name, in lower case. The second is
		 * `"args"` which is an array of arguments in the tag, which are space separated in the command, and different
		 *  elements in this array. The first element is the command name.
		 * 
		 * This is in "Last mode" so only the last non-undefined return value will matter.
		 * @type dusk.utils.EventDispatcher
		 * @protected
		 */
		this._command = new EventDispatcher("dusk.sgui.Label._command");
		this._command.listen((function(e){return [null, ""];}).bind(this));
		this._command.listen((function(e){return [null, "["];}).bind(this), "[");
		this._command.listen((function(e){return [Label._EVENT_BOLD, ""];}).bind(this),"b");
		this._command.listen((function(e){return [Label._EVENT_DEBOLD, ""];}).bind(this), "/b");
		this._command.listen((function(e){return [Label._EVENT_ITALIC, ""];}).bind(this), "i");
		this._command.listen((function(e){return [Label._EVENT_DEITALIC,""];}).bind(this), "/i");
		
		this._command.listen((function(e){
			return [Label._EVENT_COLOUR, e.args[1]];
		}).bind(this), "colour");
		this._command.listen((function(e){
			return [Label._EVENT_COLOUR, this.colour];
		}).bind(this), "/colour");
		
		this._command.listen((function(e){
			return [Label._EVENT_FONT, e.args[1]];
		}).bind(this), "font");
		this._command.listen((function(e){
			return [Label._EVENT_FONT, this.font];
		}).bind(this), "/font");
		
		this._command.listen((function(e){
			return [Label._EVENT_BSIZE, e.args[1]];
		}).bind(this), "bsize");
		this._command.listen((function(e){
			return [Label._EVENT_BSIZE, this.borderSize];
		}).bind(this), "/bsize");
		
		this._command.listen((function(e){
			return [Label._EVENT_BCOLOUR, e.args[1]];
		}).bind(this), "bcolour");
		this._command.listen((function(e){
			return [Label._EVENT_BCOLOUR, this.borderColour];
		}).bind(this), "/bcolour");
		
		this._command.listen((function(e){
			var img = new Image(e.args[1], e.args[2]);
			
			return [Label._EVENT_IMAGE, [img]];
		}).bind(this), "img");
		
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
		
		//Listeners
		this.prepareDraw.listen(_draw.bind(this));
		this.onActiveChange.listen(_activeChange.bind(this), false);
	};
	Label.prototype = Object.create(Component.prototype);
	
	/** A formatting constant meaning the text has terminated.
	 * @type integer
	 * @constant
	 * @value 0
	 * @protected
	 */
	Label._EVENT_TERM = 0;
	/** A formatting constant meaning the text colour should change to the argument.
	 * @type integer
	 * @constant
	 * @value 1
	 * @protected
	 */
	Label._EVENT_COLOUR = 1;
	/** A formatting constant meaning an image should be drawn. The argument is an array, the first element being an image
	 * object to draw.
	 * @type integer
	 * @constant
	 * @value 2
	 * @protected
	 */
	Label._EVENT_IMAGE = 2;
	/** A formatting constant meaning that from now on bold text should be used.
	 * @type integer
	 * @constant
	 * @value 3
	 * @protected
	 */
	Label._EVENT_BOLD = 3;
	/** A formatting constant meaning that any bold text being used should stop.
	 * @type integer
	 * @constant
	 * @value 4
	 * @protected
	 */
	Label._EVENT_DEBOLD = 4;
	/** A formatting constant meaning that from now on italic text should be used.
	 * @type integer
	 * @constant
	 * @value 5
	 * @protected
	 */
	Label._EVENT_ITALIC = 5;
	/** A formatting constant meaning that any italic text being used should stop.
	 * @type integer
	 * @constant
	 * @value 6
	 * @protected
	 */
	Label._EVENT_DEITALIC = 6;
	/** A formatting constant meaning the font should change to the argument.
	 * @type integer
	 * @constant
	 * @value 7
	 * @protected
	 */
	Label._EVENT_FONT = 7;
	/** A formatting constant meaning the border size should change to the argument.
	 * @type integer
	 * @constant
	 * @value 8
	 * @protected
	 */
	Label._EVENT_BSIZE = 8;
	/** A formatting constant meaning the border colour should change to the argument.
	 * @type integer
	 * @constant
	 * @value 9
	 * @protected
	 */
	Label._EVENT_BCOLOUR = 9;
	
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
	 * @param {object} e An event object from `{@link dusk.sgui.Component#prepareDraw}`.
	 * @private
	 */
	var _draw = function(e) {
		if(this.text !== "" && !this._supressTextDisplay){
			if(this._sig != this._genSig(e)) {
				//Rebuild the text cache
				this._updateText(true, true);
				this._updateText();
			}
			
			e.c.drawImage(this._cache, e.d.slice.x, e.d.slice.x, e.d.slice.width,  e.d.slice.height,
				e.d.dest.x, e.d.dest.y, e.d.dest.width, e.d.dest.height
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
	
	/** Updates the cache, as well as the dimensions the text will take up.
	 * @param {boolean} widthOnly Will only update the width, rather than drawing the text. This function must be called
	 * with this argument first, unless you know that the width has not changed.
	 * @param {boolean=false} commit Whether to set the width and height of the textbox, or just return them.
	 * @param {?string} text The text to use, defaults to the contents of this text field.
	 * @return {Array} A [lines, width] Pair of the dimensions.
	 * @private
	 */
	Label.prototype._updateText = function(widthOnly, commit, text) {
		var textHold = text !== undefined?text:this._text;
		var textBuffer = "";
		
		//Create the cache
		var cache = this._widthCache;
		
		if(!widthOnly) {
			cache = this._cache;
			this._cache.width = this._cachedWidth;
			this._cache.height = (this.lines * this.size) + (this.padding << 1);
		};
		
		var c = cache.getContext("2d");
		var font = this.font;
		
		//Set the formatting
		c.font = this.size + "px " + this.font;
		c.fillStyle = this.colour;
		c.strokeStyle = this.borderColour;
		c.lineWidth = this.borderSize;
		c.textBaseline = "middle";
		
		var useBorder = this.borderSize > 0;
		
		//Loop through each character in the text, cutting off the processed characters at the end of each loop
		var drawBuff = (function() {
			if(textBuffer !== "") {
				if(useBorder && !widthOnly)
					c.strokeText(textBuffer, cursor, this.padding + (line * this.size) + (this.size >> 1));
				
				if(!widthOnly) c.fillText(textBuffer, cursor, this.padding + (line * this.size) + (this.size>>1));
				
				cursor += c.measureText(textBuffer).width;
				textBuffer = "";
			}
		}).bind(this);
		
		var longestLine = 0;
		var cursor = this.padding;
		var charData = null;
		var line = 0;
		while(charData = this._nextChar(textHold)) {
			if(charData[0] == null) {
				//No formatting
				if(charData[1] == "\n" && this.multiline) {
					drawBuff();
					line ++;
					if(cursor > longestLine) longestLine = cursor;
					cursor = this.padding;
				}else{
					textBuffer += charData[1];
				}
				
				if(this.multiline && c.measureText(textBuffer).width + this.padding > this.width) {
					//Wrap previous word
					var p = textBuffer.length-1;
					var overflow = "";
					while(!/\s/.test(textBuffer[p]) && p >= 0) {
						overflow += textBuffer[p];
						p --;
					}
					
					if(textBuffer.length == overflow.length) {
						//No words! D:
						overflow = textBuffer[textBuffer.length - 1];
					}
					
					textBuffer = textBuffer.substring(0, textBuffer.length - overflow.length);
					drawBuff();
					textBuffer = overflow.split("").reverse().join("");
					line ++;
					if(cursor > longestLine) longestLine = cursor;
					cursor = this.padding;
				}
			}else{
				//Formatting, draw what text we have generated now, and then change the canvas to reflect formatting
				drawBuff();
				
				if(charData[0] == Label._EVENT_TERM) {
					break;
				}
				
				if(charData[0] == Label._EVENT_COLOUR) {
					c.fillStyle = charData[1];
				}
				
				if(charData[0] == Label._EVENT_BCOLOUR) {
					c.strokeStyle = charData[1];
				}
				
				if(charData[0] == Label._EVENT_BSIZE) {
					c.lineWidth = charData[1];
					useBorder = charData[1] > 0;
				}
				
				if(charData[0] == Label._EVENT_BOLD && c.font.indexOf("bold") === -1) {
					if(c.font.indexOf("italic") !== -1) {
						c.font = c.font.replace("italic", "italic bold");
					}else{
						c.font = "bold " + c.font;
					} 
				}
				
				if(charData[0] == Label._EVENT_DEBOLD && c.font.indexOf("bold") !== -1) {
					c.font = c.font.replace("bold ", "");
				}
				
				if(charData[0] == Label._EVENT_ITALIC && c.font.indexOf("italic") === -1) {
					c.font = "italic " + c.font;
				}
				
				if(charData[0] == Label._EVENT_DEITALIC && c.font.indexOf("italic") !== -1) {
					c.font = c.font.replace("italic ", "");
				}
				
				if(charData[0] == Label._EVENT_FONT) {
					c.font = c.font.replace(font, charData[1]);
					font = charData[1];
				}
				
				if(charData[0] == Label._EVENT_IMAGE) {
					if(!charData[1][1]) {
						charData[1][1] = (charData[1][0].width() / charData[1][0].height()) * this.size;
					}
					
					if(charData[1][0].isReady() && !widthOnly) {
						charData[1][0].paint(c, "", false,
							0, 0, charData[1][0].width(), charData[1][0].height(),
							cursor, this.padding + line * this.size, charData[1][1], this.size
						);
						
						cursor += charData[1][1];
					}else{
						charData[1][0].loadPromise().then((function(e) {this._updateText(false, true);}).bind(this));
						
						textBuffer += "\ufffd";
					}
				}
			}
			
			//Cut off the characters we have processed
			textHold = textHold.substr(charData[2]);
		}
		
		if(cursor > longestLine) longestLine = cursor;
		
		//And set the dimensions
		var width = longestLine + this.padding;
		if(isNaN(width)) width = this.padding << 1;
		width = ~~width;
		
		if(commit) {
			this._cachedWidth = width;
			this.lines = line + 1;
		}
		
		return [line + 1, this._cachedWidth];
	};
	
	/** Counts the number of lines (if it is a multiline text field) that the given text takes up.
	 * @param {string} Text the text to measure.
	 * @return {integer} The lines the text takes up.
	 * @since 0.0.21-alpha
	 */
	Label.prototype.countLines = function(text) {
		if(!this.multiline) return 1;
		
		return this._updateText(true, false, text)[0];
	};
	
	//width
	Object.defineProperty(Label.prototype, "width", {
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
	});
	
	//height
	Object.defineProperty(Label.prototype, "height", {
		get: function() {
			if(this._height > -1) {
				return this._height;
			}else{
				return this.lines * this.size + (this.padding<<1);
			}
		},
		set: function(value) {
			if(this.multiline || value < 0) {
				this._height = value;
			}else{
				this.size = value - (this.padding<<1);
			}
		}
	});
	
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
						this._updateText(true, true);
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
	
	/** Given text, checks if the next character is a formatting tag and processes it. If the string is empty, then a
	 * "TERM" event will be returned.
	 * @param {string} The input text. Scanning will start at the beginning of this.
	 * @return {array} Formatting data. First element is a `_EVENT_*` constant or null, second is either an argument to
	 * the event (if it is defined) or the string to insert (if it is null). The third element is the number of 
	 * characters that were "consumed", and thus can be removed from the start of the text.
	 * @private
	 */
	Label.prototype._nextChar = function(text) {
		if(text.length <= 0) return [Label._EVENT_TERM, "", 0];
		
		if(text.charAt(0) == "[" && text.indexOf("]") != -1 && this.format) {
			var commandStr = text.match(/^\[([^\]]*?)\]/i);
			var commands = commandStr[1].split(/\s/);
			
			return this._command.fireOne({"command":commands[0].toLowerCase(), "args":commands},
				commands[0].toLowerCase()).concat([commandStr[0].length]);
		}else{
			return [null, text.charAt(0), 1];
		}
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
		this.prepareDraw.listen(_draw.bind(this));
		this.onInteract.listen(_key.bind(this), interaction.KEY_DOWN);
		this.onActiveChange.listen(_activeChange.bind(this));
		this.frame.listen((function(e) {
			if(this.active) {
				var e = dusk.getElementTextarea();
				
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
	 * @param {object} e An event object from `{@link dusk.sgui.Component#prepareDraw}`.
	 * @private
	 */
	var _draw = function(e) {
		if(this.active) return;
		e.c.strokeStyle = this.border;
		
		e.c.strokeRect(e.d.dest.x, e.d.dest.y, e.d.dest.width, e.d.dest.height);
	};
	
	/** Used to handle keypresses.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#keyPress}`.
	 * @private
	 */
	var _key = function(e) {
		if(e.ctrl) return true;
		var keyDat = keyboard.lookupCode(e.key);
		var textElement = document.getElementById(dusk.elemPrefix+"-input");
		
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
		var elem = document.getElementById(dusk.elemPrefix+"-input");
		
		if(e.active) {
			elem.style.visibility = "visible";
			elem.focus();
			elem.value = this.text;
			elem.style.padding = this.padding+"px";
			elem.style.width = (this.width-(this.padding<<1))+"px";
			elem.style.height = (this.height-(this.padding<<1))+"px"; //this.size+"px";
			elem.style.left = this.container.getTrueX(this.name)+"px";
			elem.style.top = this.container.getTrueY(this.name)+"px";
			elem.style.font = this.size + "px " + this.font;
			elem.style.lineHeight = "100%";
			elem.style.outline = "none";
			elem.style.color = this.colour;
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
