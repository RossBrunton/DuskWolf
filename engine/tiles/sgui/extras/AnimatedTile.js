//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.extras.animationTypes", (function() {
	/** This namespace contains functions that do an action in an animation.
	 * 
	 * The functions return objects that can be used for an AnimatedTile's action list.
	 * 
	 * @since 0.0.21-alpha
	 */
	var types = {};
	
	/** This action will change the current animation to the given one. This will set the "interrupted" flag to true on
	 * any promises.
	 * @param {string} name The animation to switch to.
	 * @return {object} An action.
	 */
	types.switchTo = function(name) {
		return {"type":"switchTo", "name":name};
	};
	
	/** Stops the current animation, leaving the highest priority one to run next.
	 * @return {object} An action.
	 */
	types.stop = function() {
		return {"type":"stop"};
	};
	
	/** Sets the tile on the owner.
	 * @param {integer} x The x coordinate of the tile.
	 * @param {integer} y The y coordinate of the tile.
	 * @return {object} An action.
	 */
	types.setTile = function(x, y) {
		return {"type":"setTile", "x":x, "y":y};
	};
	
	/** Fullfills the animation promise, but does not stop the animation. The `manual` flag on the animation will be
	 * true. The next action will be executed immediately.
	 * @return {object} An action.
	 */
	types.fullfill = function() {
		return {"type":"fullfill"};
	};
	
	/** Adds the image transformation provided to the tile. It will replace any of the current kind already on the tile.
	 * @param {string} trans The transformation to add.
	 * @param {boolean=false} block Iff false, then the next action will be executed immediately. Otherwise, the full
	 *  frame delay is waited before advancing.
	 * @return {object} An action.
	 */
	types.addTrans = function(trans, block) {
		return {"type":"addTrans", "trans":trans, "block":block};
	};
	
	/** Removes the image transformation provided from the tile.
	 * @param {string} trans The transformation to remove.
	 * @param {boolean=false} block Iff false, then the next action will be executed immediately. Otherwise, the full
	 *  frame delay is waited before advancing.
	 * @return {object} An action.
	 */
	types.removeTrans = function(trans, block) {
		return {"type":"removeTrans", "trans":trans, "block":block};
	};
	
	/** Calls `cond` with the tile and state. If `cond` returns true, then the current frame is advanced by `advance`.
	 * @param {function(dusk.tiles.sgui.Tile, object):boolean} cond The condition to check. The next action (which will
	 * be the one advanced to if appropriate) will be executed.
	 * executed immediately.
	 * @param {integer} advance The amount of frames to skip if the condition is true.
	 * @return {object} An action.
	 */
	types.cond = function(cond, advance) {
		return {"type":"cond", "cond":cond, "advance":advance};
	};
	
	/** Does nothing until the frame is advanced next.
	 * @return {object} An action.
	 */
	types.pass = function() {
		return {"type":"pass"};
	};
	
	/** Shortcut to set a key on the state object.
	 * @return {object} An action.
	 */
	types.setState = function(key, value) {
		return {"type":"setState", "key":key, "value":value};
	};
	
	return types;
})());

load.provide("dusk.tiles.sgui.extras.AnimatedTile", (function() {
	var Extra = load.require("dusk.sgui.extras.Extra");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var sgui = load.require("dusk.sgui");
	var animationTypes = load.require("dusk.tiles.sgui.extras.animationTypes");
	var frameTicker = load.require("dusk.utils.frameTicker");
	
	/** The total number of frames ran. Using this instead of frameTicker.framesTotal so it takes into effect different
	 * refresh rates.
	 * @type integer
	 * @private
	 */
	var _totalFrames = 0;
	frameTicker.onFrame.listen(function() {_totalFrames ++;});
	
	/** An animated tile simply animates a tile.
	 * 
	 * This contains a list of animations in order, with higher "priority" animations being later in the list. Each
	 * entry in this list is an array of `[name, actions, options]`. The name is the name of the animation, used to
	 * start it. The actions is an array of actions to do on each frame, and options is an object containing settings
	 * for the animation.
	 * 
	 * The actions object is an array of either functions or objects. If it is an object, it must be output from a
	 * member of `dusk.tiles.sgui.extras.animationTypes`, and their effects are documented there. If it is a function,
	 * the function will be called with `(state object, attached component)` and the next frame is animated.
	 * 
	 * The options object contains settings as follows:
	 * - trigger:function(object, dusk.tiles.sgui.Tile) - This function will be called for each animation with a higher
	 * priority than the current animation every frame. If it returns true, then the tile will switch to that animation
	 * immediately. The function will be given the animation state and the tile this is attached to.
	 * - holds:boolean - If this boolean is true (by default it is false), the animation will only run while the trigger
	 * is true. If it stops being true, then the animation will stop.
	 * - loops:boolean - Normaly, when the end of an animation is reached, it is stopped and the highest priority
	 * animation is used (even if it is lower than the stoped one). If this is true, instead the animation will restart
	 * from the first action.
	 * - globalSync:boolean - Ensures that every tile doing this animation is always on the same frame. This removes the
	 * guarantee that the animation will start at the first frame, and manipulating the current frame (e.g. via cond)
	 * will not work. Default is false.
	 * - unsettable:boolean - If this is true, then the animation cannot be set as an active animation. Every frame its
	 * trigger will be checked and if true, then its actions will run only for that frame. The regular animation
	 * continues as if this didn't trigger at all. This is useful for conditional image transformations and particle
	 * effects that are independent from animations. All actions will run on the same frame.
	 * - cooldown:integer - If present and this animation is unsettable, it will not run until this many frames have
	 * passed since it's last run. Settable animations do not use this property.
	 * - waitFalse:boolean - If true and this animation is unsettable, it will wait for the trigger to turn false
	 * between running. Settable animations do not use this property.
	 * 
	 * Once an animation is started, it will run to completion unless a higher priority animation is triggered or a new
	 * one is specified via `changeAnimation`.
	 * 
	 * This extra contains a "state" object, which is given to triggers and functions. It is expected that this object
	 * have properties changed based on the state of the animation, and triggers use these properties to decide if they
	 * should be ran.
	 * 
	 * The frame rate of animations is no the frame rate of the game engine. That is, a single frame of the animation
	 * here can last multiple "real frames". The amount each frame of this animation lasts is specifed by the `rate`
	 * property.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Extra
	 * @since 0.0.21-alpha
	 * @constructor
	 */
	var AnimatedTile = function(owner, name) {
		Extra.call(this, owner, name);
		
		/** An array of all the animations, in the format described by the class description.
		 * @type array<array>
		 * @private
		 */
		this._animations = [];
		
		/** The index of the current animation in the animations array.
		 * @type integer
		 * @private
		 */
		this._current = -1;
		/** The index of the current action in the current animation.
		 * @type integer
		 * @private
		 */
		this._frame = -1;
		
		/** The delay between frames, in "real" frames. Higher numbers indicate a slower animation, with 60 being one
		 * frame a second.
		 * @default 5
		 * @type integer
		 */
		this.rate = 5;
		
		/** The array of fullfill functions to call when the animation changes.
		 * @type array<function(object)>
		 * @private
		 */
		this._fullfills = [];
		
		/** The state object.
		 * @type object
		 * @private
		 */
		this._state = {};
		
		/** A mapping of animation names to their current cooldown counters.
		 * @type Map<string, integer>
		 * @private
		 */
		this._animationCooldowns = new Map();
		
		/** A mapping of whether a trigger on a "waitFalse" is eligible yet.
		 * @type Map<string, boolean>
		 * @private
		 */
		this._eligibleWaitFalse = new Map();
		
		//Listeners
		this._atFrameId = this._owner.frame.listen(_frame.bind(this));
		this.onDelete.listen(_deleted.bind(this));
		
		//Prop masks
		this._props.map("rate", "rate");
		this._props.map("animations", [undefined, this.setAnimations.bind(this)])
	};
	AnimatedTile.prototype = Object.create(Extra.prototype);
	
	/** Sets the current animation to the provided object.
	 * 
	 * The animations array must be of the format described in the class description.
	 * 
	 * This will replace all existing animations.
	 * 
	 * This can be called in the JSON representation using the `animations` property.
	 * 
	 * @param {array<array>} animations The animations to set.
	 */
	AnimatedTile.prototype.setAnimations = function(animations) {
		this._animations = [];
		for(var a of animations) {
			this._animations.push(a);
		}
	};
	
	/** Checks for a new animation of a higher priority (calling triggers) and sets it.
	 * 
	 * @private
	 * @return {boolean} Whether a new animation was set.
	 */
	AnimatedTile.prototype._checkNew = function() {
		for(var i = this._animations.length-1; i > this._current; i --) {
			if(!this._animations[i][2].unsettable
			&& "trigger" in this._animations[i][2] && this._animations[i][2].trigger(this._state, this._owner)) {
				this.changeAnimation(this._animations[i][0]);
				return true;
			}
		}
		return false;
	};
	
	/** Checks for and executes unsettable animations.
	 * 
	 * @private
	 */
	AnimatedTile.prototype._execUnsettable = function() {
		for(var i = this._animations.length-1; i >= 0; i --) {
			var a = this._animations[i];
			if(i > this._current && a[2].unsettable && "trigger" in a[2] && a[2].trigger(this._state, this._owner)
			&& (!this._animationCooldowns.has(a[0]) || this._animationCooldowns.get(a[0]) <= 0)
			&& (!a[2].waitFalse || this._eligibleWaitFalse.get(a[0]))) {
				
				for(var act of a[1]) {
					this._performAction(act);
				}
				
				if("cooldown" in a[2]) {
					this._animationCooldowns.set(a[0], a[2].cooldown);
				}
				
				if("waitFalse" in a[2]) {
					this._eligibleWaitFalse.set(a[0], false);
				}
			}else if(a[2].waitFalse && !a[2].trigger(this._state, this._owner)) {
				this._eligibleWaitFalse.set(a[0], true);
			}
			
			if(this._animationCooldowns.has(a[0]) && this._animationCooldowns.get(a[0]) > 0) {
				this._animationCooldowns.set(a[0], this._animationCooldowns.get(a[0])-1);
			}
		}
	};
	
	/** Changes the animation to the one with the provided name, even if it has a lower priority.
	 * 
	 * This returns a promise which resolves to an object with the following properties when the animation is ended or
	 * the "fullfill" action is ran:
	 * - interrupted:boolean - True if the animation never ran until completion, instead another animation was set
	 *  (either via triggers or this function).
	 * - manual:boolean - True iff the promise was resolved by the fullfill action.
	 * - exists:boolean - Iff the animation specified by the name does not exist, the promise resolves immediately, and
	 *  this flag will be false.
	 * 
	 * @param {string} The string name of the animation to set.
	 * @return {Promise<object>} A promise as described above.
	 */
	AnimatedTile.prototype.changeAnimation = function(name) {
		return new Promise((function(full, rej) {
			this._fullfills.forEach(function(e) {e({"interrupted":true, "manual":false, "exists":true});});
			this._fullfills = [full];
			
			// Find the animation
			for(var i = 0; i < this._animations.length; i ++) {
				if(this._animations[i][0] == name) {
					this._current = i;
					break;
				}
			}
			
			// If we can't find it, just fullfill with this object
			if(i == this._animations.length) {
				full({"interrupted":false, "manual":false, "exists":false});
				return;
			}
			
			this._frame = -1;
			this._nextAction();
		}).bind(this));
	};
	
	/** Stops the currently running animation. The next animation to run will be the highest priority one.
	 * @param {?string} filter If this is defined, the animation will only be stopped if it has this name.
	 */
	AnimatedTile.prototype.stopAnimation = function(filter) {
		if(filter && this._animations[this._current][0] != filter) return;
		
		this._fullfills.forEach(function(e) {e({"interrupted":true, "manual":false, "exists":true});});
		this._fullfills = [];
		this._current = -1;
		this._checkNew();
	};
	
	/** Increments the frame counter and either handles an animation ending, or does the next action.
	 * 
	 * @private
	 */
	AnimatedTile.prototype._nextAction = function() {
		this._frame ++;
		
		// Check if we need to change/loop
		if(this._current < 0 || this._frame >= this._animations[this._current][1].length) {
			if(this._current >= 0 && this._animations[this._current][2].loops) {
				this._frame = 0;
			}else{
				this._fullfills.forEach(function(e) {e({"interrupted":false, "manual":false, "exists":true});});
				this._fullfills = [];
				this._current = -1;
				this._checkNew();
				return;
			}
		}
		
		if(this._current >= 0) {
			// Check holds status
			if(this._animations[this._current][2].holds
			&& !this._animations[this._current][2].trigger(this._state, this._owner)) {
				this._fullfills.forEach(function(e) {e({"interrupted":false, "manual":false, "exists":true});});
				this._fullfills = [];
				this._current = -1;
				this._checkNew();
				return;
			}
			
			// Handle gobalSync
			if(this._animations[this._current][2].globalSync) {
				this._frame = (_totalFrames / this.rate) % this._animations[this._current][1].length;
			}
			
			// Handle the current action
			var now = this._animations[this._current][1][this._frame];
			
			if(this._performAction(now)) this._nextAction();
		}
	};
	
	/** Performs a single animation action.
	 * 
	 * @param {object|array<integer>|function(object, dusk.sgui.Tile):*} The action object.
	 * @return {boolean} true iff the next action should be ran now, or delayed until the next animation frame.
	 * @private
	 */
	AnimatedTile.prototype._performAction = function(act) {
		if(typeof act == "function") {
			act = act(this._state, this._owner);
			if(!act) {
				// Fn did not return an action
				return true;
			}
		}else if(Array.isArray(act)) {
			this._owner.tile = act;
			return false;
		}
		
		if(act) {
			switch(act.type) {
				case "switchTo":
					this.changeAnimation(act.name);
					return false;
				
				case "stop":
					this._fullfills.forEach(function(e) {e({"interrupted":false, "manual":false, "exists":true});});
					this._fullfills = [];
					this._current = -1;
					this._checkNew();
					return false;
				
				case "setTile":
					this._owner.tile = [act.x, act.y];
					return false;
				
				case "fullfill":
					this._fullfills.forEach(function(e) {e({"interrupted":false, "manual":true, "exists":true});});
					this._fullfills = [];
					this._checkNew();
					return false;
				
				case "addTrans":
				case "removeTrans":
					for(var i = 0; i < this._owner.imageTrans.length; i ++) {
						if(this._owner.imageTrans[i][0] == act.trans.split(":")[0]) {
							this._owner.imageTrans.splice(i, 1);
							i --;
						}
					}
					
					if(act.type == "addTrans") {
						this._owner.imageTrans.push(act.trans.split(":"));
					}
					
					return !act.block;
				
				case "cond":
					if(act.cond(this.state, this._owner)) {
						this._frame += act.advance;
					}
					return true;
				
				case "pass":
					return false;
				
				case "setState":
					this._state[act.key] = act.value;
					return true;
				
				default:
					throw new TypeError("Animation action" + act.type + " not appropriate");
			}
		}
		
		return false;
	};
	
	/** Added to the `_onDelete` listener; removes the frame listener from its owner.
	 * @param {object} e The event object.
	 * @private
	 */
	var _deleted = function(e) {
		this._owner.frame.unlisten(this._atFrameId);
	};
	
	/** Called every frame by its owner, this calls _nextAction when the next frame is advanced, and also checks for
	 * higher priority animations.
	 * @param {object} e The event object.
	 * @private
	 */
	var _frame = function(e) {
		this._execUnsettable();
		
		if(!this._checkNew()) {
			if(_totalFrames % this.rate == 0) {
				this._nextAction();
			}
		}
	};
	
	sgui.registerExtra("AnimatedTile", AnimatedTile);
	
	return AnimatedTile;
})());
