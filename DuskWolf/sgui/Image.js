//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.data");
dusk.load.require("dusk.sgui.Component");

dusk.load.provide("dusk.sgui.Image");

/** Creates a new Image.
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * 
 * @class dusk.sgui.Image
 * 
 * @classdesc An image.
 *
 * It is given an URL pointing to an image which is then downloaded and displayed.
 * 
 * Any valid image type supported by 2D canvas context works.
 * 
 * This component's width and height properties are currently not implemented, and it will not book a redraw when the image loads.
 * 
 * This uses the theme key `img.src` (default "sgui/img.png") as the default image.
 * 
 * @extends dusk.sgui.Component
 */
dusk.sgui.Image = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
	
		/** The current image, as a HTML img object.
		 * 
		 * @type HTMLImageElement
		 * @protected
		 */
		this._img = null;
		
		this._registerPropMask("src", "src", true);
		
		this.src = this._theme("img.src", "sgui/img.png");
		
		this._registerDrawHandler(this._imageDraw);
	}
};
dusk.sgui.Image.prototype = new dusk.sgui.Component();
dusk.sgui.Image.constructor = dusk.sgui.Image;

dusk.sgui.Image.prototype.className = "Image";

/** Used to draw the image.
 * 
 * @param {CanvasRenderingContext2D} c The canvas on which to draw.
 * @private
 */
dusk.sgui.Image.prototype._imageDraw = function(c) {
	if(this._img && this._img.complete){
		c.drawImage(this._img, 0, 0, this.width?this.width:this._img.width, this.height?this.height:this._img.height);
	}else if(this._img) {
		this.bookRedraw();
	}
};

/** Sets the image to draw, this should be a URL, potentially relative to `{@link dusk.dataDir}`.
 * 
 * Setting this property will cause the image to be updated at the current time.
 * 
 * @type string
 * @name src
 * @memberof dusk.sgui.Image
 */
dusk.sgui.Image.prototype.__defineSetter__("src", function s_src(value) {
	if(!value) {console.warn(this.comName+" tried to set image to nothing."); return;}
	this._img = dusk.data.grabImage(value);
	this.bookRedraw();
});
dusk.sgui.Image.prototype.__defineGetter__("src", function g_src(value) {
	return this._img.src;
});
