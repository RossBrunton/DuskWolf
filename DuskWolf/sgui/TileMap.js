//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Grid");

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
		sgui.Grid.call(this, parent, events, comName);
		
		this._registerStuff(this._tileMapStuff);
		
		this._hspacing = this._theme("tm-spacing-h");
		this._vspacing = this._theme("tm-spacing-v");
		
		this.setWidth(this._events.getVar("sys-sg-width"));
		this.setHeight(this._events.getVar("sys-sg-height"));
		
		this._twidth = this._theme("tm-tile-width");
		this._theight = this._theme("tm-tile-height");
		this._tsize = this._theme("tm-tile-size");
		
		this.dec = this._theme("tm-dec");
		
		this._lbound = 0;
		this._ubound = 0;
		this._rbound = 0;
		this._bbound = 0;
		
		this._defImg = "";
		
		this._registerDrawHandler(this._tileMapDraw);
	}
};
sgui.TileMap.prototype = new sgui.Grid();
sgui.TileMap.constructor = sgui.TileMap;

sgui.TileMap.prototype.className = "TileMap";

sgui.TileMap.prototype._tileMapStuff = function(data) {
	this._lbound = this._prop("bound-l", data, this._lbound, true, 1);
	this._rbound = this._prop("bound-r", data, this._rbound, true, 1);
	this._ubound = this._prop("bound-u", data, this._ubound, true, 1);
	this._bbound = this._prop("bound-b", data, this._bbound, true, 1);
	
	this._twidth = this._prop("tile-width", data, this._twidth, true, 1);
	this._theight = this._prop("tile-height", data, this._theight, true, 1);
	this._tsize = this._prop("tile-size", data, this._tsize, true, 1);
	
	this._defImg = this._prop("src", data, this._defImg, true, 0);
	
	if(typeof(this._prop("map", data, null, false)) != "string" && this._prop("map", data, null, false)){
		var map = this._prop("map", data, null, false);
		
		var dec = (("dec" in map)?map.dec:this.dec) == "1";
		loadComponent(dec?"DecimalTile":"Tile");
		
		//Get data
		if(!("rows" in map)) map.rows = this._theme("tm-rows");
		if(!("cols" in map)) map.cols = this._theme("tm-cols");
		
		if(!("src" in map)) map.src = this._defImg;
		
		var singleW = dec?this._twidth:1<<this._tsize;
		var singleH = dec?this._theight:1<<this._tsize;
		
		if(map.rows == "-1") map.rows = Math.floor((this.getHeight()/singleH));
		if(map.cols == "-1") map.cols = Math.floor((this.getWidth()/singleW));
		
		map.type = dec?"DecimalTile":"Tile";
		this.populate(map);
		
		var tiles = map.map.split(/\s/g);
		
		var i = 0;
		mainLoop:for(var yi = 0; yi < map.rows; yi++){
			for(var xi = 0; xi < map.cols; xi++){
				while(!tiles[i]){if(tiles.length == i){break mainLoop;}else{i++;}}
				
				this.getComponent(xi+","+yi).doStuff({"tile":tiles[i]});
				this.getComponent(xi+","+yi).setWidth(singleW);
				this.getComponent(xi+","+yi).setHeight(singleH);
				i ++;
			}
		}
		
		this.dec = dec;
		
		this.ajust();
		
		this.setBoundsCoord(0, 0, this.getWidth(), this.getHeight());
	}
};

sgui.TileMap.prototype.setBounds = function(l, u, r, b) {
	this._lbound = l;
	this._rbound = r;
	this._ubound = u;
	this._bbound = b;
	this.bookRedraw();
}

sgui.TileMap.prototype.setBoundsCoord = function(l, u, r, b) {
	if(r === undefined) r = l+this.getWidth();
	if(b === undefined) b = u+this.getHeight();
	
	if(this.dec){
		this._lbound = Math.floor(l/this._twidth);
		this._rbound = Math.ceil(r/this._twidth);
		this._ubound = Math.floor(u/this._theight);
		this._bbound = Math.ceil(b/this._theight);
	}else{
		this._lbound = Math.floor(l/(1<<this._tsize));
		this._rbound = Math.ceil(r/(1<<this._tsize));
		this._ubound = Math.floor(u/(1<<this._tsize));
		this._bbound = Math.ceil(b/(1<<this._tsize));
	}
	
	this.bookRedraw();
};

sgui.TileMap.prototype.tilePointIn = function(x, y, exactX, exactY) {
	var xpt = this.dec?(x/this._twidth):(x/(1<<this._tsize));
	var ypt = this.dec?(y/this._theight):(y/(1<<this._tsize));
	
	if(exactX && exactY){
		return this.getComponent(xpt+","+ypt);
	}else if(exactX){
		return this.getComponent(xpt+","+Math.floor(ypt));
	}else if(exactY){
		return this.getComponent(Math.floor(xpt)+","+ypt);
	}else {
		return this.getComponent(Math.floor(xpt)+","+Math.floor(ypt));
	}
};

sgui.TileMap.prototype._tileMapDraw = function(c) {
	for(var c in this._components){
		this._components[c].visible = false;
	}
	
	for(var yi = this._ubound; yi <= this._bbound; yi++){
		if(!this.getComponent("0,"+yi)) continue;
		
		for(var xi = this._lbound; xi <= this._rbound; xi++){
			if(!this.getComponent(xi+","+yi)) continue;
			this.getComponent(xi+","+yi).visible = true;
		}
	}
};

sgui.TileMap.prototype.getRelativeTile = function(xcoord, ycoord) {
	return this.getComponent((xcoord+this._lbound)+","+(ycoord+this._ubound))
};

sgui.TileMap.prototype.visibleCols = function() {
	if(this.dec){
		return Math.floor(this.getWidth()/this._twidth);
	}else{
		return Math.floor(this.getWidth()/(1<<this._tsize));
	}
};

sgui.TileMap.prototype.visibleRows = function() {
	if(this.dec){
		return Math.floor(this.getHeight()/this._theight);
	}else{
		return Math.floor(this.getHeight()/(1<<this._tsize));
	}
};

sgui.TileMap.prototype.lookTile = function(x, y) {
	for(var c in this._components){
		if(this._components[c].getTile && this._components[c].getTile() == x+","+y){
			return c;
		}
	}
	
	return null;
};
