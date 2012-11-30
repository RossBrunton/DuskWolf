//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.PlatEntity");
dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.EditableTileMap");
dusk.load.require("dusk.sgui.EntityGroup");

dusk.load.provide("dusk.sgui.PlatMain");

/***/
dusk.sgui.PlatMain = function(parent, comName) {
	if(parent !== undefined){
		dusk.sgui.Group.call(this, parent, comName);
		
		this._registerFrameHandler(this._platMainFrame);
		this._registerKeyHandler(83, false, false, this._save, this);
		
		this._registerPropMask("spawn", "spawn", true);
		this._registerPropMask("room", "room", true, ["spawn"]);
		
		this._scrollSpeed = this._theme("plat.scrollSpeed", 10);
		this.spawn = 0;
		this.roomName = "";
	}
};
dusk.sgui.PlatMain.prototype = new dusk.sgui.Group();
dusk.sgui.PlatMain.constructor = dusk.sgui.PlatMain;

dusk.sgui.PlatMain.prototype.className = "PlatMain";

dusk.sgui.PlatMain.prototype.__defineSetter__("room", function s_room(value) {
	var room = dusk.actions.getVar("proom."+value);
	dusk.actions.setVar("theme.default.etm.globalcoords", true);
	
	this.parseProps({"focus":"noEdit", "children":[
		{"name":"noEdit", "type":"NullCom"},
		
		{"name":"back", "type":"EditableTileMap", "cursorColour":"#00ff00", "flow-down":"over", "flow-up":"entities",
		"src":room.backSrc, "tile-size":dusk.actions.getVar("plat.tsize"), "sprite-size":dusk.actions.getVar("plat.ssize"), "mode":dusk.actions.getVar("plat.mode"),
		"tile-width":dusk.actions.getVar("plat.twidth"), "tile-height":dusk.actions.getVar("plat.theight"), "sprite-width":dusk.actions.getVar("plat.swidth"), "sprite-height":dusk.actions.getVar("plat.sheight"),
		"map":{"map":room.back, "rows":room.rows, "cols":room.cols}},
		
		{"name":"entities", "type":"EntityGroup", "tile-size":this.tsize, "sprite-size":this.ssize, "flow-down":"back", "flow-up":"scheme", "mode":dusk.actions.getVar("plat.mode"),
		"tile-width":dusk.actions.getVar("plat.twidth"), "tile-height":dusk.actions.getVar("plat.theight"), "sprite-width":dusk.actions.getVar("plat.swidth"), "sprite-height":dusk.actions.getVar("plat.sheight")},
		
		{"name":"over", "type":"EditableTileMap", "cursorColour":"#ff0000", "flow-down":"scheme", "flow-up":"back",
		"src":room.overSrc, "tile-size":dusk.actions.getVar("plat.tsize"), "sprite-size":dusk.actions.getVar("plat.ssize"), "mode":dusk.actions.getVar("plat.mode"),
		"tile-width":dusk.actions.getVar("plat.twidth"), "tile-height":dusk.actions.getVar("plat.theight"), "sprite-width":dusk.actions.getVar("plat.swidth"), "sprite-height":dusk.actions.getVar("plat.sheight"),
		"map":{"map":room.over, "rows":room.rows, "cols":room.cols}},
		
		{"name":"scheme", "type":"EditableTileMap", "cursorColour":"#0000ff", "flow-down":"entities", "flow-up":"over",
		"src":"pimg/schematics.png", "alpha":0, "tile-size":dusk.actions.getVar("plat.tsize"), "sprite-size":dusk.actions.getVar("plat.ssize"), "mode":dusk.actions.getVar("plat.mode"),
		"tile-width":dusk.actions.getVar("plat.twidth"), "tile-height":dusk.actions.getVar("plat.theight"), "sprite-width":dusk.actions.getVar("plat.swidth"), "sprite-height":dusk.actions.getVar("plat.sheight"),
		"map":{"map":room.scheme, "rows":room.rows, "cols":room.cols}},
	]});
	
	this.path("entities").clear();
	
	var playerData = {};
	playerData.name = dusk.actions.getVar("plat.seek");
	playerData.type = dusk.actions.getVar("plat.seekType");
	var crd = this.getComponent("scheme").lookTile(this.spawn, 1);
	if(dusk.actions.getVar("plat.mode") == "BINARY") {
		playerData.x = crd[0]<<dusk.actions.getVar("plat.tsize");
		playerData.y = crd[1]<<dusk.actions.getVar("plat.tsize");
	}else{
		playerData.x = crd[0]*dusk.actions.getVar("plat.twidth");
		playerData.y = crd[1]*dusk.actions.getVar("plat.theight");
	}
	
	this.path("entities").dropEntity(playerData);
	
	var waitingEnts = room.entities;
	for(var i = 0; i < waitingEnts.length; i++) {
		this.path("entities").dropEntity(waitingEnts[i]);
	}
	
	this.roomName = value;
	
	this.autoScroll();
});

dusk.sgui.PlatMain.prototype.__defineGetter__("room", function g_room(){return this.roomName;});

dusk.sgui.PlatMain.prototype._platMainFrame = function(e) {
	if(!this.getComponent("scheme")) return;
	
	//Center the player
	this.autoScroll();
	
	//Ask scheme to do something
	if(this._focused) this.getComponent("entities").doFrame();
	
	//Editing
	if(dusk.actions.getVar("plat.edit.active") && this.getFocused().comName == "noedit") this.flow("over");
	if(!dusk.actions.getVar("plat.edit.active") && this.getFocused().comName != "noedit") this.flow("noEdit");
};

dusk.sgui.PlatMain.prototype.autoScroll = function() {
	// Centre the player
	var seekCoords = [];
	if(dusk.actions.getVar("plat.mode") == "BINARY") {
		seekCoords = dusk.actions.getVar("plat.edit.active")?[
			(dusk.actions.getVar("etm.x")+3)<<(dusk.actions.getVar("plat.tsize")),
			(dusk.actions.getVar("etm.y")+3)<<(dusk.actions.getVar("plat.tsize"))]
		:
			[this.path("entities/"+dusk.actions.getVar("plat.seek")).x,
			this.path("entities/"+dusk.actions.getVar("plat.seek")).y];
	}else{
		seekCoords = dusk.actions.getVar("plat.edit.active")?[
			(dusk.actions.getVar("etm.x")+3)*(dusk.actions.getVar("plat.twidth")),
			(dusk.actions.getVar("etm.y")+3)*(dusk.actions.getVar("plat.theight"))]
		:
			[this.path("entities/"+dusk.actions.getVar("plat.seek")).x,
			this.path("entities/"+dusk.actions.getVar("plat.seek")).y];
	}
	this._container.prop("seek", seekCoords);
	
	var dimen = this._container.render;
	this.getComponent("scheme").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
	this.getComponent("back").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
	this.getComponent("over").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
};

dusk.sgui.PlatMain.prototype._upAction = function(e) {
	if(!dusk.actions.getVar("plat.edit.active")) return true;
	if(dusk.mods.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftTop();
		this.path("back").graftTop();
		this.path("over").graftTop();
		this.path("entities").adjustAll(0, 1<<this.tsize);
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveTop();
		this.path("back").carveTop();
		this.path("over").carveTop();
		this.path("entities").adjustAll(0, -(1<<this.tsize));
		return false;
	}
	
	return true;
};

dusk.sgui.PlatMain.prototype._downAction = function(e) {
	if(!dusk.actions.getVar("plat.edit.active")) return true;
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
	if(!dusk.actions.getVar("plat.edit.active")) return true;
	if(dusk.mods.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftLeft();
		this.path("back").graftLeft();
		this.path("over").graftLeft();
		this.path("entities").adjustAll(1<<this.tsize, 0);
		return false;
	}
	
	if(dusk.mods.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveLeft();
		this.path("back").carveLeft();
		this.path("over").carveLeft();
		this.path("entities").adjustAll(-(1<<this.tsize), 0);
		return false;
	}
	
	return true;
};

dusk.sgui.PlatMain.prototype._rightAction = function(e) {
	if(!dusk.actions.getVar("plat.edit.active")) return true;
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
	if(!dusk.actions.getVar("plat.edit.active")) return true;
	
	console.log("----- Saved Room Data -----");
	var a = {};
	a.a = "var";
	a.name = "proom."+this.room;
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
