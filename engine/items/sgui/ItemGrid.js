//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.items.sgui.ItemGrid", function() {
	var Grid = load.require("dusk.sgui.Grid");
	var ItemSlot = load.require("dusk.items.sgui.ItemSlot");
	var sgui = load.require("dusk.sgui");
	var c = load.require("dusk.sgui.c");
	var items = load.require("dusk.items");
	var Invent = load.require("dusk.items.Inventory");
	
	class ItemGrid extends Grid {
		constructor(parent, name) {
			super(parent, name);
			
			this.maxStack = 0xffffffff;
			this._invent = new Invent(this.rows*this.cols, "1", this.maxStack);
			
			this._counter = 0;
			
			//Prop masks
			this._mapper.map("maxStack", "maxStack");
			this._mapper.map("invent", [() => [], this.setInventory], ["maxStack"]);
			this._mapper.addDepends("populate", "invent");
			
			//Listeners
			this._populationEvent.listen(this._igBefore.bind(this), "before");
			this._populationEvent.listen(this._igCreate.bind(this), "create");
		}
		
		setInventory(invent) {
			if(!(invent instanceof Invent)) {
				invent = new Invent(this.rows*this.cols, invent, this.maxStack);
			}
			
			this._invent.sendAllToInvent(invent);
			this._invent = invent;
		}
		
		_igBefore(e) {
			if("slot" in e.child) delete e.child.slot;
			if("invent" in e.child) delete e.child.invent;
			
			this._counter = 0;
			return e;
		}
		
		_igCreate(e) {
			if(e.component instanceof ItemSlot) {
				e.component.setInventory(this._invent);
				e.component.slot = this._counter++;
			}
			
			return e;
		}
	}
	
	sgui.registerType("ItemGrid", ItemGrid);
	
	return ItemGrid;
});
