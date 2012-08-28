//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.sgui.Tile");

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
dusk.sgui.Tile = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
	
		/** This is the actual image. */
		this._img = null;
		
		this.ssize = this._theme("tile.ssize", 4);
		this.width = 1<<this._ssize;
		this.height = 1<<this._ssize;
		this._tx = 0;
		this._ty = 0;
		
		/** This creates a new image! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
		
		this._registerPropMask("src", "src", true);
		this._registerPropMask("tile", "tile", true);
		this._registerPropMask("sprite-size", "ssize", true);
		this._registerDrawHandler(this._tileDraw);
	}
};
dusk.sgui.Tile.prototype = new dusk.sgui.Component();
dusk.sgui.Tile.constructor = dusk.sgui.Tile;


/** @inheritDoc */
dusk.sgui.Tile.prototype.className = "Tile";

dusk.sgui.Tile.prototype._tileDraw = function(c) {
	if(this._img){
		c.drawImage(this._img, this._tx<<this.ssize, this._ty<<this.ssize, 1<<this.ssize, 1<<this.ssize, 0, 0, this.width, this.height);
	}
};

dusk.sgui.Tile.prototype.__defineSetter__("src", function _setSrc (value) {
	if(!value) {console.warn(this.comName+" tried to set image to nothing."); return;}
	this._img = dusk.data.grabImage(value);
	this.bookRedraw();
});

dusk.sgui.Tile.prototype.__defineGetter__("src", function _getSrc () {
	return this._img;
});

dusk.sgui.Tile.prototype.__defineGetter__("tile", function _getTile() {
	return this._tx+","+this._ty;
});

dusk.sgui.Tile.prototype.__defineSetter__("tile", function _setTile(value) {
	this._tx = value.split(",")[0];
	this._ty = value.split(",")[1];
});

dusk.sgui.Tile.prototype.snapX = function(down) {
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
};

dusk.sgui.Tile.prototype.__defineGetter__("width", function _getWidth() {
	return 1<< this.ssize;
});

dusk.sgui.Tile.prototype.__defineSetter__("width", function _setWidth(value) {
	this.ssize = Math.log(value)/Math.LN2;
});

dusk.sgui.Tile.prototype.__defineGetter__("height", function _getHeight() {
	return 1<<this.ssize;
});

dusk.sgui.Tile.prototype.__defineSetter__("height", function _setHeight(value) {
	this.ssize = Math.log(value)/Math.LN2;
});
