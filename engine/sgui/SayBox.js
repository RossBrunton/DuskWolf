//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.SayBox", (function() {
	var Group = load.require("dusk.sgui.Group");
	var PlusText = load.require("dusk.sgui.PlusText");
	var Image = load.require("dusk.sgui.Image");
	var Fade = load.require("dusk.sgui.extras.Fade");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var UserCancelError = load.require("dusk.utils.reversiblePromiseChain.UserCancelError");
	
	/** Group of components that function as a dialogue box.
	 * 
	 * A saybox is a combination of components that are arranged such that they create a "conversation area"
	 *  like in RPGs and stuff. It consists of two single line text boxes (one at the left for a "name", one at the
	 *  right for other things), a larger box below these two (for the main body of the text) and an image which is only
	 *  visible when the user can advance the text.
	 * 
	 * The components of this group may be styled, and are named as follows:
	 * - body: The main body of the saybox of type PlusText.
	 * - right: The right text box of type PlusText.
	 * - left: The left text box of type PlusText.
	 * - continue: The image that is displayed when the user can continue of type Image.
	 * 
	 * Messages can be set using the method `say` or similar. The textbox will slowly type out the message
	 *  and allow the user a chance to read the text and when they are ready they can trigger an action to continue.
	 *  The method say returns a promise that resolves when the user has "confirmed" the text box, while it rejects if
	 *  the user cancels.
	 * 
	 * The method `sayBoundPair` allows messages to be set using a ReversiblePromiseChain. An argument can be passed
	 *  through the promise in this way, and if there is a property called `sayVars` on the passed object, it's keys are
	 *  iterated as `x` and any occurence of `{{x}}` in text will be replaced by the value.
	 * 
	 * @extends dusk.sgui.Group
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var SayBox = function (parent, name) {
		Group.call(this, parent, name);
		
		/** The body component.
		 * @type dusk.sgui.PlusText
		 * @private
		 */
		this._body = this.get("body", "PlusText");
		/** The right component.
		 * @type dusk.sgui.PlusText
		 * @private
		 */
		this._right = this.get("right", "PlusText");
		/** The left component.
		 * @type dusk.sgui.PlusText
		 * @private
		 */
		this._left = this.get("left", "PlusText");
		/** The continue component.
		 * @type dusk.sgui.Image
		 * @private
		 */
		this._continue = this.get("continue", "Image");
		
		/** The number of frames to wait between each character being printed.
		 * @type integer
		 * @default 3
		 */
		this.delay = 3;
		
		/** The number of frames left until the next character is added.
		 * @type integer
		 * @private
		 */
		this._delayCount = 0;
		
		/** The full text that is currently being fed into the text box.
		 * @type string
		 * @private
		 */
		this._streaming = "";
		/** The index of the character that was last printed.
		 * @type integer
		 * @private
		 */
		this._pointer = 0;
		
		/** The text to add to the right box when the text is filled in.
		 * @type string
		 * @private
		 */
		this._toRight = "";
		
		/** The function to be called when fulfilled.
		 * @type function
		 * @private
		 */
		this._fulfill = null;
		/** The function to be called when rejected.
		 * @type function
		 * @private
		 */
		this._reject = null;
		
		/** Whether this text box will set itself as active whenever something is said.
		 * @type boolean
		 * @default true
		 */
		this.autoActive = true;
		
		// Listeners
		this.frame.listen(_frame.bind(this));
		this.action.listen(_action.bind(this));
		this.cancel.listen(_cancel.bind(this));
		
		// Prop masks
		this._mapper.map("delay", "delay");
		this._mapper.map("autoActive", "autoActive");
		
		this.xDisplay = "expand";
	};
	SayBox.prototype = Object.create(Group.prototype);
	
	/** Called every frame to handle frames.
	 * @private
	 */
	var _frame = function() {
		if(this._streaming) {
			this._delayCount ++;
			if(this._delayCount >= this.delay) {
				this._delayCount = 0;
				
				this._pointer ++;
				
				var outText = this._streaming.substring(0, this._pointer);
				
				if(this._pointer > this._streaming.length) {
					this._complete();
				}else{
					this._body.text = outText;
				}
			}
		}
	};
	
	/** Called on action to either fill in the rest of the text or confirm.
	 * @param {object} e The event object.
	 * @private
	 */
	var _action = function(e) {
		if(this._streaming) {
			this._complete();
		}else{
			this._fulfill(this._pass);
			this._continue.visible = false;
		}
	};
	
	/** Called on cancel to either fill in the rest of the text, or reject the promise.
	 * @param {object} e The event object.
	 * @private
	 */
	var _cancel = function(e) {
		if(this._streaming) {
			this._complete();
		}else{
			this._reject(new UserCancelError());
		}
	};
	
	/** Completes the text, setting the body to the text, displaying the right text and displaying the continue.
	 * @private
	 */ 
	SayBox.prototype._complete = function() {
		this._body.text = this._streaming;
		this._streaming = "";
		
		if(this._toRight) {
			this._right.text = this._toRight;
			this._right.visible = true;
		}
		
		this._continue.visible = true;
		this._continue.getExtra("fadeIn").end();
		this._continue.getExtra("fadeOut").end();
		this._continue.getExtra("fadeIn").start();
	};
	
	/** Sets the text to say, and starts talking.
	 * @param {string} left The text to put in the left box.
	 * @param {?string} body The text to put in the body.
	 * @param {?string} right The text to put in the right box after the text has finished filling.
	 * @param {?object} context Used for value formatting.
	 * @param {?array} options Currently unused.
	 * @return {Promise(*)} A promise that fulfills or rejects based on the users interaction to the saybox.
	 */
	SayBox.prototype.say = function(left, body, right, context, options) {
		if(this.autoActive && !this.active) this.becomeActive();
		
		return new Promise((function(fulfill, reject) {
			if(context) {
				left = _format(left, context);
				right = _format(right, context);
				body = _format(body, context);
			}
			
			if(!left) {
				this._left.visible = false;
			}else{
				this._left.visible = true;
				this._left.text = left;
			}
			
			this._right.visible = false;
			this._toRight = right;
			
			this._continue.visible = false;
			
			this._streaming = body;
			this._body.get("label").shadowText = body;
			this._pointer = 0;
			
			this._fulfill = fulfill;
			this._reject = reject;
		}).bind(this));
	};
	
	var _format = function(base, context) {
		var outs = "";
		
		for(var p = 0; p < base.length; p ++) {
			var c = base[p];
			
			if(c == "{") {
				var c = base[++p];
				
				var transfn = {
					"{":function(k) {return context[k];},
					"%":function(k) {return context[k].apply(undefined, arguments);},
				}[c];
				
				var expr = "";
				var nc;
				while((nc = base[++p]) && nc != "}") {
					if(nc == "\\") {
						expr += base[++p];
					}else{
						expr += nc;
					}
				}
				
				outs += transfn.apply(undefined, expr.trim().split(/\s/gi));
				p ++;
			}else{
				outs += c;
			}
		}
		
		return outs;
	};
	
	sgui.registerType("SayBox", SayBox);
	
	sgui.addStyle("SayBox>#left", {
		behind:true,
		x:10,
		height:35,
		mark:"#00ff00",
		behind:true,
		visible:false,
		plus:{
			xDisplay:"expand"
		},
		label:{
			"padding":10,
		}
	});
	sgui.addStyle("SayBox>#body", {
		behind:true,
		height:100,
		xDisplay:"expand",
		y:40,
		mark:"#00ff00",
		behind:true,
		plus:{
			xDisplay:"expand"
		},
		label:{
			multiline:true,
			padding:10,
			xDisplay:"expand",
		}
	});
	sgui.addStyle("SayBox>#right", {
		behind:true,
		xOrigin:"right",
		x:-10,
		height:35,
		mark:"#00ff00",
		behind:true,
		visible:false,
		plus:{
			xDisplay:"expand"
		},
		label:{
			padding:10,
		}
	});
	sgui.addStyle("SayBox>#continue", {
		behind:true,
		xOrigin:"right",
		yOrigin:"bottom",
		x:-10,
		y:-5,
		src:"default/next.png",
		width:16,
		height:16,
		extras:{
			fadeIn:{
				"type":"Fade",
				"from":0.5,
				"to":1.0,
				"duration":60,
				"noDelete":true
			},
			fadeOut:{
				"type":"Fade",
				"from":1.0,
				"to":0.5,
				"duration":60,
				"noDelete":true
			},
		}
	});
	
	/** An error raised if there is a problem parsing the formatting syntax.
	 * @param {string} message The message that this error should display.
	 * @since 0.0.21-alpha
	 * @constructor
	 * @extends Error
	 */
	SayBox.FormatError = function(message) {
		this.message = message;
		this.name = "SayBoxFormatError";
	};
	SayBox.FormatError.prototype = Object.create(Error.prototype);
	
	return SayBox;
})());
