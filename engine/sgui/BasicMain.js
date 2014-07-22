//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.BasicMain", (function() {
	var sgui = load.require("dusk.sgui");
	var Group = load.require("dusk.sgui.Group");
	var EditableTileMap = load.require("dusk.sgui.EditableTileMap");
	var TileMap = load.require("dusk.sgui.TileMap");
	var EntityGroup = load.require("dusk.sgui.EntityGroup");
	var ParticleField = load.require("dusk.sgui.ParticleField");
	var TransitionManager = load.require("dusk.sgui.TransitionManager");
	var TileRegionGenerator = load.require("dusk.sgui.TileRegionGenerator");
	var Label = load.require("dusk.sgui.Label");
	var editor = load.require("dusk.editor");
	var RoomManager = load.require("dusk.RoomManager");
	var c = load.require("dusk.sgui.c");
	var entities = load.require("dusk.entities");
	var dusk = load.require("dusk");
	var keyboard = load.require("dusk.input.keyboard");
	var controls = load.require("dusk.input.controls");
	
	var BasicMain = function(parent, comName) {
		Group.call(this, parent, comName);
		
		this.scrollSpeed = 3;
		this.scrollRegion = 0.60;
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
		this._registerPropMask("scrollSpeed", "scrollSpeed");
		this._registerPropMask("scrollRegion", "scrollRegion");
		this._registerPropMask("editorColour", "editorColour");
		this._registerPropMask("editorColor", "editorColor");
		this._registerPropMask("room", "room", true, ["spawn"]);
		
		//Listeners
		this.frame.listen(this._basicMainFrame.bind(this));
		this.onControl.listen(this.saveRoomToConsole.bind(this), controls.addControl("basicmain_save", "S"));
		this.onControl.listen((function(e) {
			if(editor.active) {
				if(!e.shift) {
					this.createRoom(prompt("Enter a room to go to.", this.roomName), 0);
				}else{
					this.roomManager.setRoom(prompt("Enter a room to go to via the room manager.", this.roomName), 0);
				}
			}
		}).bind(this), controls.addControl("basicmain_goto", "G"));
		
		this.augment.listen((function(e) {
			this.mouse.focus = false;
		}).bind(this), "mouse");
		
		//Directions
		this.dirPress.listen(this._bmRightAction.bind(this), c.DIR_RIGHT);
		this.dirPress.listen(this._bmLeftAction.bind(this), c.DIR_LEFT);
		this.dirPress.listen(this._bmUpAction.bind(this), c.DIR_UP);
		this.dirPress.listen(this._bmDownAction.bind(this), c.DIR_DOWN);
	};
	BasicMain.prototype = Object.create(Group.prototype);
	
	BasicMain.LAYER_TILEMAP = 0x01;
	BasicMain.LAYER_SCHEME = 0x02;
	BasicMain.LAYER_ENTITIES = 0x04;
	BasicMain.LAYER_PARTICLES = 0x08;
	BasicMain.LAYER_TRANSITIONS = 0x10;
	BasicMain.LAYER_REGION = 0x20;
	
	var _LAYER_COLOURS = ["#ff0000", "#00ff00", "#0000ff"];
	
	BasicMain.prototype.createRoom = function(name, spawn) {
		return new Promise((function(fulfill, reject) {
			var room = null;
			this.roomManager.getRoomData(name).then((function(room) {;
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
				
				var entLayers = this.getAllLayersOfType(BasicMain.LAYER_ENTITIES);
				for(var i = entLayers.length-1; i >= 0; i --) {
					entLayers[i].scheme = this.getFirstLayerOfType(BasicMain.LAYER_SCHEME);
					entLayers[i].particles = this.getFirstLayerOfType(BasicMain.LAYER_PARTICLES);
					entLayers[i].width = this.getFirstLayerOfType(BasicMain.LAYER_SCHEME | BasicMain.LAYER_TILEMAP).width;
					entLayers[i].height = this.getFirstLayerOfType(BasicMain.LAYER_SCHEME | BasicMain.LAYER_TILEMAP).height;
				}
				
				var pLayers = this.getAllLayersOfType(BasicMain.LAYER_PARTICLES);
				for(var i = pLayers.length-1; i >= 0; i --) {
					pLayers[i].width = this.getFirstLayerOfType(BasicMain.LAYER_SCHEME | BasicMain.LAYER_TILEMAP).width;
					pLayers[i].height = this.getFirstLayerOfType(BasicMain.LAYER_SCHEME | BasicMain.LAYER_TILEMAP).height;
				}
				
				var crd = this.getFirstLayerOfType(BasicMain.LAYER_SCHEME).lookTile(spawn, 1);
				if(crd && entities.seek){
					var playerData = {};
					playerData.name = entities.seek;
					playerData.type = entities.seekType;
					playerData.x = crd[0]*entities.twidth;
					playerData.y = crd[1]*entities.theight;
				
					this.getComponent(this._primaryEntityGroup).dropEntity(playerData, true);
				}
				
				this.flow(this.getPrimaryEntityLayer().comName);
				
				this.autoScroll();
				
				fulfill({"name":name});
			}).bind(this));
		}).bind(this));
	};
	
	//layers
	Object.defineProperty(BasicMain.prototype, "layers", {
		get: function() {
			return this._layers;
		},
		
		set: function(val) {
			this._layers = val;
			if(!val.length) return;
			
			this.deleteAllComponents();
			
			var colour = 0;
			var mapType = dusk.dev?"EditableTileMap":"TileMap";
			
			for(var i = 0; i < val.length; i ++) {
				switch(val[i].type) {
					case BasicMain.LAYER_TILEMAP:
						this.getComponent(val[i].name, mapType).parseProps(
						{"cursorColour":_LAYER_COLOURS[colour++],
							"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":entities.twidth, "theight":entities.theight,
							"swidth":entities.swidth, "sheight":entities.sheight, "globalCoords":true
						});
						
						break;
					
					case BasicMain.LAYER_SCHEME:
						this.getComponent(val[i].name, mapType).parseProps(
						{"cursorColour":_LAYER_COLOURS[colour++],
							"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":entities.twidth, "theight":entities.theight,
							"swidth":entities.swidth, "sheight":entities.sheight, "alpha":0, "globalCoords":true
						});
						
						if("weights" in val[i] && val[i].weights) 
							this.getComponent(val[i].name, mapType).weights = val[i].weights;
						
						break;
					
					case BasicMain.LAYER_REGION:
						this.getComponent(val[i].name, "TileRegionGenerator").parseProps(
						{
							"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":entities.twidth, "theight":entities.theight,
							"swidth":entities.swidth, "sheight":entities.sheight, "globalCoords":true,
							"alpha":0.50
						});
						
						break;
					
					case BasicMain.LAYER_ENTITIES:
						this.getComponent(val[i].name, "EntityGroup").parseProps(
						{"name":"entities", "type":"EntityGroup",
							"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":entities.twidth, "theight":entities.theight,
							"swidth":entities.swidth, "sheight":entities.sheight, "globalCoords":true
						});
						
						if("primary" in val[i] && val[i].primary) this._primaryEntityGroup = val[i].name;
						
						break;
					
					case BasicMain.LAYER_PARTICLES:
						this.getComponent(val[i].name, "ParticleField").parseProps({"upFlow":(i > 0?val[i-1].name:"")});
						
						break;
					
					case BasicMain.LAYER_TRANSITIONS:
						this.getComponent(val[i].name, "TransitionManager")
							.parseProps({"upFlow":(i > 0?val[i-1].name:"")});
						
						break;
				}
				
				if(i > 0) this.getComponent(val[i-1].name).downFlow = val[i].name;
			}
			
			this.getComponent(val[0].name).upFlow = val[val.length-1].name;
			this.getComponent(val[val.length-1].name).downFlow = val[0].name;
			
			this.getComponent("editorLabel", "Label").parseProps({
				"visible":false,
				"text":"",
				"height":18
			});
		}
	});
	
	BasicMain.prototype.getFirstLayerOfType = function(type) {
		for(var i = 0; i < this._layers.length; i ++) {
			if((this._layers[i].type & type) > 0) return this.getComponent(this._layers[i].name);
		}
		
		return null;
	};
	
	BasicMain.prototype.getAllLayersOfType = function(type) {
		var out = [];
		for(var i = 0; i < this._layers.length; i ++) {
			if((this._layers[i].type & type) > 0) out.push(this.getComponent(this._layers[i].name));
		}
		
		return out;
	};
	
	BasicMain.prototype.getPrimaryEntityLayer = function() {
		return this.getComponent(this._primaryEntityGroup);
	};
	
	BasicMain.prototype.getTransitionManager = function() {
		return this.getAllLayersOfType(BasicMain.LAYER_TRANSITIONS)[0];
	};
	
	BasicMain.prototype.getScheme = function() {
		return this.getAllLayersOfType(BasicMain.LAYER_SCHEME)[0];
	};
	
	BasicMain.prototype.getRegion = function() {
		return this.getAllLayersOfType(BasicMain.LAYER_REGION)[0];
	};
	
	BasicMain.prototype.getSeek = function() {
		if(!this.getComponent(this._primaryEntityGroup)) return null;
		return this.getComponent(this._primaryEntityGroup).getComponent(entities.seek);
	};
	
	BasicMain.prototype._basicMainFrame = function(e) {
		//Center the player
		this.autoScroll();
		
		//Ask all entities to do something
		//if(this.active) {
			for(var i = 0; i < this._layers.length; i ++) {
				if(this._layers[i].type == BasicMain.LAYER_ENTITIES) 
					this.getComponent(this._layers[i].name).doFrame(this.active);
			}
		//}
		
		//Editing
		if(editor.active) {
			this.focusBehaviour = Group.FOCUS_ONE;
			
			if(this.getComponent("editorLabel")) {
				this.getComponent("editorLabel").visible = true;
				this.getComponent("editorLabel").text = "Editing: " + this.focus;
				this.getComponent("editorLabel").x = this.xOffset+this.width/2-this.getComponent("editorLabel").width/2;
				this.getComponent("editorLabel").y = this.yOffset + 10;
				this.getComponent("editorLabel").size = 14;
				this.getComponent("editorLabel").colour = this.editorColour;
				this.getComponent("editorLabel").borderColour = "#ffffff";
				this.getComponent("editorLabel").borderSize = 3;
			}
		}else{
			this.focusBehaviour = Group.FOCUS_ALL;
			
			if(this.getComponent("editorLabel")) {
				this.getComponent("editorLabel").visible = false;
				this.getComponent("editorLabel").text = this.focus;
			}
		}
	};
	
	BasicMain.prototype.autoScroll = function() {
		// Centre the player
		var seekCoords = [];
		if(editor.active) {
			seekCoords = [
				(EditableTileMap.globalEditX)*(entities.twidth),
				(EditableTileMap.globalEditY)*(entities.theight),
				32,
				32
			];
		}else if(this.getSeek()) {
			seekCoords = [this.getSeek().x, this.getSeek().y, this.getSeek().width, this.getSeek().height];
		}else{
			//seekCoords = [0, 0];
			return;
		}
		
		//this.xOffset = seekCoords[0] - (this.width >> 1);
		//this.yOffset = seekCoords[1] - (this.height >> 1);
		
		var oldX = this.xOffset;
		var oldY = this.yOffset;
		
		if(seekCoords[0] + (seekCoords[2] >> 1) < this.xOffset + (this.width >> 1) * this.scrollRegion)
			this.xOffset -= this.scrollSpeed;
		if(seekCoords[0] + (seekCoords[2] >> 1) > this.xOffset + this.width - ((this.width >> 1) * this.scrollRegion))
			this.xOffset += this.scrollSpeed;
		if(seekCoords[1] + (seekCoords[3] >> 1) < this.yOffset + (this.height >> 1) * this.scrollRegion)
			this.yOffset -= this.scrollSpeed;
		if(seekCoords[1] + (seekCoords[3] >> 1) > this.yOffset + this.height - ((this.height >> 1) * this.scrollRegion))
			this.yOffset += this.scrollSpeed;
		
		if(this.xOffset > this.getContentsWidth(false) - this.width)
			this.xOffset = this.getContentsWidth(false) - this.width;
		if(this.yOffset > this.getContentsHeight(false) - this.height)
			this.yOffset = this.getContentsHeight(false) - this.height;
		
		if(this.xOffset < 0) this.xOffset = 0;
		if(this.yOffset < 0) this.yOffset = 0;
		
		if((oldX != this.xOffset || oldY != this.yOffset) && this.mouse) {
			//It counts, okay!
			//this.containerUpdateMouse(this.mouse.x, this.mouse.y);
			//this.mouse.move.fire();
		}
	};
	
	BasicMain.prototype._bmUpAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).graftTop();
				}
				if(this.getComponent(this._layers[i].name) instanceof EntityGroup) {
					this.getComponent(this._layers[i].name).adjustAll(0, entities.theight);
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).rows ++;
				}
			}
			
			return false;
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).carveTop();
				}
				if(this.getComponent(this._layers[i].name) instanceof EntityGroup) {
					this.getComponent(this._layers[i].name).adjustAll(0, -entities.theight);
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).rows --;
				}
			}
			
			return false;
		}
		
		return true;
	};
	
	BasicMain.prototype._bmDownAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).graftBottom();
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).rows ++;
				}
			}
			return false;
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).carveBottom();
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).rows --;
				}
			}
			return false;
		}
		
		return true;
	};
	
	BasicMain.prototype._bmLeftAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).graftLeft();
				}
				if(this.getComponent(this._layers[i].name) instanceof EntityGroup) {
					this.getComponent(this._layers[i].name).adjustAll(entities.twidth, 0);
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).cols ++;
				}
			}
			return false;
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).carveLeft();
				}
				if(this.getComponent(this._layers[i].name) instanceof EntityGroup) {
					this.getComponent(this._layers[i].name).adjustAll(-entities.twidth, 0);
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).cols --;
				}
			}
			return false;
		}
		
		return true;
	};
	
	BasicMain.prototype._bmRightAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).graftRight();
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).cols ++;
				}
			}
			return false;
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.getComponent(this._layers[i].name) instanceof TileMap) {
					this.getComponent(this._layers[i].name).carveRight();
				}
				if(this.getComponent(this._layers[i].name) instanceof TileRegionGenerator) {
					this.getComponent(this._layers[i].name).cols --;
				}
			}
			return false;
		}
		
		return true;
	};
	
	BasicMain.prototype.saveRoomToConsole = function(e, returnRoom) {
		if(!editor.active) return true;
		
		if(e === undefined || typeof e == "object") e = prompt("Please enter a package name.", this.roomName);
		
		console.log("----- Exported Room Data "+e+" -----");
		var deps = [this.roomManager.packageName, "dusk.entities"];
		var out = "";
		out += "\"use strict\";\n\n";
		
		out += "load.provide(\""+e+"\", (function() {\n\t";
		
		var ad = (function(str) {
			if(deps.indexOf(str) === -1) deps.push(str);
		}).bind(out);
		
		var a = [];
		for(var i = 0; i < this._layers.length; i ++) {
			a.push(this.getComponent(this._layers[i].name).saveBM(ad));
		}
		
		out += "var manager = ";
		for(var i = 0; i < deps.length; i ++) {
			out += "load.require(\""+deps[i]+"\");\n\t";
		}
		
		out += "\n\t";
		out += "var room = "+JSON.stringify(a, undefined, 0)+";\n\t\n\t";
		out += "manager."+this.roomManager.managerPath+".createRoom(\""+this.roomName+"\", room);\n\t\n\t";
		out += "//Remember to add extra code!\n\t";
		
		var count = 0;
		while(out.indexOf('"%'+count+'"') !== -1) {
			out = out.replace('"%'+count+'"', prompt("Please enter a replacement for %"+count));
			count ++;
		}
		
		out += "return room;\n";
		out += "})());";
		
		console.log(out);
		console.log("----- End Exported Room Data -----");
		
		if(returnRoom) return out;
		return false;
	};
	
	sgui.registerType("BasicMain", BasicMain);
	
	return BasicMain;
})());


load.provide("dusk.sgui.IBasicMainLayer", (function() {
	var IBasicMainLayer = function() {};
	
	IBasicMainLayer.saveBM = function() {};
	IBasicMainLayer.loadBM = function() {};
	
	return IBasicMainLayer;
})());
