//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Extra");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require("dusk.Range");

dusk.load.provide("dusk.sgui.extras.Effect");

/** @class dusk.sgui.extras.Effect
 * 
 * @classdesc An effect is a type of extra that does the following:
 * 
 * - Stays idle until it is triggered.
 * - When triggered, waits a specified number of frames.
 * - Then does something (an effect, like fading in or out, or moving) for a specified number of frames.
 * - Then deletes itself.
 * 
 * This class does nothing on its own, it is expected that other subclasses of this provide the actuall effects.
 *  They should use the `{@link dusk.sgui.extras.Effect#_tick}`, `{@link dusk.sgui.extras.Effect#_onStart}`
 *   and `{@link dusk.sgui.extras.Effect#_onEnd}` handlers to act.
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Extra
 * @since 0.0.18-alpha
 * @constructor
 */
dusk.sgui.extras.Effect = function(owner, name) {
	dusk.sgui.extras.Extra.call(this, owner, name);
	
	/** A string, or array of strings, indicating the name(s) of an effect in the container.
	 *  This effect will start once this is finished.
	 * @type string|array
	 */
	this.then = "";
	/** How long the body of the effect will play, in frames.
	 * @type integer
	 */
	this.duration = 0;
	/** The delay before starting the effect, in frames.
	 * @type integer
	 */
	this.delay = 0;
	
	/** The state of the effect, from 0 to 3, higher numbers indicate later states.
	 * 
	 * - 0: Idle, the effect hasn't started yet.
	 * - 1: Waititng, the effect is counting down until it has started.
	 * - 2: Running, the effect is currently running.
	 * - 3: Ended, the effect has ended and is deleting itself.
	 * 
	 * @type integer
	 * @protected
	 */
	this._state = 0;
	/** The current time in frames remaining when the effect is waiting or running.
	 * 
	 * This can be -1 if the current state is not 1 or 2, or the current state doesn't end.
	 * @type integer
	 * @protected
	 */
	this._left = -1;
	/** An array of all the range triggers, each element is an array with the first element being the range to check,
	 *  the second being the threshold, and the third being -1 (<=), 0 (==) or 1 (>=) indicating how the value needs to 
	 *  relate to the threshold.
	 * @type array
	 * @private
	 */
	this._rangeTriggers = [];
	
	/** If true, then the next frame will start the action.
	 * 
	 * Set when a trigger value of "true" is set.
	 * @type boolean
	 * @private
	 */
	this._autoTrigger = false;
	
	/** Fired when the effect should do one frame of whatever it is doing.
	 * 
	 * While the effect is active, this will be called once per frame.
	 * @type dusk.EventDispatcher
	 * @protected
	 */
	this._tick = new dusk.EventDispatcher("dusk.sgui.extras.Effect._tick");
	/** Fired once when the effect starts, this is after any delay that has been specified.
	 * @type dusk.EventDispatcher
	 * @protected
	 */
	this._onStart = new dusk.EventDispatcher("dusk.sgui.extras.Effect._onStart");
	/** Fired when the event ends, either through running out of time or by someone calling
	 *  `{@link dusk.sgui.extras.Effect#end}`
	 * @type dusk.EventDispatcher
	 * @protected
	 */
	this._onEnd = new dusk.EventDispatcher("dusk.sgui.extras.Effect._onEnd");
	
	//Listeners
	this._owner.frame.listen(this._effectFrame, this);
	this.onDelete.listen(this._effDeleted, this);
	
	//Prop masks
	this._props.map("on", "__on");
	this._props.map("then", "then");
	this._props.map("delay", "delay");
	this._props.map("duration", "duration");
};
dusk.sgui.extras.Effect.prototype = Object.create(dusk.sgui.extras.Extra.prototype);

/** Starts the effect if it has not already been started. */
dusk.sgui.extras.Effect.prototype.start = function() {
	if(this._state > 0) return;
	this._state = 1;
	this._left = this.delay;
};

/** Added to listener triggers, will call `{@link dusk.sgui.extras.Effect#start}`.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.extras.Effect.prototype._startEvent = function(e) {
	this.start();
};

/** Ends the effect, will be called automatically when it ends. */
dusk.sgui.extras.Effect.prototype.end = function() {
	this._state = 3;
	this._onEnd.fire({});
	
	if(this.then) {
		var then = this.then;
		if(typeof this.then == "string") {
			then = [this.then];
		}
		
		for(var i = 0; i < then.length; i ++) {
			if(this._owner.getExtra(this.then[i]) instanceof dusk.sgui.extra.Effect) {
				this._owner.getExtra(this.then[i]).start();
			}
		}
	}
	
	this._owner.removeExtra(this.name);
};

/** Added to the `{@link dusk.sgui.extras.Extra#_onDelete}` listener; removes the frame listener from it's owner.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.extras.Effect.prototype._effDeleted = function(e) {
	this._owner.frame.unlisten(this._effectFrame, this);
};

/** Called every frame by it's owner, this does effect stuff.
 * @param {object} e The event object.
 * @private
 */
dusk.sgui.extras.Effect.prototype._effectFrame = function(e) {
	if(this._autoTrigger) {
		this.start();
	}
	
	if(this._state == 0) {
		for(var i = this._rangeTriggers.length-1; i >= 0; i--) {
			if((this._rangeTriggers[0] >= this._rangeTriggers[1] && (!this._rangeTriggers[2]||this._rangeTriggers[2] == 1))
			|| (this._rangeTriggers[0] == this._rangeTriggers[1] && this._rangeTriggers[2] == 0)
			|| (this._rangeTriggers[0] <= this._rangeTriggers[1] && this._rangeTriggers[2] == -1)) {
				this.start();
			}
		}
	}
	
	if(this._left > 0) {
		this._left --;
	}
	
	if(this._left == 0 && this._state == 1) {
		this._state = 2;
		this._onStart.fire({});
		this._left = this.duration;
		if(this.duration < 0) this._left = -1;
	}
		
	if(this._left > 0 && this._state == 2) {
		this._tick.fire({});
	}
	
	if(this._left == 0 && this._state == 2) {
		this.end();
	}
};

/** Adds a new "trigger" to the effect, indicating a condition in which it should start.
 * 
 * A single trigger is an array, how the trigger works depends on what type the first element is.
 * 
 * - `{@link dusk.EventDispatcher}`: The effect will start when the dispatcher fires.
 * - `{@link dusk.Range}`: When the value reaches a threshold, the first element of the trigger is the range object to
 *  check, the second is the threshold, and the third is -1 (<=), 0 (==) or 1 (>=) indicating how the value needs to 
 *  relate to the threshold.
 * - `true`: If the value is exactly `true`, then the event will trigger on the next frame.
 * - `array`: Each element of the array is considered to be a trigger, and this function will be called on all of them.
 * 
 * This may be used in the JSON representation using the key "on".
 * 
 * @param {array} A trigger as described above.
 */
dusk.sgui.extras.Effect.prototype.addTrigger = function(trigger) {
	if(Array.isArray(trigger[0])) {
		for(var i = trigger.length-1; i >= 0; i --) {
			this.addTrigger(trigger[i]);
		}
		
		return;
	}
	
	if(trigger[0] instanceof dusk.EventDispatcher) {
		trigger[i].listen(this._startEvent, this);
	}else if(trigger[0] instanceof dusk.Range) {
		this._rangeTriggers.push(trigger);
	}else if(trigger === true) {
		this._autoTrigger = true;
	}
};
Object.defineProperty(dusk.sgui.extras.Effect.prototype, "__on", {
	set: function(value) {
		this.addTrigger(value);
	},
	
	get: function() {
		return undefined;
	}
});

Object.seal(dusk.sgui.extras.Effect);
Object.seal(dusk.sgui.extras.Effect.prototype);
