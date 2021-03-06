//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.sgui.LayeredRoom", function() {
	var sgui = load.require("dusk.sgui");
	var Group = load.require("dusk.sgui.Group");
	var EditableTileMap = load.require("dusk.tiles.sgui.EditableTileMap");
	var TileMap = load.require("dusk.tiles.sgui.TileMap");
	var EntityGroup = load.require("dusk.entities.sgui.EntityGroup");
	var ParticleField = load.require("dusk.particles.sgui.ParticleField");
	var FluidLayer = load.require("dusk.rooms.sgui.FluidLayer");
	var RegionDisplay = load.require("dusk.tiles.sgui.RegionDisplay");
	var editor = load.require("dusk.rooms.editor");
	var RoomManager = load.require("dusk.rooms.RoomManager");
	var c = load.require("dusk.sgui.c");
	var entities = load.require("dusk.entities");
	var dusk = load.require("dusk");
	var keyboard = load.require("dusk.input.keyboard");
	var controls = load.require("dusk.input.controls");
	var Properties = load.require("dusk.tiles.Properties");
	var utils = load.require("dusk.utils");
	
	class LayeredRoom extends Group {
		constructor(parent, name) {
			super(parent, name);
			
			this.scrollSpeed = 3;
			this.scrollRegion = 0.60;
			this.scrollInstantly = false;
			this.spawn = 0;
			this.roomName = "";
			this._primaryEntityGroup = "";
			
			this.layers = [];
			this._layers = [];
			
			this.roomManager = null;
			
			this._tileProperties = new Properties();
			this.tileProperties;
			this.tilePropertiesAuto = "*";
			
			this.seek = "";
			this.seekType = "";
			
			this.twidth = 32;
			this.theight = 32;
			
			this.rows = 0;
			this.cols = 0;
			
			//Prop masks
			this._mapper.map("spawn", "spawn");
			this._mapper.map("layers", "layers", ["allowMouse"]);
			this._mapper.map("scrollSpeed", "scrollSpeed");
			this._mapper.map("scrollRegion", "scrollRegion");
			this._mapper.map("scrollInstantly", "scrollInstantly");
			this._mapper.map("room", "room", ["spawn", "allowMouse", "seek", "seekType", "twidth", "theight"]);
			this._mapper.map("tileProperties", "tileProperties");
			this._mapper.map("seek", "seek");
			this._mapper.map("seekType", "seekType");
			this._mapper.map("twidth", "twidth");
			this._mapper.map("theight", "theight");
			
			//Listeners
			this.frame.listen(this._basicMainFrame.bind(this));
			this._onBeforePaintChildren.listen(this._updateScroll.bind(this));
			
			this.mouseFocus = false;
			
			this.xDisplay = "expand";
			this.yDisplay = "expand";
			this.width = -1;
			this.height = -1;
		}
		
		createRoom(name, spawn) {
			return new Promise((function(fulfill, reject) {
				var room = null;
				this.roomManager.getRoomData(name).then((function(room) {;
					if(!room) {
						console.error("Room "+name+" does not exist.");
						return;
					}
					
					this.roomName = name;
					
					this.rows = room.rows;
					this.cols = room.cols;
					this._updateLayers();
					
					if(Array.isArray(room.contents)) {
						for(var i = 0; i < room.contents.length; i ++) {
							this.get(this._layers[i].name).loadBM(room.contents[i], spawn);
						}
					}else{
						for(var p in room.contents) {
							if(this.get(p)) this.get(p).loadBM(room.contents[p], spawn);
						}
					}
					
					var crd = [0, 0];
					if(Array.isArray(spawn)) {
						crd = spawn;
					}else{
						crd = this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME).lookTile(spawn, 1);
						if(crd) {
							crd[0] *= this.twidth;
							crd[1] *= this.theight;
						}
					}
					
					if(crd && this.seek){
						var playerData = {};
						playerData.name = this.seek;
						playerData.type = this.seekType;
						playerData.x = crd[0];
						playerData.y = crd[1];
					
						this.get(this._primaryEntityGroup).dropEntity(playerData, true);
					}
					
					this.flow(this.getPrimaryEntityLayer().name);
					
					fulfill({"name":name});
				}).bind(this));
			}).bind(this));
		}
		
		//layers
		get layers() {
			return this._layers;
		}
		
		set layers(val) {
			this._layers = val;
			if(!val.length) return;
			
			this.empty();
			this._updateLayers();
		}
		
		_updateLayers() {
			var val = this._layers;
			var mapType = dusk.dev?"EditableTileMap":"TileMap";
			
			for(var i = 0; i < val.length; i ++) {
				switch(val[i].type) {
					case LayeredRoom.LAYER_TILEMAP:
						this.get(val[i].name, mapType).update(
						{"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":this.twidth, "theight":this.theight,
							"globalCoords":true, "layer":"+",
							"rows":this.rows, "cols":this.cols
						});
						
						break;
					
					case LayeredRoom.LAYER_SCHEME:
						this.get(val[i].name, mapType).update(
						{"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":this.twidth, "theight":this.theight,
							"alpha":0, "globalCoords":true,
							"layer":"+",
							"rows":this.rows, "cols":this.cols
						});
						
						break;
					
					case LayeredRoom.LAYER_REGION:
						this.get(val[i].name, "RegionDisplay").update(
						{
							"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":this.twidth, "theight":this.theight,
							"globalCoords":true,
							"layer":"+",
							"rows":this.rows, "cols":this.cols
						});
						
						break;
					
					case LayeredRoom.LAYER_ENTITIES:
						this.get(val[i].name, "EntityGroup").update(
						{"name":"entities", "type":"EntityGroup",
							"downFlow":"", "upFlow":(i > 0?val[i-1].name:""),
							"twidth":this.twidth, "theight":this.theight,
							"globalCoords":true, "layer":"+",
							"allowMouse":this.allowMouse, "tileProperties":this.tileProperties
						});
						
						if("primary" in val[i] && val[i].primary) this._primaryEntityGroup = val[i].name;
						
						break;
					
					case LayeredRoom.LAYER_PARTICLES:
						this.get(val[i].name, "ParticleField").update({"upFlow":(i > 0?val[i-1].name:""), "layer":"+"});
						
						break;
					
					case LayeredRoom.LAYER_FLUID:
						this.get(val[i].name, "FluidLayer").update({"upFlow":(i > 0?val[i-1].name:""), "layer":"+"});
						
						break;
				}
				
				if(i > 0) this.get(val[i-1].name).downFlow = val[i].name;
			}
			
			this.get(val[0].name).upFlow = val[val.length-1].name;
			this.get(val[val.length-1].name).downFlow = val[0].name;
			
			var entLayers = this.getAllLayersOfType(LayeredRoom.LAYER_ENTITIES);
			for(var i = entLayers.length-1; i >= 0; i --) {
				entLayers[i].scheme = this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME);
				entLayers[i].particles = this.getFirstLayerOfType(LayeredRoom.LAYER_PARTICLES);
				entLayers[i].fluid = this.getFirstLayerOfType(LayeredRoom.LAYER_FLUID);
				entLayers[i].width =
					this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
				entLayers[i].height =
					this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
			}
			
			var pLayers = this.getAllLayersOfType(LayeredRoom.LAYER_PARTICLES | LayeredRoom.LAYER_FLUID);
			for(var i = pLayers.length-1; i >= 0; i --) {
				pLayers[i].width =
					this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).width;
				pLayers[i].height =
					this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME | LayeredRoom.LAYER_TILEMAP).height;
			}
			
			// Tile properties
			if(this.tilePropertiesAuto && !this.tileProperties) {
				this.tileProperties = new Properties();
			}
			
			if(this.tilePropertiesAuto) {
				if(this.tilePropertiesAuto == "*") {
					this.tileProperties.associate(this.getFirstLayerOfType(LayeredRoom.LAYER_SCHEME));
				}else{
					this.tileProperties.associate(this.get(this.tilePropertiesAuto));
				}
			}
		}
		
		//tileProperties
		get tileProperties() {
			return this._tileProperties;
		}
		
		set tileProperties(value) {
			this._tileProperties = value;
			
			var entLayers = this.getAllLayersOfType(LayeredRoom.LAYER_ENTITIES);
			for(var l of entLayers) {
				l.tileProperties = value;
			}
		}
		
		getFirstLayerOfType(type) {
			for(var i = 0; i < this._layers.length; i ++) {
				if((this._layers[i].type & type) > 0) return this.get(this._layers[i].name);
			}
			
			return null;
		}
		
		getAllLayersOfType(type) {
			var out = [];
			for(var i = 0; i < this._layers.length; i ++) {
				if((this._layers[i].type & type) > 0) out.push(this.get(this._layers[i].name));
			}
			
			return out;
		}
		
		getPrimaryEntityLayer() {
			return this.get(this._primaryEntityGroup);
		}
		
		getScheme() {
			return this.getAllLayersOfType(LayeredRoom.LAYER_SCHEME)[0];
		}
		
		getRegion() {
			return this.getAllLayersOfType(LayeredRoom.LAYER_REGION)[0];
		}
		
		getSeek() {
			if(!this.get(this._primaryEntityGroup)) return null;
			return this.get(this._primaryEntityGroup).get(this.seek);
		}
		
		getFocusedEntity() {
			if(!this.get(this._primaryEntityGroup)) return null;
			if(!this.get(this._primaryEntityGroup).getFocusedChild()) return null;
			return this.get(this._primaryEntityGroup).getFocusedChild();
		}
		
		_basicMainFrame(e) {
			//Ask all entities to do something
			//if(this.active) {
				for(var i = 0; i < this._layers.length; i ++) {
					if(this._layers[i].type == LayeredRoom.LAYER_ENTITIES) 
						this.get(this._layers[i].name).doFrame(this.active);
				}
			//}
		}
		
		_updateScroll(e) {
			// Centre the player
			var seekCoords = [];
			if(editor.active) {
				seekCoords = [
					(EditableTileMap.globalEditX)*(this.twidth),
					(EditableTileMap.globalEditY)*(this.theight),
					32,
					32
				];
			}else if(this.getSeek()) {
				seekCoords = [this.getSeek().x, this.getSeek().y, this.getSeek().width, this.getSeek().height];
			}else if(this.getFocusedEntity()) {
				seekCoords = [
					this.getFocusedEntity().x, this.getFocusedEntity().y,
					this.getFocusedEntity().width, this.getFocusedEntity().height
				];
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
		}
	}
	
	LayeredRoom.LAYER_TILEMAP = 0x01;
	LayeredRoom.LAYER_SCHEME = 0x02;
	LayeredRoom.LAYER_ENTITIES = 0x04;
	LayeredRoom.LAYER_PARTICLES = 0x08;
	LayeredRoom.LAYER_REGION = 0x20;
	LayeredRoom.LAYER_FLUID = 0x40;
	
	sgui.registerType("LayeredRoom", LayeredRoom);
	
	return LayeredRoom;
});


load.provide("dusk.rooms.sgui.ILayeredRoomLayer", function() {
	var ILayeredRoomLayer = function() {};
	
	ILayeredRoomLayer.saveBM = function() {};
	ILayeredRoomLayer.loadBM = function() {};
	
	return ILayeredRoomLayer;
});
