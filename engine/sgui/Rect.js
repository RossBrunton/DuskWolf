//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Rect", function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	
	/** Creates a new Rect.
	 * 
	 * @param {dusk.sgui.Component} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * 
	 * @class dusk.sgui.Rect
	 * 
	 * @classdesc A simple rectangle.
	 * 	It sets all the area specified by it's `height` and `width`,
	 *  and colours it in a single colour with an optional border.
	 * 
	 * @extends dusk.sgui.Component
	 * @constructor
	 */
	var Rect = function (parent, name) {
		Component.call(this, parent, name);

		/** The colour of the rectangle.
		 * @type string
		 * @default "#eeeeee"
		 */
		this.colour = "#eeeeee";
		/** The colour of the border.
		 * @type string
		 * @default "#cccccc"
		 */
		this.bColour = "#cccccc";
		/** The thickness of the rectangle border.
		 * 	If 0, there will be no border.
		 * @type float
		 * @default 0
		 */
		this.bWidth = 0;
		/** A radius, if this is nonzero this will be the radius of the rectangle's corners.
		 * @type integer
		 * @default 0
		 * @since 0.0.21-alpha
		 */
		this.radius = 0;
		
		//Prop masks
		this._mapper.map("colour", "colour");
		this._mapper.map("color", "colour");
		this._mapper.map("bColour", "bColour");
		this._mapper.map("bColor", "bColour");
		this._mapper.map("bWidth", "bWidth");
		this._mapper.map("radius", "radius");
		
		//Listeners
		this.onPaint.listen(this._rectDraw.bind(this));
	};
	Rect.prototype = Object.create(Component.prototype);
	
	/** A draw handler which draws the rectangle.
	 * @param {object} e A draw event.
	 * @private
	 */
	Rect.prototype._rectDraw = function(e) {
		e.c.fillStyle = this.colour;
		e.c.strokeStyle = this.bColour;
		e.c.lineWidth = this.bWidth;
		
		this._fill(e, this.bWidth != 0, this.colour == "");
	};
	
	/** Does the rectangle thing, for use in subclasses. Will draw the rectangle, but not set any of the styles.
	 * @param {object} e A draw event, it doesn't have to be the.sliceal one.
	 * @protected
	 * @since 0.0.21-alpha
	 */
	Rect.prototype._fill = function(e, border, noFill) {
		if(this.radius) {
			e.c.beginPath();
			
			e.c.moveTo(e.d.dest.x + this.radius, e.d.dest.y);
			e.c.lineTo(e.d.dest.x + e.d.slice.width - this.radius, e.d.dest.y);
			e.c.quadraticCurveTo(
				e.d.dest.x + e.d.slice.width, e.d.dest.y, e.d.dest.x + e.d.slice.width, e.d.dest.y + this.radius
			);
			
			e.c.lineTo(e.d.dest.x + e.d.slice.width, e.d.dest.y + e.d.slice.height - this.radius);
			e.c.quadraticCurveTo(
				e.d.dest.x + e.d.slice.width, e.d.dest.y + e.d.slice.height, e.d.dest.x + e.d.slice.width - this.radius,
				e.d.dest.y+e.d.slice.height
			);
			
			e.c.lineTo(e.d.dest.x + this.radius, e.d.dest.y + e.d.slice.height);
			e.c.quadraticCurveTo(
				e.d.dest.x, e.d.dest.y + e.d.slice.height, e.d.dest.x, e.d.dest.y + e.d.slice.height - this.radius
			);
			
			e.c.lineTo(e.d.dest.x, e.d.dest.y + this.radius);
			e.c.quadraticCurveTo(e.d.dest.x, e.d.dest.y, e.d.dest.x + this.radius, e.d.dest.y);
			e.c.closePath();
			
			if(!noFill) e.c.fill();
			if(border) e.c.stroke();
		}else{
			if(!noFill) e.c.fillRect(e.d.dest.x, e.d.dest.y, e.d.slice.width, e.d.slice.height);
			if(border) e.c.strokeRect(e.d.dest.x, e.d.dest.y, e.d.slice.width, e.d.slice.height);
		}
	};
	
	sgui.registerType("Rect", Rect);
	
	return Rect;
});
