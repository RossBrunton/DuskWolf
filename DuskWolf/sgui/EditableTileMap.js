//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.TileMap");

dusk.load.provide("dusk.sgui.EditableTileMap");

/** Creates a new Editable TileMap.
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * 
 * @class dusk.sgui.EditableTileMap
 * 
 * @classdesc Extends the regular tilemap to add the ability to edit them.
 * 
 * When this has focus, keyboard combinations will be recognised and can change things, and a "frame" or "cursor" will appear, allowing you to select and change tiles.
 * 
 * @extends dusk.sgui.TileMap
 * @constructor
 */
dusk.sgui.EditableTileMap = function (parent, comName) {
	dusk.sgui.TileMap.call(this, parent, comName);
	
	/** If true, then this will use "global coordinates", meaning that the location of the frame will be the same over all EditableTileMaps with this set to true.
	 * @type boolean
	 * @default false
	 */
	this.globalCoords = false;
	/** The colour of the frame, which appears as a border.
	 * @type string
	 * @default "#000000"
	 */
	this.cursorColour = "#000000";
	
	/** The current x of the tile the cursor is at. This is not the x coordinate at which it is drawn, but the actual tile coordinate.
	 * @type integer
	 * @protected
	 */
	this._cx = 0;
	/** The current y of the tile the cursor is at. This is not the y coordinate at which it is drawn, but the actual tile coordinate.
	 * @type integer
	 * @protected
	 */
	this._cy = 0;
	
	/** The height of the frame, in tiles. Whenever a change is made, all the tiles in the frame will be set the same value.
	 * @type integer
	 * @default 1
	 */
	this.frameHeight = 1;
	/** The width of the frame, in tiles. Whenever a change is made, all the tiles in the frame will be set the same value.
	 * @type integer
	 * @default 1
	 */
	this.frameWidth = 1;
	
	//Prop masks
	this._registerPropMask("cursorColour", "cursorColour");
	this._registerPropMask("cursorColor", "cursorColour");
	this._registerPropMask("globalCoords", "globalCoords");
	this._registerPropMask("frameWidth", "frameWidth");
	this._registerPropMask("frameHeight", "frameHeight");
	
	//Listeners
	this.prepareDraw.listen(this._editTileMapDraw, this);
	this.frame.listen(this._editTileMapFrame, this);
	
	//Directions
	this.dirPress.listen(this._etmRightAction, this, {"dir":dusk.sgui.Component.DIR_RIGHT});
	this.dirPress.listen(this._etmLeftAction, this, {"dir":dusk.sgui.Component.DIR_LEFT});
	this.dirPress.listen(this._etmUpAction, this, {"dir":dusk.sgui.Component.DIR_UP});
	this.dirPress.listen(this._etmDownAction, this, {"dir":dusk.sgui.Component.DIR_DOWN});
};
dusk.sgui.EditableTileMap.prototype = new dusk.sgui.TileMap();
dusk.sgui.EditableTileMap.constructor = dusk.sgui.EditableTileMap;

dusk.sgui.EditableTileMap.prototype.className = "EditableTileMap";

/** This is the tile x coordinate for all tiles that have `{@link #globalCoords}` to true.
 * @type integer
 * @static
 */
dusk.sgui.EditableTileMap.globalEditX = 0;
/** This is the tile y coordinate for all tiles that have `{@link #globalCoords}` to true.
 * @type integer
 * @static
 */
dusk.sgui.EditableTileMap.globalEditY = 0;
/** This is the frame height for all tiles that have `{@link #globalCoords}` to true.
 * @type integer
 * @static
 */
dusk.sgui.EditableTileMap.globalEditHeight = 1;
/** This is the frame width for all tiles that have `{@link #globalCoords}` to true.
 * @type integer
 * @static
 */
dusk.sgui.EditableTileMap.globalEditWidth = 1;

/** Used internally to draw the frame around tiles that are being edited.
 * @param {CanvasRenderingContext2D} c The canvas on which to draw.
 * @private
 */
dusk.sgui.EditableTileMap.prototype._editTileMapDraw = function(c) {
	if(!this._focused || !dusk.editor.active) return;
	c.strokeStyle = this.prop("cursorColour");
	c.strokeRect(this._cx*this.tileWidth(), this._cy*this.tileHeight(), this.tileWidth()*this.frameWidth, this.tileHeight()*this.frameHeight);
};

/** Called every frame, it updates the global editor coordinates if appropriate.
 * @param {object} e An event object from `{@link dusk.sgui.Component#frame}`.
 * @private
 */
dusk.sgui.EditableTileMap.prototype._editTileMapFrame = function(e) {
	if(this.globalCoords) {
		if(this._focused && dusk.editor.active) {
			dusk.sgui.EditableTileMap.globalEditX = this._cx;
			dusk.sgui.EditableTileMap.globalEditY = this._cy;
			dusk.sgui.EditableTileMap.globalEditWidth = this.frameWidth;
			dusk.sgui.EditableTileMap.globalEditHeight = this.frameHeight;
		}else{
			this._cx = dusk.sgui.EditableTileMap.globalEditX;
			this._cy = dusk.sgui.EditableTileMap.globalEditY;
			this.frameWidth = dusk.sgui.EditableTileMap.globalEditWidth;
			this.frameHeight = dusk.sgui.EditableTileMap.globalEditHeight;
		}
	}
};

/** Used to manage what happens when "up" is pressed, and any other keyboard combinations.
 * @param {object} e An event object from `{@link dusk.sgui.Component#dirPress}`.
 * @return {boolean} True if this event should bubble up to the container, else false.
 * @private
 */
dusk.sgui.EditableTileMap.prototype._etmUpAction = function(e) {
	if(e.e.ctrlKey || !dusk.editor.active) return true;
	if(e.e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[1] --;
		for(var x = this.frameWidth-1; x >= 0; x --) {
			for(var y = this.frameHeight-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(65)) {
		if(this.alpha+0.1 >= 1) {this.alpha = 1;} else {this.alpha += 0.1;}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(70)) {
		this.frameHeight--;
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(187) || dusk.keyboard.isKeyPressed(189)) {
		this._noFlow = true;
		return true;
	}
	
	if(this._cy) this._cy --;
};

/** Used to manage what happens when "down" is pressed, and any other keyboard combinations.
 * @param {object} e An event object from `{@link dusk.sgui.Component#dirPress}`.
 * @return {boolean} True if this event should bubble up to the container, else false.
 * @private
 */
dusk.sgui.EditableTileMap.prototype._etmDownAction = function(e) {
	if(e.e.ctrlKey || !dusk.editor.active) return true;
	if(e.e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[1] ++;
		for(var x = this.frameWidth-1; x >= 0; x --) {
			for(var y = this.frameHeight-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(65)) {
		if(this.alpha-0.1 <= 0) {this.alpha = 0;} else {this.alpha -= 0.1;}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(70)) {
		this.frameHeight ++;
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(187) || dusk.keyboard.isKeyPressed(189)) {
		this._noFlow = true;
		return true;
	}
	
	this._cy ++;
};

/** Used to manage what happens when "right" is pressed, and any other keyboard combinations.
 * @param {object} e An event object from `{@link dusk.sgui.Component#dirPress}`.
 * @return {boolean} True if this event should bubble up to the container, else false.
 * @private
 */
dusk.sgui.EditableTileMap.prototype._etmRightAction = function(e) {
	if(e.e.ctrlKey || !dusk.editor.active) return true;
	if(e.e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[0] ++;
		for(var x = this.frameWidth-1; x >= 0; x --) {
			for(var y = this.frameHeight-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(65)) {
		if(this.alpha+0.1 >= 1) {this.alpha = 1;} else {this.alpha += 0.1;}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(70)) {
		this.frameWidth ++;
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(187) || dusk.keyboard.isKeyPressed(189)) {
		this._noFlow = true;
		return true;
	}
	
	this._cx ++;
};

/** Used to manage what happens when "left" is pressed, and any other keyboard combinations.
 * @param {object} e An event object from `{@link dusk.sgui.Component#dirPress}`.
 * @return {boolean} True if this event should bubble up to the container, else false.
 * @private
 */
dusk.sgui.EditableTileMap.prototype._etmLeftAction = function(e) {
	if(e.e.ctrlKey || !dusk.editor.active) return true;
	if(e.e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[0] --;
		for(var x = this.frameWidth-1; x >= 0; x --) {
			for(var y = this.frameHeight-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(65)) {
		if(this.alpha-0.1 <= 0) {this.alpha = 0;} else {this.alpha -= 0.1;}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(70)) {
		this.frameWidth --;
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(187) || dusk.keyboard.isKeyPressed(189)) {
		this._noFlow = true;
		return true;
	}
	
	if(this._cx) this._cx --;
};

/** Removes the topmost row of tiles, and moves all other tiles up one to compensate. */
dusk.sgui.EditableTileMap.prototype.carveTop = function() {
	this.rows --;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = this.cols<<1;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Adds a new row to the top of the tilemap, and moves all other tiles down to compensate. */
dusk.sgui.EditableTileMap.prototype.graftTop = function() {
	this.rows ++;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		if(i < this.cols << 1) {
			newTiles[i] = 0;
			continue;
		}
		
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Removes the bottommost row of the tilemap. */
dusk.sgui.EditableTileMap.prototype.carveBottom = function() {
	this.rows --;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Adds a new row to the bottom of the tilemap. */
dusk.sgui.EditableTileMap.prototype.graftBottom = function() {
	this.rows ++;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		if(point >= this._tiles.length) {
			newTiles[i] = 0;
			continue;
		}
		
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Adds a new column onto the left of this tilemap, shifting all other cols right to compensate. */
dusk.sgui.EditableTileMap.prototype.graftLeft = function() {
	this.cols ++;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		if(i % (this.cols<<1) == 0) {
			newTiles[i++] = 0;
			newTiles[i] = 0;
			continue;
		}
		
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Removes a column from the left of this tilemap, shifting all other cols left to compensate. */
dusk.sgui.EditableTileMap.prototype.carveLeft = function() {
	this.cols --;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		if(i % (this.cols<<1) == 0) {
			point += 2;
		}
		
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Adds a new column to the right of this tilemap. */
dusk.sgui.EditableTileMap.prototype.graftRight = function() {
	this.cols ++;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		if((i+2) % (this.cols<<1) == 0) {
			newTiles[i++] = 0;
			newTiles[i] = 0;
			continue;
		}
		
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Removes a column from the right of this tilemap. */
dusk.sgui.EditableTileMap.prototype.carveRight = function() {
	this.cols --;
	var newTileBuffer = new ArrayBuffer((this.rows*this.cols)<<1);
	var newTiles = new Uint8Array(newTileBuffer);
	
	var point = 0;
	for(var i = 0; i < (this.rows*this.cols)<<1; i++) {
		if((i+1) % (this.cols<<1) == 0) {
			point+=2;
		}
		
		newTiles[i] = this._tiles[point++];
	}
	
	this._tileBuffer = newTileBuffer;
	this._tiles = new Uint8Array(this._tileBuffer);
	this.drawAll();
};

/** Returns a string representing the map in this tilemap.
 * 
 * This will be able to be used with `{@link dusk.sgui.TileMap#map}` to create this map.
 * @return {string} A string representation of the map.
 */
dusk.sgui.EditableTileMap.prototype.save = function() {
	return this.map.map;
};

/** Returns the map for `{@link dusk.sgui.BasicMain}` to save it.
 * 
 * @return {object} The current map.
 * @since 0.0.18-alpha
 */
dusk.sgui.EditableTileMap.prototype.saveBM = function() {
	return this.map;
};

/** Loads a map from an object. This is used by `{@link dusk.sgui.BasicMain}`.
 * 
 * @param {object} map The map to load, will be assigned to `{@link dusk.sgui.EditableTileMap#map}`.
 * @since 0.0.18-alpha
 */
dusk.sgui.EditableTileMap.prototype.loadBM = function(map) {
	this.map = map;
};

Object.seal(dusk.sgui.EditableTileMap);
Object.seal(dusk.sgui.EditableTileMap.prototype);

dusk.sgui.registerType("EditableTileMap", dusk.sgui.EditableTileMap);
