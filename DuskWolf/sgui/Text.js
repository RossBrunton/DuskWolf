//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Label", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var controls = load.require("dusk.controls");
	var utils = load.require("dusk.utils");
	var Image = load.require("dusk.Image");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
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
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Component
	 * @constructor
	 */
	var Label = function(parent, comName) {
		Component.call(this, parent, comName);
		
		/** The stored width of the text. This is generated before the text is drawn so we know how wide the canvas
		 * should be. This is also used when returning the `width` property.
		 * @type integer
		 * @private
		 */
		this._cachedWidth = 0;
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
		/** Internal storage for the current size, used only if this is multiline.
		 * @type int
		 * @since 0.0.21-alpha
		 * @private
		 */
		this._height = 0;
		
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
		 * @type dusk.EventDispatcher
		 * @protected
		 */
		this._command = new EventDispatcher("dusk.sgui.Label._command", EventDispatcher.MODE_LAST);
		this._command.listen(function(e){return [null, ""];}, this);
		this._command.listen(function(e){return [null, "["];}, this, {"command":"["});
		this._command.listen(function(e){return [Label._EVENT_BOLD, ""];}, this, {"command":"b"});
		this._command.listen(function(e){return [Label._EVENT_DEBOLD, ""];}, this, {"command":"/b"});
		this._command.listen(function(e){return [Label._EVENT_ITALIC, ""];}, this, {"command":"i"});
		this._command.listen(function(e){return [Label._EVENT_DEITALIC, ""];}, this, {"command":"/i"});
		
		this._command.listen(function(e){
			return [Label._EVENT_COLOUR, e.args[1]];
		}, this, {"command":"colour"});
		this._command.listen(function(e){
			return [Label._EVENT_COLOUR, this.colour];
		}, this, {"command":"/colour"});
		
		this._command.listen(function(e){
			return [Label._EVENT_FONT, e.args[1]];
		}, this, {"command":"font"});
		this._command.listen(function(e){
			return [Label._EVENT_FONT, this.font];
		}, this, {"command":"/font"});
		
		this._command.listen(function(e){
			return [Label._EVENT_BSIZE, e.args[1]];
		}, this, {"command":"bsize"});
		this._command.listen(function(e){
			return [Label._EVENT_BSIZE, this.borderSize];
		}, this, {"command":"/bsize"});
		
		this._command.listen(function(e){
			return [Label._EVENT_BCOLOUR, e.args[1]];
		}, this, {"command":"bcolour"});
		this._command.listen(function(e){
			return [Label._EVENT_BCOLOUR, this.borderColour];
		}, this, {"command":"/bcolour"});
		
		this._command.listen(function(e){
			var img = new Image(e.args[1], e.args[2]);
			
			return [Label._EVENT_IMAGE, [img]];
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
		this._registerPropMask("width", "width", true, ["font", "text", "multiline"]);
		this._registerPropMask("height", "height", true, ["font", "text", "multiline"]);
		this._registerPropMask("multiline", "multiline");
		
		//Listeners
		this.prepareDraw.listen(this._blDraw, this);
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

	/** Draws the current label, updating the cache if needed.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#prepareDraw}`.
	 * @private
	 */
	Label.prototype._blDraw = function(e) {
		if(this.text !== "" && !this._supressTextDisplay){
			if(this._sig != this._genSig()) {
				//Rebuild the text cache
				this._updateCache(true);
				this._updateCache();
			}
			
			e.c.drawImage(this._cache, e.d.sourceX, e.d.sourceY, e.d.width,  e.d.height,
				e.d.destX, e.d.destY, e.d.width, e.d.height
			);
		}
	};

	/** Updates the cache.
	 * @param {boolean} widthOnly Will only update the width, rather than drawing the text. This function must be called
	 * with this argument first, unless you know that the width has not changed.
	 * @private
	 */
	Label.prototype._updateCache = function(widthOnly) {
		var textHold = this._text;
		var textBuffer = "";
		
		//Create the cache
		var cache = this._widthCache;
		if(!widthOnly) {
			cache = this._cache;
			this._cache.width = this.width;
			this._cache.height = this.height;
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
		
		var cursor = this.padding;
		var charData = null;
		var line = 0;
		while(charData = this._nextChar(textHold)) {
			if(charData[0] == null) {
				//No formatting
				if(charData[1] == "\n" && this.multiline) {
					drawBuff();
					line ++;
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
					
					if(charData[1][0].isReady()) {
						charData[1][0].paint(c, "", false,
							0, 0, charData[1][0].width(), charData[1][0].height(),
							cursor, this.padding + line * this.size, charData[1][1], this.size
						);
						
						cursor += charData[1][1];
					}else{
						charData[1][0].loadPromise().then((function(e) {this._updateCache();}).bind(this));
						
						textBuffer += "\ufffd";
					}
				}
			}
			
			//Cut off the characters we have processed
			textHold = textHold.substr(charData[2]);
		}
		
		//And set the width
		this._cachedWidth = cursor + this.padding;
		if(isNaN(this._cachedWidth)) this._cachedWidth = this.padding << 1;
		this._cachedWidth = ~~this._cachedWidth;
		if(!widthOnly) this._sig = this._genSig();
	};

	//width
	Object.defineProperty(Label.prototype, "width", {
		get: function() {
			if(this._width >=0) {
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
	Object.defineProperty(Label.prototype, "height", {
		get: function() {
			if(this.multiline) {
				return this._height;
			}else{
				return this.size + (this.padding<<1);
			}
		},
		set: function(value) {
			if(this.multiline) {
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
				this._text = ""+value;
				this._updateCache(true);
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
			
			return this._command.fire({"command":commands[0].toLowerCase(), "args":commands})
				.concat([commandStr[0].length]);
		}else{
			return [null, text.charAt(0), 1];
		}
	};

	Object.seal(Label);
	Object.seal(Label.prototype);

	sgui.registerType("Label", Label);
	
	return Label;
})());


load.provide("dusk.sgui.TextBox", (function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var controls = load.require("dusk.controls");
	var dusk = load.require("dusk");
	var keyboard = load.require("dusk.keyboard");
	
	/** @class dusk.sgui.TextBox
	 * 
	 * @classdesc A textbox is an instance of `{@link dusk.sgui.Label}` that allows the user to change the text inside
	 * it when active.
	 * 
	 * Due to limitations, the input isn't accurate and you can only edit the end of the string. But still, what do you
	 * want for a canvas text entry?
	 * 
	 * This component sets the `{@link dusk.sgui.Component#allowMouse}` property to true, and the
	 * `{@link dusk.sgui.Component#activeBorder}` property to "#ff5555". It also draws it's own border even when the
	 * component is not active, as a hint to the user.
	 * 
	 * If the user presses a key that is bound to a direction, the direction will not be typed, and focus will try to
	 * switch away from the TextBox.
	 * 
	 * @param {dusk.sgui.IContainer} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Label
	 * @constructor
	 */
	var TextBox = function(parent, comName) {
		Label.call(this, parent, comName);
		
		/** The border of the TextBox when it is not active.
		 * @type string
		 * @default "#cccccc"
		 */
		this.border = "#cccccc";
		
		//Prop masks
		this._registerPropMask("border", "border", true);
		
		//Listeners
		this.prepareDraw.listen(this._boxDraw, this);
		this.keyPress.listen(this._boxKey, this, {"ctrl":false});
		this.onActiveChange.listen(this._activeChange, this);
		this.frame.listen((function(e) {
			if(this.active) {
				var e = document.getElementById(dusk.elemPrefix+"-input");
				//I want no newlines
				if(!this.multiline && e.value.indexOf("\n") !== -1) {
					e.value = e.value.replace("\n", "");
				} 
				
				this.text = e.value;
			}
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
	TextBox.prototype._boxDraw = function(e) {
		if(this.active) return;
		e.c.strokeStyle = this.border;
		
		e.c.strokeRect(e.d.destX, e.d.destY, e.d.width, e.d.height);
	};

	/** Used to handle keypresses.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#keyPress}`.
	 * @private
	 */
	TextBox.prototype._boxKey = function(e) {
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
	TextBox.prototype._activeChange = function(e) {
		var elem = document.getElementById(dusk.elemPrefix+"-input");
		
		if(e.active) {
			elem.style.visibility = "visible";
			elem.focus();
			elem.value = this.text;
			elem.style.padding = this.padding+"px";
			elem.style.width = (this.width-(this.padding<<1))+"px";
			elem.style.height = (this.height-(this.padding<<1))+"px"; //this.size+"px";
			elem.style.left = this.container.getTrueX(this.comName)+"px";
			elem.style.top = this.container.getTrueY(this.comName)+"px";
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

	Object.seal(TextBox);
	Object.seal(TextBox.prototype);

	sgui.registerType("TextBox", TextBox);
	
	return TextBox;
})());
