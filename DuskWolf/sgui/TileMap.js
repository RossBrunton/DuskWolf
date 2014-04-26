//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.utils");
dusk.load.require(">dusk.Image");

dusk.load.provide("dusk.sgui.TileMap");
dusk.load.provide("dusk.sgui.TileMapWeights");

/** @class dusk.sgui.TileMap
 * 
 * @classdesc This is a lot of tiles arranged in a grid.
 * 
 * This can be thought of as a lot of `{@link dusk.sgui.Tile}` instances arranged in a grid,
 *  but for practical reasons this is not how it is implemented.
 * 
 * Each tile on the grid has a coordinate, where the tile at the upper left is at (0, 0),
 *  and the next one to the right is (1, 0) and so on.
 * 
 * The tilemap must be drawn completley before it can be used, hence changing any tile
 *  and especially changing the dimensions of the tilemap is a really expensive operation.
 *
 * Only part of the tilemap is visible, as described by the `*bound` properties, and this will be the only area drawn.
 * 
 * Some functions accept and return tileData objects. This is essentially an array, the first two elements are the x and
 *  y coordinates of the image displayed (from the original stylesheet), the second two are the x and y coordinates that
 *  this tiledata describes, and the last two elements is the weight of this tile and an integer which is 0 iff the
 *  tile is not solid else 1.
 * 
 * TileMaps have the property `{@link dusk.sgui.Component#mousePierce}` set to true by default.
 * 
 * @extends dusk.sgui.Component
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @constructor
 */
dusk.sgui.TileMap = function (parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	/** The width (for displaying) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 32
	 */
	this.twidth = 32;
	/** The height (for displaying) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 32
	 */
	this.theight = 32;
	
	/** The width (for reading from the image) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 16
	 */
	this.swidth = 16;
	/** The height (for reading from the image) of a single tile if this tilemap is in `"DECIMAL"` mode.
	 * @type integer
	 * @default 16
	 */
	this.sheight = 16;

	
	/** The number of rows in this TileMap.
	 * @type integer
	 * @default 50
	 */
	this.rows = 50;
	/** The number of columns in this TileMap.
	 * @type integer
	 * @default 50
	 */
	this.cols = 50;
	
	/** The actual map to draw. Setting this will cause the map to update.
	 * 
	 * This can be set in two ways. Both ways require a string that describes the TileMap,
	 *  this can be outputted from `{@link dusk.sgui.EditableTilemap#save}`,
	 *  or as a whitespace seperated list of all the tile coordinates in order.
	 * 
	 * This can either be an object with optional properties `rows` and `cols` describing the dimensions,
	 *  and a required property `map` being the string. Or the string itself can be set directly.
	 * 
	 * @type object|string
	 */
	this.map = null;
	
	/** Used internall ty store the set image src.
	 * @type string
	 * @private
	 * @since 0.0.20-alpha
	 */
	this._src = "";
	/** The path to the background image on which tiles are copied from.
	 * @type string
	 */
	this.src = "";
	/** The actual image object used to store the source image.
	 * @type dusk.Image
	 * @private
	 */
	this._img = null;
	
	/** An array of canvases that has the full drawn tilemap for each frame on it.
	 *  This will be copied onto the real canvas when it's time to draw it.
	 * @type array
	 * @private
	 */
	this._all = [];
	/** True if the current map has been drawn yet, else false.
	 * @type boolean
	 * @private
	 */
	this._drawn = false;
	
	/** An array of buffers used to store all the tiles.
	 * @type array
	 * @protected
	 */
	this._tileBuffer = [];
	/** An array of all the tiles that the tilemap contains per frame,
	 *  in order of where they appear on the screen (left to right, then up to down).
	 * 
	 * Each coordinate has two bytes (hence to entries in this array), `x` then `y`,
	 *  and refers to the location on the origin image for the tile.
	 * @type array
	 * @protected
	 */
	this._tiles = [];
	
	/** The time left before changing frames.
	 * @type integer
	 * @private
	 * @since 0.0.19-alpha
	 */
	this._frameRemaining = 0;
	/** The delay between each animation frame, in frames.
	 * @type integer
	 * @private
	 * @since 0.0.19-alpha
	 */
	this._frameDelay = 5;
	/** The current frame the animation is on.
	 * @type integer
	 * @private
	 * @since 0.0.19-alpha
	 */
	this._currentFrame = 0;
	/** The total number of frames needed.
	 * @type integer
	 * @private
	 * @since 0.0.19-alpha
	 */
	this._frames = 0;
	/** Whether the tilemap is animating or not.
	 * @type boolean
	 * @default true
	 * @since 0.0.19-alpha
	 */
	this.animating = true;
	
	/** If set, this is the weights of a given tile. This can be changed often, and incurs no performance problems.
	 * @type ?dusk.sgui.TileMapWeights
	 * @since 0.0.21-alpha
	 */
	this.weights = null;
	
	//Prop masks
	this._registerPropMask("map", "map", true, 
		["src", "swidth", "sheight", "theight", "twidth", "tsize"]
	);
	this._registerPropMask("src", "src");
	this._registerPropMask("rows", "rows");
	this._registerPropMask("cols", "cols");
	this._registerPropMask("animated", "animated");
	
	this._registerPropMask("sheight", "sheight");
	this._registerPropMask("swidth", "swidth");
	
	this._registerPropMask("theight", "theight");
	this._registerPropMask("twidth", "twidth");
	
	//Listeners
	this.prepareDraw.listen(this._tileMapDraw, this);
	this.frame.listen(this._tileMapFrame, this);
	
	//Default values
	this.augment.listen((function(e) {
		this.mouse.clickPierce = true;
	}).bind(this), {"augment":"mouse"});
};
dusk.sgui.TileMap.prototype = Object.create(dusk.sgui.Component.prototype);

dusk.sgui.TileMap.prototype.className = "TileMap";

//map
Object.defineProperty(dusk.sgui.TileMap.prototype, "map", {
	set: function(value) {
		if(!value) return;
		if(typeof value == "string") value = {"map":value};
		var map = value;
		
		//Get stuff
		if(!("rows" in map)) map.rows = this.rows;
		if(!("cols" in map)) map.cols = this.cols;
		
		if("src" in map) {
			this.src = map.src;
		}
		
		if("ani" in map) {
			for(var i = map.ani.length-1; i >= 0; i --) {
				dusk.sgui.TileMap.setAnimation(this.src, map.ani[i]);
			}
		}
		
		this._frames = this._framesNeeded();
		
		var singleW = this.twidth;
		var singleH = this.theight;
		
		if("performance" in window && "now" in window.performance) var t = performance.now();
		
		this._tileBuffer = [];
		this._tiles = [];
		this._all = [];
		
		var buffer = dusk.utils.stringToData(map.map);
		this._tileBuffer[0] = buffer;
		this._tiles[0] = new Uint8Array(this._tileBuffer[0]);
		this._all[0] = dusk.utils.createCanvas((this.cols*singleW)+this.width, (this.rows*singleH)+this.height);
		
		if(this._frames > 1) {
			for(var i = 1; i < this._frames; i ++) {
				this._tileBuffer[i] = buffer.slice(0);
				this._tiles[i] = new Uint8Array(this._tileBuffer[i]);
				this._all[i] = dusk.utils.createCanvas((this.cols*singleW)+this.width, (this.rows*singleH)+this.height);
			}
		}
		
		this.rows = map.rows;
		this.cols = map.cols;
		
		this.drawAll();
		if(t) console.log("Map took "+(performance.now()-t)+"ms to render!");
	},
	
	get: function(){
		var hold = {};
		hold.rows = this.rows;
		hold.cols = this.cols;
		hold.src = this.src;
		hold.ani = [];
		
		var ani = dusk.sgui.TileMap.getAllAnimation(this.src);
		for(var p in ani) {
			hold.ani[hold.ani.length] = ani[p];
		}
		
		hold.map = dusk.utils.dataToString(this._tileBuffer[0], dusk.utils.SD_BC16);
		
		return hold;
	}
});

//src
Object.defineProperty(dusk.sgui.TileMap.prototype, "src", {
	get: function() {return this._src;},
	
	set: function(value) {
		if(value) {
			this._img = new dusk.Image(value);
			this._src = value;
		}else{
			this._img = null;
			this._src = "";
		}
	}
});

/** Causes the map to update it's display. 
 * 
 * This will be called automatically before the map is drawn, but you can call it here first if you want.
 * 
 * @return {boolean} Whether it was successfull. This can fail if the origin image is not downloaded yet.
 */
dusk.sgui.TileMap.prototype.drawAll = function() {
	this._drawn = false;
	
	if(!this._img || !this._img.isReady()) return false;
	
	this._frames = this._framesNeeded();
	this._currentFrame = 0;
	this._framesRemaining = this._frameDelay;
	
	for(var f = 0; f < this._frames; f ++) {
		this._editAnimation(this._tiles[0], f);
		var i = 0;
		//this._all[f].getContext("2d").clearRect(0, 0, this._all[f].width, this._all[f].height);
		for (var yi = 0; yi < this.rows; yi++) {
			for (var xi = 0; xi < this.cols; xi++) {
				this._img.paint(this._all[f].getContext("2d"), "", false,
					this._tiles[f][i]*this.swidth, this._tiles[f][i+1]*this.sheight, this.swidth, this.sheight, 
					xi*this.swidth, yi*this.sheight, this.swidth, this.sheight
				);
				i+=2;
			}
		}
	}
	
	this._drawn = true;
	return true;
};

/** Given the first frame in the tilemap, will update `arr` such that it is `offset` frames array.
 * 
 * If the arrays are not the same size, then the destination array will be recreated at that size.
 * @param {Uint8Array} origin The first frame.
 * @param {integer} offset The frame to set.
 * @private
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.prototype._editAnimation = function(origin, offset) {
	var ani = dusk.sgui.TileMap.getAllAnimation(this.src);
	var hold = [];
	var changed = false;
	
	if(offset >= this._tiles.length || origin.length != this._tiles[offset].length) {
		this._tileBuffer[offset] = origin.buffer.slice(0);
		this._tiles[offset] = new Uint8Array(this._tileBuffer[offset]);
		this._all[offset] = 
			dusk.utils.createCanvas((this.cols*this.swidth)+this.width, (this.rows*this.sheight)+this.height);
	}
	
	for(var i = origin.length-2; i >= 0; i -= 2) {
		changed = false;
		for(var p in ani) {
			if(p == origin[i]+","+origin[i+1]) {
				hold = ani[p][offset % ani[p].length].split(",");
				this._tiles[offset][i] = +hold[0];
				this._tiles[offset][i + 1] = +hold[1];
				changed = true;
			}
		}
		if(!changed) {
			this._tiles[offset][i] = origin[i];
			this._tiles[offset][i+1] = origin[i+1];
		}
	}
};

/** Returns the location of the source tile on the origin image
 *  (as in, the one that was drawn to here) that the specified coordinate is in.
 * 
 * Please return the output to `{@link dusk.sgui.TileMap.tileData}` when you are done.
 * @param {integer} x The x coordinate to look in.
 * @param {integer} y The y coordinate to look in.
 * @param {boolean=false} exactX If true
 *  then the specified x coordinate must exactly match the x coordinate of a tile on this map.
 * @param {boolean=false} exactY If true
 *  then the specified y coordinate must exactly match the y coordinate of a tile on this map.
 * @return {?array} An `[x,y]` array specifying the tile that is here, or `null`, if there is no tile here.
 */
dusk.sgui.TileMap.prototype.tilePointIn = function(x, y, exactX, exactY) {
	var xpt = x/this.twidth;
	var ypt = y/this.theight;
	
	if(exactX && exactY){
		return this.getTile(xpt, ypt);
	}else if(exactX){
		return this.getTile(xpt, ~~ypt);
	}else if(exactY){
		return this.getTile(~~xpt, ypt);
	}else{
		return this.getTile(~~xpt, ~~ypt);
	}
};

/** Assumes this TileMap is a schematic, and returns whether the specified coordinates are in a solid place.
 * 
 * If they are in a solid place, it returns the number of pixels to add to the x or y coordinate such that there is no
 * collision.
 * 
 * Solid tiles have a weight of greater than 100.
 * 
 * @param {integer} x The x coordinate to check.
 * @param {integer} y The y coordinate to check.
 * @param {boolean=false} shiftRight If true, then the entitiy will be shifted right/down, else left/up.
 * @param {boolean=false} shiftVer If true, then this will return the shift for vertical, rather than horizontal.
 * @return {integer} The number of pixels to shift this. This will be negative for left or up shifts.
 * @since 0.0.20-alpha
 */
dusk.sgui.TileMap.prototype.mapSolidIn = function(x, y, shiftRightDown, shiftVer) {
	if(!this.weights) {
		return 0;
	}
	
	var tileNow = this.tilePointIn(x, y);
	var toRet = 0;
	
	if(this.weights.getSolid(tileNow[0], tileNow[1])) {
		if(!shiftRightDown && !shiftVer)
			toRet = -(x % this.tileWidth());
		if(shiftRightDown && !shiftVer)
			toRet = -(x % this.tileWidth()) + this.tileWidth();
		if(!shiftRightDown && shiftVer)
			toRet = -(y % this.tileHeight());
		if(shiftRightDown && shiftVer)
			toRet = -(y % this.tileHeight()) + this.tileHeight();
	}
	
	dusk.sgui.TileMap.tileData.free(tileNow);
	
	return toRet;
};

/** Used internally to manage frames.
 * @param {object} e A `frame` event object.
 * @private
 */
dusk.sgui.TileMap.prototype._tileMapFrame = function(e) {
	if(this.animating && (!("editor" in dusk) || !dusk.editor.active)) {
		if(--this._framesRemaining == 0) {
			this._framesRemaining = this._frameDelay;
			this._currentFrame = (this._currentFrame + 1) % this._frames;
		}
	}else{
		this._currentFrame = 0;
	}
};

/** Used internally to draw the tilemap.
 * @param {object} e A `prepareDraw` event object.
 * @private
 */
dusk.sgui.TileMap.prototype._tileMapDraw = function(e) {
	if(!this._img) return;
	if(!this._drawn) this.drawAll();
	
	var hscale = this.swidth/this.twidth;
	var vscale = this.sheight/this.theight;
	e.c.drawImage(this._all[this._currentFrame], e.d.sourceX*hscale, e.d.sourceY*vscale, e.d.width*hscale, e.d.height*vscale, 
		e.d.destX, e.d.destY, e.d.width, e.d.height
	);
};

/** Returns the tile drawn at the specified coordinates.
 * 
 * Please return the output to `{@link dusk.sgui.TileMap.tileData}` when you are done.
 * @param {integer} x The x coordinate.
 * @param {integer} y The y coordinate.
 * @return {array} An `[x,y]` style array of the tile at this location.
 */
dusk.sgui.TileMap.prototype.getTile = function(x, y) {
	var t = dusk.sgui.TileMap.tileData.alloc();
	t[2] = x;
	t[3] = y;
	
	if(this._tiles[0][((y*this.cols)+x)<<1] !== undefined) {
		t[0] = this._tiles[0][((y*this.cols)+x)<<1];
		t[1] = this._tiles[0][(((y*this.cols)+x)<<1)+1];
		
		if(this.weights) {
			t[4] = this.weights.getWeight(t[0], t[1]);
			t[5] = this.weights.getSolid(t[0], t[1])?1:0;
		}else{
			t[4] = 1;
			t[5] = 0;
		}
	}
	
	//console.warn("Tile "+x+","+y+" not found on "+this.comName+".");
	
	return t;
};

/** Given a tile and a direction, updates the tile data such that it refers to that tile.
 * 
 * Please return the output to `{@link dusk.sgui.TileMap.tileData}` when you are done.
 * @param {Array} t The tile to shift.
 * @param {integer} dir The direction to shift, one of the `dusk.sgui.c.DIR_*` constants.
 * @return {array} A tiledata array of the tile at this location.
 */
dusk.sgui.TileMap.prototype.shiftTile = function(t, dir) {
	if(dir == dusk.sgui.c.DIR_UP) {
		t[3] --;
		t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
		t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
	}else if(dir == dusk.sgui.c.DIR_DOWN) {
		t[3] ++;
		t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
		t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
	}else if(dir == dusk.sgui.c.DIR_LEFT) {
		t[2] --;
		t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
		t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
	}else if(dir == dusk.sgui.c.DIR_RIGHT) {
		t[2] ++;
		t[0] = this._tiles[0][((t[3]*this.cols)+t[2])<<1];
		t[1] = this._tiles[0][(((t[3]*this.cols)+t[2])<<1)+1];
	}
	
	if(this.weights) {
		t[4] = this.weights.getWeight(t[0], t[1]);
		t[5] = this.weights.getSolid(t[0], t[1])?1:0;
	}else{
		t[4] = 1;
		t[5] = 0;
	}
	
	return t;
};

/** Sets the tile to be drawn at a specified location.
 * @param {integer} x The x coordinate of the tile to change.
 * @param {integer} y The y coordinate of the tile to change.
 * @param {integer} tx The x coordinate to change the tile to.
 * @param {integer} ty The y coordinate to change the tile to.
 * @param {boolean} update If true,
 *  then the map will be redrawn and updated when the new tile is set (an expensive operation).
 *  If this is not true, then the changes won't take effect until the map is redrawn.
 */
dusk.sgui.TileMap.prototype.setTile = function(x, y, tx, ty, update) {
	if(x > this.cols || y > this.rows || x < 0 || y < 0) return;
	
	if(this._tiles[0][((y*this.cols)+x)<<1] !== undefined) {
		this._tiles[0][((y*this.cols)+x)<<1] = tx;
		this._tiles[0][(((y*this.cols)+x)<<1)+1] = ty;
		if(update) this.drawAll();
	}else{
		//console.warn("Tile "+x+","+y+" not found on "+this.comName+".");
	}
};

/* I have no idea what this function does, I think it doesn't work anyway.
dusk.sgui.TileMap.prototype.getRelativeTile = function(xcoord, ycoord) {
	if(this.mode == "BINARY") {
		return this.getTile((xcoord+this.lbound >> this.tsize), (ycoord+this.ubound >> this.tsize));
	}
	return this.getTile((xcoord+this.lbound * this.twidth), (ycoord+this.ubound * this.theight));
};

dusk.sgui.TileMap.prototype.inRelativeRange = function(xcoord, ycoord) {
	if(xcoord+(this.lbound*this.twidth) < 0 || xcoord+(this.lbound*this.twidth) >= this.cols
	|| ycoord+(this.ubound*this.theight) < 0 || ycoord+(this.ubound*this.theight) >= this.rows) return false;
	return true;
};*/

/** Returns the width of a single tile.
 * @return {integer} The width of a tile.
 */
dusk.sgui.TileMap.prototype.tileWidth = function() {
	return this.twidth;
};

/** Returns the height of a single tile.
 * @return {integer} The height of a tile.
 */
dusk.sgui.TileMap.prototype.tileHeight = function() {
	return this.theight;
};

/** Returns the number of visible columns.
 * @return {integer} The number of visible columns.
 */
dusk.sgui.TileMap.prototype.visibleCols = function() {
	return Math.floor(this.width/this.tileWidth());
};

/** Returns the number of visible rows.
 * @return {integer} The number of visible columns.
 */
dusk.sgui.TileMap.prototype.visibleRows = function() {
	return Math.floor(this.height/this.tileHeight());
};

/** Looks for a specified tile (from the origin image), and then returns the coordinates of where it is on this tilemap.
 * @param {integer} x The x of the tile origin we are looking for.
 * @param {integer} y The y of the tile origin we are looking for.
 * @return {?array} The location of a tile that contains the specified image,
 *  in `[x,y]` format, or null if none were found.
 */
dusk.sgui.TileMap.prototype.lookTile = function(x, y) {
	for(var t = (this.rows*this.cols)<<1; t > 0; t-=2){
		if(this._tiles[0][t] == x && this._tiles[0][t+1] == y) {
			return [(t >> 1) % this.cols, Math.floor((t >> 1)/this.cols)];
		}
	}
	
	return null;
};

//width
Object.defineProperty(dusk.sgui.TileMap.prototype, "width", {
	get: function() {
		return this.cols*this.twidth;
	},

	set: function(value) {if(value > 0) console.warn("TileMap setting width is not supported.");}
});

//height
Object.defineProperty(dusk.sgui.TileMap.prototype, "height", {
	get: function() {
		return this.rows*this.theight;
	},

	set: function(value) {if(value > 0) console.warn("TileMap setting height is not supported.");}
});

/** Internal storage for the animation data.
 * 
 * Keys are tilesheet paths and the value is another object. In the second object, the keys are the first frame of the
 *  animation, and their value is the whole animation.
 * @type object
 * @private
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap._animationData = {};

/** Sets an animation on the specified sheet, animating all tiles that match the first element of the animation array.
 * 
 * @param {string} sheet The path of the sheet to animate with. Must be exactly the same as the src used to specify the 
 *  tiles on the TileMap.
 * @param {array} animation An array of tile strings (`"0,0"` for example) that describe the animation. The first
 *  element must be the tile set on the map data.
 * @static
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.setAnimation = function(sheet, animation) {
	if(!(sheet in dusk.sgui.TileMap._animationData)) {
		dusk.sgui.TileMap._animationData[sheet] = {};
	}
	dusk.sgui.TileMap._animationData[sheet][animation[0]] = animation;
	
	if(!animation || animation.length < 2) {
		delete dusk.sgui.TileMap._animationData[sheet][animation[0]];
	}
};

/** Gets an animation on the specified sheet.
 * 
 * @param {string} sheet The path of the sheet to animate with. Must be exactly the same as the src used to specify the 
 *  tiles on the TileMap.
 * @param {array} base The first tile of the animation.
 * @return {array} The animation, as an array of tiles to set. If no animation is set, this will have a length of one.
 * @static
 * @since 0.0.20-alpha
 */
dusk.sgui.TileMap.getAnimation = function(sheet, base) {
	if(!(sheet in dusk.sgui.TileMap._animationData)) {
		return [base];
	}
	
	if(dusk.sgui.TileMap._animationData[sheet][base]) {
		return dusk.sgui.TileMap._animationData[sheet][base];
	}
	
	return [base];
};

/** Returns an object of all the animations registered on the specified sheet.
 * 
 * @param {string} sheet The path of the sheet to get the animations for.
 * @return {object} All the animations. The key is the first frame in the animation, while the values are the full
 *  animation. Returns an empty object if no animations have been registered for the sheet.
 * @static
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.getAllAnimation = function(sheet) {
	if(!(sheet in dusk.sgui.TileMap._animationData)) {
		dusk.sgui.TileMap._animationData[sheet] = {};
	}
	return dusk.sgui.TileMap._animationData[sheet];
};

/** Returns the minimum number of frames needed to animate.
 * 
 * @param {?integer} test Used for recursion; the number to test to see if it works.
 * @return {integer} The lowest number of frames that the animation can use.
 * @since 0.0.19-alpha
 */
dusk.sgui.TileMap.prototype._framesNeeded = function(test) {
	if(test === undefined) test = 1;
	var ani = dusk.sgui.TileMap.getAllAnimation(this.src);
	var valid = true;
	for(var p in ani) {
		if((test % ani[p].length) != 0) {
			valid = false;
			break;
		}
	};
	
	if(valid == true) return test;
	return this._framesNeeded(test+1);
};

/** A pool containing the values returned by `{@link dusk.sgui.TileMap#getTile}` please return them here when you are
 *  done.
 * 
 * Tile data is an array in the form `[value x, value y, tile x, tile y, weight]`.
 * 
 * @type dusk.pool<Array>
 * @since 0.0.21-alpha
 */
dusk.sgui.TileMap.tileData = new dusk.Pool(Uint8Array.bind(undefined, 5));

Object.seal(dusk.sgui.TileMap);
Object.seal(dusk.sgui.TileMap.prototype);

dusk.sgui.registerType("TileMap", dusk.sgui.TileMap);

// ----

/** @class dusk.sgui.TileMapWeights
 * 
 * @classdesc Stores weights of tilemap schematic layers.
 * 
 * Essentially, it maps a given tile on the schematic layer to a weight.
 * 
 * Tiles not set have a weight of 1. Tiles cannot have a weight of less than 1 or larger than 127.
 * 
 * Tiles can also be either solid or not solid.
 * 
 * @param {integer} rows The number of rows in the source image.
 * @param {integer} cols The number of columns in the source image.
 * @constructor
 * @since 0.0.21-alpha
 */
dusk.sgui.TileMapWeights = function(rows, cols) {
	this.rows = rows;
	this.cols = cols;
	
	this._weights = new Uint8Array(this.rows * this.cols);
};

/** Sets the weight of a given tile.
 * @param {integer} x The x coordinate of the tile on the tilesheet.
 * @param {integer} y The y coordinate of the tile on the tilesheet.
 * @param {integer} w The weight to set the tile.
 */
dusk.sgui.TileMapWeights.prototype.addWeight = function(x, y, w) {
	this._weights[(y * this.cols) + x] = w | (this._weights[(y * this.cols) + x] & 0x80);
};

/** Gets the weight of a given tile.
 * @param {integer} x The x coordinate of the tile on the tilesheet.
 * @param {integer} y The y coordinate of the tile on the tilesheet.
 * @return {integer} The weight of the given tile.
 */
dusk.sgui.TileMapWeights.prototype.getWeight = function(x, y) {
	if(!this._weights[(y * this.cols) + x]) return 1;
	return this._weights[(y * this.cols) + x] & 0x7f;
};

/** Sets whether the tile is solid or not.
 * @param {integer} x The x coordinate of the tile on the tilesheet.
 * @param {integer} y The y coordinate of the tile on the tilesheet.
 * @param {boolean} solid Whether to set the tile as solid or not.
 */
dusk.sgui.TileMapWeights.prototype.addSolid = function(x, y, solid) {
	this._weights[(y * this.cols) + x] = (solid?0x80:0x00) | (this._weights[(y * this.cols) + x] & 0x7f);
};

/** Sets whether the tile is solid or not.
 * @param {integer} x The x coordinate of the tile on the tilesheet.
 * @param {integer} y The y coordinate of the tile on the tilesheet.
 * @return {boolean} Whether the given tile is solid or not.
 */
dusk.sgui.TileMapWeights.prototype.getSolid = function(x, y) {
	return (this._weights[(y * this.cols) + x] & 0x80) == 0x80;
};
