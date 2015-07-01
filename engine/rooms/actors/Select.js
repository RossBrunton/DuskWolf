//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.actors.Select", (function() {
	var Runner = load.require("dusk.script.Runner");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var Region = load.require("dusk.tiles.Region");
	var utils = load.require("dusk.utils");
	var SelectorManager = load.require("dusk.tiles.SelectorManager");

	
	/** An actor that contains standard actions for a LayeredRoom
	 * 
	 * @param {dusk.rooms.sgui.LayeredRoom} The layered room to act upon.
	 * @since 0.0.21-alpha
	 */
	var SelectActor = function(layeredRoom, type) {
		this.selectorManager = new SelectorManager(layeredRoom, type);
		this.layeredRoom = layeredRoom;
	};
	
	SelectActor.prototype.pickEntity = function(filter, task, options) {
		return Runner.action("dusk.rooms.actors.Select.pickEntity", (function(x, add) {
			var tobj = utils.copy(task);
			
			if(options.copy) {
				for(var c of options.copy) {
					tobj[c[1]] = x[c[0]];
				}
			}
			
			var _selected = (function(state, sopts) {
				var elayer = this.layeredRoom.getPrimaryEntityLayer();
				var ents = elayer.getEntitiesExactlyHere(
					state.x * elayer.twidth, state.y * elayer.theight, state.selector()
				);
				
				for(var e of ents) {
					if(!filter(e)) return;
				}
				
				if(ents.length || options.allowNone) {
					x.entity = ents.length > 0 ? ents[0] : null;
					x.allEntities = ents;
					if(x.entity) {
						x.x = x.entity.tileX();
						x.y = x.entity.tileY();
						x.fullX = x.entity.x;
						x.fullY = x.entity.y;
					}
					state.fulfill(x);
				}
			}).bind(this);
			
			var _cancel = function(state, sopts) {
				state.reject(new Runner.Cancel());
			};
			
			if(!("controlHandlers" in tobj)) tobj.controlHandlers = {};
			if(!("clickHandlers" in tobj)) tobj.clickHandlers = {};
			
			tobj.controlHandlers["sgui_action"] = _selected;
			tobj.controlHandlers["sgui_cancel"] = _cancel;
			tobj.clickHandlers["1"] = _selected;
			
			return this.selectorManager.performTask(tobj);
		}).bind(this), 
		
		function() {});
	};
	
	SelectActor.prototype.pickEntityInRegion = function(filter, task, options) {
		return Runner.action("dusk.rooms.actors.Select.pickEntityInRegion", (function(x, add) {
			var region;
			if(options.region) {
				region = x[options.region];
			}else{
				region = x.region;
			}
			
			var eg = this.layeredRoom.getPrimaryEntityLayer();
			if(options.layer) {
				eg = this.layeredRoom.get(options.layer);
			}
			
			var ents = eg.allInRegion(region, options.sub);
			
			var newFilter = function(e) {
				if(!ents.includes(e)) return false;
				return filter(e);
			};
			
			return this.pickEntity(newFilter, task, options).forward(x, add);
		}).bind(this), 
		
		function() {});
	};
	
	SelectActor.prototype.pickTile = function(task, options) {
		return Runner.action("dusk.rooms.actors.Select.pickTile", (function(x, add) {
			var tobj = utils.copy(task);
			
			if(options.copy) {
				for(var c of options.copy) {
					tobj[c[1]] = x[c[0]];
				}
			}
			
			if(options.which) {
				tobj.path = x[options.which];
			}else{
				tobj.path = x.path;
			}
			
			var _selected = (function(state, sopts) {
				if(state.path.validPath && state.path.completePath) {
					x.x = state.path.end[0];
					x.y = state.path.end[1];
					state.fulfill(x);
				}
			}).bind(this);
			
			var _cancel = function(state, sopts) {
				state.reject(new Runner.Cancel());
			};
			
			if(!("controlHandlers" in tobj)) tobj.controlHandlers = {};
			if(!("clickHandlers" in tobj)) tobj.clickHandlers = {};
			
			tobj.controlHandlers["sgui_action"] = _selected;
			tobj.clickHandlers["1"] = _selected;
			tobj.controlHandlers["sgui_cancel"] = _cancel;
			
			return this.selectorManager.performTask(tobj);
		}).bind(this), 
		
		function() {});
	};
	
	SelectActor.prototype.followPath = function(options) {
		return Runner.action("dusk.rooms.actors.Select.followPath", (function(x, add) {
			return new Promise((function(fulfill, reject) {
					var ent = x.entity;
					if("which" in options) ent = x[options.which];
					
					ent.eProp("gwmoves", utils.copy(x.path.dirs().reverse()));
					var oldX = ent.x;
					var oldY = ent.y;
					
					x.oldX = oldX;
					x.oldY = oldY;
					
					if(x.path.length()){ 
						var l = ent.entityEvent.listen((function(e) {
							if(!ent.eProp("gwmoves").length) {
								ent.entityEvent.unlisten(l);
								fulfill(x);
							}
						}).bind(this), "gwStopMove");
					}else{
						fulfill(x);
					}
				}).bind(this));
		}).bind(this), 
		
		(function(x) {
			x.entity.x = x.oldX;
			x.entity.y = x.oldY;
			
			return Promise.reject(new Runner.Cancel());
		}).bind(this));
	};
	
	SelectActor.prototype.entitiesInRegion = function(options) {
		return Runner.action("dusk.rooms.actors.Select.entitiesInRegion", (function(x, add) {
			var region;
			if(options.region) {
				region = x[options.region];
			}else{
				region = x.region;
			}
			
			var eg = this.layeredRoom.getPrimaryEntityLayer();
			if(options.layer) {
				eg = this.layeredRoom.get(options.layer);
			}
			
			var dest = options.dest ? options.dest : "entities";
			
			if(options.withSub) {
				x[dest] = eg.allInRegionWithSub(region, options.sub);
			}else{
				x[dest] = eg.allInRegion(region, options.sub);
			}
			
			if("filter" in options) x[dest] = x[dest].filter(options.filter);
			
			return x;
		}).bind(this));
	};
	
	SelectActor.prototype.showSelector = function(options) {
		return Runner.action("dusk.rooms.actors.Select.showSelector", (function(x, add) {
			this.selectorManager.show();
			
			if(!options.noCopyCoord) {
				this.selectorManager.getSelector().x = x.fullX;
				this.selectorManager.getSelector().y = x.fullY;
			}
			
			return x;
		}).bind(this), 
		
		(function(x) {
			this.selectorManager.hide();
			return Promise.reject(new Runner.Cancel());
		}).bind(this));
	};
	
	SelectActor.prototype.hideSelector = function(options) {
		return Runner.action("dusk.rooms.actors.Select.showSelector", (function(x, add) {
			this.selectorManager.hide();
			
			return x;
		}).bind(this), 
		
		(function(x) {
			this.selectorManager.show();
			return Promise.reject(new Runner.Cancel());
		}).bind(this));
	};
	
	return SelectActor;
})());
