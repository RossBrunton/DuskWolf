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
	
	/** Creates a new SayBox component.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} name The name of the component.
	 * 
	 * @class dusk.sgui.SayBox
	 * 
	 * @classdesc A saybox is a combination of components that are arranged such that they create a "conversation area"
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
		this._body = this.getComponent("body", "PlusText");
		/** The right component.
		 * @type dusk.sgui.PlusText
		 * @private
		 */
		this._right = this.getComponent("right", "PlusText");
		/** The left component.
		 * @type dusk.sgui.PlusText
		 * @private
		 */
		this._left = this.getComponent("left", "PlusText");
		/** The continue component.
		 * @type dusk.sgui.Image
		 * @private
		 */
		this._continue = this.getComponent("continue", "Image");
		
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
				
				if(this._streaming.charAt(this._pointer) == "[") {
					while(this._streaming.charAt(this._pointer) != "]") {
						this._pointer ++;
					}
					
					this._pointer ++;
				}
				
				// Check if newline needed
				var wordsDone = outText.split(" ");
				
				if(
					this._body.getComponent("label").countLines(wordsDone.join(" ")) != 
					this._body.getComponent("label").countLines(
						this._streaming.split(" ").slice(0, wordsDone.length).join(" ")
					)
				) {
					wordsDone[wordsDone.length-2] += "\n";
					outText = wordsDone.join(" ");
				}
				
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
	 * @param {?array} options Currently unused.
	 * @param {?*} pass Passed argument, will be the value the promise fulfills.
	 * @return {Promise(*)} A promise that fulfills or rejects based on the users interaction to the saybox.
	 */
	SayBox.prototype.say = function(left, body, right, options, pass) {
		if(this.autoActive && !this.active) this.becomeActive();
		
		return new Promise((function(fulfill, reject) {
			if("sayVars" in pass) {
				for(var v in pass.sayVars) {
					body = body.split("{{"+v+"}}").join(pass.sayVars[v]);
					if(left) left = left.split("{{"+v+"}}").join(pass.sayVars[v]);
					if(right) right = right.split("{{"+v+"}}").join(pass.sayVars[v]);
					if(options) options = options.map(
						function(elem) {return elem.split("{{"+v+"}}").join(pass.sayVars[v]);}
					);
				}
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
			this._pointer = 0;
			
			this._fulfill = fulfill;
			this._reject = reject;
			this._pass = pass;
		}).bind(this));
	};
	
	/** Returns `say` with the arguments bound.
	 * @param {string} left The text to put in the left box.
	 * @param {string} body The text to put in the body.
	 * @param {string} right The text to put in the right box after the text has finished filling.
	 * @param {array} options Currently unused.
	 * @param {?*} pass Passed argument, will be the value the promise fulfills.
	 * @return {function(string, ?string, ?string, ?array, ?*}):Promise(*)} The bound function.
	 */
	SayBox.prototype.sayBound = function(left, body, right, options, pass) {
		return this.say.bind(this, left, body, right, options);
	};
	
	/** Returns an array with `say` with the arguments bound as the first argument, and a resolving function as the
	 *  second for use with ReversiblePromiseChains.
	 * @param {string} left The text to put in the left box.
	 * @param {string} body The text to put in the body.
	 * @param {string} right The text to put in the right box after the text has finished filling.
	 * @param {array} options Currently unused.
	 * @param {?*} pass Passed argument, will be the value the promise fulfills.
	 * @return {array} The functions.
	 */
	SayBox.prototype.sayBoundPair = function(left, body, right, options, pass) {
		return [
			this.sayBound(left, body, right, options, pass),
			function(pa) {return Promise.resolve();},
			"Saybox: "+left+": "+body.substring(0, 30)+"..."
		];
	};
	
	sgui.registerType("SayBox", SayBox);
	
	sgui.addStyle("SayBox>#left", {
		"behind":true,
		"x":10,
		"height":35,
		"label":{
			"padding":10,
		}
	});
	sgui.addStyle("SayBox>#body", {
		"behind":true,
		"height":100,
		"width":700,
		"y":40,
		"label":{
			"multiline":true,
			"padding":10,
		}
	});
	sgui.addStyle("SayBox>#right", {
		"behind":true,
		"xOrigin":"right",
		"x":-10,
		"height":35,
		"label":{
			"padding":10,
		}
	});
	sgui.addStyle("SayBox>#continue", {
		"behind":true,
		"xOrigin":"right",
		"yOrigin":"bottom",
		"x":-10,
		"y":-5,
		"src":"default/next.png",
		"width":16,
		"height":16,
		"extras":{
			"fadeIn":{
				"type":"Fade",
				"from":0.5,
				"to":1.0,
				"duration":60,
				"noDelete":true,
				"then":"fadeOut"
			},
			"fadeOut":{
				"type":"Fade",
				"from":1.0,
				"to":0.5,
				"duration":60,
				"noDelete":true,
				"then":"fadeIn"
			},
		}
	});
	
	return SayBox;
})());
