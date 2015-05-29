//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.extras.QuestPuppeteer", (function(){
	var Extra = load.require("dusk.sgui.extras.Extra");
	var sgui = load.require("dusk.sgui");
	var UserCancelError = load.require("dusk.utils.reversiblePromiseChain.UserCancelError");
	var quest = load.require(">dusk.rooms.quest", function(p) {quest = p});
	var utils = load.require("dusk.utils");
	var entities = load.require("dusk.entities");
	var TileRegion = load.require("dusk.tiles.sgui.TileRegion");
	
	/* @class dusk.sgui.extras.DynamicWidth
	 * 
	 * @classdesc A dynamic width component changes it's width depending on the value of a range.
	 * 
	 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range
	 *  is to the `max` value.
	 * 
	 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
	 * @param {string} name This extra's name.
	 * @extends dusk.sgui.extras.Extra
	 * @constructor
	 */
	var QuestPuppeteer = function(owner, name) {
		Extra.call(this, owner, name);
		
		this.request = this.request.bind(this);
	};
	QuestPuppeteer.prototype = Object.create(Extra.prototype);
	
	QuestPuppeteer.prototype.ensureSelector = function() {
		if(!this._owner.getPrimaryEntityLayer().hasEntity(this.selector)) {
			if(this.selector) this.selector.deleted = true;
			
			this.selector = this._owner.getPrimaryEntityLayer().dropEntity(
				{"x":0, "y":0, "type":"puppetSelect", "name":"select"}, true
			);
		}
	};
	
	QuestPuppeteer.prototype.request = function(type, args, passedArg, queue) {
		if(!passedArg) passedArg = {};
		
		switch(type) {
			case "disableFreeControl":
				passedArg.oldControl = this._owner.getSeek().eProp("playerControl");
				this._owner.getSeek().eProp("playerControl", false);
				return Promise.resolve(passedArg);
			
			case "enableFreeControl":
				passedArg.oldControl = this._owner.getSeek().eProp("playerControl");
				this._owner.getSeek().eProp("playerControl", true);
				return Promise.resolve(passedArg);
			
			case "disableFreeControl^-1":
			case "enableFreeControl^-1":
				this._owner.getSeek().eProp("playerControl", passedArg.oldControl);
				return Promise.reject(new UserCancelError());
			
			case "getSeek":
				passedArg.entity = this._owner.getSeek();
				passedArg.x = passedArg.entity.tileX();
				passedArg.y = passedArg.entity.tileY();
				return Promise.resolve(passedArg);
			
			case "selectEntity":
				return new Promise((function(fulfill, reject) {
					var r = this._owner.getRegion();
					var e = this._owner.getPrimaryEntityLayer();
					var oldSeek = entities.seek;
					this.ensureSelector();
					
					if(!passedArg.regions) passedArg.regions = {};
					var region = passedArg.regions[args.regionToUse];
					var range = args.range?args.range:passedArg.range;
					var x = args.x?args.x:passedArg.x;
					var y = args.y?args.y:passedArg.y;
					
					if(args.restrict) {
						this.selector.eProp("gwregion", region);
					}
					
					if(x !== undefined) this.selector.x = x * this.selector.width;
					if(y !== undefined) this.selector.y = y * this.selector.height;
					
					entities.seek = this.selector.name;
					this.selector.visible = true;
					this.selector.eProp("gmMouseMove", true);
					
					var l = this.selector.action.listen((function(e) {
						var e = e.component;
						var sel = this._owner.getPrimaryEntityLayer().getEntitiesExactlyHere(e.x, e.y, e, true);
						
						if(!sel.length && !args.allowNone) return;
						if(sel) sel = sel[0];
						if(!sel) sel = null;
						
						if(region && !region.isIn(e.tileX(), e.tileY())) {
							return;
						}
						
						if(sel && args.filter && !sel.evalTrigger(args.filter)) {
							return;
						}
						
						passedArg.x = e.tileX();
						passedArg.y = e.tileY();
						passedArg.fullX = e.x;
						passedArg.fullY = e.y;
						passedArg.entity = sel;
						
						e.visible = false;
						e.eProp("gmMouseMove", false);
						if(oldSeek) entities.seek = oldSeek;
						e.action.unlisten(l);
						e.cancel.unlisten(c);
						
						fulfill(passedArg);
					}).bind(this));
					
					var c = this.selector.cancel.listen(function(e) {
						var e = e.component;
						e.visible = false;
						e.eProp("gmMouseMove", false);
						if(oldSeek) entities.seek = oldSeek;
						e.cancel.unlisten(c);
						e.action.unlisten(l);
						reject(new UserCancelError());
					});
				}).bind(this));
			
			case "generateRegion":
				return new Promise((function(fulfill, reject) {
					var r = this._owner.getRegion();
					var e = this._owner.getPrimaryEntityLayer();
					
					var x = args.x!==undefined?args.x:passedArg.x;
					var y = args.y!==undefined?args.y:passedArg.y;
					var range = args.range!==undefined?args.range:passedArg.range;
					
					if(!passedArg.ignoreEntity && passedArg.entity) {
						x = passedArg.entity.tileX();
						y = passedArg.entity.tileY();
					}
					
					/*if("forEach" in args) {
						for(var i = 0; i < args.forEach.length; i ++) {
							var e = args.forEach[i];
							
							r.clearRegion(e.name);
						}
					}*/
					
					//console.profile("Region");
					r.generateRegion(x, y, range, args).then(function(region) {
						passedArg.regions[args.name] = region;
						passedArg.range = range;
						passedArg.x = x;
						passedArg.y = y;
						
						fulfill(passedArg);
					});
					//console.profileEnd("Region");
				}).bind(this));
			
			case "generateRegion^-1":
				/*this._owner.getRegion().clearRegion(args.region);
				
				if("forEach" in args) {
					for(var i = 0; i < args.forEach.length; i ++) {
						var e = args.forEach[i];
						
						this._owner.getRegion().clearRegion(e.name);
					}
				}*/
				// :D
				
				this._owner.getRegion().uncolourRegion(passedArg.regions[args.name]);
				
				return Promise.reject(new UserCancelError());
			
			case "getTileInRange":
			case "getTilePathInRange":
				return new Promise((function(fulfill, reject) {
					var r = this._owner.getRegion();
					var e = this._owner.getPrimaryEntityLayer();
					var oldSeek = entities.seek;
					this.ensureSelector();
					
					var region = passedArg.regions[args.regionToUse];
					var range = args.range !== undefined?args.range:passedArg.range;
					if(args.setCoord) args.x = passedArg.x;
					if(args.setCoord) args.y = passedArg.y;
					
					if(args.restrict) {
						this.selector.eProp("gwregion", region);
					}
					this.selector.eProp("grregion", region);
					
					var destRegion = new TileRegion(this._owner.getScheme(), r);
					destRegion.colour = args.colour;
					destRegion.name = args.destName;
					
					if(type == "getTilePathInRange") {
						this.selector.eProp("grrecording", true);
						this.selector.eProp("grrange", range);
						this.selector.eProp("grregionto", destRegion);
						this.selector.eProp("grsnap", true);
						this.selector.eProp("grmoves", []);
						
						args.x = passedArg.entity.tileX();
						args.y = passedArg.entity.tileY();
					}
					
					if(args.x !== undefined) this.selector.x = args.x * this.selector.width;
					if(args.y !== undefined) this.selector.y = args.y * this.selector.height;
					
					if(type == "getTilePathInRange") {
						//r.clearRegion(region+"_path");
						if("colourChildrenUnder" in args) {
							for(var i = 0; i < args.colourChildrenUnder.length; i ++) {
								r.colourRegion(region, args.colourChildrenUnder[i]);
							}
						}
						
						r.colourRegion(region);
						
						if("colourChildrenOver" in args) {
							for(var i = 0; i < args.colourChildrenOver.length; i ++) {
								r.colourRegion(region, args.colourChildrenOver[i]);
							}
						}
						
						if("colour" in args) {
							r.colourRegion(destRegion);
						}
					}
					
					entities.seek = this.selector.name;
					this.selector.visible = true;
					this.selector.eProp("gmMouseMove", true);
					
					var l = this.selector.action.listen((function(e) {
						var e = e.component;
						
						var x = e.tileX();
						var y = e.tileY();
						var fx = e.x;
						var fy = e.y;
						
						if(type == "getTilePathInRange") {
							var t = region.followPath(e.eProp("grmoves"));
							x = t[0];
							y = t[1];
							fx = t[0] * r.tileWidth();
							fy = t[1] * r.tileHeight();
						}
						
						if(!args.allowEntity) {
							var el = this._owner.getPrimaryEntityLayer().getEntitiesExactlyHere(fx, fy, e, true);
							if(el.length > 0 && (args.blockFirstEnt || el[0] != passedArg.entity)) {
								return true;
							}
						}
						
						passedArg.x = x;
						passedArg.y = y;
						passedArg.fullX = fx;
						passedArg.fullY = fy;
						passedArg.regions[args.destName] = destRegion;
						passedArg.path = e.eProp("grmoves").reverse();
						
						e.visible = false;
						e.eProp("gmMouseMove", false);
						e.eProp("grRecording", false);
						if(oldSeek) entities.seek = oldSeek;
						e.action.unlisten(l);
						e.cancel.unlisten(c);
						
						//if("colour" in args) {
						//	r.uncolourRegion(region+"_path");
						//}
						
						fulfill(passedArg);
					}).bind(this));
					
					var c = this.selector.cancel.listen(function(e) {
						var e = e.component;
						
						e.visible = false;
						e.eProp("gmMouseMove", false);
						e.eProp("grrecording", false);
						if(oldSeek) entities.seek = oldSeek;
						e.cancel.unlisten(c);
						e.action.unlisten(l);
						r.uncolourRegion(destRegion);
						
						//if("colour" in args) {
						//	r.uncolourRegion(region+"_path");
						//}
						
						reject(new UserCancelError());
					});
				}).bind(this));
			
			case "getTilePathInRange^-1":
				this.selector.eProp("grrecording", false);
				this._owner.getRegion().uncolourRegion(passedArg.regions[args.destName]);
			case "getTileInRange^1":
				return Promise.resolve(true);
			
			case "colourRegion":
				var r = this._owner.getRegion();
				
				for(var i = 0; i < args.regionsToColour.length; i ++) {
					var frags = args.regionsToColour[i].split(".");
					
					r.colourRegion(passedArg.regions[frags[0]], frags.slice(1).join("."));
				}
				
				return Promise.resolve(passedArg);
			
			case "colourRegion^-1":
				var r = this._owner.getRegion();
				
				for(var i = 0; i < args.regionsToColour; i ++) {
					var frags = args.regionsToColour[i].split(".");
					
					r.uncolourRegion(passedArg.regions[frags[1]], frags.slice(1));
				}
				
				return Promise.reject(new UserCancelError());
			
			
			case "uncolourRegion":
				var r = this._owner.getRegion();
				
				for(var i = 0; i < args.regionsToUncolour.length; i ++) {
					var frags = args.regionsToUncolour[i].split(".");
					
					r.uncolourRegion(passedArg.regions[frags[0]], frags.slice(1).join("."));
				}
				
				return Promise.resolve(passedArg);
			
			case "uncolourRegion^-1":
				var r = this._owner.getRegion();
				
				for(var i = 0; i < args.regionsToUncolour.length; i ++) {
					var frags = args.regionsToUncolour[i].split(".");
					
					r.colourRegion(passedArg.regions[frags[0]], frags.slice(1).join("."));
				}
				
				return Promise.reject(new UserCancelError());
			
			case "moveViaPath":
				return new Promise((function(fulfill, reject) {
					passedArg.entity.eProp("gwmoves", utils.copy(passedArg.path, true));
					var oldX = passedArg.entity.x;
					var oldY = passedArg.entity.y;
					
					passedArg.oldX = oldX;
					passedArg.oldY = oldY;
					
					if(passedArg.path.length){ 
						var l = passedArg.entity.entityEvent.listen((function(e) {
							if(!passedArg.entity.eProp("gwmoves").length) {
								passedArg.entity.entityEvent.unlisten(l);
								fulfill(passedArg);
							}
						}).bind(this), "gwStopMove");
					}else{
						fulfill(passedArg);
					}
				}).bind(this));
			
			case "moveViaPath^-1":
				passedArg.entity.x = passedArg.oldX;
				passedArg.entity.y = passedArg.oldY;
				
				return Promise.reject(new UserCancelError());
			
			case "selectListMenu":
				return new Promise((function(fulfill, reject) {
					var c = sgui.path(args.path);
					
					var options = args.options?args.options:passedArg.options;
					
					c.rows = options.length;
					c.cols = 1;
					c.populate(options);
					c.getRoot().pushActive();
					c.becomeActive();
					c.visible = true;
					
					var optm = {};
					
					var l = c.action.listen((function(e) {
						var s = c.getFocusedChild();
						var opt = options[s.name.split(",")[1]];
						
						if("listSelectFunction" in opt) {
							queue(opt.listSelectFunction);
						}
						
						passedArg.selectedValue = opt.listValue;
						
						c.visible = false;
						c.action.unlisten(l);
						c.cancel.unlisten(can);
						c.getRoot().popActive();
						
						if("listSelectCancel" in opt) {
							reject(new UserCancelError());
						}
						
						fulfill(passedArg);
					}).bind(this));
					
					var can = c.cancel.listen((function(e) {
						this._owner.becomeActive();
						c.visible = false;
						c.cancel.unlisten(can);
						c.action.unlisten(l);
						c.getRoot().popActive();
						
						reject(new UserCancelError());
					}).bind(this));
				}).bind(this));
			
			case "selectListMenu^-1":
				return Promise.resolve(true);
			
			case "getSeek^-1":
			case "selectEntity^-1":
				//When cancel, do nothing, and cancel
				return Promise.reject(new UserCancelError());
				
			default:
				console.error("QuestPuppeteer tried to do `"+type+"` but it doesn't know how.");
				return Promise.reject(new TypeError("QuestPuppeteer tried to do `"+type+"` but it doesn't know how."));
		}
	};
	
	QuestPuppeteer.prototype.requestBound = function(type, args) {
		return this.request.bind(this, type, args);
	};
	
	QuestPuppeteer.prototype.requestBoundPair = function(type, args) {
		return [this.request.bind(this, type, args), this.request.bind(this, type+"^-1", args), type];
	};
	
	QuestPuppeteer.prototype.getLayeredRoom = function() {
		return this._owner;
	};
	
	//Create selector entity
	entities.types.createNewType("puppetSelect", {
		"behaviours":{
			"PlayerGridWalker":true, "GridWalker":true, "GridRecorder":true, "GridMouse":true
		},
		"data":{
			"solid":false, "collides":false, "src":"default/selector32.png", "noSave":true, "noRegion":true,
			"gmMouseMove":false
		},
		"animation":[["true", "0,0|1,0|2,0|1,0", {}]]
	}, "quest");
	
	sgui.registerExtra("QuestPuppeteer", QuestPuppeteer);
	
	return QuestPuppeteer;
})());
