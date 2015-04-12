//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.sgui.LayeredRoom", (function() {
	var sgui = load.require("dusk.sgui");
	var Group = load.require("dusk.sgui.Group");
	var EditableTileMap = load.require("dusk.tiles.sgui.EditableTileMap");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	var ParticleField = load.require("dusk.particles.sgui.ParticleField");
	var TransitionManager = load.require("dusk.rooms.sgui.TransitionManager");
	var FluidLayer = load.require("dusk.rooms.sgui.FluidLayer");
	var TileRegionGenerator = load.require("dusk.tiles.sgui.TileRegionGenerator");
	var Label = load.require("dusk.sgui.Label");
	var editor = load.require("dusk.rooms.editor");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var c = load.require("dusk.sgui.c");
	var entities = load.require("dusk.entities");
	var dusk = load.require("dusk");
	var keyboard = load.require("dusk.input.keyboard");
	var controls = load.require("dusk.input.controls");
	var TileMapWeights = load.require("dusk.tiles.sgui.TileMapWeights");
	var utils = load.require("dusk.utils");
	
	var LayeredRoom = function(parent, name) {
		Group.call(this, parent, name);
		
		this.scrollSpeed = 3;
		this.scrollRegion = 0.60;
		this.scrollInstantly = false;
		this.spawn = 0;
		this.roomName = "";
		this._primaryEntityGroup = "";
		
		this.layers = [];
		this._layers = [];
		
		this.roomManager = null;
		this.editorColour = "#000000";
		
		//Prop masks
		this._mapper.map("spawn", "spawn");
		this._mapper.map("layers", "layers");
		this._mapper.map("scrollSpeed", "scrollSpeed");
		this._mapper.map("scrollRegion", "scrollRegion");
		this._mapper.map("editorColour", "editorColour");
		this._mapper.map("editorColor", "editorColor");
		this._mapper.map("scrollInstantly", "scrollInstantly");
		this._mapper.map("room", "room", ["spawn"]);
		
		//Listeners
		this.frame.listen(_basicMainFrame.bind(this));
		this._drawingChildren.listen(_updateScroll.bind(this));
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
		
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_TILEMAP), controls.addControl("basicmain_add_tilemap", "M")
		);
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_SCHEME), controls.addControl("basicmain_add_scheme", "S")
		);
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_ENTITIES), controls.addControl("basicmain_add_entities", "N")
		);
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_PARTICLES), controls.addControl("basicmain_add_particles", "P")
		);
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_TRANSITIONS), controls.addControl("basicmain_add_transitions", "T")
		);
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_REGION), controls.addControl("basicmain_add_region", "R")
		);
		this.onControl.listen(
			_addLayer.bind(this, LayeredRoom.LAYER_FLUID), controls.addControl("basicmain_add_fluid", "F")
		);
		
		this.mouseFocus = false;
		
		//Directions
		this.dirPress.listen(_bmRightAction.bind(this), c.DIR_RIGHT);
		this.dirPress.listen(_bmLeftAction.bind(this), c.DIR_LEFT);
		this.dirPress.listen(_bmUpAction.bind(this), c.DIR_UP);
		this.dirPress.listen(_bmDownAction.bind(this), c.DIR_DOWN);
		
		this.xDisplay = "expand";
		this.yDisplay = "expand";
		this.width = -1;
		this.height = -1;
	};
	LayeredRoom.prototype = Object.create(Group.prototype);
	
	LayeredRoom.LAYER_TILEMAP = 0x01;
	LayeredRoom.LAYER_SCHEME = 0x02;
	LayeredRoom.LAYER_ENTITIES = 0x04;
	LayeredRoom.LAYER_PARTICLES = 0x08;
	LayeredRoom.LAYER_TRANSITIONS = 0x10;
	LayeredRoom.LAYER_REGION = 0x20;
	LayeredRoom.LAYER_FLUID = 0x40;
	
	var _LAYER_COLOURS = ["#990000", "#009900", "#000099", "#999900", "#990099"];
	
	LayeredRoom.prototype.createRoom = function(name, spawn) {
		return new Promise((function(fulfill, reject) {
			var room = null;
			this.roomManager.getRoomData(name).then((function(room) {;
				if(!room) {
					console.error("Room "+name+" does not exist.");
					return;
				}
				
				this.roomName = name;
				
				if(Array.isArray(room)) {
					// Old style
					
					//Yes.
					this.layers = this.layers;
					
					for(var i = 0; i < room.length; i ++) {
						this.get(this._layers[i].name).loadBM(room[i], spawn);
					}
				}else{
					// New style
					this.layers = room.layers;
					
					for(var i = 0; i < room.contents.length; i ++) {
						this.get(this._layers[i].name).loadBM(room.contents[i], spawn);
					}
					
					this._updateLayers();
				}
				
				var crd = [0, 0];
				if(Array.isArray(spawn)) {
					crd = spawn;
				}else{
					crd = this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME).lookTile(spawn, 1);
					if(crd) {
						crd[0] *= entities.twidth;
						crd[1] *= entities.theight;
					}
				}
				
				if(crd && entities.seek){
					var playerData = {};
					playerData.name = entities.seek;
					playerData.type = entities.seekType;
					playerData.x = crd[0];
					playerData.y = crd[1];
				
					this.get(this._primaryEntityGroup).dropEntity(playerData, true);
				}
				
				this.flow(this.getPrimaryEntityLayer().name);
				
				fulfill({"name":name});
			}).bind(this));
		}).bind(this));
	};
	
	//layers
	Object.defineProperty(LayeredRoom.prototype, "layers", {
		get: function() {
			return this._layers;
		},
		
		set: function(val) {
			this._layers = val;
			if(!val.length) return;
			
			this.empty();
			this._updateLayers();
			
			this.get("editorLabel", "Label").update({
				"visible":false,
				"text":"",
				"height":18
			});
		}
	});
	
	LayeredRoom.prototype._updateLayers = function() {
		var val = this._layers;
		var colour = 0;
		var mapType = dusk.dev?"EditableTileMap":"TileMap";
		
		for(var i = 0; i < val.length; i ++) {
			switch(val[i].type) {
				case LayeredRoom.LAYER_TILEMAP:
					this.get(val[i].name, mapType).update(
					{"cursorColour":_LAYER_COLOURS[colour++],
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":entities.twidth, "theight":entities.theight,
						"swidth":entities.swidth, "sheight":entities.sheight, "globalCoords":true, "layer":"+"
					});
					
					break;
				
				case LayeredRoom.LAYER_SCHEME:
					this.get(val[i].name, mapType).update(
					{"cursorColour":_LAYER_COLOURS[colour++],
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":entities.twidth, "theight":entities.theight,
						"swidth":entities.swidth, "sheight":entities.sheight, "alpha":0, "globalCoords":true,
						"layer":"+"
					});
					
					if("weights" in val[i] && val[i].weights instanceof TileMapWeights) 
						this.get(val[i].name, mapType).weights = val[i].weights;
					
					break;
				
				case LayeredRoom.LAYER_REGION:
					this.get(val[i].name, "TileRegionGenerator").update(
					{
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":entities.twidth, "theight":entities.theight,
						"swidth":entities.swidth, "sheight":entities.sheight, "globalCoords":true,
						"alpha":0.50, "layer":"+"
					});
					
					break;
				
				case LayeredRoom.LAYER_ENTITIES:
					this.get(val[i].name, "EntityGroup").update(
					{"name":"entities", "type":"EntityGroup",
						"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
						"twidth":entities.twidth, "theight":entities.theight,
						"swidth":entities.swidth, "sheight":entities.sheight, "globalCoords":true, "layer":"+"
					});
					
					if("primary" in val[i] && val[i].primary) this._primaryEntityGroup = val[i].name;
					
					break;
				
				case LayeredRoom.LAYER_PARTICLES:
					this.get(val[i].name, "ParticleField").update({"upFlow":(i > 0?val[i-1].name:""), "layer":"+"});
					
					break;
				
				case LayeredRoom.LAYER_FLUID:
					this.get(val[i].name, "FluidLayer").update({"upFlow":(i > 0?val[i-1].name:""), "layer":"+"});
					
					break;
				
				case LayeredRoom.LAYER_TRANSITIONS:
					this.get(val[i].name, "TransitionManager")
						.update({"upFlow":(i > 0?val[i-1].name:""), "layer":"+"});
					
					break;
			}
			
			if(i > 0) this.get(val[i-1].name).downFlow = val[i].name;
			colour = colour % _LAYER_COLOURS.length
		}
		
		this.get(val[0].name).upFlow = val[val.length-1].name;
		this.get(val[val.length-1].name).downFlow = val[0].name;
		
		if(this.get("editorLabel")) this.get("editorLabel").alterLayer("+");
		
		var entLayers = this.getAllLayersOfType(LayeredRoom.LAYER_ENTITIES);
		for(var i = entLayers.length-1; i >= 0; i --) {
			entLayers[i].scheme = this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME);
			entLayers[i].particles = this.getFirstLayerOfType(LayeredRoom.LAYER_PARTICLES);
			entLayers[i].fluid = this.getFirstLayerOfType(LayeredRoom.LAYER_FLUID);
			//entLayers[i].width =
			//	this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
			//entLayers[i].height =
			//	this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
		}
		
		var pLayers = this.getAllLayersOfType(LayeredRoom.LAYER_PARTICLES | LayeredRoom.LAYER_FLUID);
		for(var i = pLayers.length-1; i >= 0; i --) {
			pLayers[i].width =
				this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
			pLayers[i].height =
				this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
		}
	};
	
	LayeredRoom.prototype.getFirstLayerOfType = function(type) {
		for(var i = 0; i < this._layers.length; i ++) {
			if((this._layers[i].type & type) > 0) return this.get(this._layers[i].name);
		}
		
		return null;
	};
	
	LayeredRoom.prototype.getAllLayersOfType = function(type) {
		var out = [];
		for(var i = 0; i < this._layers.length; i ++) {
			if((this._layers[i].type & type) > 0) out.push(this.get(this._layers[i].name));
		}
		
		return out;
	};
	
	LayeredRoom.prototype.getPrimaryEntityLayer = function() {
		return this.get(this._primaryEntityGroup);
	};
	
	LayeredRoom.prototype.getTransitionManager = function() {
		return this.getAllLayersOfType(LayeredRoom.LAYER_TRANSITIONS)[0];
	};
	
	LayeredRoom.prototype.getScheme = function() {
		return this.getAllLayersOfType(LayeredRoom.LAYER_SCHEME)[0];
	};
	
	LayeredRoom.prototype.getRegion = function() {
		return this.getAllLayersOfType(LayeredRoom.LAYER_REGION)[0];
	};
	
	LayeredRoom.prototype.getSeek = function() {
		if(!this.get(this._primaryEntityGroup)) return null;
		return this.get(this._primaryEntityGroup).getComponent(entities.seek);
	};
	
	var _basicMainFrame = function(e) {
		//Ask all entities to do something
		//if(this.active) {
			for(var i = 0; i < this._layers.length; i ++) {
				if(this._layers[i].type == LayeredRoom.LAYER_ENTITIES) 
					this.get(this._layers[i].name).doFrame(this.active);
			}
		//}
		
		//Editing
		if(editor.active) {
			this.focusBehaviour = Group.FOCUS_ONE;
			
			var layerImg = "";
			for(var i = 0; i < this._layers.length; i ++) {
				if(this._layers[i].name == this.focus) {
					if(this._layers[i].type == LayeredRoom.LAYER_TILEMAP) {
						layerImg = "[img default/bmlayers/tilemap.png] ";
					}
					if(this._layers[i].type == LayeredRoom.LAYER_SCHEME) {
						layerImg = "[img default/bmlayers/scheme.png] ";
					}
					if(this._layers[i].type == LayeredRoom.LAYER_ENTITIES) {
						if(this._layers[i].primary) {
							layerImg = "[img default/bmlayers/entitiesPrimary.png] ";
						}else{
							layerImg = "[img default/bmlayers/entities.png] ";
						}
					}
					if(this._layers[i].type == LayeredRoom.LAYER_PARTICLES) {
						layerImg = "[img default/bmlayers/particles.png] ";
					}
					if(this._layers[i].type == LayeredRoom.LAYER_TRANSITIONS) {
						layerImg = "[img default/bmlayers/transitions.png] ";
					}
					if(this._layers[i].type == LayeredRoom.LAYER_REGION) {
						layerImg = "[img default/bmlayers/region.png] ";
					}
					if(this._layers[i].type == LayeredRoom.LAYER_FLUID) {
						layerImg = "[img default/bmlayers/fluid.png] ";
					}
				}
			}
			
			if(this.get("editorLabel")) {
				this.get("editorLabel").visible = true;
				this.get("editorLabel").text = layerImg + this.focus;
				this.get("editorLabel").xOrigin = "middle";
				this.get("editorLabel").x = this.xOffset;
				this.get("editorLabel").y = this.yOffset + 10;
				this.get("editorLabel").size = 14;
				this.get("editorLabel").colour = this.editorColour;
				this.get("editorLabel").borderColour = "#ffffff";
				this.get("editorLabel").borderSize = 3;
			}
		}else{
			this.focusBehaviour = Group.FOCUS_ALL;
			
			if(this.get("editorLabel")) {
				this.get("editorLabel").visible = false;
				this.get("editorLabel").text = this.focus;
			}
		}
	};
	
	var _updateScroll = function(e) {
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
		
		if(this.scrollInstantly) {
			this.xOffset = seekCoords[0] - (e.d.slice.width >> 1);
			this.yOffset = seekCoords[1] - (e.d.slice.height >> 1);
		}else{
			var oldX = this.xOffset;
			var oldY = this.yOffset;
			
			if(seekCoords[0] + (seekCoords[2] >> 1) < this.xOffset + (e.d.origin.width >> 1) * this.scrollRegion)
				this.xOffset -= this.scrollSpeed;
			if(seekCoords[0] + (seekCoords[2] >> 1)
				> this.xOffset + e.d.origin.width - ((e.d.origin.width >> 1)*this.scrollRegion))
				this.xOffset += this.scrollSpeed;
			if(seekCoords[1] + (seekCoords[3] >> 1) < this.yOffset + (e.d.origin.height >> 1) * this.scrollRegion)
				this.yOffset -= this.scrollSpeed;
			if(seekCoords[1] + (seekCoords[3] >> 1)
				> this.yOffset+e.d.origin.height - ((e.d.origin.height >> 1)*this.scrollRegion))
				this.yOffset += this.scrollSpeed;
		}
		
		if(this.xOffset > this.getContentsWidth(false) - e.d.slice.width)
			this.xOffset = this.getContentsWidth(false) - e.d.slice.width;
		if(this.yOffset > this.getContentsHeight(false) - e.d.slice.height)
			this.yOffset = this.getContentsHeight(false) - e.d.slice.height;
		
		if(this.xOffset < 0) this.xOffset = 0;
		if(this.yOffset < 0) this.yOffset = 0;
		
		if((oldX != this.xOffset || oldY != this.yOffset) && this.mouse) {
			//It counts, okay!
			//this.containerUpdateMouse(this.mouse.x, this.mouse.y);
			//this.mouse.move.fire();
		}
	};
	
	var _bmUpAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftTop();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(0, entities.theight);
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).rows ++;
				}
			}
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveTop();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(0, -entities.theight);
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).rows --;
				}
			}
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
				}
			}
			
			return false;
		}
		
		return true;
	};
	
	var _bmDownAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftBottom();
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).rows ++;
				}
			}
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveBottom();
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).rows --;
				}
			}
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
				}
			}
			
			return false;
		}
		
		return true;
	};
	
	var _bmLeftAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftLeft();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(entities.twidth, 0);
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).cols ++;
				}
			}
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveLeft();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(-entities.twidth, 0);
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).cols --;
				}
			}
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
				}
			}
			
			return false;
		}
		
		return true;
	};
	
	var _bmRightAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftRight();
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).cols ++;
				}
			}
				
			return false;
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveRight();
				}
				if(this.get(this._layers[i].name) instanceof TileRegionGenerator) {
					this.get(this._layers[i].name).cols --;
				}
			}
			return false;
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
				}
			}
			
			return false;
		}
		
		return true;
	};
	
	var _addLayer = function(type, e) {
		if(!e.alt) return true;
		
		var name = prompt("What is the name of this new layer?");
		
		var i = -1;
		for(i = 0; i < this._layers.length; i ++) {
			if(this._layers[i].name == this.focus) break;
		}
		
		var layer = {"type":type, "name":name};
		
		if(type == LayeredRoom.LAYER_ENTITIES) layer.primary = e.shift;
		
		if(type & (LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP)){
			// Rows and cols, copy from any existing layer
			var firstMap = this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP);
			if(firstMap) {
				layer.cols = firstMap.cols;
				layer.rows = firstMap.rows;
			}else{
				layer.cols = 1;
				layer.rows = 1;
			}
			
			layer.map = utils.dataToString(new ArrayBuffer((layer.cols * layer.rows) << 1), utils.SC_HEX);
			
			layer.src = prompt("What will be the image for this tilemap?", firstMap?firstMap.src:"");
		}
		
		if(type == LayeredRoom.LAYER_REGION){
			// Rows and cols, copy from any existing layer
			var firstMap = this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP);
			if(firstMap) {
				layer.cols = firstMap.cols;
				layer.rows = firstMap.rows;
			}else{
				layer.cols = 1;
				layer.rows = 1;
			}
		}
		
		this._layers.splice(i, 0, layer);
		
		this._updateLayers();
		
		// Load the new layer
		this.get(name).loadBM(layer, -1);
	};
	
	LayeredRoom.prototype.saveRoomToConsole = function(e, returnRoom) {
		if(!editor.active) return true;
		
		if(e !== undefined && e.alt) return true;
		if(e === undefined || typeof e == "object") e = prompt("Please enter a package name.", this.roomName);
		
		console.log("----- Exported Room Data "+e+" -----");
		var deps = [this.roomManager.packageName, "dusk.entities"];
		var out = "";
		out += "\"use strict\";\n\n";
		
		out += "load.provide(\""+e+"\", (function() {\n\t";
		
		var addDep = (function(str) {
			if(deps.indexOf(str) === -1) deps.push(str);
		}).bind(out);
		
		var room = {};
		room.contents = [];
		room.layers = this.layers;
		for(var i = 0; i < this._layers.length; i ++) {
			room.contents.push(this.get(this._layers[i].name).saveBM(addDep));
		}
		
		out += "var manager = ";
		for(var i = 0; i < deps.length; i ++) {
			out += "load.require(\""+deps[i]+"\");\n\t";
		}
		
		out += "\n\t";
		out += "var room = "+JSON.stringify(room, undefined, 0)+";\n\t\n\t";
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
	
	sgui.registerType("LayeredRoom", LayeredRoom);
	
	return LayeredRoom;
})());


load.provide("dusk.rooms.sgui.ILayeredRoomLayer", (function() {
	var ILayeredRoomLayer = function() {};
	
	ILayeredRoomLayer.saveBM = function() {};
	ILayeredRoomLayer.loadBM = function() {};
	
	return ILayeredRoomLayer;
})());
