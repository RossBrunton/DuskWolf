//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.items.sgui.ItemSlot", function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var items = load.require("dusk.items");
	var Invent = load.require("dusk.items.Inventory");
	var Image = load.require("dusk.sgui.Image");
	var Label = load.require("dusk.sgui.Label");
	var Tile = load.require("dusk.tiles.sgui.Tile");
	var ItemHand = load.require("dusk.items.sgui.ItemHand");
	
	class ItemSlot extends Group {
		constructor(parent, name) {
			super(parent, name);
			
			this._invent = new Invent(1, "true", 0xffffffff);
			this.maxStack = 0xffffffff;
			this.slot = 0;
			
			this._itemChild = this.get("item", "Tile");
			this._handItemChild = this.get("handitem", "Tile");
			this._textChild = this.get("count", "Label");
			this._handTextChild = this.get("handcount", "Label");
			this._selectChild = this.get("select", "Image");
			this.alterChildLayer("count", "+");
			
			//Prop masks
			this._mapper.map("maxStack", "maxStack");
			this._mapper.map("invent", [this.setInventory, ()=>[]], ["maxStack"]);
			
			//Listeners
			this.frame.listen(this._itemSlotFrame.bind(this));
			this.action.listen(this._itemSlotAction.bind(this));
		}
		
		setInventory(invent) {
			if(!(invent instanceof Invent)) {
				invent = new Invent(1, invent, this.maxStack);
			}
			
			this._invent.transferAllToInvent(invent);
			this._invent = invent;
		}
		
		getInventory() {
			return this._invent;
		}
		
		putItem(item) {
			return this._invent.putItemIntoSlot(item, this.slot);
		}
		
		getItem(item) {
			return this._invent.getItemFromSlot(this.slot);
		}
		
		_itemSlotFrame() {
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
		}
		
		_itemSlotAction(e) {
			var h = this._getHand();
			
			if(h) {
				if(h.getHand().countSlot(0) > 0) {
					//Holding something
					if(this._invent.isValidAddition(h.getHand().getItemFromSlot(0))
					&& this._invent.isValidAdditionToSlot(h.getHand().getItemFromSlot(0), this.slot)) {
						//Can add the item
						h.getHand().transferToInventSlot(this._invent, this.slot, e.shift?1:0xffffffff);
					}else if(this._invent.isValidAddition(h.getHand().getItemFromSlot(0))) {
						//Swap them round
						var temp = new Invent(1, "true");
						this._invent.transferSlotToInvent(temp, this.slot, 0xffffffff);
						h.getHand().transferToInventSlot(this._invent, this.slot, 0xffffffff);
						temp.transferToInventSlot(h.getHand(), 0, 0xffffffff);
					}
						
				}else{
					//Not holding anything
					if(h.getHand().isValidAddition(this._invent.getItemFromSlot(this.slot))) {
						this._invent.transferSlotToInvent(h.getHand(), this.slot,
							e.shift?(this._invent.countSlot(this.slot)>>1):0xffffffff
						);
					}else{
						//..?
					}
				}
			}
		}
		
		_getHand() {
			var c = this;
			while(c = c.path("..")) {
				if(c instanceof ItemHand && !c.supressHand) {
					return c;
				}
			}
			
			return null;
		}
	}
	
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
});
