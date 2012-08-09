//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk.sgui.Rect");

/***/
dusk.sgui.Rect = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
	
		/** This is the actual image. */
		this._colour = this._theme("box");
		this._bColour = this._theme("border");
		this._bWidth = 1;
		
		/** This creates a new rect! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
		this._registerPropMask("colour", "_colour", true);
		this._registerPropMask("color", "_colour", true);
		this._registerPropMask("border-colour", "_bColour", true);
		this._registerPropMask("border-color", "_bColour", true);
		this._registerPropMask("border-width", "_bWidth", true);
		
		this._registerDrawHandler(this._rectDraw);
	}
};
dusk.sgui.Rect.prototype = new dusk.sgui.Component();
dusk.sgui.Rect.constructor = dusk.sgui.Rect;

/** @inheritDoc */
dusk.sgui.Rect.prototype.className = "Rect";

dusk.sgui.Rect.prototype._rectDraw = function(c) {
	c.fillStyle = this._colour;
	c.strokeStyle = this._bColour;
	c.lineWidth = this._bWidth;
	
	c.fillRect (0, 0, this.prop("width"), this.prop("height"));
	if(this._bWidth) c.strokeRect (0, 0, this.prop("width"), this.prop("height"));
};
