//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.TileMap");

dusk.load.provide("dusk.sgui.EditableTileMap");

/*
 */
dusk.sgui.EditableTileMap = function (parent, comName) {
	dusk.sgui.TileMap.call(this, parent, comName);
	
	this._globalCoords = false;
	this.cursorColour = "#000000";
	
	this._cx = 0;
	this._cy = 0;
	
	this.frameHeight = 1;
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

dusk.sgui.EditableTileMap.globalEditX = 0;
dusk.sgui.EditableTileMap.globalEditY = 0;
dusk.sgui.EditableTileMap.globalEditHeight = 1;
dusk.sgui.EditableTileMap.globalEditWidth = 1;

dusk.sgui.EditableTileMap.prototype._editTileMapDraw = function(c) {
	if(!this._focused) return;
	c.strokeStyle = this.prop("cursorColour");
	c.strokeRect(this._cx*this.tileWidth(), this._cy*this.tileHeight(), this.tileWidth()*this.frameWidth, this.tileHeight()*this.frameHeight);
};

dusk.sgui.EditableTileMap.prototype._editTileMapFrame = function(e) {
	if(this._focused) {
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
};

dusk.sgui.EditableTileMap.prototype._etmUpAction = function(e) {
	if(e.e.ctrlKey) return true;
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
		return false;
	}
	
	this._cy --;
};

dusk.sgui.EditableTileMap.prototype._etmDownAction = function(e) {
	if(e.e.ctrlKey) return true;
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
		return false;
	}
	
	this._cy ++;
};

dusk.sgui.EditableTileMap.prototype._etmRightAction = function(e) {
	if(e.e.ctrlKey) return true;
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
		return false;
	}
	
	this._cx ++;
};

dusk.sgui.EditableTileMap.prototype._etmLeftAction = function(e) {
	if(e.e.ctrlKey) return true;
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
		return false;
	}
	
	this._cx --;
};

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

dusk.sgui.EditableTileMap.prototype.save = function() {
	return this.map.map;
};

Object.seal(dusk.sgui.EditableTileMap);
Object.seal(dusk.sgui.EditableTileMap.prototype);

dusk.sgui.registerType("EditableTileMap", dusk.sgui.EditableTileMap);
