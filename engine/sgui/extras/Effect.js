//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.Effect", function() {
	var Extra = load.require("dusk.sgui.extras.Extra");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var Range = load.require("dusk.utils.Range");
	
	/** An effect is a type of extra that does the following:
	 * 
	 * - Stays idle until it is triggered.
	 * - When triggered, waits a specified number of frames.
	 * - Then does something (an effect, like fading in or out, or moving) for a specified number of frames.
	 * - Then deletes itself.
	 * 
	 * This class does nothing on its own, it is expected that other subclasses of this provide the actual effects.
	 * They should use the `_tick}`, `_onStart}` and `_onEnd}` handlers to act.
	 * 
	 * See the `addTrigger` function to see how to automatically trigger an effect.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Extra
	 * @since 0.0.18-alpha
	 * @memberof dusk.sgui.extras
	 */
	class Effect extends Extra {
		/** Creates a new Effect.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			/** A string, or array of strings or functions, indicating the name(s) of an effect in the owner which will
			 *  start once or a functino to call when this is finished.
			 * @type string|function()|array<string|function()>
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this.then = "";
			/** How long the body of the effect will play, in frames.
			 * @type integer
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this.duration = 0;
			/** The delay before starting the effect, in frames.
			 * @type integer
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this.delay = 0;
			/** If true, then the effect won't be deleted once it's finished.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this.noDelete = false;
			
			/** The state of the effect, from 0 to 3, higher numbers indicate later states.
			 * 
			 * - 0: Idle, the effect hasn't started yet.
			 * - 1: Waititng, the effect is counting down until it starts.
			 * - 2: Running, the effect is currently running.
			 * - 3: Ended, the effect has ended and is deleting itself.
			 * 
			 * @type integer
			 * @protected
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._state = 0;
			/** The current time in frames remaining when the effect is waiting or running.
			 * 
			 * This can be -1 if the current state is not 1 or 2, or the current state doesn't end.
			 * @type integer
			 * @protected
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._left = -1;
			/** If true, then the next time the effect runs, its "then" properties won't be processed.
			 * @type boolean
			 * @since 0.0.21-alpha
			 * @private
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._stopLoop = false;
			
			/** An array of all the range triggers, each element is an array with the first element being the range to
			 *  check, the second being the threshold, and the third being -1 (<=), 0 (==) or 1 (>=) indicating how the
			 *  value needs to relate to the threshold.
			 * @type array
			 * @private
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._rangeTriggers = [];
			/** An array of all the promise functions that have been assigned to this effect.
			 * @type array<function(*):*>
			 * @private
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._promiseFns = [];
			/** An array of all the promise functions that have been assigned to the effect chain.
			 * @type array<function(*):*>
			 * @private
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._promiseChainFns = [];
			
			/** If true, then the next frame will start the action.
			 * 
			 * Set when a trigger value of "true" is set.
			 * @type boolean
			 * @private
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._autoTrigger = false;
			
			/** The id of the "frame" listener, so it can be removed.
			 * @type integer
			 * @private
			 * @since 0.0.20-alpha
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._effectFrameId = 0;
			/** Event IDs, as `[listener, id]` pairs so they can be removed.
			 * @type array<array>
			 * @private
			 * @since 0.0.21-alpha
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._eventIds = [];
			
			/** Fired when the effect should do one frame of whatever it is doing.
			 * 
			 * While the effect is active, this will be called once per frame.
			 * @type dusk.utils.EventDispatcher
			 * @protected
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._tick = new EventDispatcher("dusk.sgui.extras.Effect._tick");
			/** Fired once when the effect starts, this is after any delay that has been specified.
			 * @type dusk.utils.EventDispatcher
			 * @protected
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._onStart = new EventDispatcher("dusk.sgui.extras.Effect._onStart");
			/** Fired when the event ends, either through running out of time or by someone calling
			 *  `{@link dusk.sgui.extras.Effect#end}`
			 * @type dusk.utils.EventDispatcher
			 * @protected
			 * @memberof! dusk.sgui.extras.Effect#
			 */
			this._onEnd = new EventDispatcher("dusk.sgui.extras.Effect._onEnd");
			
			//Listeners
			this._effectFrameId = this._owner.frame.listen(this._effectFrame.bind(this));
			this.onDelete.listen(this._effectDeleted.bind(this));
			
			//Prop masks
			this._props.map("on", [function() {return undefined;}, this.addTrigger]);
			this._props.map("then", "then");
			this._props.map("delay", "delay");
			this._props.map("duration", "duration");
			this._props.map("noDelete", "noDelete");
		}
		
		/** Starts the effect if it has not already been started.
		 * @param {boolean=} chain If true, then the promise that this function will return resolves once the entire
		 *  chain (following "then" effects) is resolved, rather than just this effect. Default is false.
		 * @return {Promise<dusk.sgui.Component|array<dusk.sgui.Component>>} A promise that resolves when either this effect
		 *  resolves, or all following effects resolve.
		 */
		start(chain) {
			return new Promise((function(fulfill, reject) {
				if(this._state > 0) return;
				this._state = 1;
				this._left = this.delay;
				if(chain) {
					this._promiseChainFns.push(fulfill);
				}else{
					this._promiseFns.push(fulfill);
				}
			}).bind(this));
		}
		
		/** Added to listener triggers, will call `{@link dusk.sgui.extras.Effect#start}`.
		 * @param {object} e The event object.
		 * @private
		 */
		_startEvent(e) {
			this.start();
		}
		
		/** Ends the effect, will be called automatically when it ends. */
		end() {
			this._state = 3;
			this._onEnd.fire();
			
			if(this.then) {
				var then = this.then;
				if(!Array.isArray(then)) {
					then = [this.then];
				}
				
				var pfuncts = [];
				if(!this._stopLoop) {
					for(var t of then) {
						if(this._owner.getExtra(t) instanceof Effect) {
							pfuncts.push(this._owner.getExtra(t).start(true));
						}else if("call" in t) {
							t(this._owner);
						} 
					}
				}
				
				var chainFns = this._promiseChainFns;
				Promise.all(pfuncts).then(function(o) {
					for(p of chainFns) {
						p(o);
					}
				});
			}else{
				for(var p of this._promiseChainFns) {
					p([this._owner]);
				}
			}
			
			for(var p of this._promiseFns) {
				p(this._owner);
			}
			
			if(this.noDelete) {
				this._state = 0;
				this._promiseFns = [];
				this._promiseChainFns = [];
			}else{
				this._owner.removeExtra(this.name);
			}
			
			this._stopLoop = false;
		}
		
		/** The next time this effect ends, it will not call the "then" effects or functions.
		 * 
		 * Usefull for terminating loops.
		 */
		stopLoop() {
			this._stopLoop = true;
		}
		
		/** Added to the `{@link dusk.sgui.extras.Extra#_onDelete}` listener; removes the frame listener from it's owner.
		 * @param {object} e The event object.
		 * @private
		 */
		_effectDeleted(e) {
			this._owner.frame.unlisten(this._effectFrameId);
			for(id of this._eventIds) {
				id[0].unlisten(id[1]);
			}
		}
		
		/** Called every frame by it's owner, this does effect stuff.
		 * @param {object} e The event object.
		 * @private
		 */
		_effectFrame(e) {
			if(this._autoTrigger) {
				this.start();
			}
			
			if(this._state == 0) {
				// Waiting, looking for triggers
				for(var i = this._rangeTriggers.length-1; i >= 0; i--) {
					if((this._rangeTriggers[0] >= this._rangeTriggers[1]
						&& (!this._rangeTriggers[2]||this._rangeTriggers[2] == 1)
					)
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
				// Effect started
				this._state = 2;
				this._onStart.fire();
				this._left = this.duration;
				if(this.duration < 0) this._left = -1;
			}
				
			if(this._left != 0 && this._state == 2) {
				// Effect running
				this._tick.fire();
			}
			
			if(this._left == 0 && this._state == 2) {
				// Effect ended
				this.end();
			}
		}
		
		/** Adds a new "trigger" to the effect, indicating a condition in which it should start.
		 * 
		 * A single trigger is an array, how the trigger works depends on what type the first element is.
		 * 
		 * - `{@link dusk.utils.EventDispatcher}`: The effect will start when the dispatcher fires.
		 * - `{@link dusk.utils.Range}`: When the value reaches a threshold, the first element of the trigger is the range
		 *  object to check, the second is the threshold, and the third is -1 (<=), 0 (==) or 1 (>=) indicating how the
		 *  value needs to relate to the threshold.
		 * - `Promise`: The effect will start when this promise resolves.
		 * - `true`: If the value is exactly `true`, then the event will trigger on the next frame.
		 * - `array`: Each element of the array is considered to be a trigger, and this function will be called on all of
		 *  them.
		 * 
		 * This may be used in the JSON representation using the key "on".
		 * 
		 * @param {dusk.utils.EventDispatcher|dusk.utils.Range|boolean|array} trigger A trigger as described above.
		 */
		addTrigger(trigger) {
			if(Array.isArray(trigger[0])) {
				for(var i = trigger.length-1; i >= 0; i --) {
					this.addTrigger(trigger[i]);
				}
				
				return;
			}
			
			if(trigger[0] instanceof EventDispatcher) {
				this._eventIds.push([trigger[0], trigger[0].listen(this._startEvent.bind(this))]);
			}else if(trigger[0] instanceof Range) {
				this._rangeTriggers.push(trigger);
			}else if(trigger[0] instanceof Promise) {
				trigger[0].then(this._startEvent.bind(this));
			}else if(trigger === true) {
				this._autoTrigger = true;
			}
		}
	}
	
	return Effect;
});
