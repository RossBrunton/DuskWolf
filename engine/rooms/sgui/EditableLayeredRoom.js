//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.sgui.EditableLayeredRoom", function() {
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
	
	class EditableLayeredRoom extends LayeredRoom {
		constructor(parent, name) {
			super(parent, name);
			
			this.editorColour = "#000000";
			
			//Prop masks
			this._mapper.map("editorColour", "editorColour");
			this._mapper.map("editorColor", "editorColor");
			
			//Listeners
			this.frame.listen(this._editableLayeredRoomFrame.bind(this));
			this.onControl.listen((function(e) {this.basicMain.export()}).bind(this),
				controls.addControl("basicmain_save", "S")
			);
			this.onControl.listen((function(e) {
				if(editor.active) {
					//if(!e.shift) {
					//	this.createRoom(prompt("Enter a room to go to.", this.roomName), 0);
					//}else{
						this.roomManager.setRoom(prompt("Enter a room to go to via the room manager.", this.roomName), 0);
					//}
				}
			}).bind(this), controls.addControl("basicmain_goto", "G"));
			
			//Directions
			this.dirPress.listen(this._bmRightAction.bind(this), c.DIR_RIGHT);
			this.dirPress.listen(this._bmLeftAction.bind(this), c.DIR_LEFT);
			this.dirPress.listen(this._bmUpAction.bind(this), c.DIR_UP);
			this.dirPress.listen(this._bmDownAction.bind(this), c.DIR_DOWN);
		}
		
		get _LAYER_COLOURS() {return ["#990000", "#009900", "#000099", "#999900", "#990099"];}
		
		_editableLayeredRoomFrame(e) {
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
							layerImg = "[img default/bmlayers/tilemap.png][/img] ";
						}
						if(this._layers[i].type == LayeredRoom.LAYER_SCHEME) {
							layerImg = "[img default/bmlayers/scheme.png][/img] ";
						}
						if(this._layers[i].type == LayeredRoom.LAYER_ENTITIES) {
							if(this._layers[i].primary) {
								layerImg = "[img default/bmlayers/entitiesPrimary.png][/img] ";
							}else{
								layerImg = "[img default/bmlayers/entities.png][/img] ";
							}
						}
						if(this._layers[i].type == LayeredRoom.LAYER_PARTICLES) {
							layerImg = "[img default/bmlayers/particles.png][/img] ";
						}
						if(this._layers[i].type == LayeredRoom.LAYER_TRANSITIONS) {
							layerImg = "[img default/bmlayers/transitions.png][/img] ";
						}
						if(this._layers[i].type == LayeredRoom.LAYER_REGION) {
							layerImg = "[img default/bmlayers/region.png][/img] ";
						}
						if(this._layers[i].type == LayeredRoom.LAYER_FLUID) {
							layerImg = "[img default/bmlayers/fluid.png][/img] ";
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
		}
		
		_updateLayers() {
			LayeredRoom.prototype._updateLayers.apply(this, arguments);
			
			var cp = 0;
			
			for(var l of this._layers) {
				if(l.type & (LayeredRoom.LAYER_TILEMAP | LayeredRoom.LAYER_SCHEME)) {
					this.get(l.name).cursorColour = this._LAYER_COLOURS[cp];
					cp = (++cp) % this._LAYER_COLOURS.length;
				}
			}
			
			if(this.get("editorLabel")) this.get("editorLabel").alterLayer("+");
		}
		
		_bmUpAction(e) {
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
		}
		
		_bmDownAction(e) {
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
		}
		
		_bmLeftAction(e) {
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
		}
		
		_bmRightAction(e) {
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
		}
		
		saveRoom(addDep) {
			if(!editor.active) return true;
			
			var room = {};
			room.contents = {};
			room.cols = this.cols;
			room.rows = this.rows;
			
			for(var l of this._layers) {
				var outobj = {};
				switch(l.type) {
					case LayeredRoom.LAYER_TILEMAP:
					case LayeredRoom.LAYER_SCHEME:
						outobj = this.get(l.name).map;
						
						break;
					
					case LayeredRoom.LAYER_REGION:
					case LayeredRoom.LAYER_PARTICLES:
						// Pass
						
						break;
					
					case LayeredRoom.LAYER_ENTITIES:
						outobj = this.get(l.name).saveBM(addDep);
						
						break;
					
					case LayeredRoom.LAYER_FLUID:
						var c = this.get(l.name);
						outobj = {"level":c.level, "colour":c.colour, "alpha":c.alpha, "type":c.fluidType};
						
						break;
					
					case LayeredRoom.LAYER_TRANSITIONS:
						outobj = this.get(l.name).saveBM(addDep);
						
						break;
				}
				
				room.contents[l.name] = outobj;
			}
			
			return room;
		}
	}
	
	sgui.registerType("EditableLayeredRoom", EditableLayeredRoom);
	
	return EditableLayeredRoom;
});
