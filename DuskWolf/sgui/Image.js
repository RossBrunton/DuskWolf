//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.data");
dusk.load.require("dusk.sgui.Component");

dusk.load.provide("dusk.sgui.Image");

/** @class dusk.sgui.Image
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
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * @extends dusk.sgui.Component
 * @constructor
 */
dusk.sgui.Image = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);

	/** The current image, as a HTML img element object.
	 * @type HTMLImageElement
	 * @protected
	 */
	this._img = null;
	
	/** Sets the image to draw, this should be a URL, potentially relative to `{@link dusk.dataDir}`.
	 * @type string
	 * @default "sgui/img.png"
	 */
	this.src = "sgui/img.png";
	
	//Prop masks
	this._registerPropMask("src", "src");
	
	//Listeners
	this.prepareDraw.listen(this._imageDraw, this);
};
dusk.sgui.Image.prototype = new dusk.sgui.Component();
dusk.sgui.Image.constructor = dusk.sgui.Image;

dusk.sgui.Image.prototype.className = "Image";

/** Used to draw the image.
 * @param {CanvasRenderingContext2D} c The canvas on which to draw.
 * @private
 */
dusk.sgui.Image.prototype._imageDraw = function(c) {
	if(this._img && this._img.complete && this._img.width && this._img.height){
		c.drawImage(this._img, 0, 0, this.width?this.width:this._img.width, this.height?this.height:this._img.height);
	}
};

//src
Object.defineProperty(dusk.sgui.Image.prototype, "src", {
	get: function() {
		return this._img.src;
	},
	
	set: function(value) {
		if(!value) {return;}
		this._img = dusk.data.grabImage(value);
	}
});

Object.seal(dusk.sgui.Image);
Object.seal(dusk.sgui.Image.prototype);

dusk.sgui.registerType("Image", dusk.sgui.Image);
