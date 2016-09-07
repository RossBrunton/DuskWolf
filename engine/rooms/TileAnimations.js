//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.tileAnimations", function() {
	var particleAnimation = load.require("dusk.particles.particleAnimation");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	
	var tileAnimations = {};
	
	/** This action (for AnimatedTiles) will perform a particle effect on the given field. This will not wait until the
	 * effect is over before going on to the next action.
	 * 
	 * @param {dusk.particles.sgui.ParticleField} The field on which to inject the effect.
	 * @param {object|function(object, dusk.tiles.sgui.Tile):object} The object settings for the effect. If it is a
	 *  function it will be called with the animation state and tile.
	 * @param {?string} name The name of the particle effect to perform. 
	 * @return {object} An animation action.
	 */
	tileAnimations.particle = function(bm, data, name) {
		return function(state, tile) {
			return particleAnimation(bm.getFirstLayerOfType(LayeredRoom.LAYER_PARTICLES), data, name)(state, tile);
		};
	};
	
	return tileAnimations;
});
