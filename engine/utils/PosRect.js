//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.PosRect", (function() {
	var utils = load.require("dusk.utils");
	var dusk = load.require("dusk");
	var Pool = load.require("dusk.utils.Pool");
	
	/** A position rectangle stores a rectangle, and it's x,y position.
	 * 
	 * Unless you intend to use only one PosRect, you should use the `pool` property of this class to manage them.
	 * 
	 * When you use the `setXY` or `setWH` methods of the PosRect, all the properties are updated.
	 * 
	 * @since 0.0.14-alpha
	 * @constructor
	 */
	var PosRect = function() {
		/** The x coordinate of the rectangle.
		 * @type integer
		 */
		this.x = 0;
		/** The y coordinate of the rectangle.
		 * @type integer
		 */
		this.y = 0;
		
		/** The end x coordinate (i.e. the right) of the rectangle.
		 * @type integer
		 */
		this.ex = 0;
		/** The end y coordinate (i.e. the bottom) of the rectangle.
		 * @type integer
		 */
		this.ey = 0;
		
		/** The width of the rectangle.
		 * @type integer
		 */
		this.width = 0;
		/** The height of the rectangle.
		 * @type integer
		 */
		this.height = 0;
	};
	
	/** Uses the upper values of the x and y coordinates to set all the properties of the rectangle.
	 * @param {integer} x The left x coordinate of the rectangle.
	 * @param {integer} y The top y coordinate of the rectangle.
	 * @param {integer} ex The right x coordinate of the rectangle.
	 * @param {integer} ey The bottom y coordinate of the rectangle.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.setXY = function(x, y, ex, ey) {
		this.x = ~~x;
		this.y = ~~y;
		
		this.ex = ~~ex;
		this.ey = ~~ey;
		
		this.width = ex - x;
		this.height = ey - y;
		
		return this;
	};
	
	/** Uses the width and height to set all the properties of the rectangle.
	 * @param {integer} x The left x coordinate of the rectangle.
	 * @param {integer} y The top y coordinate of the rectangle.
	 * @param {integer} width The width of the rectangle.
	 * @param {integer} height The height of the rectangle.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.setWH = function(x, y, width, height) {
		this.x = ~~x;
		this.y = ~~y;
		
		this.width = ~~width;
		this.height = ~~height;
		
		this.ex = this.x + this.width;
		this.ey = this.y + this.height;
		
		return this;
	};
	
	/** Moves the PosRect the given amount.
	 * @param {integer} x The value to shift the x coordinate.
	 * @param {integer} y The value to shift the y coordinate.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.shift = function(x, y) {
		this.x += ~~x;
		this.y += ~~y;
		
		this.ex += ~~x;
		this.ey += ~~y;
		
		return this;
	};
	
	/** Moves the PosRect to the given coordinates.
	 * @param {integer} x The x value to go to.
	 * @param {integer} y The y value to go to.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.shiftTo = function(x, y) {
		this.x = ~~x;
		this.y = ~~y;
		
		this.ex = ~~x + this.width;
		this.ey = ~~y + this.height;
		
		return this;
	};
	
	/** Resizes the PosRect.
	 * @param {integer} width The new width.
	 * @param {integer} height The new height.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.sizeTo = function(width, height) {
		this.width = ~~width;
		this.height = ~~height;
		
		this.ex = this.x + ~~width;
		this.ey = this.y + ~~height;
		
		return this;
	};
	
	/** Sets the size of the 
	 * @param {integer} x The value to add to the width.
	 * @param {integer} y The value to add to the height.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.size = function(width, height) {
		this.width += ~~width;
		this.height += ~~height;
		
		this.ex += ~~width;
		this.ey += ~~height;
		
		return this;
	};
	
	/** Resizes the PosRect, but reduces it's size from the left/top, rather than the right/bottom.
	 * 
	 * This means that the right and bottom sides do not move.
	 * @param {integer} x The value to add to the width.
	 * @param {integer} y The value to add to the height.
	 * @return {dusk.utils.PosRect} This object.
	 */ 
	PosRect.prototype.startSize = function(width, height) {
		this.width += ~~width;
		this.height += ~~height;
		
		this.x -= ~~width;
		this.y -= ~~height;
		
		return this;
	};
	
	/** Returns a string representation of this PosRect.
	 * @return {string} A description of this.
	 */
	PosRect.prototype.toString = function() {
		return "[PosRect "+this.x+","+this.y+" "+this.width+"x"+this.height+"]";
	};
	
	/** Returns true if both rectangles are equal (have the same width, height, x and y).
	 * @param {PosRect} b The other rectangle.
	 * @return {boolean} Whether this and b are equal.
	 */
	PosRect.prototype.equals = function(b) {
		return this.x == b.x && this.y == b.y && this.width == b.width && this.height == b.height;
	}
	
	/** A pool containing PosRects.
	 * 
	 * @type dusk.utils.Pool<PosRect>
	 */
	PosRect.pool = new Pool(PosRect);
	
	return PosRect;
})());
