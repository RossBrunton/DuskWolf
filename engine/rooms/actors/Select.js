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
			
			if(!("controlHandlers" in tobj)) tobj.controlHandlers = {};
			if(!("clickHandlers" in tobj)) tobj.clickHandlers = {};
			
			tobj.controlHandlers["sgui_action"] = _selected;
			tobj.clickHandlers["1"] = _selected;
			
			return this.selectorManager.performTask(tobj);
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
			
			if(!("controlHandlers" in tobj)) tobj.controlHandlers = {};
			if(!("clickHandlers" in tobj)) tobj.clickHandlers = {};
			
			tobj.controlHandlers["sgui_action"] = _selected;
			tobj.clickHandlers["1"] = _selected;
			
			return this.selectorManager.performTask(tobj);
		}).bind(this), 
		
		function() {});
	};
	
	SelectActor.prototype.followPath = function(options) {
		return Runner.action("dusk.rooms.actors.Select.followPath", (function(x, add) {
			return new Promise((function(fulfill, reject) {
					x.entity.eProp("gwmoves", utils.copy(x.path.dirs().reverse()));
					var oldX = x.entity.x;
					var oldY = x.entity.y;
					
					x.oldX = oldX;
					x.oldY = oldY;
					
					if(x.path.length()){ 
						var l = x.entity.entityEvent.listen((function(e) {
							if(!x.entity.eProp("gwmoves").length) {
								x.entity.entityEvent.unlisten(l);
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
	
	return SelectActor;
})());
