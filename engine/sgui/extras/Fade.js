//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.Fade", function() {
	var Range = load.require("dusk.utils.Range");
	var Effect = load.require("dusk.sgui.extras.Effect");
	var sgui = load.require("dusk.sgui");
	
	/** @class dusk.sgui.extras.Fade
	 * 
	 * @classdesc A fade effect fades it's component from one alpha value to another over it's duration.
	 * 
	 * It fades from the `{@link dusk.sgui.extras.Fade#from}` value to the `{@link dusk.sgui.extras.Fade#to}` value over
	 *  a time of `{@link dusk.sgui.extras.Effect#duration}`.
	 * 
	 * When this effect stats, it sets the components alpha to the `from` value, and likewise when it ends (even
	 *  manually) it will set the alpha to the `to` value.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Effect
	 * @since 0.0.18-alpha
	 * @constructor
	 */
	var Fade = function(owner, name) {
		Effect.call(this, owner, name);
		
		/** The original value that this starts from.
		 * @type float
		 * @default 0.0
		 */
		this.from = 0.0;
		/** The alpha value that this will end up with.
		 * @type float
		 * @default 1.0
		 */
		this.to = 1.0;
		/** The range used internally to switch between the two values.
		 * @type dusk.utils.Range
		 * @private
		 */
		this._range = null;
		/** Whether the value of the range should go up or down.
		 * @type boolean
		 * @private
		 */
		this._decreasing = false;
		
		//Listeners
		this._tick.listen(this._fdeOnTick.bind(this));
		this._onStart.listen(this._fdeOnStart.bind(this));
		this._onEnd.listen(this._fdeOnEnd.bind(this));
		
		//Prop masks
		this._props.map("from", "from");
		this._props.map("to", "to");
	};
	Fade.prototype = Object.create(Effect.prototype);
	
	/** Used internally to start the effect.
	 * @private
	 */
	Fade.prototype._fdeOnStart = function(e) {
		if(this.from > this.to) {
			this._range = new Range(this.to, this.from, this.from);
			this._range.setDownFraction(1/this.duration);
			this._decreasing = true;
		}else{
			this._range = new Range(this.from, this.to, this.from);
			this._range.setUpFraction(1/this.duration);
			this._decreasing = false;
		}
	};
	
	/** Used internally to do a single tick of the effect.
	 * @private
	 */
	Fade.prototype._fdeOnTick = function(e) {
		if(this._decreasing) {
			this._range.down();
		}else{
			this._range.up();
		}
		this._owner.alpha = this._range.value;
	};
	
	/** Used internally once the effect has ended to set the end alpha correctly.
	 * @private
	 */
	Fade.prototype._fdeOnEnd = function(e) {
		this._owner.alpha = this.to;
	};
	
	sgui.registerExtra("Fade", Fade);
	
	return Fade;
});
