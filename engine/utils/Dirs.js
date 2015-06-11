//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.dirs", (function() {
	/** This namespace contains constants and functions representing and manipulating directions.
	 * 
	 * This contains the constants `N`, `S`, `E`, `W`, `U`, `D` and `NONE`. Representing north, south, east, west, up,
	 * down and "no direction". These constants are integers and capable of being used in a bitmask.
	 * 
	 * @since 0.0.21-alpha
	 */
	var dirs = {
		"NONE":0x1,
		"N":0x2,
		"S":0x4,
		"E":0x8,
		"W":0x10,
		"U":0x20,
		"D":0x40,
	};
	
	/** An array of all the direction constants.
	 * @type array<integer>
	 */
	dirs.arr = [dirs.NONE, dirs.N, dirs.S, dirs.E, dirs.W, dirs.U, dirs.D];
	
	/** Reverses a direction; north becomes south, east becomes west and up becomes down or vice versia. NONE reverses
	 * to NONE.
	 * @param {integer} dir The direction to invert.
	 * @return {integer} The inverted direction.
	 */
	dirs.invertDir = function(dir) {
		if(dir == dirs.N) return dirs.S;
		if(dir == dirs.S) return dirs.N;
		if(dir == dirs.E) return dirs.W;
		if(dir == dirs.W) return dirs.E;
		if(dir == dirs.D) return dirs.U;
		if(dir == dirs.U) return dirs.D;
		if(dir == dirs.NONE) return dirs.NONE;
		throw new TypeError(dir+" is not a valid direction");
	};
	
	/** Given an x, y, z coordinate and a direction, returns the coordinates from moving one in that direction.
	 * @param {integer} x The x coordinate.
	 * @param {integer} y The y coordinate.
	 * @param {integer} z The z coordinate.
	 * @param {integer} dir The direction to travel.
	 * @param {integer=1} n The number of units to travel.
	 * @return {array<integer>} An `[x, y, z]` triplet representing the destination.
	 */
	dirs.translateDir = function(x, y, z, dir, n) {
		if(n === undefined) n = 1;
		
		if(dir == dirs.N) return [x, y-n, z];
		if(dir == dirs.S) return [x, y+n, z];
		if(dir == dirs.E) return [x+n, y, z];
		if(dir == dirs.W) return [x-n, y, z];
		if(dir == dirs.D) return [x, y, z-n];
		if(dir == dirs.U) return [x, y, z+n];
		if(dir == dirs.NONE) return [x, y, z];
		throw new TypeError(dir+" is not a valid direction");
	};
	
	/** Given two sets of x, y, z coordinates, returns either the direction taken.
	 * @param {integer} ox The original x coordinate.
	 * @param {integer} oy The original y coordinate.
	 * @param {integer} oz The original z coordinate.
	 * @param {integer} dx The destination x coordinate.
	 * @param {integer} dy The destination y coordinate.
	 * @param {integer} dz The destination z coordinate.
	 * @param {integer=1} n The number of units to travel.
	 * @return {integer} The direction taken, or `NONE` if it couldn't be found.
	 */
	dirs.findDir = function(ox, oy, oz, dx, dy, dz, n) {
		if(n === undefined) n = 1;
		
		if(ox + n == dx && oy == dy && oz == dz) return dirs.E;
		if(ox - n == dx && oy == dy && oz == dz) return dirs.W;
		if(ox == dx && oy + n == dy && oz == dz) return dirs.S;
		if(ox == dx && oy - n == dy && oz == dz) return dirs.N;
		if(ox == dx && oy == dy && oz + n == dz) return dirs.U;
		if(ox == dx && oy == dy && oz - n == dz) return dirs.D;
		
		return dirs.NONE;
	};
	
	/** Returns a single character which is an arrow facing in the given direction.
	 * 
	 * The direction NONE returns ".", U returns "o" and D returns "x". All others return unicode arrows.
	 * @param {integer} dir The direction.
	 * @return {string} An arrow for this direction.
	 */
	dirs.toArrow = function(dir) {
		if(dir == dirs.N) return "\u2191";
		if(dir ==dirs.S) return "\u2193";
		if(dir == dirs.E) return "\u2192";
		if(dir == dirs.W) return "\u2190";
		if(dir == dirs.D) return "x";
		if(dir == dirs.U) return "o";
		if(dir == dirs.NONE) return ".";
		return "?";
	};
	
	return dirs;
})());
