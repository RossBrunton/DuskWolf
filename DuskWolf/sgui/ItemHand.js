//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.items");
dusk.load.require("dusk.items.Invent");

dusk.load.provide("dusk.sgui.ItemHand");

dusk.sgui.ItemHand = function (parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this._hand = new dusk.items.Invent(1, [], 0xffffffff);
	this.maxStack = 0xffffffff;
	this.supressHand = false;
	
	//Prop masks
	this._registerPropMask("maxStack", "maxStack");
	this._registerPropMask("supressHand", "supressHand");
	this._registerPropMask("invent", "__invent", undefined, ["maxStack"]);
};
dusk.sgui.ItemHand.prototype = new dusk.sgui.Group();
dusk.sgui.ItemHand.constructor = dusk.sgui.ItemHand;

dusk.sgui.ItemHand.prototype.className = "ItemHand";

dusk.sgui.ItemHand.prototype.setHand = function(invent) {
	if(!(invent instanceof dusk.items.Invent)) {
		invent = new dusk.items.Invent(1, invent, this.maxStack);
	}
	
	this._hand.sendAllToInvent(invent);
	this._hand = invent;
};

dusk.sgui.ItemHand.prototype.getHand = function() {
	return this._hand;
};
Object.defineProperty(dusk.sgui.ItemHand.prototype, "__invent", {
	set: function(value) {
		this.setHand(value);
	},
	
	get: function(){
		return [];
	}
});

//Locking
Object.defineProperty(dusk.sgui.ItemHand.prototype, "locked", {
	set: function(value) {
		//Pass
	},
	
	get: function(){
		return this.getHand().countSlot(0) > 0;
	}
});

Object.seal(dusk.sgui.ItemHand);
Object.seal(dusk.sgui.ItemHand.prototype);

dusk.sgui.registerType("ItemHand", dusk.sgui.ItemHand);
