//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.items.sgui.ItemHand", function() {
	var Group = load.require("dusk.sgui.Group");
	var sgui = load.require("dusk.sgui");
	var items = load.require("dusk.items");
	var Invent = load.require("dusk.items.Inventory");
	
	class ItemHand extends Group {
		constructor(parent, name) {
			super(parent, name);
			
			this._hand = new Invent(1, "true", 0xffffffff);
			this.maxStack = 0xffffffff;
			this.supressHand = false;
			
			//Prop masks
			this._mapper.map("maxStack", "maxStack");
			this._mapper.map("supressHand", "supressHand");
			this._mapper.map("invent", [() => [], this.setHand], ["maxStack"]);
		}
		
		setHand(invent) {
			if(!(invent instanceof Invent)) {
				invent = new Invent(1, invent, this.maxStack);
			}
			
			this._hand.sendAllToInvent(invent);
			this._hand = invent;
		}
		
		getHand() {
			return this._hand;
		}
		
		get locked() {
			return this.getHand().countSlot(0) > 0;
		}
		
		set locked(value) {}
	}
	
	sgui.registerType("ItemHand", ItemHand);
	
	return ItemHand;
});
