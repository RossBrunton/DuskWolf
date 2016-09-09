//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.rooms.actors.Select", function() {
	var Runner = load.require("dusk.script.Runner");
	var LayeredRoom = load.require("dusk.rooms.sgui.LayeredRoom");
	var Region = load.require("dusk.tiles.Region");
	var utils = load.require("dusk.utils");
	var SelectorManager = load.require("dusk.tiles.SelectorManager");
	
	/** TODO: Document
	 * 
	 * @memberof dusk.rooms.actors
	 * @since 0.0.21-alpha
	 */
	class SelectActor {
		/** Creates a new SelectActor
		 * 
		 * @param {dusk.rooms.sgui.LayeredRoom} layeredRoom The layered room to act upon.
		 * @param {string} type The entity type the selector will be
		 * @since 0.0.21-alpha
		 */
		constructor(layeredRoom, type) {
			this.selectorManager = new SelectorManager(layeredRoom, type);
			this.layeredRoom = layeredRoom;
		}
		
		pickEntity(filter, task, options) {
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
		}
		
		pickEntityInRegion(filter, task, options) {
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
		}
		
		pickTile(task, options) {
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
		}
		
		entitiesInRegion(options) {
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
		}
		
		showSelector(options) {
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
		}
		
		hideSelector(options) {
			return Runner.action("dusk.rooms.actors.Select.showSelector", (function(x, add) {
				this.selectorManager.hide();
				
				return x;
			}).bind(this), 
			
			(function(x) {
				this.selectorManager.show();
				return Promise.reject(new Runner.Cancel());
			}).bind(this));
		}
	}
	
	return SelectActor;
});
