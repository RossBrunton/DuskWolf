//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.provide("dusk.sgui.Tile");

/** A tile is a type of image designed for using tilesets, a single image with lots of smaller ones in. Generally, it has a "viewing area" of a certian size and width, and the image behind it can be moved to show only one tile at a time.
 * 
 * <p>Uh, remember that this extends the <code>image</code> component, and uses the <code>image</code> property of that as the tileset.</p>
 * 
 * <p>The tileset is assumed to be a grid where every tile is the same size, this will fail if you make all the tiles different sizes. The default is 32x32 pixels for a single tile.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;tile&gt;(x),(y)&lt;/tile&gt;</code> --
 * The x and y of the tile that will be displayed. Note that this is NOT the coordinates, it's the tile, the second tile to the left will be <code>1,0</code></p>
 * 
 * <p><code>&lt;tile-h&gt;(height)&lt;/tile-h&gt;</code> --
 * The height of a single tile in pixels, the default is 32.</p>
 * 
 * <p><code>&lt;tile-w&gt;(width)&lt;/tile-w&gt;</code> --
 * The width of a single tile in pixels, the default is 32.</p>
 * 
 * <p><b>Vars provided are as follows:</b></p>
 * 
 * <p><code>sg-tile-defHeight</code>: The defualt height of every tile, in pixels. Defualt is 32.</p>
 * <p><code>sg-tile-defWidth</code>: The defualt width of every tile, in pixels. Defualt is 32.</p>
 * 
 * @see Tile
 */
sgui.Tile = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	
		/** This is the actual image. */
		this._img = null;
		
		this._ssize = this._theme("tile.ssize", 4);
		this._width = 1<<this._ssize;
		this._height = 1<<this._ssize;
		this._tx = 0;
		this._ty = 0;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
		this._registerProp("src", this._setImage, function(name){return this._img});
		this._registerProp("tile", function(name, value){this._setTile(value.split(",")[0], value.split(",")[1]);}, function(name){this._getTile();});
		this._registerPropMask("sprite-size", "_ssize", true);
		this._registerDrawHandler(this._tileDraw);
	}
};
sgui.Tile.prototype = new sgui.Component();
sgui.Tile.constructor = sgui.Tile;


/** @inheritDoc */
sgui.Tile.prototype.className = "Tile";

sgui.Tile.prototype._tileDraw = function(c) {
	if(this._img){
		c.drawImage(this._img, this._tx<<this._ssize, this._ty<<this._ssize, 1<<this._ssize, 1<<this._ssize, 0, 0, this.prop("width"), this.prop("height"));
	}
};

/** This sets the image that will be displayed.
 * @param image The name of the image, should be a constant in <code>Data</code>.
 */
sgui.Tile.prototype._setImage = function(name, value) {
	this._img = dusk.data.grabImage(value);
};

sgui.Tile.prototype._getTile = function() {
	return this._tx+","+this._ty;
};

sgui.Tile.prototype._setTile = function(x, y) {
	if(y === undefined) {x = x.split(",")[0]; y = x.split(",")[1];}
	
	this._tx = x;
	this._ty = y;
};

sgui.Tile.prototype.snapX = function(down) {
	if(down)
		this.x = Math.ceil(this.x/this.prop("width"))*this.prop("width");
	else
		this.x = Math.floor(this.x/this.prop("width"))*this.prop("width");
};

sgui.Tile.prototype.snapY = function(right) {
	if(right)
		this.y = Math.ceil(this.y/this.prop("height"))*this.prop("height");
	else
		this.y = Math.floor(this.y/this.prop("height"))*this.prop("height");
};

sgui.Tile.prototype.gridGo = function(x, y) {
	this.x = x*this.prop("width");
	this.y = y*this.prop("height");
};
