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
	
	//Create selector entity
	dusk.entities.types.createNewType("puppetSelect", {
		"behaviours":{
			"PlayerGridWalker":true, "GridWalker":true, "GridRecorder":true,
		},
		"data":{
			"solid":false,
		}
	}, "quest");
};
dusk.sgui.extras.QuestPuppeteer.prototype = Object.create(dusk.sgui.extras.Extra.prototype);

dusk.sgui.extras.QuestPuppeteer.prototype.request = function(type, args) {
	switch(type) {
		case "disableFreeControl":
			this._owner.getSeek().eProp("playerControl", false);
			return Promise.cast(true);
		
		case "enableFreeControl":
			this._owner.getSeek().eProp("playerControl", true);
			return Promise.cast(true);
		
		case "getTileInRange":
		case "getTilePathInRange":
			return new Promise((function(fulfill, reject) {
				var r = this._owner.getRegion();
				var e = this._owner.getPrimaryEntityLayer();
				var oldSeek = dusk.entities.seek;
				
				var sel = e.dropEntity(
					{"x":0, "y":0, "type":"puppetSelect", "name":args.region+"_select"}, true
				);
				
				sel.eProp("gwregion", args.region);
				sel.eProp("grregion", args.region);
				
				if(type == "getTilePathInRange") {
					sel.eProp("grrecording", true);
					sel.eProp("grrange", args.range);
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
				
				dusk.entities.seek = args.region+"_select";
				
				sel.action.listen(function(e) {
					var e = e.component;
					
					var out = {
						"x":e.tileX(), "y":e.tileY(), "fullX":e.x, "fullY":e.y, "path":e.eProp("grmoves").reverse()
					};
					e.deleted = true;
					r.uncolourRegion(args.region);
					
					dusk.entities.seek = oldSeek;
					
					fulfill(out);
				});
				
				sel.cancel.listen(function(e) {
					var e = e.component;
					
					var out = {};
					e.deleted = true;
					r.uncolourRegion(args.region);
					
					dusk.entities.seek = oldSeek;
					
					reject(out);
				});
			}).bind(this));
		
		default:
			console.error("QuestPuppeteer tried to do `"+type+"` but it doesn't know how.");
			return Promise.cast(undefined);
	}
};

dusk.sgui.registerExtra("QuestPuppeteer", dusk.sgui.extras.QuestPuppeteer);
