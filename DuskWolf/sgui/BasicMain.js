//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Entity");
dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.EditableTileMap");
dusk.load.require("dusk.sgui.EntityGroup");
dusk.load.require(">dusk.sgui.ParticleField");
dusk.load.require(">dusk.sgui.TransitionManager");
dusk.load.require(">dusk.sgui.TileRegion");
dusk.load.require(">dusk.sgui.Label");
dusk.load.require("dusk.editor");
dusk.load.require("dusk.RoomManager");

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
	
	this.roomManager = null;
	this.editorColour = "#000000";
	
	//Prop masks
	this._registerPropMask("spawn", "spawn");
	this._registerPropMask("layers", "layers");
	this._registerPropMask("editorColour", "editorColour");
	this._registerPropMask("editorColor", "editorColor");
	this._registerPropMask("room", "room", true, ["spawn"]);
	
	//Listeners
	this.frame.listen(this._basicMainFrame.bind(this));
	this.keyPress.listen(this.save, this, {"key":83});
	this.keyPress.listen(function(e) {
		if(dusk.editor.active) this.createRoom(prompt("Enter a room to go to.", this.roomName), 0);
	}, this, {"key":71});
	
	//Directions
	this.dirPress.listen(this._bmRightAction, this, {"dir":dusk.sgui.c.DIR_RIGHT});
	this.dirPress.listen(this._bmLeftAction, this, {"dir":dusk.sgui.c.DIR_LEFT});
	this.dirPress.listen(this._bmUpAction, this, {"dir":dusk.sgui.c.DIR_UP});
	this.dirPress.listen(this._bmDownAction, this, {"dir":dusk.sgui.c.DIR_DOWN});
};
dusk.sgui.BasicMain.prototype = Object.create(dusk.sgui.Group.prototype);

dusk.sgui.BasicMain.prototype.className = "BasicMain";

dusk.sgui.BasicMain.LAYER_TILEMAP = 0x01;
dusk.sgui.BasicMain.LAYER_SCHEME = 0x02;
dusk.sgui.BasicMain.LAYER_ENTITIES = 0x04;
dusk.sgui.BasicMain.LAYER_PARTICLES = 0x08;
dusk.sgui.BasicMain.LAYER_TRANSITIONS = 0x10;
dusk.sgui.BasicMain.LAYER_REGION = 0x20;

dusk.sgui.BasicMain._LAYER_COLOURS = ["#ff0000", "#00ff00", "#0000ff"];

dusk.sgui.BasicMain.prototype.createRoom = function(name, spawn) {
	var room = null;
	if(this.roomManager) room = this.roomManager.getRoomData(name);
	if(!room) {
		console.error("Room "+name+" does not exist.");
		return;
	}
	
	this.roomName = name;
	
	//Yes.
	this.layers = this.layers;
	
	for(var i = 0; i < room.length; i ++) {
		this.getComponent(this._layers[i].name).loadBM(room[i], spawn);
	}
	
	var entLayers = this.getAllLayersOfType(dusk.sgui.BasicMain.LAYER_ENTITIES);
	for(var i = entLayers.length-1; i >= 0; i --) {
		entLayers[i].scheme = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME);
		entLayers[i].particles = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_PARTICLES);
		entLayers[i].width = 
		 this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME | dusk.sgui.BasicMain.LAYER_TILEMAP).width;
		entLayers[i].height = 
		 this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME | dusk.sgui.BasicMain.LAYER_TILEMAP).height;
	}
	
	var pLayers = this.getAllLayersOfType(dusk.sgui.BasicMain.LAYER_PARTICLES);
	for(var i = pLayers.length-1; i >= 0; i --) {
		pLayers[i].width = 
		 this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME | dusk.sgui.BasicMain.LAYER_TILEMAP).width;
		pLayers[i].height = 
		 this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME | dusk.sgui.BasicMain.LAYER_TILEMAP).height;
	}
	
	var crd = this.getFirstLayerOfType(dusk.sgui.BasicMain.LAYER_SCHEME).lookTile(spawn, 1);
	if(crd && dusk.entities.seek){
		var playerData = {};
		playerData.name = dusk.entities.seek;
		playerData.type = dusk.entities.seekType;
		playerData.x = crd[0]*dusk.entities.twidth;
		playerData.y = crd[1]*dusk.entities.theight;
	
		this.getComponent(this._primaryEntityGroup).dropEntity(playerData, true);
	}
	
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
		
		var colour = 0;
		
		for(var i = 0; i < val.length; i ++) {
			switch(val[i].type) {
				case dusk.sgui.BasicMain.LAYER_TILEMAP:
					this.getComponent(val[i].name, "EditableTileMap").parseProps(
					{"cursorColour":dusk.sgui.BasicMain._LAYER_COLOURS[colour++],
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "globalCoords":true
					});
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_SCHEME:
					this.getComponent(val[i].name, "EditableTileMap").parseProps(
					{"cursorColour":dusk.sgui.BasicMain._LAYER_COLOURS[colour++],
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "alpha":0, "globalCoords":true
					});
					
					if("weights" in val[i] && val[i].weights) 
						this.getComponent(val[i].name, "EditableTileMap").weights = val[i].weights;
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_REGION:
					this.getComponent(val[i].name, "TileRegion").parseProps(
					{
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "globalCoords":true,
						"alpha":0.50
					});
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_ENTITIES:
					this.getComponent(val[i].name, "EntityGroup").parseProps(
					{"name":"entities", "type":"EntityGroup",
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":dusk.entities.twidth, "theight":dusk.entities.theight,
						"swidth":dusk.entities.swidth, "sheight":dusk.entities.sheight, "globalCoords":true
					});
					
					if("primary" in val[i] && val[i].primary) this._primaryEntityGroup = val[i].name;
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_PARTICLES:
					this.getComponent(val[i].name, "ParticleField").parseProps({"upFlow":(i > 0?val[i-1].name:"")});
					
					break;
				
				case dusk.sgui.BasicMain.LAYER_TRANSITIONS:
					this.getComponent(val[i].name, "TransitionManager").parseProps({"upFlow":(i > 0?val[i-1].name:"")});
					
					break;
			}
			
			if(i > 0) this.getComponent(val[i-1].name).downFlow = val[i].name;
		}
		
		this.getComponent(val[0].name).upFlow = val[val.length-1].name;
		this.getComponent(val[val.length-1].name).downFlow = val[0].name;
		this.flow(val[0].name);
		
		this.getComponent("editorLabel", "Label").parseProps({
			"visible":false,
			"text":"",
			"height":18
		});
	}
});

dusk.sgui.BasicMain.prototype.getFirstLayerOfType = function(type) {
	for(var i = 0; i < this._layers.length; i ++) {
		if((this._layers[i].type & type) > 0) return this.getComponent(this._layers[i].name);
	}
	
	return null;
};

dusk.sgui.BasicMain.prototype.getAllLayersOfType = function(type) {
	var out = [];
	for(var i = 0; i < this._layers.length; i ++) {
		if((this._layers[i].type & type) > 0) out.push(this.getComponent(this._layers[i].name));
	}
	
	return out;
};

dusk.sgui.BasicMain.prototype.getPrimaryEntityLayer = function() {
	return this.getComponent(this._primaryEntityGroup);
};

dusk.sgui.BasicMain.prototype.getTransitionManager = function() {
	return this.getAllLayersOfType(dusk.sgui.BasicMain.LAYER_TRANSITIONS)[0];
};

dusk.sgui.BasicMain.prototype.getScheme = function() {
	return this.getAllLayersOfType(dusk.sgui.BasicMain.LAYER_SCHEME)[0];
};

dusk.sgui.BasicMain.prototype.getRegion = function() {
	return this.getAllLayersOfType(dusk.sgui.BasicMain.LAYER_REGION)[0];
};

dusk.sgui.BasicMain.prototype.getSeek = function() {
	if(!this.getComponent(this._primaryEntityGroup)) return null;
	return this.getComponent(this._primaryEntityGroup).getComponent(dusk.entities.seek);
};

dusk.sgui.BasicMain.prototype._basicMainFrame = function(e) {
	//Center the player
	this.autoScroll();
	
	//Ask all entities to do something
	if(this._active) {
		for(var i = 0; i < this._layers.length; i ++) {
			if(this._layers[i].type == dusk.sgui.BasicMain.LAYER_ENTITIES) 
				this.getComponent(this._layers[i].name).doFrame();
		}
	}
	
	//Editing
	if(dusk.editor.active) {
		this.focusBehaviour = dusk.sgui.Group.FOCUS_ONE;
		
		if(this.getComponent("editorLabel")) {
			this.getComponent("editorLabel").visible = true;
			this.getComponent("editorLabel").text = "Editing: " + this.focus;
			this.getComponent("editorLabel").x = this.xOffset + this.width/2 - this.getComponent("editorLabel").width/2;
			this.getComponent("editorLabel").y = this.yOffset + 10;
			this.getComponent("editorLabel").colour = this.editorColour;
		}
	}else{
		this.focusBehaviour = dusk.sgui.Group.FOCUS_ALL;
		
		if(this.getComponent("editorLabel")) {
			this.getComponent("editorLabel").visible = false;
			this.getComponent("editorLabel").text = this.focus;
		}
	}
};

dusk.sgui.BasicMain.prototype.autoScroll = function() {
	// Centre the player
	var seekCoords = [];
	if(dusk.editor.active) {
		seekCoords = [
			(dusk.sgui.EditableTileMap.globalEditX+3)*(dusk.entities.twidth),
			(dusk.sgui.EditableTileMap.globalEditY+3)*(dusk.entities.theight)
		];
	}else if(this.getSeek()) {
		seekCoords = [this.getSeek().x, this.getSeek().y];
	}else{
		//seekCoords = [0, 0];
		return;
	}
	
	this.xOffset = seekCoords[0] - (this.width >> 1);
	this.yOffset = seekCoords[1] - (this.height >> 1);
	
	if(this.xOffset > this.getContentsWidth(false) - this.width)
		this.xOffset = this.getContentsWidth(false) - this.width;
	if(this.yOffset > this.getContentsHeight(false) - this.height)
		this.yOffset = this.getContentsHeight(false) - this.height;
	
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
				this.getComponent(this._layers[i].name).adjustAll(0, dusk.entities.theight);
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).rows ++;
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
				this.getComponent(this._layers[i].name).adjustAll(0, -dusk.entities.theight);
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).rows --;
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
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).rows ++;
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
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).rows --;
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
				this.getComponent(this._layers[i].name).adjustAll(dusk.entities.twidth, 0);
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).cols ++;
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
				this.getComponent(this._layers[i].name).adjustAll(-dusk.entities.twidth, 0);
			}
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).cols --;
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
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).cols ++;
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
			if(this.getComponent(this._layers[i].name) instanceof dusk.sgui.TileRegion) {
				this.getComponent(this._layers[i].name).cols --;
			}
		}
		return false;
	}
	
	return true;
};

dusk.sgui.BasicMain.prototype.save = function(e, returnRoom) {
	if(!dusk.editor.active) return true;
	
	if(e === undefined || typeof e == "object") e = prompt("Please enter a package name.", this.roomName);
	
	console.log("----- Exported Room Data "+e+" -----");
	var deps = [this.roomManager.packageName, "dusk.entities"];
	var out = "";
	out += "\"use strict\";\n\n";
	
	var ad = (function(str) {
		if(deps.indexOf(str) === -1) deps.push(str);
	}).bind(out);
	
	var a = [];
	for(var i = 0; i < this._layers.length; i ++) {
		a.push(this.getComponent(this._layers[i].name).saveBM(ad));
	}
	
	for(var i = 0; i < deps.length; i ++) {
		out += "dusk.load.require(\""+deps[i]+"\");\n";
	}
	
	out += "\ndusk.load.provide(\""+e+"\");\n";
	
	out += "\n";
	out += e + " = "+JSON.stringify(a, undefined, 0)+";\n\n";
	out += this.roomManager.managerPath+".createRoom(\""+this.roomName+"\", "+e+");\n\n";
	out += "//Remember to add your listeners!";
	
	var count = 0;
	while(out.indexOf('"%'+count+'"') !== -1) {
		out = out.replace('"%'+count+'"', prompt("Please enter a replacement for %"+count));
		count ++;
	}
	
	console.log(out);
	console.log("----- End Exported Room Data -----");
	
	if(returnRoom) return out;
	return false;
};

Object.seal(dusk.sgui.BasicMain);
Object.seal(dusk.sgui.BasicMain.prototype);

dusk.sgui.registerType("BasicMain", dusk.sgui.BasicMain);

dusk.sgui.IBasicMainLayer = function() {};

dusk.sgui.IBasicMainLayer.saveBM = function() {};
dusk.sgui.IBasicMainLayer.loadBM = function() {};
