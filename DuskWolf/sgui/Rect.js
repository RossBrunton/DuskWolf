//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.sgui.Rect");

/***/
dusk.sgui.Rect = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
	
		/** This is the actual image. */
		this.colour = this._theme("box");
		this.bColour = this._theme("border");
		this.bWidth = 1;
		
		/** This creates a new rect! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
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

/** @inheritDoc */
dusk.sgui.Rect.prototype.className = "Rect";

dusk.sgui.Rect.prototype._rectDraw = function(c) {
	c.fillStyle = this.colour;
	c.strokeStyle = this.bColour;
	c.lineWidth = this.bWidth;
	
	c.fillRect (0, 0, this.width, this.height);
	if(this.bWidth) c.strokeRect (0, 0, this.width, this.height);
};
