//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** This is a single image, the image just sits on the screen and does nothing of any relevance.
 * 
 * <p><img src='Image.png'/></p>
 * 
 * <p>Only one image can be displayed at a time, if you try to set another, it'll replace the existing one.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;image&gt;(image)&lt;/image&gt;</code> --
 * The image to display, it must be the name of a constant in <code>Data</code>.</p>
 * 
 * @see Data
 */
sgui.Image = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	
		/** This is the actual image. */
		this._img = null;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		this._registerProp("src", this._setImage, function(name){return this._img});
		this._registerDrawHandler(this._imageDraw);
	}
};
sgui.Image.prototype = new sgui.Component();
sgui.Image.constructor = sgui.Image;

/** @inheritDoc */
sgui.Image.prototype.className = "Image";

sgui.Image.prototype._imageDraw = function(c) {
	if(this._img){
		c.drawImage(this._img, 0, 0, this.prop("width"), this.prop("height"));
	}
};

/** This sets the image that will be displayed.
 * @param image The name of the image, should be a constant in <code>Data</code>.
 */
sgui.Image.prototype._setImage = function(name, value) {
	if(!value) {duskWolf.warn(this.comName+" tried to set image to nothing."); return;}
	this._img = data.grabImage(value);
	this.bookRedraw();
};
