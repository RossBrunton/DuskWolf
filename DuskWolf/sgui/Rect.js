//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.sgui.Rect");

/** Creates a new Rect.
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * 
 * @class dusk.sgui.Rect
 * 
 * @classdesc A simple rectangle.
 * 	It sets all the area specified by it's `height` and `width`, and colours it in a single colour with an optional border.
 * 
 * @extends dusk.sgui.Component
 */
dusk.sgui.Rect = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
	
		/** The colour of the rectangle.
		 * The default value depends on the theme value "box".
		 * 
		 * @type string
		 * @memberof dusk.sgui.Rect
		 */
		this.colour = this._theme("box");
		/** The colour of the border.
		 * The default value depends on the theme value "border".
		 * 
		 * @type string
		 * @memberof dusk.sgui.Rect
		 */
		this.bColour = this._theme("border");
		/** The thinkness of the rectangle border.
		 * 	If 0, there will be no border.
		 * @default 1
		 * @type number
		 * @memberof dusk.sgui.Rect
		 */
		this.bWidth = 1;
		
		this._registerPropMask("colour", "colour", true);
		this._registerPropMask("color", "colour", true);
		this._registerPropMask("border-colour", "bColour", true);
		this._registerPropMask("border-color", "bColour", true);
		this._registerPropMask("border-width", "bWidth", true);
		
		this._registerDrawHandler(this._rectDraw);
	}
};
dusk.sgui.Rect.prototype = new dusk.sgui.Component();
dusk.sgui.Rect.constructor = dusk.sgui.Rect;

dusk.sgui.Rect.prototype.className = "Rect";

/** A draw handler which draws the rectangle.
 * @param {canvas} c A 2D canvas perspective to draw onto.
 * @private
 */
dusk.sgui.Rect.prototype._rectDraw = function(c) {
	c.fillStyle = this.colour;
	c.strokeStyle = this.bColour;
	c.lineWidth = this.bWidth;
	
	c.fillRect (0, 0, this.width, this.height);
	if(this.bWidth) c.strokeRect (0, 0, this.width, this.height);
};
