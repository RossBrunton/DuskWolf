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
	var Location = load.require("dusk.text.Location");
	var FormatBlock = load.require("dusk.text.FormatBlock");
	
	/** A label is a component that contains (possibly) formatted text.
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
	 * Text can have a border round it, using the `bsize` and `borderColour` properties.
	 * 
	 * Labels have a default width and height of -1. This means it will automatically render at the correct size to
	 *  display all the text. Setting it to a value larger than -1 could chop off the text.
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
		/** The number of lines of text, if the text is not multiline then this will be 1.
		 * 
		 * Please do not set this property, it won't do anything. Also, this is only accurate if the text box does not
		 *  have an xDisplay of "expand", since it is impossible to know the width ahead of time.
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
		/** The canvas onto which the caches are drawn
		 * 
		 * Is a map from a given width to HTML canvas elements. Single line text fields always use -1.
		 * @type Map.<integer, HTMLCanvasElement>
		 * @private
		 */
		this._caches = new Map();
		
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
		/** If true, this text will support multiple lines.
		 * 
		 * If false, then only one line of text is allowed.
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
		
		/** The location instance used for all this label's logic.
		 * @type dusk.text.Location
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._location = new Location(this);
		/** The total number of characters this label's text has.
		 * 
		 * This does not include tags, so "[b]Hi![/b]" has 3 chars rather than 10.
		 * @type integer
		 * @since 0.0.21-alpha
		 */
		this.chars = 0;
		/** Only this number of characters (from the beginning of the text) will be displayed.
		 * @type integer
		 * @default Number.MAX_SAFE_INTEGER
		 * @since 0.0.21-alpha
		 */
		this.displayChars = Number.MAX_SAFE_INTEGER;
		
		// Default dimensions
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
		
		//Listeners
		this.onPaint.listen(_draw.bind(this));
	};
	Label.prototype = Object.create(Component.prototype);
	
	/** Draws the current label, updating the cache if needed.
	 * @param {object} e An event object from `{@link dusk.sgui.Component#onPaint}`.
	 * @private
	 */
	var _draw = function(e) {
		if(this.text !== "" && !this._supressTextDisplay){
			if(this._sig != this._genSig(e)) {
				//Rebuild the text cache
				this._clearCache();
				this._sig = this._genSig(e);
			}
			
			this._processText(false, e.d.origin.width);
			var cache = this._caches.get(this.multiline ? e.d.origin.width : -1);
			
			var xDelta = 0;
			var yDelta = 0;
			if(e.d.slice.width > cache.width) {
				xDelta = cache.width - e.d.slice.width;
			}
			if(e.d.slice.height > cache.height) {
				yDelta = cache.height - e.d.slice.height;
			}	
			
			e.c.drawImage(cache, e.d.slice.x, e.d.slice.x, e.d.slice.width + xDelta,  e.d.slice.height + yDelta,
				e.d.dest.x, e.d.dest.y, e.d.dest.width + xDelta, e.d.dest.height + yDelta
			);
		}
	};
	
	Label.prototype._configContext = function(ctx) {
		ctx.font = this.size + "px " + this.font;
		ctx.fillStyle = this.colour;
		ctx.strokeStyle = this.borderColour;
		ctx.lineWidth = this.borderSize;
		ctx.textBaseline = "middle";
	};
	
	/** Either draws onto the appropriate cache, or measures the text for its dimensions.
	 * 
	 * If the cache already exists for the appropriate size, this does nothing.
	 * @param {boolean} measure If true, will only update the dimensions, rather than drawing the text.
	 * @param {?integer} width The width to generate a cache for iff this is a multiline label.
	 *  If ommited it will be this.width if it is defined.
	 * @private
	 */
	Label.prototype._processText = function(measure, width) {
		var width = this.multiline ? (width >= 0 ? width : this.width) : -1;
		
		// Don't bother if a value already exists
		if(this._caches.has(width)) return;
		
		//Create the cache
		var cache = utils.createCanvas(0, 0);
		if(width > 0) cache.width = width;
		var c = cache.getContext("2d");
		
		// Parse the text
		var f = new FormatBlock([this.text]);
		this._location.reset();
		this._location.restrictMaxWidth = width;
		
		// Measure the text
		this._configContext(c);
		f.print(c, this._location, Number.MAX_SAFE_INTEGER, true);
		this._cachedWidth = this._location.x + this.padding;
		this.lines = this._location.lines;
		this.chars = this._location.chars;
		
		// Now actually create the cache
		if(!measure) {
			cache.width = width >= 0 ? width : this._cachedWidth;
			cache.height = this.lines * this.size + (this.padding<<1);
			
			this._configContext(c);
			this._location.reset();
			f.print(c, this._location, this.displayChars);
		}
		
		// And set the cache
		this._caches.set(width, cache);
		
		return;
	};
	
	/** Empties the cache.
	 * 
	 * For when the text changes or something.
	 * @private
	 * @since 0.0.21-alpha
	 */
	Label.prototype._clearCache = function() {
		this._caches.clear();
	};
	
	/** Returns the width to render this component.
	 * 
	 * Either the explicit set width, or the minimum width to display all the text.
	 * @return integer The width to paint.
	 * @since 0.0.21-alpha
	 */
	Label.prototype.getRenderingWidth = function() {
		if(this.width > -1) {
			return this.width
		}else{
			return this._cachedWidth+(this.padding*2);
		}
	};
	
	/** Returns the height to render this component.
	 * 
	 * Either the explicit set height, or the minimum height to display all the text.
	 * @return integer The height to paint.
	 * @since 0.0.21-alpha
	 */
	Label.prototype.getRenderingHeight = function() {
		if(this.height > -1) {
			return this.height;
		}else{
			return this.lines * this.size + (this.padding*2);
		}
	};
	
	//text
	Object.defineProperty(Label.prototype, "text", {
		get: function() {
			return this._text;
		},
		set: function(value) {
			if(this._text != value) {
				if(this.onChange.fireAnd({"component":this, "text":""+value})) {
					this._text = ""+value;
					this._clearCache();
					this._processText(true);
					this.postChange.fire({"component":this, "text":""+value});
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

load.provide("dusk.text.sgui.ValidatingLabel", (function() {
	var Label = load.require("dusk.sgui.Label");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var utils = load.require("dusk.utils");
	
	/** A validating label is a type of label that always ensures its text matches a regex
	 * 
	 * The validation can be done at one of two times, depending on `validCancel`. If `validCancel` is true, then it is
	 *  checked whenever the text is set, if it doesn't pass the validation then the setting of that text is cancelled.
	 *  If it is false, then validation is checked at the instant the component looses focus, in which case the text is
	 *  set to `validDefault`.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * @extends dusk.sgui.Label
	 * @since 0.0.21-alpha
	 * @constructor
	 */
	var ValidatingLabel = function(parent, name) {
		Label.call(this, parent, name);
		
		/** A regular expression. If the text does not match this then it is invalid. If `validCancel` is true, then
		 *  the text will never be set an invalid expression (it will revert to the last valid one immediately). If it
		 *  is false, then when this field looses focus the text will be set to `validDefault`.
		 * @type RegExp
		 * @default null
		 * @since 0.0.21-alpha
		 */
		this.validFilter = null;
		/** If true then an invalid text string will never be set. If false, then it will be reset to the default when
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
		
		// Prop Masks
		this._mapper.map("validFilter", "validFilter");
		this._mapper.map("validCancel", "validCancel");
		this._mapper.map("validDefault", "validDefault");
		
		//Listeners
		this.onActiveChange.listen(_activeChange.bind(this), false);
		this.onChange.listen(_textChange.bind(this));
	};
	ValidatingLabel.prototype = Object.create(Label.prototype);
	
	/** A validator that checks whether the text is a valid number or not (I.E. isNaN(n) will return false).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	ValidatingLabel.VALID_NUMBER = /^[+-]?(?:\d+|\d*(?:\.\d+)?)(?:[Ee][+-]?(?:\d+|\d*(?:\.\d+)?))?$/;
	
	/** A validator that checks whether the text is a valid integer (I.E. isNaN(n) will return false and n % 1 is 0).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	ValidatingLabel.VALID_INTEGER = /^[+-]?\d+(?:[Ee][+-]?\d+)?$/;
	/** A validator that checks whether the text is a valid alphanumeric string (a-z and 0-9).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	ValidatingLabel.VALID_ALPHANUMERIC = /^[a-zA-Z0-9]*$/;
	/** A validator that checks whether the text is a valid alphanumeric string that can contain underscores 
	 *  (a-z, 0-9 and _).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	ValidatingLabel.VALID_ALPHANUMERIC_UNDERSCORES = /^[a-zA-Z0-9_]*$/;
	/** A validator that checks whether the text is a valid alphanumeric string that can contain underscores and spaces
	 *  (a-z, 0-9, _ and space).
	 * @type RegExp
	 * @constant
	 * @since 0.0.21-alpha
	 */
	ValidatingLabel.VALID_ALPHANUMERIC_SPACE = /^[a-zA-Z0-9_ ]*$/;
	
	/** Handles loosing focus, with regards to the validators.
	 * @param {object} e The event object.
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _activeChange = function(e) {
		if(!this.validFilter || this.validCancel) return;
		
		if(!this.validFilter.test(this._text)) this._text = this.validDefault;
	};
	
	//Check if the set text is valid
	var _textChange = function(e) {
		if(this.validFilter && this.validCancel && !this.validFilter.test(e.text)) return false;
		return true;
	};
	
	sgui.registerType("ValidatingLabel", ValidatingLabel);
	
	return ValidatingLabel;
})());
