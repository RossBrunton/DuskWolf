//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.items.sgui.ItemHand", function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var items = load.require("dusk.items");
	
	var ItemHand = function (parent, name) {
		Group.call(this, parent, name);
		
		this._hand = new items.Invent(1, "true", 0xffffffff);
		this.maxStack = 0xffffffff;
		this.supressHand = false;
		
		//Prop masks
		this._mapper.map("maxStack", "maxStack");
		this._mapper.map("supressHand", "supressHand");
		this._mapper.map("invent", "__invent", ["maxStack"]);
	};
	ItemHand.prototype = Object.create(Group.prototype);
	
	ItemHand.prototype.setHand = function(invent) {
		if(!(invent instanceof items.Invent)) {
			invent = new items.Invent(1, invent, this.maxStack);
		}
		
		this._hand.sendAllToInvent(invent);
		this._hand = invent;
	};
	
	ItemHand.prototype.getHand = function() {
		return this._hand;
	};
	Object.defineProperty(ItemHand.prototype, "__invent", {
		set: function(value) {this.setHand(value);},
		get: function(){return [];}
	});
	
	//Locking
	Object.defineProperty(ItemHand.prototype, "locked", {
		set: function(value) {},
		get: function(){return this.getHand().countSlot(0) > 0;}
	});
	
	sgui.registerType("ItemHand", ItemHand);
	
	return ItemHand;
});
