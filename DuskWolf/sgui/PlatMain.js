//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

goog.require("dusk.sgui.PlatEntity");
goog.require("dusk.sgui.Group");
goog.require("dusk.sgui.EditableTileMap");

goog.provide("dusk.sgui.PlatMain");

/***/
dusk.sgui.PlatMain = function (parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Group.call(this, parent, comName);
		
		this._registerFrameHandler(this._platMainFrame);
		this._registerKeyHandler(83, false, false, this._save, this);
		
		this._registerPropMask("sprite-size", "_ssize", true);
		this._registerPropMask("tile-size", "_tsize", true);
		this._registerPropMask("spawn", "_spawn", true);
		this._registerPropMask("render-width", "_renderWidth", true);
		this._registerPropMask("render-height", "_renderHeight", true);
		this._registerProp("room", this._room, function(name){return this._room}, ["spawn"]);
		this._registerProp("width", null, function(name){return this.path("scheme").prop("width")});
		this._registerProp("height", null, function(name){return this.path("scheme").prop("height")});
		
		this._renderWidth = dusk.events.getVar("sys.sg.width");
		this._renderHeight = dusk.events.getVar("sys.sg.height");
		
		this._tsize = dusk.events.getVar("plat.tsize");
		this._ssize = dusk.events.getVar("plat.ssize");
		this._scrollSpeed = this._theme("plat.scrollSpeed", 10);
		this._spawn = 0;
		this._room = "";
	}
};
dusk.sgui.PlatMain.prototype = new dusk.sgui.Group();
dusk.sgui.PlatMain.constructor = dusk.sgui.PlatMain;

dusk.sgui.PlatMain.prototype.className = "PlatMain";

dusk.sgui.PlatMain.prototype._room = function(name, value) {
	var room = dusk.events.getVar("proom."+value);
	events.setVar("theme.default.etm.globalcoords", true);
	
	this.parseProps({"focus":"noEdit", "children":[
		{"name":"noEdit", "type":"NullCom"},
		{"name":"back", "type":"EditableTileMap", "cursorColour":"#00ff00", "flow-down":"over", "flow-up":"entities", "src":room.backSrc, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":room.back, "rows":room.rows, "cols":room.cols}},
		{"name":"entities", "type":"EntityGroup", "tile-size":this._tsize, "sprite-size":this._ssize, "flow-down":"back", "flow-up":"scheme", },
		{"name":"over", "type":"EditableTileMap", "cursorColour":"#ff0000", "flow-down":"scheme", "flow-up":"back", "src":room.overSrc, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":room.over, "rows":room.rows, "cols":room.cols}},
		{"name":"scheme", "type":"EditableTileMap", "cursorColour":"#0000ff", "flow-down":"entities", "flow-up":"over", "src":"pimg/schematics.png", "alpha":0, "tile-size":this._tsize, "sprite-size":this._ssize, "map":{"map":room.scheme, "rows":room.rows, "cols":room.cols}},
	]});
	
	this.path("entities").clear();
	
	var playerData = {};
	playerData.name = dusk.events.getVar("plat.seek");
	playerData.type = dusk.events.getVar("plat.seekType");
	var crd = this.getComponent("scheme").lookTile(this._spawn, 1);
	playerData.x = crd[0]<<this._tsize;
	playerData.y = crd[1]<<this._tsize;
	
	this.path("entities").dropEntity(playerData);
	
	var waitingEnts = room.entities;
	for(var i = 0; i < waitingEnts.length; i++) {
		this.path("entities").dropEntity(waitingEnts[i]);
	}
	
	this._room = value;
	
	this.autoScroll();
};

dusk.sgui.PlatMain.prototype._platMainFrame = function(e) {
	// Center the player
	this.autoScroll();
	
	//Editing
	if(events.getVar("plat.edit.active") && this.getFocus().comName == "noedit") this.focus("over");
	if(!events.getVar("plat.edit.active") && this.getFocus().comName != "noedit") this.focus("noEdit");
};

dusk.sgui.PlatMain.prototype.autoScroll = function() {
	// Centre the player
	var seekCoords = events.getVar("plat.edit.active")?[(events.getVar("etm.x")+3)<<(this._tsize), (events.getVar("etm.y")+3)<<(this._tsize)]:[this.path("entities/"+dusk.events.getVar("plat.seek")).x, this.path("entities/"+dusk.events.getVar("plat.seek")).y];
	this._container.prop("seek", seekCoords);
	
	var dimen = this._container.prop("render");
	this.getComponent("scheme").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
	this.getComponent("back").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
	this.getComponent("over").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
};

dusk.sgui.PlatMain.prototype._upAction = function(e) {
	if(!dusk.events.getVar("plat.edit.active")) return true;
	if(dusk.mods.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftTop();
		this.path("back").graftTop();
		this.path("over").graftTop();
		this.path("entities").adjustAll(0, 1<<this._tsize);
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveTop();
		this.path("back").carveTop();
		this.path("over").carveTop();
		this.path("entities").adjustAll(0, -(1<<this._tsize));
		return false;
	}
	
	return true;
};

dusk.sgui.PlatMain.prototype._downAction = function(e) {
	if(!dusk.events.getVar("plat.edit.active")) return true;
	if(dusk.mods.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftBottom();
		this.path("back").graftBottom();
		this.path("over").graftBottom();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveBottom();
		this.path("back").carveBottom();
		this.path("over").carveBottom();
		return false;
	}
	
	return true;
};

dusk.sgui.PlatMain.prototype._leftAction = function(e) {
	if(!dusk.events.getVar("plat.edit.active")) return true;
	if(dusk.mods.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftLeft();
		this.path("back").graftLeft();
		this.path("over").graftLeft();
		this.path("entities").adjustAll(1<<this._tsize, 0);
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveLeft();
		this.path("back").carveLeft();
		this.path("over").carveLeft();
		this.path("entities").adjustAll(-(1<<this._tsize), 0);
		return false;
	}
	
	return true;
};

dusk.sgui.PlatMain.prototype._rightAction = function(e) {
	if(!dusk.events.getVar("plat.edit.active")) return true;
	if(dusk.mods.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftRight();
		this.path("back").graftRight();
		this.path("over").graftRight();
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveRight();
		this.path("back").carveRight();
		this.path("over").carveRight();
		return false;
	}
	
	return true;
};

dusk.sgui.PlatMain.prototype._save = function(e) {
	if(!dusk.events.getVar("plat.edit.active")) return true;
	
	console.log("----- Saved Room Data -----");
	var a = {};
	a.a = "var";
	a.name = "proom."+this._room;
	a.value = {};
	a.value.overSrc = this.path("over").prop("src");
	a.value.backSrc = this.path("back").prop("src");
	a.value.rows = this.path("scheme").prop("rows");
	a.value.cols = this.path("scheme").prop("cols");
	a.value.back = this.path("back").save();
	a.value.over = this.path("over").save();
	a.value.scheme = this.path("scheme").save();
	a.value.entities = this.path("entities").save();
	console.log(JSON.stringify(a));
	console.log("----- Saved Room Data -----");
	
	return false;
};
