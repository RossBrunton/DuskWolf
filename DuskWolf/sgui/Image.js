//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.data");
dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.Image");

dusk.load.provide("dusk.sgui.Image");

/** @class dusk.sgui.Image
 * 
 * @classdesc An image.
 *
 * It is given an URL pointing to an image which is then downloaded and displayed.
 * 
 * Any valid image type supported by 2D canvas context works.
 * 
 * A width and height must be specified, otherwise the image will not draw.
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

	/** The current image.
	 * @type dusk.Image
	 * @protected
	 */
	this._img = null;
	/** Image options for the image.
	 * 
	 * @type string
	 * @since 0.0.21-alpha
	 */
	this.imageTrans = "";
	
	/** Sets the image to draw, this should be a URL, potentially relative to `{@link dusk.dataDir}`.
	 * @type string
	 * @default "sgui/img.png"
	 */
	this.src = "sgui/img.png";
	
	//Prop masks
	this._registerPropMask("src", "src");
	this._registerPropMask("imageTrans", "imageTrans", true);
	
	//Listeners
	this.prepareDraw.listen(this._imageDraw, this);
};
dusk.sgui.Image.prototype = Object.create(dusk.sgui.Component.prototype);

/** Used to draw the image.
 * @param {object} e A draw event.
 * @private
 */
dusk.sgui.Image.prototype._imageDraw = function(e) {
	if(this._img && this._img.isReady() && this._img.width() && this._img.height()){
		/*var ratioX = (this._img.width() / this.width);
		var ratioY = (this._img.height() / this.height);
		
		e.c.drawImage(this._img.asCanvas(this.imageTrans),
			e.d.sourceX * ratioX, e.d.sourceY * ratioY, e.d.width * ratioX, e.d.height * ratioY,
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);*/
		
		this._img.paintScaled(e.c, this.imageTrans, false,
			e.d.sourceX, e.d.sourceY, e.d.width, e.d.height,
			e.d.destX, e.d.destY, e.d.width, e.d.height,
			this._img.width()/this.width, this._img.height()/this.height
		);
	}
};

//src
Object.defineProperty(dusk.sgui.Image.prototype, "src", {
	get: function() {
		if(!this._img) return "";
		return this._img.src;
	},
	
	set: function(value) {
		if(value === undefined) {
			this._img = null;
		}else{
			this._img = new dusk.Image(value);
		}
	}
});

Object.seal(dusk.sgui.Image);
Object.seal(dusk.sgui.Image.prototype);

dusk.sgui.registerType("Image", dusk.sgui.Image);
