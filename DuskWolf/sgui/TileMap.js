//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** A tilemap is just a grid of tiles.
 * 
 * <p>However, it does have a <code>&lt;map&gt;</code> property, which allows quick creation of a map, based on a tilesheet. The content of that property is a whitespace separated list (Preferably using tabs) of coordinates relating to the position on the tilesheet.</p>
 * 
 * <p>These coordinates are assigned tiles in order, the first coordinate is set to the tile at 0,0, the second one is set to the tile 0,1 and so on. It wraps to the next line once the current one is full.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;map [spacing-y='(yspacing)'] [spacing-x='(xspacing)'] [rows='(rows)'] [cols='(cols)'] [image='(image)']&gt;(map)&lt;/map&gt;</code> --
 * Creates a new grid of tiles, erasing any already there. The <code>xspacing</code> and <code>yspacing</code> are space between the tiles, both default to 0. <code>rows</code> and <code>cols</code>, the rows and columns, default to <code>$sys-env-height;/$sg-tile-defHeight</code> and <code>$sys-env-width;/$sg-tile-defWidth</code>, these give the total number of tiles that the stage can support. <code>image</code> is the tilesheet to use, a string for a constant in <code>Data</code>, defaults to <code>IMG_EXAMPLE_TILE</code>. <code>map</code> is the whitespace seperated list of coordinates described above.</p>
 * 
 * @see Grid
 * @see Tile
 */
sgui.TileMap = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
		
		this._registerStuff(this._tileMapStuff);
		
		this._hspacing = this._theme("tm-spacing-h");
		this._vspacing = this._theme("tm-spacing-v");
		
		this.setWidth(this._events.getVar("sys-sg-width"));
		this.setHeight(this._events.getVar("sys-sg-height"));
		
		this._twidth = this._theme("tm-tile-width");
		this._theight = this._theme("tm-tile-height");
		this._tsize = this._theme("tm-tsize");
		this._ssize = this._theme("tm-ssize");
		
		this._lbound = 0;
		this._ubound = 0;
		this._rbound = 0;
		this._bbound = 0;
		
		this.rows = -1;
		this.cols = -1;
		
		this._defImg = "";
		this._img = null;
		
		this._all = null;
		this._drawn = false;
		
		this._registerDrawHandler(this._tileMapDraw);
	}
};
sgui.TileMap.prototype = new sgui.Component();
sgui.TileMap.constructor = sgui.TileMap;

sgui.TileMap.prototype.className = "TileMap";

sgui.TileMap.prototype._tileMapStuff = function(stuff) {
	this._lbound = this._prop("bound-l", stuff, this._lbound, true, 1);
	this._rbound = this._prop("bound-r", stuff, this._rbound, true, 1);
	this._ubound = this._prop("bound-u", stuff, this._ubound, true, 1);
	this._bbound = this._prop("bound-b", stuff, this._bbound, true, 1);
	
	this._tsize = this._prop("tile-size", stuff, this._tsize, true, 1);
	this._ssize = this._prop("sprite-size", stuff, this._ssize, true, 1);
	this._tiles = new Array();
	
	this._defImg = this._prop("src", stuff, this._defImg, true, 0);
	
	if(typeof(this._prop("map", stuff, null, false)) != "string" && this._prop("map", stuff, null, false)){
		var map = this._prop("map", stuff, null, false);
		
		//Get stuff
		if(!("rows" in map)) map.rows = this._theme("tm-rows");
		if(!("cols" in map)) map.cols = this._theme("tm-cols");
		
		if("src" in map) {
			this._img = data.grabImage(map.src);
		}else{
			this._img = data.grabImage(this._defImg);
		}
		
		var singleW = 1<<this._tsize;
		var singleH = 1<<this._tsize;
		
		if(map.rows == "-1") map.rows = Math.floor((this.getHeight()/singleH));
		if(map.cols == "-1") map.cols = Math.floor((this.getWidth()/singleW));
		
		var tiles = map.map.split(/\s+/g);
		
		for(var i = 0; i < tiles.length; i++){
			if(tiles[i].indexOf(",") === -1) continue;
			this._tiles[this._tiles.length] = tiles[i].split(",");
		}
		
		this.rows = map.rows;
		this.cols = map.cols;
		
		this._all = document.createElement("canvas");
		this._all.width = (this.cols<<this._tsize) + this.getWidth();
		this._all.height = (this.rows<<this._tsize) + this.getHeight();
		this._all.style.imageRendering = "-webkit-optimize-contrast";
		
		this.drawAll();
		
		this.setBoundsCoord(0, 0, this.getWidth(), this.getHeight());
	}
};

sgui.TileMap.prototype.drawAll = function() {
	this._drawn = false;
	
	if(!this._img.complete) return false;
	
	var i = 0;
	for (var yi = 0; yi < this.rows; yi++) {
		for (var xi = 0; xi < this.cols; xi++) {
			if(this._tiles[i]) {
				this._all.getContext("2d").drawImage(this._img, this._tiles[i][0]<<this._ssize, this._tiles[i][1]<<this._ssize, 1<<this._ssize, 1<<this._ssize, xi<<this._tsize, yi<<this._tsize, 1<<this._tsize, 1<<this._tsize);
			}
			i++;
		}
	}
	
	this._drawn = true;
	return true;
};

sgui.TileMap.prototype.setBoundsCoord = function(l, u, r, b) {
	this._lbound = l;
	this._rbound = r;
	this._ubound = u;
	this._bbound = b;
	this.bookRedraw();
};

sgui.TileMap.prototype.setBounds = function(l, u, r, b) {
	if(r === undefined) r = l+this.cols;
	if(b === undefined) b = u+this.rows;
	
	if(this.dec){
		/*this._lbound = Math.floor(l/this._twidth);
		this._rbound = Math.ceil(r/this._twidth);
		this._ubound = Math.floor(u/this._theight);
		this._bbound = Math.ceil(b/this._theight);*/
		duskWolf.warn("Decimal tilemaps have not been fully implemented!");
	}else{
		this._lbound = l<<this._tsize;
		this._rbound = r<<this._tsize;
		this._ubound = u<<this._tsize;
		this._bbound = b<<this._tsize;
	}
	
	this.bookRedraw();
};

sgui.TileMap.prototype.tilePointIn = function(x, y, exactX, exactY) {
	var xpt = (x/(1<<this._tsize));
	var ypt = (y/(1<<this._tsize));
	
	if(exactX && exactY){
		return this.getTile(xpt, ypt);
	}else if(exactX){
		return this.getTile(xpt, Math.floor(ypt));
	}else if(exactY){
		return this.getTile(Math.floor(xpt), ypt);
	}else{
		return this.getTile(Math.floor(xpt), Math.floor(ypt));
	}
};

sgui.TileMap.prototype._tileMapDraw = function(c) {
	if(!this._img) return;
	if(!this._drawn) this.drawAll();
	c.drawImage(this._all, this._lbound, this._ubound, this.getWidth(), this.getHeight(), 0, 0, this.getWidth(), this.getHeight());
};

sgui.TileMap.prototype.getTile = function(x, y) {
	if(this._tiles[(y*this.cols)+x]) {
		return this._tiles[(y*this.cols)+x];
	}else{
		duskWolf.warn("Tile "+x+","+y+" not found on "+this.comName);
		return "0,0";
	}
};

sgui.TileMap.prototype.getRelativeTile = function(xcoord, ycoord) {
	return this.getTile((xcoord+this._lbound >> this._tsize), (ycoord+this._ubound >> this._tsize));
};

sgui.TileMap.prototype.inRelativeRange = function(xcoord, ycoord) {
	if(xcoord+(this._lbound>>this._tsize) < 0 || xcoord+(this._lbound>>this._tsize) >= this.cols || ycoord+(this._ubound>>this._tsize) < 0 || ycoord+(this._ubound>>this._tsize) >= this.rows) return false;
	return true;
};

sgui.TileMap.prototype.visibleCols = function() {
	return Math.floor(this.getWidth()/(1<<this._tsize));
};

sgui.TileMap.prototype.visibleRows = function() {
	return Math.floor(this.getHeight()/(1<<this._tsize));
};

sgui.TileMap.prototype.lookTile = function(x, y) {
	for(var t in this._tiles){
		if(this._tiles[t][0] == x && this._tiles[t][1] == y) {
			return [t % this.cols, Math.floor(t/this.cols)];
		}
	}
	
	return [0, 0];
};
