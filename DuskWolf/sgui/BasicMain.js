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
dusk.load.provide("dusk.sgui.IBasicMainLayer");

dusk.sgui.BasicMain = function(parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this._scrollSpeed = 0;
	this.spawn = 0;
	this.roomName = "";
	this._primaryEntityGroup = "";
	
	this.layers = [];
	this._layers = [];
	
	//Prop masks
	this._registerPropMask("spawn", "spawn");
	this._registerPropMask("layers", "layers");
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

dusk.sgui.BasicMain.LAYER_TILEMAP = 0x01;
dusk.sgui.BasicMain.LAYER_SCHEME = 0x02;
dusk.sgui.BasicMain.LAYER_ENTITIES = 0x04;

dusk.sgui.BasicMain._LAYER_COLOURS = ["#ff0000", "#00ff00", "#ffff00", "#0000ff"];

dusk.sgui.BasicMain.prototype.createRoom = function(name, spawn) {
	var room = dusk.rooms.getRoomData(name);
	if(!room) {
		console.error("Room "+name+" does not exist.");
		return;
	}
	
	//Yes.
	this.layers = this.layers;
	
	for(var i = 0; i < room.length; i ++) {
		this.getComponent(this._layers[i].name).loadBM(room[i]);
	}
	
	var entLayers = this.getAllLayersOfType(dusk.sgui.BasicMain.LAYER_ENTITIES);
	for(var i = entLayers.length-1; i >= 0; i --) {
		entLayers[i].scheme = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME);
		entLayers[i].width = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME | dusk.sgui.BasicMain.LAYER_TILEMAP).width;
		entLayers[i].height = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME | dusk.sgui.BasicMain.LAYER_TILEMAP).height;
	}
	
	var playerData = {};
	playerData.name = dusk.entities.seek;
	playerData.type = dusk.entities.seekType;
	var crd = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME).lookTile(spawn, 1);
	if(dusk.entities.mode == "BINARY") {
		playerData.x = crd[0]<<dusk.entities.tsize;
		playerData.y = crd[1]<<dusk.entities.tsize;
	}else{
		playerData.x = crd[0]*dusk.entities.twidth;
		playerData.y = crd[1]*dusk.entities.theight;
	}
	
	this.getComponent(this._primaryEntityGroup).dropEntity(playerData, true);
	
	this.roomName = name;
	
	this.autoScroll();
};

//layers
Object.defineProperty(dusk.sgui.BasicMain.prototype, "layers", {
	get: function() {
		return this._layers;
	},
	
	set: function(val) {
		this._layers = val;
		if(!val.length) return;
		
		this.deleteAllComponents();
		
		for(var i = 0; i < val.length; i ++) {
			switch(val[i].type) {
				case dusk.sgui.BasicMain.LAYER_TILEMAP:
					this.getComponent(val[i].name, "EditableTileMap").parseProps(
					{"cursorColour":dusk.sgui.BasicMain._LAYER_COLOURS[i % dusk.sgui.BasicMain._LAYER_COLOURS.length],
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"tsize":dusk.entities.tsize, "ssize":dusk.entities.ssize, "mode":dusk.entities.mode,
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "globalCoords":true
					});
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_SCHEME:
					this.getComponent(val[i].name, "EditableTileMap").parseProps(
					{"cursorColour":dusk.sgui.BasicMain._LAYER_COLOURS[i % dusk.sgui.BasicMain._LAYER_COLOURS.length],
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"tsize":dusk.entities.tsize, "ssize":dusk.entities.ssize, "mode":dusk.entities.mode,
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "alpha":0, "globalCoords":true
					});
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_ENTITIES:
					this.getComponent(val[i].name, "EntityGroup").parseProps(
					{"name":"entities", "type":"EntityGroup", "tsize":dusk.entities.tsize,
						"ssize":dusk.entities.ssize, "downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "globalCoords":true
					});
					
					if("primary" in val[i] && val[i].primary) this._primaryEntityGroup = val[i].name;
					
					break;
			}
			
			if(i > 0) this.getComponent(val[i-1].name).downFlow = val[i].name;
		}
		
		this.getComponent(val[0].name).upFlow = val[val.length-1].name;
		this.getComponent(val[val.length-1].name).downFlow = val[0].name;
		this.flow(val[0].name);
	}
});

dusk.sgui.BasicMain.prototype.getFirstLayerOfType = function(type) {
	for(var i = 0; i < this._layers.length; i ++) {
		if((this._layers[i].type & type) > 0) return this.getComponent(this._layers[i].name);
	}
	
	return null;
};

dusk.sgui.BasicMain.prototype.getAllLayersOfType = function(type) {
	var out = []
	for(var i = 0; i < this._layers.length; i ++) {
		if((this._layers[i].type & type) > 0) out.push(this.getComponent(this._layers[i].name));
	}
	
	return out;
};

dusk.sgui.BasicMain.prototype.getPrimaryEntityLayer = function() {
	return this.getComponent(this._primaryEntityGroup);
};

dusk.sgui.BasicMain.prototype.getSeek = function() {
	if(!this.getComponent(this._primaryEntityGroup)) return null;
	return this.getComponent(this._primaryEntityGroup).getComponent(dusk.entities.seek);
};

dusk.sgui.BasicMain.prototype._platMainFrame = function(e) {
	//Center the player
	this.autoScroll();
	
	//Ask all entities to do something
	if(this._active) {
		for(var i = 0; i < this._layers.length; i ++) {
			if(this._layers[i].type == dusk.sgui.BasicMain.LAYER_ENTITIES) this.getComponent(this._layers[i].name).doFrame();
		}
	}
	
	//Editing
	if(dusk.editor.active) {
		this.focusBehaviour = dusk.sgui.Group.FOCUS_ONE;
	}else{
		this.focusBehaviour = dusk.sgui.Group.FOCUS_ALL;
	}
};

dusk.sgui.BasicMain.prototype.autoScroll = function() {
	// Centre the player
	var seekCoords = [];
	if(dusk.editor.active) {
		if(dusk.entities.mode == "BINARY") {
			seekCoords = [
				(dusk.sgui.EditableTileMap.globalEditX+3)<<(dusk.entities.tsize),
				(dusk.sgui.EditableTileMap.globalEditY+3)<<(dusk.entities.tsize)
			];
		}else{
			seekCoords = [
				(dusk.sgui.EditableTileMap.globalEditX+3)*(dusk.entities.twidth),
				(dusk.sgui.EditableTileMap.globalEditY+3)*(dusk.entities.theight)
			];
		}
	}else if(this.getSeek()) {
		seekCoords = [this.getSeek().x, this.getSeek().y];
	}else{
		seekCoords = [0, 0];
	}
	
	this.xOffset = seekCoords[0] - (this.width >> 1);
	this.yOffset = seekCoords[1] - (this.height >> 1);
	
	if(this.xOffset > this._getTrueWidth(false) - this.width) this.xOffset = this._getTrueWidth(false) - this.width;
	if(this.yOffset > this._getTrueHeight(false) - this.height) this.yOffset = this._getTrueHeight(false) - this.height;
	
	if(this.xOffset < 0) this.xOffset = 0;
	if(this.yOffset < 0) this.yOffset = 0;
};

dusk.sgui.BasicMain.prototype._bmUpAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).graftTop();
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.EntityGroup) {
				this.getComponent(this._layers[i].name).adjustAll(0, 1<<dusk.entities.tsize);
			}
		}
		
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).carveTop();
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.EntityGroup) {
				this.getComponent(this._layers[i].name).adjustAll(0, -(1<<dusk.entities.tsize));
			}
		}
		
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype._bmDownAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).graftBottom();
			}
		}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).carveBottom();
			}
		}
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype._bmLeftAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).graftLeft();
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.EntityGroup) {
				this.getComponent(this._layers[i].name).adjustAll(1<<dusk.entities.tsize, 0);
			}
		}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).carveLeft();
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.EntityGroup) {
				this.getComponent(this._layers[i].name).adjustAll(-(1<<dusk.entities.tsize), 0);
			}
		}
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype._bmRightAction = function(e) {
	if(!dusk.editor.active) return true;
	if(dusk.keyboard.isKeyPressed(187)) {
		//+
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).graftRight();
			}
		}
		return false;
	}
	
	if(dusk.keyboard.isKeyPressed(189)) {
		//-
		for(var i = this._layers.length-1; i >= 0; i --) {
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileMap) {
				this.getComponent(this._layers[i].name).carveRight();
			}
		}
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype.save = function(e) {
	if(!dusk.editor.active) return true;
	if(e === undefined || typeof e == "object") e = prompt("Please enter a package name.");
	
	console.log("----- Exported Room Data "+e+" -----");
	var out = "";
	out += "\"use strict\";\n\n";
	out += "dusk.load.require(\"dusk.rooms\");\n";
	out += "dusk.load.require(\"dusk.entities\");\n";
	out += "dusk.load.provide(\""+e+"\");\n\n";
	var a = [];
	for(var i = 0; i < this._layers.length; i ++) {
		a.push(this.getComponent(this._layers[i].name).saveBM());
	}
	out += e + " = "+JSON.stringify(a, undefined, 0)+";\n\n";
	out += "dusk.rooms.createRoom(\""+this.roomName+"\", "+e+");\n\n";
	out += "//Remember to add your listeners!";
	console.log(out);
	console.log("----- End Exported Room Data -----");
	
	return false;
};

Object.seal(dusk.sgui.BasicMain);
Object.seal(dusk.sgui.BasicMain.prototype);

dusk.sgui.registerType("BasicMain", dusk.sgui.BasicMain);

dusk.sgui.IBasicMainLayer = function() {};

dusk.sgui.IBasicMainLayer.saveBM = function() {};
dusk.sgui.IBasicMainLayer.loadBM = function() {};
