//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.extras.Extra");
dusk.load.require(">dusk.quest");

dusk.load.provide("dusk.sgui.extras.QuestPuppeteer");

/* @class dusk.sgui.extras.DynamicWidth
 * 
 * @classdesc A dynamic width component changes it's width depending on the value of a range.
 * 
 * The width is changed to value between the `min` and `max` properties. The higher the value, the closer the range is
 *  to the `max` value.
 * 
 * @param {dusk.sgui.Component} owner The component this extra is "attached to".
 * @param {string} name This extra's name.
 * @extends dusk.sgui.extras.Extra
 * @constructor
 */
dusk.sgui.extras.QuestPuppeteer = function(owner, name) {
	dusk.sgui.extras.Extra.call(this, owner, name);
	
	this.request = this.request.bind(this);
};
dusk.sgui.extras.QuestPuppeteer.prototype = Object.create(dusk.sgui.extras.Extra.prototype);

dusk.sgui.extras.QuestPuppeteer.prototype.request = function(type, args, passedArg) {
	console.log(type);
	
	switch(type) {
		case "disableFreeControl":
			var old = this._owner.getSeek().eProp("playerControl");
			this._owner.getSeek().eProp("playerControl", false);
			return Promise.resolve(old);
		
		case "enableFreeControl":
			var old = this._owner.getSeek().eProp("playerControl");
			this._owner.getSeek().eProp("playerControl", true);
			return Promise.resolve(old);
		
		case "disableFreeControl^-1":
		case "enableFreeControl^-1":
			this._owner.getSeek().eProp("playerControl", passedArg);
			return Promise.reject(true);
		
		case "getSeek":
			return Promise.resolve(this._owner.getSeek());
		
		case "getTileInRange":
		case "getTilePathInRange":
			return new Promise((function(fulfill, reject) {
				var r = this._owner.getRegion();
				var e = this._owner.getPrimaryEntityLayer();
				var oldSeek = dusk.entities.seek;
				
				if("Entity" in dusk.sgui && passedArg instanceof dusk.sgui.Entity) {
					args.x = passedArg.tileX();
					args.y = passedArg.tileY();
				}
				
				var sel = e.dropEntity(
					{"x":0, "y":0, "type":"puppetSelect", "name":args.region+"_select"}, true
				);
				
				sel.eProp("gwregion", args.region);
				sel.eProp("grregion", args.region);
				
				if(type == "getTilePathInRange") {
					sel.eProp("grrecording", true);
					sel.eProp("grrange", args.range);
					sel.eProp("grregionto", args.region+"_path");
					sel.eProp("grsnap", true);
					sel.eProp("grmoves", []);
				}
				
				sel.src = args.src;
				sel.x = args.x * sel.width;
				sel.y = args.y * sel.height;
				
				r.clearRegion(args.region);
				r.expandRegion(args.region, args.x, args.y, args.range, args.los, args.ignoreFirst);
				
				if(args.colour) {
					r.colourRegion(args.region, args.colour);
				}else{
					r.uncolourRegion(args.region);
				}
				
				if(type == "getTilePathInRange") {
					r.clearRegion(args.region+"_path");
					if(args.colourPath) {
						r.colourRegion(args.region+"_path", args.colourPath);
					}
				}
				
				dusk.entities.seek = args.region+"_select";
				
				sel.action.listen(function(e) {
					var e = e.component;
					
					var out = {
						"x":e.tileX(), "y":e.tileY(), "fullX":e.x, "fullY":e.y, "path":e.eProp("grmoves").reverse(),
						"entity":passedArg?passedArg:null
					};
					e.deleted = true;
					r.uncolourRegion(args.region);
					r.uncolourRegion(args.region+"_path");
					
					dusk.entities.seek = oldSeek;
					
					fulfill(out);
				});
				
				sel.cancel.listen(function(e) {
					var e = e.component;
					
					var out = {};
					e.deleted = true;
					
					r.uncolourRegion(args.region);
					r.uncolourRegion(args.region+"_path");
					
					dusk.entities.seek = oldSeek;
					
					reject(out);
				});
			}).bind(this));
		
		case "moveViaPath":
			return new Promise((function(fulfill, reject) {
				passedArg.entity.eProp("gwmoves", passedArg.path);
				var oldX = passedArg.entity.x;
				var oldY = passedArg.entity.y;
				
				if(passedArg.path.length){ 
					var l = passedArg.entity.entityEvent.listen((function(e) {
						if(!passedArg.entity.eProp("gwmoves").length) {
							passedArg.entity.entityEvent.unlisten(l);
							fulfill({"entity":passedArg.entity, "oldX":oldX, "oldY":oldY});
						}
					}).bind(this), undefined, {"name":"gwStopMove"});
				}else{
					fulfill({"entity":passedArg.entity, "oldX":oldX, "oldY":oldY});
				}
			}).bind(this));
		
		case "moveViaPath^-1":
			passedArg.entity.x = passedArg.oldX;
			passedArg.entity.y = passedArg.oldY;
			
			return Promise.reject(true);
		
		case "getSeek^-1":
			//When cancel, do nothing, and cancel
			return Promise.reject(true);
		
		case "getTileInRange^1":
		case "getTilePathInRange^-1":
			//When cancel, do nothing, but don't cancel
			return Promise.resolve(true);
			
		default:
			console.error("QuestPuppeteer tried to do `"+type+"` but it doesn't know how.");
			return Promise.reject(new Error("QuestPuppeteer tried to do `"+type+"` but it doesn't know how."));
	}
};

dusk.sgui.extras.QuestPuppeteer.prototype.requestBound = function(type, args) {
	return this.request.bind(this, type, args);
};

dusk.sgui.extras.QuestPuppeteer.prototype.requestBoundPair = function(type, args, trans) {
	return [this.request.bind(this, type, args), this.request.bind(this, type+"^-1", args)];
};

//Create selector entity
dusk.entities.types.createNewType("puppetSelect", {
	"behaviours":{
		"PlayerGridWalker":true, "GridWalker":true, "GridRecorder":true,
	},
	"data":{
		"solid":false,
	}
}, "quest");

dusk.sgui.registerExtra("QuestPuppeteer", dusk.sgui.extras.QuestPuppeteer);
