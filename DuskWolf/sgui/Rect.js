//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/***/
sgui.Rect = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	
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
sgui.Rect.prototype = new sgui.Component();
sgui.Rect.constructor = sgui.Rect;

/** @inheritDoc */
sgui.Rect.prototype.className = "Rect";

sgui.Rect.prototype._rectDraw = function(c) {
	c.fillStyle = this._colour;
	c.strokeStyle = this._bColour;
	c.lineWidth = this._bWidth;
	
	c.fillRect (0, 0, this.prop("width"), this.prop("height"));
	if(this._bWidth) c.strokeRect (0, 0, this.prop("width"), this.prop("height"));
};
