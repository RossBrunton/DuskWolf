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
		
		if(!this._events.getVar("sg-def-tm-spacing-h")) this._events.setVar("sg-def-tm-spacing-h", "0");
		if(!this._events.getVar("sg-def-tm-spacing-v")) this._events.setVar("sg-def-tm-spacing-v", "0");
		if(!this._events.getVar("sg-def-tm-rows")) this._events.setVar("sg-def-tm-rows", "-1");
		if(!this._events.getVar("sg-def-tm-cols")) this._events.setVar("sg-def-tm-cols", "-1");
		if(!this._events.getVar("sg-def-tm-dec")) this._events.setVar("sg-def-tm-dec", "0");
		
		this._hspacing = this._events.getVar("sg-def-tm-spacing-h");
		this._vspacing = this._events.getVar("sg-def-tm-spacing-v");
	}
};
sgui.TileMap.prototype = new sgui.Grid();
sgui.TileMap.constructor = sgui.TileMap;

sgui.TileMap.prototype.className = "TileMap";

sgui.TileMap.prototype._tileMapStuff = function(data) {
	if(typeof(this._prop("map", data, null, false)) != "string" && this._prop("map", data, null, false)){
		var map = this._prop("map", data, null, false);
		
		var dec = (("dec" in map)?map.dec:this._events.getVar("sg-def-tm-dec")) == "1";
		loadComponent(dec?"DecimalTile":"Tile");
		
		//Get data
		if(!("rows" in map)) map.rows = this._events.getVar("sg-def-tm-rows");
		if(!("cols" in map)) map.cols = this._events.getVar("sg-def-tm-cols");
		
		if(map.rows == "-1") map.rows = Number(this._events.getVar("sys-sg-width"))/(map.width?map.width:Number((new sgui[dec?"DecimalTile":"Tile"](this, this._events, "void")).getWidth()));
		if(map.cols == "-1") map.cols = Number(this._events.getVar("sys-sg-height"))/(map.height?map.height:Number((new sgui[dec?"DecimalTile":"Tile"](this, this._events, "void")).getHeight()));
		
		map.type = dec?"DecimalTile":"Tile";
		this.populate(map);
		
		var tiles = map.map.split(/\s/g);
		
		var i = 0;
		mainLoop:for(var yi = 0; yi < map.cols; yi++){
			for(var xi = 0; xi < map.rows; xi++){
				while(!tiles[i]){if(!tiles[i+1]){break mainLoop;}else{i++;}}
				
				this.getComponent(xi+","+yi).doStuff({"tile":tiles[i]});
				i ++;
			}
		}
	}
};

