//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.items", (function() {
	var utils = load.require("dusk.utils");
	var Inheritable = load.require("dusk.Inheritable");
	var InheritableContainer = load.require("dusk.InheritableContainer");
	var parseTree = load.require("dusk.parseTree");
	var EventDispatcher = load.require("dusk.EventDispatcher");
	
	/** @namespace dusk.items
	 * @name dusk.items
	 * 
	 * @description Contains methods of managing items.
	 * 
	 * Items are essentially just instances of `{@link dusk.Inheritable}`, which are from `{@link dusk.items.items}`.
	 * 	These objects describe the items, and what they do.
	 * 
	 * Extra data is specific to one individial item, and not to it's type.
	 *  This contains things such as how many usages it has left, if it is cursed or not, that kind of thing.
	 * 
	 * Items are stored in instances of `{@link dusk.items.Invent}`, where they can be added or removed.
	 *  This is used so that items can be transferred from one place to another easily,
	 *  but the item will remain in it's old place if it cannot be sent to the other item.
	 * 
	 * The item Inheritable has a property called `"makStack"` which is the maximum number of the items
	 *  that can be placed in an inventory, by default this is 0.
	 * 
	 * @since 0.0.17-alpha
	 */
	var items = {};
	
	/** An InheritableContainer that contains all the item types.
	 * @type dusk.InheritableContainer
	 */
	items.items = new InheritableContainer("dusk.items.items");
	
	//Create the default item.
	items.items.createNewType("root", {"maxStack":64});

	/** Creates a new inventory. 
	 * 
	 * @class dusk.items.Invent
	 * 
	 * @classdesc An inventory manages items, and has the ability to add or remove items.
	 * 
	 * It is recommended that this be used whenever multiple items need to be stored, rather than in an array or the like.
	 * 
	 * An inventory carries restrictions on what items can be stored in it, this is done by specifying a string for a 
	 *  `{@link dusk.sgui.parseTree`}. An "item" operator is added, which is the item to be added, and you can do things
	 *  like `"item.itemType = Sword"` to allow only swords.
	 * 
	 * Items are arranged in "slots", and are not sorted automatically.
	 *  The number of slots the inventory has is defined when it is created, and each slot can contain one type of item.
	 *	Multiple items of the same type can be stored in the same slot, up to the item's `"maxStack"` value,
	 *   or the Invent's `"maxStack"` value, whichever is lower.
	 * 
	 * @param {integer} capacity The number of inventory slots this inventory should have.
	 * @param {string} restriction The restriction on what items can be added to this inventory.
	 * @param {integer=0xffffffff} maxStack The maximum number of items that can be stored in one single slot.
	 * @since 0.0.17-alpha
	 * @constructor
	 */
	items.Invent = function(capacity, restriction, maxStack) {
		/** The capacity of the inventory, this is how many slots it has.
		 * @type integer
		 * @private
		 */
		this._capacity = capacity;
		/** An array of items.
		 *  Each element of this array will itself be either an array of `{@link dusk.Inheritable}` items, 
		 *  or null if the stack is empty.
		 * 
		 * Each element of this array is an "inventory slot".
		 * @type array
		 * @private
		 */
		this._items = [];
		
		/** The tree used for restrictions.
		 * 
		 * @type dusk.parseTree.Compiler
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._tree = new parseTree.Compiler([], [], [
			["item", (function(o) {return this._item;}).bind(this)],
		]);
		/** The compiled node for the restriction tree.
		 * 
		 * @type function
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._restriction = this._tree.compile(restriction).toFunction();
		/** The restriction, as unprocessed text.
		 * 
		 * @type string
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._restrictionText = restriction;
		/** Temporary storage for the item that is to be added for the parse tree.
		 * 
		 * @type ?dusk.Inheritable
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._item = null;
		
		/** The maximum number of items that can be in one stack.
		 * No item stack will have larger than this number of elements.
		 * @type integer
		 */
		this.maxStack = maxStack>=0?maxStack:0xffffffff;
		
		/** This will be fired when the contents of this inventory change. There is no event object.
		 * 
		 * This event may be fired multiple times for the same inventory change.
		 * @type dusk.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.contentsChanged = new EventDispatcher("dusk.items.Invent.contentsChanged");
	};
	
	/** Checks if the specified item can be added into the inventory.
	 * @param {dusk.Inheritable} item An item from `{@link dusk.items.items}` that should be checked.
	 * @return {boolean} Whether it can be added or not.
	 */
	items.Invent.prototype.isValidAddition = function(item) {
		if(!item || (this.countOccupiedSlots() >= this._capacity && this.findSlot(item.type) === -1)) return false;
		
		/*for(var i = this._restrictions.length-1; i >= 0; i --) {
			switch(this._restrictions[i][1]) {
				case items.REST_ISEQ:
					if(item.get(this._restrictions[i][0]) != this._restrictions[i][2]) return false;break;
				case items.REST_ISNEQ:
					if(item.get(this._restrictions[i][0]) == this._restrictions[i][2]) return false;break;
				
				case items.REST_ISIN:
					if(item.get(this._restrictions[i][0]) in this._restrictions[i][2]) return false;break;
				case items.REST_ISNIN:
					if(!(item.get(this._restrictions[i][0]) in this._restrictions[i][2])) return false;break;
				
				default:
					console.warn(this.toString()+" has invalid restrictions.");
			}
		}*/
		
		this._item = item;
		return this._restriction();
	};

	/** Checks if the specified item can be addet to an item slot.
	 *   This does not do anything that `{@link dusk.items.Invent#isValidAddition}` does,
	 *   and should not be used to replace it.
	 * @param {string|dusk.Inheritable} item An item type that should be checked,
	 *  either an item from `{@link dusk.items.items}` or a string type name.
	 * @param {integer} slot The slot to check.
	 * @return {boolean} Whether it can be added or not.
	 */
	items.Invent.prototype.isValidAdditionToSlot = function(item, slot) {
		if(slot >= this._capacity) return false;
		if(!this._items[slot]) return true;
		
		if(typeof item == "string") {
			if(this._items[slot] && this._items[slot][0].type === item
			&& this._items[slot].length < this.maxStack
			&& this._items[slot].length < items.items.get(item, "maxStack")) {
				return true;
			}
		}else{
			if(this._items[slot] && this._items[slot][0].type === item.type
			&& this._items[slot].length < this.maxStack && this._items[slot].length < item.get("maxStack")) {
				return true;
			}
		}
		
		return false;
	};

	/** Attempts to add multiple copies of the specified item, if possible.
	 * @param {string|dusk.Inheritable} item An item from `{@link dusk.items.items}`,
	 *  or a string type name, that should be added.
	 * @param {integer=1} amount The number of items that should be added, defaults to `1` if not specified.
	 * @param {boolean=false} noFire If true, then the `itemsUpdated` event will not fire.
	 * @return {integer} The number of items that are left after all possible items were added.
	 */
	items.Invent.prototype.addItem = function(item, amount, noFire) {
		if(isNaN(amount)) amount = 1;
		if(amount == 0) return 0;
		if(!(item instanceof Inheritable)) item = items.items.create(item);
		if(!this.isValidAddition(item)) return amount;
		
		var slot = this.findSlot(item.type);
		if(slot === -1) slot = this.findEmptySlot();
		if(slot === -1) return amount;
		
		this.putItemIntoSlot(item.copy(), slot);
		var out = this.addItem(item, amount-1, true);
		this.contentsChanged.fire();
		return out;
	};

	/** Attempts to remove multiple copies of the specified item, if possible.
	 * @param {string} type The type of item to be removed.
	 * @param {integer=1} amount The number of items that should be removed, defaults to `1` if not specified.
	 * @param {boolean=false} noFire If true, then the `itemsUpdated` event will not fire.
	 * @return {integer} The number of items that could not be removed, possibly because they do not exist.
	 */
	items.Invent.prototype.removeItem = function(type, amount, noFire) {
		if(isNaN(amount)) amount = 1;
		if(amount == 0) return 0;
		
		for(var i = 0; i < this._capacity; i ++) {
			if(this._items[i] && this._items[i][0].type == type && this._items[i].length > 1) {
				this._items[i].pop();
				var out = this.removeItem(type, amount-1, true);
				this.contentsChanged.fire();
				return out;
			}else if(this._items[i] && this._items[i][0].type == type && this._items[i].length == 1) {
				this._items[i] = null;
				if(i == this._items.length-1) this._items.length = this._items.length-1;
				var out = this.removeItem(type, amount-1, true);
				this.contentsChanged.fire();
				return out;
			}
		}
		
		return amount;
	};

	/** Returns an item of the specified type, if it exists in the inventory. The item will remain in the inventory.
	 * @param {string} type The type of item to look up.
	 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that was previously added of the specified type, 
	 *  or null if it doesn't exist.
	 */
	items.Invent.prototype.getAnItem = function(type) {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i] && this._items[i][0].type == type) {
				return this._items[i][0];
			}
		}
		
		return null;
	};

	/** Returns any item if it exists in the inventory. The item will remain in the inventory.
	 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that was previously added,
	 *  or null if the inventory is empty.
	 */
	items.Invent.prototype.getAnyItem = function() {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i]) {
				return this._items[i][0];
			}
		}
		
		return null;
	};

	/** Removes and returns an item of the specified type. The item will no longer remain in the inventory.
	 * @param {string} type The type of item to take.
	 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that was previously added
	 *  and has just been removed of the specified type, or null if it doesn't exist.
	 */
	items.Invent.prototype.takeAnItem = function(type) {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i] && this._items[i][0].type == type && this._items[i].length > 1) {
				var out = this._items[i].pop();
				this.contentsChanged.fire();
				return out;
			}else if(this._items[i] && this._items[i][0].type == type && this._items[i].length == 1) {
				var hold = this._items[i][0];
				this._items[i] = null;
				if(i == this._items.length-1) this._items.length = this._items.length-1;
				this.contentsChanged.fire();
				return hold;
			}
		}
		
		return null;
	};

	/** Counts the total number of items in the inventory.
	 * @return {integer} The number of items in the inventory.
	 */
	items.Invent.prototype.countItems = function() {
		var count = 0;
		
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i]) {
				count += this._items[i].length;
			}
		}
		
		return count;
	};

	/** Counts the total number of occupied slots in the inventory.
	 * @return {integer} The number of occupied slots in the inventory.
	 */
	items.Invent.prototype.countOccupiedSlots = function() {
		var count = 0;
		
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i]) {
				count++;
			}
		}
		
		return count;
	};

	/** Returns the number of items of the specified type in the inventory.
	 * @param {string} type The type to count.
	 * @return {integer} The total number of items of that type in the inventory.
	 */
	items.Invent.prototype.countItemsOfType = function(type) {
		var count = 0;
		
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i] && this._items[i][0].type == type) {
				count += this._items[i].length;
			}
		}
		
		return count;
	};

	/** Sends the specified amount of items of a specified type to another inventory.
	 * 
	 * If not all of the items can be added, then they will remain in this inventory.
	 * @param {dusk.items.Invent} dest The destination inventory.
	 * @param {string} type The type of item to send.
	 * @param {integer=1} howMany The number of items to send. Defaults to `1` if not specified.
	 * @return {integer} The number of items that were not sent to the other inventory, and hence remain in this one.
	 */
	items.Invent.prototype.sendToInvent = function(dest, type, howMany) {
		if(howMany === undefined) howMany = 1;
		for(var i = howMany; i > 0; i --) {
			if(this.countItemsOfType(type) > 0 && dest.isValidAddition(this.getAnItem(type))) {
				dest.addItem(this.takeAnItem(type), true);
			}else{
				dest.contentsChanged.fire();
				return i;
			}
		}
		
		dest.contentsChanged.fire();
		return 0;
	};

	/** Sends the specified amount of items to another inventory in the specified slot.
	 * 
	 * If not all of the items can be added, then they will remain in this inventory.
	 * @param {dusk.items.Invent} dest The destination inventory.
	 * @param {slot} slot The slot to send the item to.
	 * @param {integer=1} howMany The number of items to send. Defaults to `1` if not specified.
	 * @return {integer} The number of items that were not sent to the other inventory, and hence remain in this one.
	 */
	items.Invent.prototype.sendToInventSlot = function(dest, slot, howMany) {
		if(howMany === undefined) howMany = 1;
		var type = "";
		if(dest.getItemFromSlot(slot) === null) {
			type = this.getAnyItem().type;
		}else{
			type = dest.getItemFromSlot(slot).type;
		}
		
		for(var i = howMany; i > 0; i --) {
			if(this.countItemsOfType(type) > 0 && dest.isValidAddition(this.getAnItem(type)) 
			&& dest.isValidAdditionToSlot(this.getAnItem(type), slot)) {
				dest.putItemIntoSlot(this.takeAnItem(type), slot);
			}else{
				dest.contentsChanged.fire();
				return i;
			}
		}
		
		dest.contentsChanged.fire();
		return 0;
	};

	/** Sends the specified amount of items from a specified slot to another inventory.
	 * 
	 * If not all of the items can be added, then they will remain in their original slot.
	 * @param {dusk.items.Invent} dest The destination inventory.
	 * @param {integer} slot The origin slot.
	 * @param {integer=1} howMany The number of items to send. Defaults to `1` if not specified.
	 * @return {integer} The number of items that were not sent to the other inventory, and hence remain in this one.
	 */
	items.Invent.prototype.sendSlotToInvent = function(dest, slot, howMany) {
		if(howMany === undefined) howMany = 1;
		if(slot >= this._capacity) return howMany;
		for(var i = howMany; i > 0; i --) {
			if(this.countSlot(slot) && dest.isValidAddition(this.getItemFromSlot(slot))) {
				dest.addItem(this.takeItemFromSlot(slot));
			}else{
				dest.contentsChanged.fire();
				return i;
			}
		}
		
		dest.contentsChanged.fire();
		return 0;
	};

	/** Attempts to send every item in this inventory to the specified other one.
	 * 
	 * If they cannot all be added to that inventory, they will remain in this one.
	 * @param {dusk.items.Invent} dest The destination inventory.
	 */
	items.Invent.prototype.sendAllToInvent = function(dest) {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i] !== null) {
				this.sendToInvent(dest, this._items[i][0].type, 0xffffffff);
			}
		}
	};

	/** Returns an item that is in the specified slot.
	 * @param {integer} slot The slot to check for the item.
	 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that is in this slot, 
	 *  or null if it doesn't exist.
	 */
	items.Invent.prototype.getItemFromSlot = function(slot) {
		if(!this._items[slot]) return null;
		return this._items[slot][0];
	};

	/** Returns and removes an item that is in the specified slot.
	 * @param {integer} slot The slot to remove the item from.
	 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that is in this slot,
	 *  or null if it doesn't exist.
	 */
	items.Invent.prototype.takeItemFromSlot = function(slot) {
		if(!this._items[slot]) return null;
		var toReturn = this._items[slot][this._items[slot].length-1];
		
		if(this._items[slot].length == 1) {
			this._items[slot] = null;
			if(slot == this._items.length-1) this._items.length = this._items.length-1;
		}else{
			this._items[slot].pop();
		}
		
		this.contentsChanged.fire();
		return toReturn;
	};

	/** Puts an item into the specified slot.
	 * @param {integer} slot The slot to check for the item.
	 * @param {string|dusk.Inheritable} item The item to add to this slot, or the type name.
	 * @return {boolean} Whether the item was successfully added.
	 */
	items.Invent.prototype.putItemIntoSlot = function(item, slot) {
		if(slot >= this._capacity) return false;
		if(!(item instanceof Inheritable)) item = items.items.create(item);
		if(!this.isValidAddition(item)) return false;
		if(!this.isValidAdditionToSlot(item, slot)) return false;
		
		if(this._items[slot]) {
			this._items[slot][this._items[slot].length] = item;
		}else{
			this._items[slot] = [item];
		}
		
		this.contentsChanged.fire();
		return true;
	};

	/** Counts the number of items in the specified slot.
	 * @param {integer} slot The slot to count.
	 * @return {integer} The number of items in the slot.
	 */
	items.Invent.prototype.countSlot = function(slot) {
		if(!this._items[slot]) return 0;
		return this._items[slot].length;
	};

	/** Finds a non-full, non-empty slot that the item can be dumped into.
	 * @param {string} type The type of the item to insert.
	 * @return {integer} The number of the slot, or -1 if it was not found.
	 */
	items.Invent.prototype.findSlot = function(type) {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i] && this.isValidAdditionToSlot(type, i)) {
				return i;
			}
		}
		
		return -1;
	};

	/** Finds a slot that contains no items.
	 * @return {integer} The number of the slot, or -1 if it was not found.
	 */
	items.Invent.prototype.findEmptySlot = function() {
		for(var i = 0; i < this._capacity; i ++) {
			if(!this._items[i]) {
				return i;
			}
		}
		
		return -1;
	};

	/** Calls the given function once for each item in the invent.
	 * @param {function(dusk.Inheritable, int):undefined} funct The function to call. Second argument is the slot.
	 * @since 0.0.21-alpha
	 */
	items.Invent.prototype.forEach = function(funct) {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i]) {
				for(var j = 0; j < this._items[i].length; j ++) {
					funct(this._items[i][j], i);
				}
			}
		}
	};

	/** Calls the given function once for each slot in the invent. For each slot, the top item in it will be the argument.
	 * @param {function(dusk.Inheritable, int):undefined} funct The function to call. Second argument is the slot.
	 * @since 0.0.21-alpha
	 */
	items.Invent.prototype.forEachSlot = function(funct) {
		for(var i = 0; i < this._items.length; i ++) {
			if(this._items[i]) {
				funct(this._items[i][this._items[i].length-1], i);
			}
		}
	};

	/** Saves this inventory to an object that can then be loaded with `{@link dusk.items.Invent#refLoad}`.
	 * 
	 * This requires `{@link dusk.save}` to be imported.
	 * @return {object} This inventory, as an object.
	 * @since 0.0.21-alpha
	 */
	items.Invent.prototype.refSave = function(ref) {
		var out = [];
		
		for(var i = 0; i < this._items.length; i ++) {
			out[i] = [];
			
			if(this._items[i]) {
				for(var j = 0; j < this._items[i].length; j ++) {
					out[i][j] = ref(this._items[i][j]);
				}
			}
		}
		
		return [out, this._capacity, this._restrictionText, this.maxStack];
	};

	/** Given a previously saved inventory (via `{@link items.Invent#refSave}`) will create a new inventory matching
	 *  the data that was saved.
	 * 
	 * This requires `{@link save}` to be imported.
	 * @param {object} data The saved data.
	 * @return {items.Invent} An inventory from the saved data.
	 * @since 0.0.21-alpha
	 * @static
	 */
	items.Invent.refLoad = function(data, unref) {
		var invent = new items.Invent(data[1], data[2], data[3]);
		var items = data[0];
		
		for(var i = 0; i < items.length; i ++) {
			for(var j = 0; j < items[i].length; j ++) {
				invent.putItemIntoSlot(unref(items[i][j]), i);
			}
		}
		
		return invent;
	};

	/** Returns the name of the class for use in saving.
	 * @return {string} The string "dusk.items.Invent".
	 * @since 0.0.21-alpha
	 */
	items.Invent.prototype.refClass = items.Invent.refClass = function() {
		return "dusk.items.Invent";
	};

	/** Returns a string representation of the inventory, and all it's items.
	 * @return {string} A string representation of the inventory.
	 */
	items.Invent.prototype.toString = function() {
		var holdStr = "[inventory ";
		for(var i = 0; i < this._capacity; i ++) {
			if(this._items[i]) {
				holdStr += this._items[i][0].type + ":" + this._items[i].length;
			}else{
				holdStr += "(null)";
			}
			if(i < this._capacity-1) holdStr += ", ";
		}
		return holdStr + "]";
	};
	
	Object.seal(items);
	Object.seal(items.Invent);
	Object.seal(items.Invent.prototype);
	
	//Testing
	items.items.createNewType("sword", {"itemType":"Sword"});
	items.items.createNewType("stabbySword", {"damage":12}, "sword");
	
	items.items.createNewType("potion", {"itemType":"Potion", "src":"pimg/items.png", "tile":"0,0", "obj":{"a":1, "b":7}});
	items.items.createNewType("heal", {"restore":50, "tile":"2,0", "obj":{"b":2, "c":3}}, "potion");
	items.items.createNewType("blood", {"restore":50, "tile":"1,0"}, "potion");
	items.items.createNewType("magic", {"restore":50, "tile":"3,0"}, "potion");
	
	window.swords = new items.Invent(5, "item.itemType = Sword");
	swords.addItem(items.items.create("sword"), 5);
	swords.addItem(items.items.create("stabbySword"), 1);
	
	window.extraInvent = new items.Invent(5, "true");
	
	return items;
})());
