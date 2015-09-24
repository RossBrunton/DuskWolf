//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.TextBox", (function() {
	var ValidatingLabel = load.require("dusk.text.sgui.ValidatingLabel");
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
		ValidatingLabel.call(this, parent, name);
		
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
	TextBox.prototype = Object.create(ValidatingLabel.prototype);
	
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
