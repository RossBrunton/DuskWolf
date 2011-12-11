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
		
		this._registerStuff(this._rectStuff);
		this._registerDrawHandler(this._rectDraw);
	}
};
sgui.Rect.prototype = new sgui.Component();
sgui.Rect.constructor = sgui.Rect;


/** @inheritDoc */
sgui.Rect.prototype.className = "Rect";


/** Generic image stuff!
 */
sgui.Rect.prototype._rectStuff = function(data) {
	this._colour = this._prop("color", data, this._colour, true, 1);
	this._colour = this._prop("colour", data, this._colour, true, 1);
	
	this._bColour = this._prop("border-color", data, this._bColour, true, 1);
	this._bColour = this._prop("border-colour", data, this._bColour, true, 1);
	
	this._bWidth = this._prop("border-width", data, this._bWidth, true, 1);
};

sgui.Rect.prototype._rectDraw = function(c) {
	c.fillStyle = this._colour;
	c.strokeStyle = this._bColour;
	c.lineWidth = this._bWidth;
	
	c.fillRect (0, 0, this.getWidth(), this.getHeight());
	if(this._bWidth) c.strokeRect (0, 0, this.getWidth(), this.getHeight());
};
