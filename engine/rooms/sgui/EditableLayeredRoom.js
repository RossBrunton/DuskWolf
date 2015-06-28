//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.sgui.EditableLayeredRoom", (function() {
	var sgui = load.require("dusk.sgui");
	var Group = load.require("dusk.sgui.Group");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	var FluidLayer = load.require("dusk.rooms.sgui.FluidLayer");
	var RegionDisplay = load.require("dusk.tiles.sgui.RegionDisplay");
	var Label = load.require("dusk.sgui.Label");
	var editor = load.require("dusk.rooms.editor");
	var c = load.require("dusk.sgui.c");
	var keyboard = load.require("dusk.input.keyboard");
	var controls = load.require("dusk.input.controls");
	var utils = load.require("dusk.utils");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	
	var EditableLayeredRoom = function(parent, name) {
		LayeredRoom.call(this, parent, name);
		
		this.editorColour = "#000000";
		
		//Prop masks
		this._mapper.map("editorColour", "editorColour");
		this._mapper.map("editorColor", "editorColor");
		
		//Listeners
		this.frame.listen(_editableLayeredRoomFrame.bind(this));
		this.onControl.listen((function(e) {this.basicMain.export()}).bind(this),
			controls.addControl("basicmain_save", "S")
		);
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
			_addLayer.bind(this, EditableLayeredRoom.LAYER_TILEMAP), controls.addControl("basicmain_add_tilemap", "M")
		);
		this.onControl.listen(
			_addLayer.bind(this, EditableLayeredRoom.LAYER_SCHEME), controls.addControl("basicmain_add_scheme", "S")
		);
		this.onControl.listen(
			_addLayer.bind(this, EditableLayeredRoom.LAYER_ENTITIES), controls.addControl("basicmain_add_entities", "N")
		);
		this.onControl.listen(
			_addLayer.bind(this, EditableLayeredRoom.LAYER_PARTICLES), controls.addControl("basicmain_add_particles", "P")
		);
		this.onControl.listen(
			_addLayer.bind(this, EditableLayeredRoom.LAYER_TRANSITIONS), controls.addControl("basicmain_add_transitions", "T")
		);
		this.onControl.listen(
			_addLayer.bind(this, EditableLayeredRoom.LAYER_REGION), controls.addControl("basicmain_add_region", "R")
		);
		this.onControl.listen(
			_addLayer.bind(this, EditableLayeredRoom.LAYER_FLUID), controls.addControl("basicmain_add_fluid", "F")
		);
		
		//Directions
		this.dirPress.listen(_bmRightAction.bind(this), c.DIR_RIGHT);
		this.dirPress.listen(_bmLeftAction.bind(this), c.DIR_LEFT);
		this.dirPress.listen(_bmUpAction.bind(this), c.DIR_UP);
		this.dirPress.listen(_bmDownAction.bind(this), c.DIR_DOWN);
	};
	EditableLayeredRoom.prototype = Object.create(LayeredRoom.prototype);
	
	var _LAYER_COLOURS = ["#990000", "#009900", "#000099", "#999900", "#990099"];
	
	var _editableLayeredRoomFrame = function(e) {
		if(editor.active) {
			this.focusBehaviour = Group.FOCUS_ONE;
			
			if(!this.get("editorLabel")) {
				this.get("editorLabel", "Label").update({
					"visible":false,
					"text":"",
					"height":18
				});
			}
			
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
	
	EditableLayeredRoom.prototype._updateLayers = function() {
		LayeredRoom.prototype._updateLayers.apply(this, arguments);
		
		var cp = 0;
		
		for(var l of this._layers) {
			if(l.type & (LayeredRoom.LAYER_TILEMAP | LayeredRoom.LAYER_SCHEME)) {
				this.get(l.name).cursorColour = _LAYER_COLOURS[cp];
				cp = (++cp) % _LAYER_COLOURS.length;
			}
		}
		
		this.get("editorLabel").alterLayer("+");
	};
	
	var _bmUpAction = function(e) {
		if(!editor.active) return true;
		if(keyboard.isKeyPressed(187)) {
			//+
			this.rows ++;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftTop();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(0, this.theight);
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).rows ++;
				}
			}
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			this.rows --;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveTop();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(0, -this.theight);
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).rows --;
				}
			}
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).height;
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
			this.rows ++;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftBottom();
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).rows ++;
				}
			}
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			this.rows --;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveBottom();
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).rows --;
				}
			}
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).height;
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
			this.cols ++;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftLeft();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(this.twidth, 0);
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).cols ++;
				}
			}
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			this.cols --;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveLeft();
				}
				if(this.get(this._layers[i].name) instanceof EntityGroup) {
					this.get(this._layers[i].name).adjustAll(-this.twidth, 0);
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).cols --;
				}
			}
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).height;
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
			this.cols ++;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).graftRight();
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).cols ++;
				}
			}
				
			return false;
		}
		
		if(keyboard.isKeyPressed(189)) {
			//-
			this.cols --;
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof TileMap) {
					this.get(this._layers[i].name).carveRight();
				}
				if(this.get(this._layers[i].name) instanceof RegionDisplay) {
					this.get(this._layers[i].name).cols --;
				}
			}
			return false;
		}
		
		if(keyboard.isKeyPressed(187) || keyboard.isKeyPressed(189)) {
			for(var i = this._layers.length-1; i >= 0; i --) {
				if(this.get(this._layers[i].name) instanceof FluidLayer) {
					this.get(this._layers[i].name).width =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).width;
					this.get(this._layers[i].name).height =
						this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP).height;
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
		
		if(type == EditableLayeredRoom.LAYER_ENTITIES) layer.primary = e.shift;
		
		if(type & (EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP)){
			// Rows and cols, copy from any existing layer
			var firstMap = this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP);
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
		
		if(type == EditableLayeredRoom.LAYER_REGION){
			// Rows and cols, copy from any existing layer
			var firstMap = this.getFirstLayerOfType(EditableLayeredRoom.LAYER_SCHEME | EditableLayeredRoom.LAYER_TILEMAP);
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
	
	EditableLayeredRoom.prototype.saveRoom = function(addDep) {
		if(!editor.active) return true;
		
		var room = {};
		room.contents = [];
		room.cols = this.cols;
		room.rows = this.rows;
		for(var i = 0; i < this._layers.length; i ++) {
			room.contents.push(this.get(this._layers[i].name).saveBM(addDep));
		}
		
		return room;
	};
	
	sgui.registerType("EditableLayeredRoom", EditableLayeredRoom);
	
	return EditableLayeredRoom;
})());
