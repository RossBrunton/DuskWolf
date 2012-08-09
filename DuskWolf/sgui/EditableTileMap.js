//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.TileMap");

goog.provide("dusk.sgui.EditableTileMap");

/**
 */
dusk.sgui.EditableTileMap = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.TileMap.call(this, parent, comName);
		
		this._registerPropMask("cursorColour", "_cursorColour", true);
		this._registerPropMask("cursorColor", "_cursorColour", true);
		this._registerPropMask("globalCoords", "_globalCoords", true);
		this._registerPropMask("frame-width", "_frameWidth", true);
		this._registerPropMask("frame-height", "_frameHeight", true);
		
		this._globalCoords = this._theme("etm.globalCoords", false);
		
		this._cx = 0;
		this._cy = 0;
		
		this._frameHeight = 1;
		this._frameWidth = 1;
		
		this._registerDrawHandler(this._editTileMapDraw);
		this._registerFrameHandler(this._editTileMapFrame);
	}
};
dusk.sgui.EditableTileMap.prototype = new dusk.sgui.TileMap();
dusk.sgui.EditableTileMap.constructor = dusk.sgui.EditableTileMap;

dusk.sgui.EditableTileMap.prototype.className = "EditableTileMap";

dusk.sgui.EditableTileMap.prototype._editTileMapDraw = function(c) {
	if(!this._focused) return;
	c.strokeStyle = this.prop("cursorColour");
	c.strokeRect(this._cx*this.tileWidth(), this._cy*this.tileHeight(), this.tileWidth()*this.prop("frame-width"), this.tileHeight()*this.prop("frame-height"));
};

dusk.sgui.EditableTileMap.prototype._editTileMapFrame = function(e) {
	if(dusk.events.getVar("etm.x") === undefined) dusk.events.setVar("etm.x", 0);
	if(dusk.events.getVar("etm.y") === undefined) dusk.events.setVar("etm.y", 0);
	if(dusk.events.getVar("etm.frame.width") === undefined) dusk.events.setVar("etm.frame.width", 1);
	if(dusk.events.getVar("etm.frame.height") === undefined) dusk.events.setVar("etm.frame.height", 1);
	
	if(this._focused) {
		dusk.events.setVar("etm.x", this._cx);
		dusk.events.setVar("etm.y", this._cy);
		dusk.events.setVar("etm.frame.width", this._frameWidth);
		dusk.events.setVar("etm.frame.height", this._frameHeight);
	}else{
		this._cx = dusk.events.getVar("etm.x");
		this._cy = dusk.events.getVar("etm.y");
		this._frameWidth = dusk.events.getVar("etm.frame.width");
		this._frameHeight = dusk.events.getVar("etm.frame.height");
	}
};

dusk.sgui.EditableTileMap.prototype._upAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[1] --;
		for(var x = this.prop("frame-width")-1; x >= 0; x --) {
			for(var y = this.prop("frame-height")-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")+0.1 >= 1) {this.prop("alpha", 1)} else {this.prop("alpha", this.prop("alpha")+0.1);}
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(70)) {
		this.prop("frame-height", this.prop("frame-height")-1);
		this.bookRedraw(); 
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(187) || dusk.mods.keyboard.isKeyPressed(189)) {
		return false;
	}
	
	this._cy --;
	this.bookRedraw();
};

dusk.sgui.EditableTileMap.prototype._downAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[1] ++;
		for(var x = this.prop("frame-width")-1; x >= 0; x --) {
			for(var y = this.prop("frame-height")-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")-0.1 <= 0) {this.prop("alpha", 0)} else {this.prop("alpha", this.prop("alpha")-0.1);}
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(70)) {
		this.prop("frame-height", this.prop("frame-height")+1);
		this.bookRedraw(); 
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(187) || dusk.mods.keyboard.isKeyPressed(189)) {
		return false;
	}
	
	this._cy ++;
	this.bookRedraw();
};

dusk.sgui.EditableTileMap.prototype._rightAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[0] ++;
		for(var x = this.prop("frame-width")-1; x >= 0; x --) {
			for(var y = this.prop("frame-height")-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")+0.1 >= 1) {this.prop("alpha", 1)} else {this.prop("alpha", this.prop("alpha")+0.1);}
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(70)) {
		this.prop("frame-width", this.prop("frame-width")+1);
		this.bookRedraw(); 
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(187) || dusk.mods.keyboard.isKeyPressed(189)) {
		return false;
	}
	
	this._cx ++;
	this.bookRedraw();
};

dusk.sgui.EditableTileMap.prototype._leftAction = function(e) {
	if(e.ctrlKey) return true;
	if(e.shiftKey) {
		var current = this.getTile(this._cx, this._cy);
		current[0] --;
		for(var x = this.prop("frame-width")-1; x >= 0; x --) {
			for(var y = this.prop("frame-height")-1; y >= 0; y --) {
				this.setTile(this._cx+x, this._cy+y, current[0], current[1]);
			}
		}
		this.drawAll();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(65)) {
		if(this.prop("alpha")-0.1 <= 0) {this.prop("alpha", 0)} else {this.prop("alpha", this.prop("alpha")-0.1);}
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(70)) {
		this.prop("frame-width", this.prop("frame-width")-1);
		this.bookRedraw(); 
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(187) || dusk.mods.keyboard.isKeyPressed(189)) {
		return false;
	}
	
	this._cx --;
	this.bookRedraw();
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
	var hold = "";
	for(var i = 0; i < this._tiles.length; i ++){
		hold += this._tiles[i]+(i+1< this._tiles.length?(i%2?" ":","):"");
	}
	return hold;
};
