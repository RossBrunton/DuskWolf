//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.sgui.Tile", (function() {
	var Image = load.require("dusk.utils.Image");
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");

	/** A tile.
	 *
	 * This is a smaller image selected from a larger image. The source image has a lot of possible different images
	 *  that this component can display. This component will take the location of the image from the source, in x,y
	 *  form, and display only that image. It is given the dimensions of each "tile" on the source image, and expects
	 *  the source image to be a grid of images of those sizes. This is what the "x" and "y" values refer to, rather
	 *  than the absolute coordinates of the tile.
	 * 
	 *  The origin sprites have their width and height described using `swidth` and `sheight`. This only determines the
	 *  size of the sprites on the source image, the tile can be resized as normal using the `height` and `width`
	 *  properties.
	 * 
	 * @param {dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} comName The name of the component.
	 * @extends dusk.sgui.Component
	 * @see {@link dusk.sgui.Image}
	 * @constructor
	 */
	var Tile = function(parent, comName) {
		Component.call(this, parent, comName);

		/** The current source image.
		 * @type dusk.utils.Image
		 * @private
		 */
		this._img = null;
		/** Origin sprite width.
		 * 
		 * This is considered to be the width of the sprites when reading them from the image.
		 * @type integer
		 * @default 16
		 */
		this.swidth = 16;
		/** Origin sprite height.
		 * 
		 * This is considered to be the height of the sprites when reading them from the image.
		 * @type integer
		 * @default 16
		 */
		this.sheight = 16;
		
		/** X coordinate of the current image on the source.
		 * @type integer
		 * @private
		 */
		this._tx = 0;
		/** Y coordinate of the current imag on the source.
		 * @type integer
		 * @private
		 */
		this._ty = 0;
		
		/** The path to the origin image.
		 * 
		 * @type string
		 */
		this.src = "";
		/** Image options for the origin image.
		 * 
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.imageTrans = [];
		
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
		this._registerPropMask("imageTrans", "imageTrans", true);
		this._registerPropMask("tile", "tileStr", true);
		this._registerPropMask("swidth", "swidth", true);
		this._registerPropMask("sheight", "sheight", true);
		
		//Listeners
		this.prepareDraw.listen(_draw.bind(this));
	};
	Tile.prototype = Object.create(Component.prototype);
	
	/** Used to draw the tile.
	 * 
	 * @param {object} e A draw event.
	 * @private
	 */
	var _draw = function(e) {
		if(this._img && this._img.isReady()){
			this._img.paintScaled(e.c, this.imageTrans, false,
				this._tx * this.swidth + e.d.sourceX, this._ty * this.sheight + e.d.sourceY, e.d.width, e.d.height,
				e.d.destX, e.d.destY, e.d.width, e.d.height,
				this.swidth/this.width, this.sheight/this.height
			);
		}
	};

	//src
	Object.defineProperty(Tile.prototype, "src", {
		set: function(value) {
			if(!value) {
				this._img = null;
			}else{
				this._img = new Image(value);
			}
		},

		get: function() {
			if(!this._img) return "";
			return this._img.src;
		}
	});
	
	//tileStr
	Object.defineProperty(Tile.prototype, "tileStr", {
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
	Object.defineProperty(Tile.prototype, "tile", {
		set: function(value) {
			this._tx = value[0];
			this._ty = value[1];
		},

		get: function() {
			return [this._tx, this._ty];
		}
	});
	
	/*dusk.tiles.sgui.Tile.prototype.snapX = function(down) {
		if(down)
			this.x = Math.ceil(this.x/this.width)*this.width;
		else
			this.x = Math.floor(this.x/this.width)*this.width;
	};
	
	dusk.tiles.sgui.Tile.prototype.snapY = function(right) {
		if(right)
			this.y = Math.ceil(this.y/this.height)*this.height;
		else
			this.y = Math.floor(this.y/this.height)*this.height;
	};
	
	dusk.tiles.sgui.Tile.prototype.gridGo = function(x, y) {
		this.x = x*this.width;
		this.y = y*this.height;
	};*/
	
	/** Imagines that this tile is on a grid of tiles the same size, and returns it's x location on that grid.
	 * 
	 * @return {integer} The tile's x coordinate in a grid of tiles the same size.
	 * @since 0.0.21-alpha
	 */
	Tile.prototype.tileX = function() {
		return ~~(this.x/this.width);
	};
	
	/** Imagines that this tile is on a grid of tiles the same size, and returns it's y location on that grid.
	 * 
	 * If it was below two other tiles that are next to each other, it would return 2, for example.
	 * @return {integer} The tile's y coordinate in a grid of tiles the same size.
	 * @since 0.0.21-alpha
	 */
	Tile.prototype.tileY = function() {
		return ~~(this.y/this.height);
	};
	
	sgui.registerType("Tile", Tile);
	
	return Tile;
})());
