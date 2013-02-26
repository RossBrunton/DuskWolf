//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Entity");
dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.EditableTileMap");
dusk.load.require("dusk.sgui.EntityGroup");
dusk.load.require("dusk.editor");
dusk.load.require("dusk.rooms");

dusk.load.provide("dusk.sgui.BasicMain");

dusk.sgui.BasicMain = function(parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this._scrollSpeed = this._theme("plat.scrollSpeed", 10);
	this.spawn = 0;
	this.roomName = "";
	
	//Prop masks
	this._registerPropMask("spawn", "spawn", true);
	this._registerPropMask("room", "room", true, ["spawn"]);
	
	//Listeners
	this.frame.listen(this._platMainFrame, this);
	this.keyPress.listen(this.save, this, {"key":83});
	
	//Directions
	this.dirPress.listen(this._bmRightAction, this, {"dir":dusk.sgui.Component.DIR_RIGHT});
	this.dirPress.listen(this._bmLeftAction, this, {"dir":dusk.sgui.Component.DIR_LEFT});
	this.dirPress.listen(this._bmUpAction, this, {"dir":dusk.sgui.Component.DIR_UP});
	this.dirPress.listen(this._bmDownAction, this, {"dir":dusk.sgui.Component.DIR_DOWN});
};
dusk.sgui.BasicMain.prototype = new dusk.sgui.Group();
dusk.sgui.BasicMain.constructor = dusk.sgui.BasicMain;

dusk.sgui.BasicMain.prototype.className = "BasicMain";

dusk.sgui.BasicMain.prototype.createRoom = function(name, spawn) {
	var room = dusk.rooms.getRoomData(name);
	if(!room) {
		console.error("Room "+name+" does not exist.");
		return;
	}
	
	this.parseProps({"focus":"entities", "children":[
		{"name":"back", "type":"EditableTileMap", "cursorColour":"#00ff00", "flow-down":"over", "flow-up":"entities",
		"src":room.backSrc, "tile-size":dusk.entities.tsize, "sprite-size":dusk.entities.ssize, "mode":dusk.entities.mode,
		"tile-width":dusk.entities.twidth, "tile-height":dusk.entities.theight, "sprite-width":dusk.entities.swidth, "sprite-height":dusk.entities.sheight,
		"map":{"map":room.back, "rows":room.rows, "cols":room.cols}},
		
		{"name":"entities", "type":"EntityGroup", "tile-size":dusk.entities.tsize, "sprite-size":dusk.entities.ssize, "flow-down":"back", "flow-up":"scheme", "mode":dusk.entities.mode,
		"tile-width":dusk.entities.twidth, "tile-height":dusk.entities.theight, "sprite-width":dusk.entities.swidth, "sprite-height":dusk.entities.sheight},
		
		{"name":"over", "type":"EditableTileMap", "cursorColour":"#ff0000", "flow-down":"scheme", "flow-up":"back",
		"src":room.overSrc, "tile-size":dusk.entities.tsize, "sprite-size":dusk.entities.ssize, "mode":dusk.entities.mode,
		"tile-width":dusk.entities.twidth, "tile-height":dusk.entities.theight, "sprite-width":dusk.entities.swidth, "sprite-height":dusk.entities.sheight,
		"map":{"map":room.over, "rows":room.rows, "cols":room.cols}},
		
		{"name":"scheme", "type":"EditableTileMap", "cursorColour":"#0000ff", "flow-down":"entities", "flow-up":"over",
		"src":"pimg/schematics.png", "alpha":0, "tile-size":dusk.entities.tsize, "sprite-size":dusk.entities.ssize, "mode":dusk.entities.mode,
		"tile-width":dusk.entities.twidth, "tile-height":dusk.entities.theight, "sprite-width":dusk.entities.swidth, "sprite-height":dusk.entities.sheight,
		"map":{"map":room.scheme, "rows":room.rows, "cols":room.cols}},
	]});
	
	this.path("entities").scheme = this.path("scheme");
	this.path("entities").clear();
	
	var playerData = {};
	playerData.name = dusk.entities.seek;
	playerData.type = dusk.entities.seekType;
	var crd = this.getComponent("scheme").lookTile(spawn, 1);
	if(dusk.entities.mode == "BINARY") {
		playerData.x = crd[0]<<dusk.entities.tsize;
		playerData.y = crd[1]<<dusk.entities.tsize;
	}else{
		playerData.x = crd[0]*dusk.entities.twidth;
		playerData.y = crd[1]*dusk.entities.theight;
	}
	
	this.path("entities").dropEntity(playerData, true);
	
	var waitingEnts = room.entities;
	for(var i = 0; i < waitingEnts.length; i++) {
		this.path("entities").dropEntity(waitingEnts[i]);
	}
	
	this.roomName = name;
	
	this.autoScroll();
};

dusk.sgui.BasicMain.prototype._platMainFrame = function(e) {
	if(!this.getComponent("scheme")) return;
	
	//Center the player
	this.autoScroll();
	
	//Ask scheme to do something
	if(this._active) this.getComponent("entities").doFrame();
	
	//Editing
	//if(dusk.editor.active && this.getFocused().comName == "entities") this.flow("over");
	if(!dusk.editor.active && (this.getFocused() && this.getFocused().comName != "entities")) this.flow("entities");
};

dusk.sgui.BasicMain.prototype.autoScroll = function() {
	// Centre the player
	var seekCoords = [];
	if(dusk.entities.mode == "BINARY") {
		seekCoords = dusk.editor.active?[
			(dusk.sgui.EditableTileMap.globalEditX+3)<<(dusk.entities.tsize),
			(dusk.sgui.EditableTileMap.globalEditY+3)<<(dusk.entities.tsize)]
		:
			[this.path("entities/"+dusk.entities.seek).x,
			this.path("entities/"+dusk.entities.seek).y];
	}else{
		seekCoords = dusk.entities.editing?[
			(dusk.sgui.EditableTileMap.globalEditX+3)*(dusk.entities.twidth),
			(dusk.sgui.EditableTileMap.globalEditY+3)*(dusk.entities.theight)]
		:
			[this.path("entities/"+dusk.entities.seek).x,
			this.path("entities/"+dusk.entities.seek).y];
	}
	this._container.centre(seekCoords);
	
	var dimen = this._container.render();
	this.getComponent("scheme").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
	this.getComponent("back").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
	this.getComponent("over").setBoundsCoord(dimen[0], dimen[1], dimen[0]+dimen[2], dimen[1]+dimen[3]);
};

dusk.sgui.BasicMain.prototype._bmUpAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftTop();
		this.path("back").graftTop();
		this.path("over").graftTop();
		this.path("entities").adjustAll(0, 1<<this.tsize);
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveTop();
		this.path("back").carveTop();
		this.path("over").carveTop();
		this.path("entities").adjustAll(0, -(1<<this.tsize));
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype._bmDownAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftBottom();
		this.path("back").graftBottom();
		this.path("over").graftBottom();
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveBottom();
		this.path("back").carveBottom();
		this.path("over").carveBottom();
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype._bmLeftAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftLeft();
		this.path("back").graftLeft();
		this.path("over").graftLeft();
		this.path("entities").adjustAll(1<<this.tsize, 0);
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveLeft();
		this.path("back").carveLeft();
		this.path("over").carveLeft();
		this.path("entities").adjustAll(-(1<<this.tsize), 0);
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype._bmRightAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		this.path("scheme").graftRight();
		this.path("back").graftRight();
		this.path("over").graftRight();
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		this.path("scheme").carveRight();
		this.path("back").carveRight();
		this.path("over").carveRight();
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype.save = function(e) {
	if(!dusk.editor.active) return true;
	
	console.log("----- Saved Room Data -----");
	var a = {};
	a.overSrc = this.path("over").prop("src");
	a.backSrc = this.path("back").prop("src");
	a.rows = this.path("scheme").prop("rows");
	a.cols = this.path("scheme").prop("cols");
	a.back = this.path("back").save();
	a.over = this.path("over").save();
	a.scheme = this.path("scheme").save();
	a.entities = this.path("entities").save();
	console.log(JSON.stringify(a));
	console.log("----- Saved Room Data -----");
	
	return false;
};

Object.seal(dusk.sgui.BasicMain);
Object.seal(dusk.sgui.BasicMain.prototype);
