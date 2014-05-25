//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.ItemHand", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var items = load.require("dusk.items");

	var ItemHand = function (parent, comName) {
		Group.call(this, parent, comName);
		
		this._hand = new items.Invent(1, "true", 0xffffffff);
		this.maxStack = 0xffffffff;
		this.supressHand = false;
		
		//Prop masks
		this._registerPropMask("maxStack", "maxStack");
		this._registerPropMask("supressHand", "supressHand");
		this._registerPropMask("invent", "__invent", undefined, ["maxStack"]);
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

	Object.seal(ItemHand);
	Object.seal(ItemHand.prototype);

	sgui.registerType("ItemHand", ItemHand);
	
	return ItemHand;
})());
