//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");

dusk.load.provide("dusk.sgui.Rect");

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
dusk.sgui.Rect = function (parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);

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
	
	//Prop masks
	this._registerPropMask("colour", "colour", true);
	this._registerPropMask("color", "colour", true);
	this._registerPropMask("bColour", "bColour", true);
	this._registerPropMask("bColor", "bColour", true);
	this._registerPropMask("bWidth", "bWidth", true);
	
	//Listeners
	this.prepareDraw.listen(this._rectDraw, this);
	
	//Render support
	this.renderSupport =
	 dusk.sgui.Component.REND_LOCATION | dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
};
dusk.sgui.Rect.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.Rect.prototype.className = "Rect";

/** A draw handler which draws the rectangle.
 * @param {CanvasRenderingContext2D} c A 2D canvas perspective to draw onto.
 * @private
 */
dusk.sgui.Rect.prototype._rectDraw = function(e) {
	e.c.fillStyle = this.colour;
	e.c.strokeStyle = this.bColour;
	e.c.lineWidth = this.bWidth;
	
	e.c.fillRect(e.d.destX, e.d.destY, e.d.width, e.d.height);
	if(this.bWidth) e.c.strokeRect(e.d.destX, e.d.destY, e.d.width, e.d.height);
};

Object.seal(dusk.sgui.Rect);
Object.seal(dusk.sgui.Rect.prototype);

dusk.sgui.registerType("Rect", dusk.sgui.Rect);
