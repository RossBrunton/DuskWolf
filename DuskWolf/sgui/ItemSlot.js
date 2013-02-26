//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Group");
dusk.load.require("dusk.sgui.Tile");
dusk.load.require("dusk.sgui.Label");
dusk.load.require("dusk.sgui.Image");
dusk.load.require("dusk.items");
dusk.load.require("dusk.items.Invent");

dusk.load.provide("dusk.sgui.ItemSlot");

dusk.sgui.ItemSlot = function (parent, comName) {
	dusk.sgui.Group.call(this, parent, comName);
	
	this._invent = new dusk.items.Invent(1, [], Infinity);
	this.maxStack = Infinity;
	this.slot = 0;
	
	this._itemChild = this.getComponent("item", "Tile");
	this._handItemChild = this.getComponent("handitem", "Tile");
	this._textChild = this.getComponent("count", "Label");
	this._selectChild = this.getComponent("select", "Image");
	this.alterChildLayer("count", "+");
	
	//Prop masks
	this._registerPropMask("maxStack", "maxStack");
	this._registerPropMask("invent", "__invent", undefined, ["maxStack"]);
	
	//Listeners
	this.frame.listen(this._itemSlotFrame, this);
	this.action.listen(this._itemSlotAction, this);
};
dusk.sgui.ItemSlot.prototype = new dusk.sgui.Group();
dusk.sgui.ItemSlot.constructor = dusk.sgui.ItemSlot;

dusk.sgui.ItemSlot.prototype.className = "ItemSlot";

dusk.sgui.ItemSlot.prototype.setInventory = function(invent) {
	if(!(invent instanceof dusk.items.Invent)) {
		invent = new dusk.items.Invent(1, invent, this.maxStack);
	}
	
	this._invent.sendAllToInvent(invent);
	this._invent = invent;
};

dusk.sgui.ItemSlot.prototype.getInventory = function() {
	return this._invent;
};
Object.defineProperty(dusk.sgui.ItemSlot.prototype, "__invent", {
	set: function(value) {
		this.setInventory(value);
	},
	
	get: function(){
		return [];
	}
});

dusk.sgui.ItemSlot.prototype.putItem = function(item) {
	return this._invent.putItemIntoSlot(item, this.slot);
};

dusk.sgui.ItemSlot.prototype.getItem = function(item) {
	return this._invent.getItemFromSlot(this.slot);
};

dusk.sgui.ItemSlot.prototype._itemSlotFrame = function() {
	if(!this._itemChild) return;
	
	if(this._invent.getItemFromSlot(this.slot)) {
		this._itemChild.src = this._invent.getItemFromSlot(this.slot).get("src");
		this._itemChild.tileStr = this._invent.getItemFromSlot(this.slot).get("tile");
		this._textChild.text = this._invent.countSlot(this.slot)>1?this._invent.countSlot(this.slot):"";
	}else{
		this._itemChild.src = undefined;
		this._itemChild.tileStr = "0,0";
		this._textChild.text = "";
	}
	
	if(this._active) {
		this._selectChild.visible = true;
		var h = this._getHand();
		if(h && h.getHand().getItemFromSlot(0)) {
			this._handItemChild.visible = true;
			this._handItemChild.src = h.getHand().getItemFromSlot(0).get("src");
			this._handItemChild.tileStr = h.getHand().getItemFromSlot(0).get("tile");
		}
	}else{
		this._selectChild.visible = false;
		this._handItemChild.visible = false;
	}
};

dusk.sgui.ItemSlot.prototype._itemSlotAction = function(e) {
	var h = this._getHand();
	if(h) {
		if(h.getHand().countSlot(0) > 0) {
			//Holding something
			if(this._invent.isValidAddition(h.getHand().getItemFromSlot(0)) && this._invent.isValidAdditionToSlot(h.getHand().getItemFromSlot(0), this.slot)) {
				h.getHand().sendToInventSlot(this._invent, this.slot, e.keyPress.shiftKey?1:Infinity);
			}
		}else{
			//Not holding anything
			if(h.getHand().isValidAddition(this._invent.getItemFromSlot(this.slot))) {
				this._invent.sendSlotToInvent(h.getHand(), this.slot, e.keyPress.shiftKey?1:Infinity);
			}else{
				//..?
			}
		}
	}
};

dusk.sgui.ItemSlot.prototype._getHand = function() {
	var c = this;
	while(c = c.path("..")) {
		if(c instanceof dusk.sgui.ItemHand && !c.supressHand) {
			return c;
		}
	}
	
	return null;
};

Object.seal(dusk.sgui.ItemSlot);
Object.seal(dusk.sgui.ItemSlot.prototype);
