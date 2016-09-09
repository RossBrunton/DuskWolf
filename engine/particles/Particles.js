//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.particles", function() {
	/** This namespace manages particle animations.
	 *
	 * TODO: Document me!
	 * @memberof dusk
	 * @namespace
	 */
	var particles = {};
	
	/** This action (for AnimatedTiles) will perform a particle effect on the given field. This will not wait until the
	 * effect is over before going on to the next action.
	 * 
	 * @param {dusk.particles.sgui.ParticleField} The field on which to inject the effect.
	 * @param {object|function(object, dusk.tiles.sgui.Tile):object} The object settings for the effect. If it is a
	 *  function it will be called with the animation state and tile.
	 * @param {?string} name The name of the particle effect to perform. 
	 * @return {object} An animation action.
	 */
	particles.animation = function(field, data, name) {
		return function(state, owner) {
			var lfield = field;
			var ldata = data;
			var lname = name;
			if(typeof field == "function") lfield = field(state, owner);
			if(typeof data == "function") ldata = data(state, owner);
			if(lname === undefined) lname = ldata.name;
			
			lfield.applyEffect(lname, ldata);
		};
	};
	
	return particles;
});
