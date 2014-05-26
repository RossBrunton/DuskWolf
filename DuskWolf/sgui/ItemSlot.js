//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.ItemSlot", (function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var items = load.require("dusk.items");
	var Image = load.require("dusk.sgui.Image");
	var Label = load.require("dusk.sgui.Label");
	var Tile = load.require("dusk.sgui.Tile");
	var ItemHand = load.require("dusk.sgui.ItemHand");

	var ItemSlot = function (parent, comName) {
		Group.call(this, parent, comName);
		
		this._invent = new items.Invent(1, "true", 0xffffffff);
		this.maxStack = 0xffffffff;
		this.slot = 0;
		
		this._itemChild = this.getComponent("item", "Tile");
		this._handItemChild = this.getComponent("handitem", "Tile");
		this._textChild = this.getComponent("count", "Label");
		this._handTextChild = this.getComponent("handcount", "Label");
		this._selectChild = this.getComponent("select", "Image");
		this.alterChildLayer("count", "+");
		
		//Prop masks
		this._registerPropMask("maxStack", "maxStack");
		this._registerPropMask("invent", "__invent", undefined, ["maxStack"]);
		
		//Listeners
		this.frame.listen(this._itemSlotFrame.bind(this));
		this.action.listen(this._itemSlotAction.bind(this));
	};
	ItemSlot.prototype = Object.create(Group.prototype);

	ItemSlot.prototype.setInventory = function(invent) {
		if(!(invent instanceof items.Invent)) {
			invent = new items.Invent(1, invent, this.maxStack);
		}
		
		this._invent.sendAllToInvent(invent);
		this._invent = invent;
	};

	ItemSlot.prototype.getInventory = function() {
		return this._invent;
	};
	Object.defineProperty(ItemSlot.prototype, "__invent", {
		set: function(value) {this.setInventory(value);},
		get: function(){return [];}
	});

	ItemSlot.prototype.putItem = function(item) {
		return this._invent.putItemIntoSlot(item, this.slot);
	};

	ItemSlot.prototype.getItem = function(item) {
		return this._invent.getItemFromSlot(this.slot);
	};

	ItemSlot.prototype._itemSlotFrame = function() {
		if(!this._itemChild) return;
		
		if(this._invent.getItemFromSlot(this.slot)) {
			this._itemChild.src = this._invent.getItemFromSlot(this.slot).get("src");
			this._itemChild.tileStr = this._invent.getItemFromSlot(this.slot).get("tile");
			this._textChild.text = this._invent.countSlot(this.slot)>1?this._invent.countSlot(this.slot):"";
		}else{
			this._itemChild.src = "";
			this._itemChild.tileStr = "0,0";
			this._textChild.text = "";
		}
		
		if(this.active) {
			this._selectChild.visible = true;
			var h = this._getHand();
			if(h && h.getHand().getItemFromSlot(0)) {
				this._handItemChild.visible = true;
				this._handItemChild.src = h.getHand().getItemFromSlot(0).get("src");
				this._handItemChild.tileStr = h.getHand().getItemFromSlot(0).get("tile");
				
				this._handTextChild.visible = true;
				this._handTextChild.text = h.getHand().countSlot(0)>1?h.getHand().countSlot(0):"";
			}else{
				this._handItemChild.visible = false;
				this._handTextChild.visible = false;
			}
		}else{
			this._selectChild.visible = false;
			this._handItemChild.visible = false;
			this._handTextChild.visible = false;
		}
	};

	ItemSlot.prototype._itemSlotAction = function(e) {
		var h = this._getHand();
		
		if(h) {
			if(h.getHand().countSlot(0) > 0) {
				//Holding something
				if(this._invent.isValidAddition(h.getHand().getItemFromSlot(0))
				&& this._invent.isValidAdditionToSlot(h.getHand().getItemFromSlot(0), this.slot)) {
					//Can add the item
					h.getHand().sendToInventSlot(this._invent, this.slot, e.keyPress.shiftKey?1:0xffffffff);
				}else if(this._invent.isValidAddition(h.getHand().getItemFromSlot(0))) {
					//Swap them round
					var temp = new items.Invent(1, "true");
					this._invent.sendSlotToInvent(temp, this.slot, 0xffffffff);
					h.getHand().sendToInventSlot(this._invent, this.slot, 0xffffffff);
					temp.sendToInventSlot(h.getHand(), 0, 0xffffffff);
				}
					
			}else{
				//Not holding anything
				if(h.getHand().isValidAddition(this._invent.getItemFromSlot(this.slot))) {
					this._invent.sendSlotToInvent(h.getHand(), this.slot,
						e.keyPress.shiftKey?(this._invent.countSlot(this.slot)>>1):0xffffffff
					);
				}else{
					//..?
				}
			}
		}
	};

	ItemSlot.prototype._getHand = function() {
		var c = this;
		while(c = c.path("..")) {
			if(c instanceof ItemHand && !c.supressHand) {
				return c;
			}
		}
		
		return null;
	};

	Object.seal(ItemSlot);
	Object.seal(ItemSlot.prototype);

	sgui.registerType("ItemSlot", ItemSlot);

	sgui.addStyle("ItemSlot", {
		"width":32,
		"height":32,
		"children":[
			{
				"name":"back",
				"type":"Rect",
				"layer":"-",
				"width":32,
				"height":32
			},
			{
				"name":"item",
				"swidth":32,
				"sheight":32,
				"width":32,
				"height":32
			},
			{
				"name":"handItem",
				"swidth":32,
				"sheight":32,
				"width":32,
				"height":32,
				"alpha":0.75
			},
			{
				"name":"count",
				"size":13,
				"colour":"#ffffff",
				"borderColour":"#cccccc",
				"borderSize":0.5,
				"y":18,
				"x":1,
				"padding":0
			},
			{
				"name":"handCount",
				"size":13,
				"colour":"#ffffff",
				"borderColour":"#cccccc",
				"borderSize":0.5,
				"y":1,
				"x":1,
				"padding":0
			},
			{
				"name":"select",
				"width":32,
				"height":32,
				"src":"default/selector.png"
			}
		]
	});
	
	return ItemSlot;
})());
