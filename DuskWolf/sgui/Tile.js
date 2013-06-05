//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require(">dusk.data");

dusk.load.provide("dusk.sgui.Tile");

/** @class dusk.sgui.Tile
 * 
 * @classdesc A tile.
 *
 * This is a smaller image selected from a larger image.
 *	Essentially, the source image has a lot of possible different images that this component can display.
 *	This component will take the location of the image from the source, in x,y form, and display only that image.
 *	It is given the dimensions of each "tile" on the source image,
 *   and expects the source image to be a grid of images of those sizes.
 * 
 * The mode is either `"BINARY"` or `"DECIMAL"`, and this determines how dimensions are interpreted.
 *	If the mode is `"BINARY"` the origin sprites are square, with each side being `2^this.ssize`.
 * 	While, if the mode is the slower `"DECIMAL"` mode,
 *   then the origin sprites have their width and height described using `this.swidth` and `this.sheight`.
 * 	This only determines the size of the sprites on the source image,
 *   the tile can be resized as normal using the `height` and `width` properties.
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * @extends dusk.sgui.Component
 * @see {@link dusk.sgui.Image}
 * @constructor
 */
dusk.sgui.Tile = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);

	/** The current source image, as a HTML img object.
	 * @type HTMLImageElement
	 * @private
	 */
	this._img = null;
	
	/** The current mode. Must be either `"BINARY"` or `"DECIMAL"`.
	 * 
	 * This takes the value of the theme key `tile.mode`, which by default is `"BINARY"`.
	 * @type string
	 * @default "BINARY"
	 */
	this.mode = "BINARY";
	
	/** Origin sprite size if this is running in `"BINARY"` mode.
	 * 
	 * This is considered to be the width and height of the sprites when reading them from the image.
	 * 
	 * This should be `n` such that the width and height of the sprite is `2^n`.
	 *  If this is 4, then the sprites will be 16x16, for example.
	 * @type integer
	 * @default 4
	 */
	this.ssize = 4;
	/** Origin sprite width if this is running in `"DECIMAL"` mode.
	 * 
	 * This is considered to be the width of the sprites when reading them from the image.
	 * @type integer
	 * @default 16
	 */
	this.swidth = 16;
	/** Origin sprite height if this is running in `"DECIMAL"` mode.
	 * 
	 * This is considered to be the height of the sprites when reading them from the image.
	 * @type integer
	 * @default 16
	 */
	this.sheight = 16;
	
	/** X coordinate of the current sprite.
	 * @type integer
	 * @private
	 */
	this._tx = 0;
	/** Y coordinate of the current sprite.
	 * @type integer
	 * @private
	 */
	this._ty = 0;
	
	/** The path to the origin image.
	 * 
	 * This is relative to `{@link dusk.dataDir}` if needed.
	 * @type string
	 */
	this.src = "";
	
	/** The current tile, represented as a string.
	 * 
	 * This must be a string in the form `"x,y"` representing the sprite on the source image.
	 * @type string
	 */
	this.tileStr = "0,0";
	
	/** The current tile, represented as an array.
	 * 
	 * This must be an array in the form `[x,y]` representing the sprite on the source image.
	 * @type string
	 */
	this.tile = [0,0];
	
	//Prop masks
	this._registerPropMask("src", "src", true);
	this._registerPropMask("tile", "tileStr", true);
	this._registerPropMask("ssize", "ssize", true);
	this._registerPropMask("swidth", "swidth", true);
	this._registerPropMask("sheight", "sheight", true);
	this._registerPropMask("mode", "mode", true);
	
	//Listeners
	this.prepareDraw.listen(this._tileDraw, this);
	
	//Render support
	this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
};
dusk.sgui.Tile.prototype = new dusk.sgui.Component();
dusk.sgui.Tile.constructor = dusk.sgui.Tile;

dusk.sgui.Tile.prototype.className = "Tile";

/** Used to draw the tile.
 * 
 * @param {CanvasRenderingContext2D} c The canvas on which to draw.
 * @private
 */
dusk.sgui.Tile.prototype._tileDraw = function(e) {
	if(this._img){
		if(this.mode == "BINARY") {
			var scaleX = (1<<this.ssize)/this.width;
			var scaleY = (1<<this.ssize)/this.height;
			e.c.drawImage(this._img, (this._tx << this.ssize) + (e.d.sourceX*scaleX), 
				(this._ty << this.ssize) + (e.d.sourceY*scaleY), e.d.width*scaleX, e.d.height*scaleY,
				e.d.destX, e.d.destY, e.d.width, e.d.height
			);
		}else{
			var hscale = this.width/this.swidth;
			var vscale = this.height/this.sheight;
			e.c.drawImage(this._img, this._tx * this.swidth + e.d.sourceX * hscale,
				this._ty * this.sheight + e.d.sourceY * vscale, e.d.width*hscale, e.d.height*vscale,
				e.d.destX, e.d.destY, e.d.width, e.d.height
			);
		}
	}
};

//src
Object.defineProperty(dusk.sgui.Tile.prototype, "src", {
	set: function(value) {
		if(value === undefined) {return;}
		this._img = dusk.data.grabImage(value);
	},

	get: function() {
		if(!this._img) return "";
		return this._img.src;
	}
});

//tileStr
Object.defineProperty(dusk.sgui.Tile.prototype, "tileStr", {
	set: function(value) {
		if(value === undefined) {return;}
		this._tx = value.split(",")[0];
		this._ty = value.split(",")[1];
	},

	get: function() {
		return this._tx+","+this._ty;
	}
});

//tile
Object.defineProperty(dusk.sgui.Tile.prototype, "tile", {
	set: function(value) {
		this._tx = value[0];
		this._ty = value[1];
	},

	get: function() {
		return [this._tx, this._ty];
	}
});

/*dusk.sgui.Tile.prototype.snapX = function(down) {
	if(down)
		this.x = Math.ceil(this.x/this.width)*this.width;
	else
		this.x = Math.floor(this.x/this.width)*this.width;
};

dusk.sgui.Tile.prototype.snapY = function(right) {
	if(right)
		this.y = Math.ceil(this.y/this.height)*this.height;
	else
		this.y = Math.floor(this.y/this.height)*this.height;
};

dusk.sgui.Tile.prototype.gridGo = function(x, y) {
	this.x = x*this.width;
	this.y = y*this.height;
};*/

Object.seal(dusk.sgui.Tile);
Object.seal(dusk.sgui.Tile.prototype);

dusk.sgui.registerType("Tile", dusk.sgui.Tile);
