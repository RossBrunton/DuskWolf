//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Effect");

dusk.load.provide("dusk.sgui.extras.Die");

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
dusk.sgui.extras.Die = function(owner, name) {
	dusk.sgui.extras.Effect.call(this, owner, name);
	
	//Listeners
	this._onStart.listen(function(e){this._owner.deleted = true;}, this);
};
dusk.sgui.extras.Die.prototype = Object.create(dusk.sgui.extras.Effect.prototype);

Object.seal(dusk.sgui.extras.Die);
Object.seal(dusk.sgui.extras.Die.prototype);

dusk.sgui.registerExtra("Die", dusk.sgui.extras.Die);
