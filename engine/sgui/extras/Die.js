//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.Die", (function() {
	var Effect = load.require("dusk.sgui.extras.Effect");
	var sgui = load.require("dusk.sgui");
	
	/** @class dusk.sgui.extras.Die
	 * 
	 * @classdesc Simply removes the component this is attached to when the delay is over.
	 * 
	 * This can be used by the `{@link dusk.sgui.extras.Effect#next}` parameter of another effect to remove the component
	 *  when an effect ends, or to remove a component after a specified time.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Effect
	 * @since 0.0.18-alpha
	 * @constructor
	 */
	var Die = function(owner, name) {
		Effect.call(this, owner, name);
		
		//Listeners
		this._onStart.listen(function(e){this._owner.deleted = true;}.bind(this));
	};
	Die.prototype = Object.create(Effect.prototype);
	
	sgui.registerExtra("Die", Die);
	
	return Die;
})());
