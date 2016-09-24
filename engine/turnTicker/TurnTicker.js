//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.TurnTicker", function() {
	/** Turn tickers allow LayeredStats instances (or just functions) to call one after the other, taking
	 *  turns.
	 * 
	 * The turn ticker calls a function which returns a promise which fulfills when the turn is over. Once that is
	 *  fulfilled, the next turn is taken in the same way, untill all the turns are over, and then it starts again.
	 * 
	 * The order of the turns is one of the `dusk.TurnTicker.ORDER_*` constants on this class. This determines the order
	 *  the turns occur in.
	 * 
	 * The functions to call for each turn are registered using `{@link dusk.TurnTicker#register}` and removed using
	 *  `{@link dusk.TurnTicker#remove}` (when whatever should be taking that turn no longer can do so). The turn ticker
	 *  won't actually start anything unless `{@link dusk.TurnTicker#start}` is called.
	 * 
	 * If the turn promise rejects, then the function that created it is removed. If there are no turn takers left, then
	 *  the promise that `{@link dusk.TurnTicker#start}` returns fulfills with the value `true`. If
	 *  `{@link dusk.TurnTicker#stop}` is used to stop it, the promise fulfills with `false`.
	 * 
	 * 
	 * @since 0.0.21-alpha
	 * @memberof dusk
	 */
	class TurnTicker {
		/** Creates a new turn ticker
		 * 
		 * @param {int=} order How the turn order is decided. One of the `dusk.TurnTicker.ORDER_` constants.
		 *  Defaults to order added.
		 * @since 0.0.21-alpha
		 */
		constructor(order) {
			/** The turn order. Value is one of the `dusk.TurnTicker.ORDER_*` constants.
			 * @type int
			 * @memberof! dusk.TurnTicker#
			 */
			this.order = order?order:TurnTicker.ORDER_ADDED;
			
			/** The turn takers, in the order that the turns will be taken.
			 * Each entry is an array of the form `[name, onTurn, orderObj]` as `{@link dusk.TurnTicker#register}`.
			 * @type array
			 * @private
			 * @memberof! dusk.TurnTicker#
			 */
			this._turnables = [];
			/** The ID of the currently active turn.
			 * @type int
			 * @private
			 * @memberof! dusk.TurnTicker#
			 */
			this._turn = 0;
			/** True if `{@link stop}` has been called, and after this turn the turns will stop ticking.
			 * @private
			 * @memberof! dusk.TurnTicker#
			 */
			this._stop = false;
		}
		
		/** Registers a new turn function, essentially adding something that can take a turn to the ticker.
		 * @param {string} name The name of the term to add, must be unique.
		 * @param {function(dusk.TurnTicker):Promise(*)} onTurn The function to call when it's its turn. Should return a
		 *  promise that fulfills when the turn is over.
		 * @param {?*} orderObj An order object used to determine turn order. It's type depends on the order system.
		 * @return {Promise(boolean)} A promise that fulfills to true when the turn has been successfully added.
		 */
		register(name, onTurn, orderObj) {
			this._turnables.push([name, onTurn, orderObj]);
			return this.ensureOrder();
		}
		
		/** Removes a turn taker.
		 * @param {string} name The name of the turn function to remove.
		 * @return {Promise(true)} A promise that fulfills to true when the turn has been removed.
		 */
		remove(name) {
			return new Promise((function(fulfill, reject) {
				for(var i = 0; i < this._turnables.length; i ++) {
					if(this._turnables[i][0] == name) {
						this._removeById(i);
						break;
					}
				}
				
				fulfill(true);
			}).bind(this));
		}
		
		/** Removes a turn taker by it's index. If the current turn is higher than the id, it decreses it so the next turn stays
		 *  the same.
		 * @param {integer} id The ID to remove.
		 * @private
		 */
		_removeById(id) {
			this._turnables.splice(id, 1);
			if(this._turn > id) this._turn --;
		}
		
		/** Ensures the order of the turn takers, called automatically when a turn function is added, but should be called
		 *  manually if the turn order may change later.
		 * @return {Promise(boolean)} A promise that resolves to true when the order has been reset.
		 */
		ensureOrder() {
			return new Promise((function(fulfill, reject) {
				if(this.order == TurnTicker.ORDER_ADDED) {
					// Do nothing
					fulfill(true);
				}
			}).bind(this));
		}
		
		/** Starts the turn ticker, calling the first taker.
		 * @return {Promise(boolean)} A promise that resolves when turns stop being taken.
		 */
		start() {
			this._turn = -1;
			this._stop = false;
			
			return new Promise((function(fulfill, reject) {
				this._next(fulfill);
			}).bind(this));
		}
		
		/** Stops a currently running taker at the end of the current turn.
		 */
		stop() {
			this._stop = true;
		}
		
		/** Called automaticaly when a turn ends, and starts the next one.
		 * @param {function(boolean)} fulfill The function to call when the turn ticker is to stop.
		 * @private
		 */
		_next(fulfill) {
			if(!this._turnables.length) fulfill(true);
			if(this._stop) fulfill(false);
			
			this._turn = (this._turn + 1) % this._turnables.length;
			this._turnables[this._turn][1](this)
			.then(this._next.bind(this, fulfill))
			.catch((function(e) {this._removeById(this._turn); this._next(fulfill);}).bind(this));
		}
		
		/** Returns the number of turn takers registered.
		 * @return {integer} How many turn takers have been registered.
		 */
		length() {
			return this._turnables.length;
		}

		/** Returns a string representation of this object.
		 * @return {string} A string representation of this object.
		 */
		toString() {
			return "[TurnTaker]";
		}
	}
	
	/** Turn ticker order that takes the turn in the order the takers were added, without doing anything fancy.
	 * @type integer
	 * @default 0
	 * @constant
	 */
	TurnTicker.ORDER_ADDED = 0;
	
	return TurnTicker;
});
