//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.Die", function() {
	var Effect = load.require("dusk.sgui.extras.Effect");
	var sgui = load.require("dusk.sgui");
	
	/** Simply removes the component this is attached to when the delay is over.
	 * 
	 * This can be used by the `{@link dusk.sgui.extras.Effect#next}` parameter of another effect to remove the component
	 *  when an effect ends, or to remove a component after a specified time.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Effect
	 * @memberof dusk.sgui.extras
	 * @since 0.0.18-alpha
	 */
	class Die extends Effect {
		/** Creates a new Die effect.
		 * 
		 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
		 * @param {string} name This extra's name.
		 */
		constructor(owner, name) {
			super(owner, name);
			
			//Listeners
			this._onStart.listen(function(e){this._owner.deleted = true;}.bind(this));
		}
	}
	
	sgui.registerExtra("Die", Die);
	
	return Die;
});
