//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.utils");
dusk.load.require("dusk.Inheritable");
dusk.load.require("dusk.InheritableContainer");
dusk.load.require("dusk.parseTree");

dusk.load.provide("dusk.items");
dusk.load.provide("dusk.items.Invent");

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

/** Initiates the items namespace.
 * @private
 */
dusk.items._init = function() {
	/** An InheritableContainer that contains all the item types.
	 * @type dusk.InheritableContainer
	 */
	dusk.items.items = new dusk.InheritableContainer("dusk.items.items");
	
	//Create the default item.
	dusk.items.items.createNewType("root", {"maxStack":64});
	
	//Testing
	dusk.items.items.createNewType("sword", {"itemType":"Sword"});
	dusk.items.items.createNewType("stabbySword", {"damage":12}, "sword");
	
	dusk.items.items.createNewType("potion", {"itemType":"Potion", "src":"pimg/items.png", "tile":"0,0", "obj":{"a":1, "b":7}});
	dusk.items.items.createNewType("heal", {"restore":50, "tile":"2,0", "obj":{"b":2, "c":3}}, "potion");
	dusk.items.items.createNewType("blood", {"restore":50, "tile":"1,0"}, "potion");
	dusk.items.items.createNewType("magic", {"restore":50, "tile":"3,0"}, "potion");
	
	window.swords = new dusk.items.Invent(5, "item.itemType = Sword");
	swords.addItem(dusk.items.items.create("sword"), 5);
	swords.addItem(dusk.items.items.create("stabbySword"), 1);
	
	window.extraInvent = new dusk.items.Invent(5, "true");
};

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
dusk.items.Invent = function(capacity, restriction, maxStack) {
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
	for(var i = 0; i < capacity; i ++) this._items[i] = null;
	
	/** The tree used for restrictions.
	 * 
	 * @type dusk.parseTree.Compiler
	 * @private
	 * @since 0.0.21-alpha
	 */
	this._tree = new dusk.parseTree.Compiler([], [], [
		["item", (function(o) {return this._item;}).bind(this)],
	]);
	/** The compiled node for the restriction tree.
	 * 
	 * @type function
	 * @private
	 * @since 0.0.21-alpha
	 */
	this._restriction = this._tree.compile(restriction).toFunction();
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
};

/** Checks if the specified item can be added into the inventory.
 * @param {dusk.Inheritable} item An item from `{@link dusk.items.items}` that should be checked.
 * @return {boolean} Whether it can be added or not.
 */
dusk.items.Invent.prototype.isValidAddition = function(item) {
	if(!item || (this.countOccupiedSlots() >= this._capacity && this.findSlot(item.type) === -1)) return false;
	
	/*for(var i = this._restrictions.length-1; i >= 0; i --) {
		switch(this._restrictions[i][1]) {
			case dusk.items.REST_ISEQ:
				if(item.get(this._restrictions[i][0]) != this._restrictions[i][2]) return false;break;
			case dusk.items.REST_ISNEQ:
				if(item.get(this._restrictions[i][0]) == this._restrictions[i][2]) return false;break;
			
			case dusk.items.REST_ISIN:
				if(item.get(this._restrictions[i][0]) in this._restrictions[i][2]) return false;break;
			case dusk.items.REST_ISNIN:
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
dusk.items.Invent.prototype.isValidAdditionToSlot = function(item, slot) {
	if(!(slot in this._items)) return false;
	if(this._items[slot] === null) return true;
	
	if(typeof item == "string") {
		if(this._items[slot] && this._items[slot][0].type === item
		&& this._items[slot].length < this.maxStack
		&& this._items[slot].length < dusk.items.items.get(item, "maxStack")) {
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
 * @return {integer} The number of items that are left after all possible items were added.
 */
dusk.items.Invent.prototype.addItem = function(item, amount) {
	if(isNaN(amount)) amount = 1;
	if(amount == 0) return 0;
	if(!(item instanceof dusk.Inheritable)) item = dusk.items.items.create(item);
	if(!this.isValidAddition(item)) return amount;
	
	var slot = this.findSlot(item.type);
	if(slot === -1) slot = this.findEmptySlot();
	if(slot === -1) return amount;
	
	this.putItemIntoSlot(item.copy(), slot);
	return this.addItem(item, amount-1);
};

/** Attempts to remove multiple copies of the specified item, if possible.
 * @param {string} type The type of item to be removed.
 * @param {integer=1} amount The number of items that should be removed, defaults to `1` if not specified.
 * @return {integer} The number of items that could not be removed, possibly because they do not exist.
 */
dusk.items.Invent.prototype.removeItem = function(type, amount) {
	if(isNaN(amount)) amount = 1;
	if(amount == 0) return 0;
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] && this._items[i][0].type == type && this._items[i].length > 1) {
			this._items[i].pop();
			return this.removeItem(type, amount-1);
		}else if(this._items[i] && this._items[i][0].type == type && this._items[i].length == 1) {
			this._items[i] = null;
			return this.removeItem(type, amount-1);
		}
	}
	
	return amount;
};

/** Returns an item of the specified type, if it exists in the inventory. The item will remain in the inventory.
 * @param {string} type The type of item to look up.
 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that was previously added of the specified type, 
 *  or null if it doesn't exist.
 */
dusk.items.Invent.prototype.getAnItem = function(type) {
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
dusk.items.Invent.prototype.getAnyItem = function() {
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
dusk.items.Invent.prototype.takeAnItem = function(type) {
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] && this._items[i][0].type == type && this._items[i].length > 1) {
			return this._items[i].pop();
		}else if(this._items[i] && this._items[i][0].type == type && this._items[i].length == 1) {
			var hold = this._items[i][0];
			this._items[i] = null;
			return hold;
		}
	}
	
	return null;
};

/** Counts the total number of items in the inventory.
 * @return {integer} The number of items in the inventory.
 */
dusk.items.Invent.prototype.countItems = function() {
	var count = 0;
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] != null) {
			count += this._items[i].length;
		}
	}
	
	return count;
};

/** Counts the total number of occupied slots in the inventory.
 * @return {integer} The number of occupied slots in the inventory.
 */
dusk.items.Invent.prototype.countOccupiedSlots = function() {
	var count = 0;
	
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] != null) {
			count++;
		}
	}
	
	return count;
};

/** Returns the number of items of the specified type in the inventory.
 * @param {string} type The type to count.
 * @return {integer} The total number of items of that type in the inventory.
 */
dusk.items.Invent.prototype.countItemsOfType = function(type) {
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
dusk.items.Invent.prototype.sendToInvent = function(dest, type, howMany) {
	if(howMany === undefined) howMany = 1;
	for(var i = howMany; i > 0; i --) {
		if(this.countItemsOfType(type) > 0 && dest.isValidAddition(this.getAnItem(type))) {
			dest.addItem(this.takeAnItem(type));
		}else{
			return i;
		}
	}
	
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
dusk.items.Invent.prototype.sendToInventSlot = function(dest, slot, howMany) {
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
			return i;
		}
	}
	
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
dusk.items.Invent.prototype.sendSlotToInvent = function(dest, slot, howMany) {
	if(howMany === undefined) howMany = 1;
	if(!(slot in this._items)) return howMany;
	for(var i = howMany; i > 0; i --) {
		if(this.countSlot(slot) && dest.isValidAddition(this.getItemFromSlot(slot))) {
			dest.addItem(this.takeItemFromSlot(slot));
		}else{
			return i;
		}
	}
	
	return 0;
};

/** Attempts to send every item in this inventory to the specified other one.
 * 
 * If they cannot all be added to that inventory, they will remain in this one.
 * @param {dusk.items.Invent} dest The destination inventory.
 */
dusk.items.Invent.prototype.sendAllToInvent = function(dest) {
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
dusk.items.Invent.prototype.getItemFromSlot = function(slot) {
	if(!this._items[slot]) return null;
	return this._items[slot][0];
};

/** Returns and removes an item that is in the specified slot.
 * @param {integer} slot The slot to remove the item from.
 * @return {?dusk.Inheritable} An item from `{@link dusk.items.items}` that is in this slot,
 *  or null if it doesn't exist.
 */
dusk.items.Invent.prototype.takeItemFromSlot = function(slot) {
	if(!this._items[slot]) return null;
	var toReturn = this._items[slot][this._items[slot].length-1];
	
	if(this._items[slot].length == 1) {
		this._items[slot] = null;
	}else{
		this._items[slot].pop();
	}
	
	return toReturn;
};

/** Puts an item into the specified slot.
 * @param {integer} slot The slot to check for the item.
 * @param {string|dusk.Inheritable} item The item to add to this slot, or they type name.
 * @return {boolean} Whether the item was successfully added.
 */
dusk.items.Invent.prototype.putItemIntoSlot = function(item, slot) {
	if(!(slot in this._items)) return false;
	if(!(item instanceof dusk.Inheritable)) item = dusk.items.items.create(item);
	if(!this.isValidAddition(item)) return false;
	if(!this.isValidAdditionToSlot(item, slot)) return false;
	
	if(this._items[slot]) {
		this._items[slot][this._items[slot].length] = item;
	}else{
		this._items[slot] = [item];
	}
	
	return true;
};

/** Counts the number of items in the specified slot.
 * @param {integer} slot The slot to count.
 * @return {integer} The number of items in the slot.
 */
dusk.items.Invent.prototype.countSlot = function(slot) {
	if(!this._items[slot]) return 0;
	return this._items[slot].length;
};

/** Finds a non-full, non-empty slot that the item can be dumped into.
 * @param {string} type The type of the item to insert.
 * @return {integer} The number of the slot, or -1 if it was not found.
 */
dusk.items.Invent.prototype.findSlot = function(type) {
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] !== null && this.isValidAdditionToSlot(type, i)) {
			return i;
		}
	}
	
	return -1;
};

/** Finds a slot that contains no items.
 * @return {integer} The number of the slot, or -1 if it was not found.
 */
dusk.items.Invent.prototype.findEmptySlot = function() {
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i] === null) {
			return i;
		}
	}
	
	return -1;
};

/** Calls the given function once for each item in the invent.
 * @param {function(dusk.Inheritable, int):undefined} funct The function to call. Second argument is the slot.
 * @since 0.0.21-alpha
 */
dusk.items.Invent.prototype.forEach = function(funct) {
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
dusk.items.Invent.prototype.forEach = function(funct) {
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i]) {
			funct(this._items[i][this._items[i].length-1], i);
		}
	}
};

/** Returns a string representation of the inventory, and all it's items.
 * @return {string} A string representation of the inventory.
 */
dusk.items.Invent.prototype.toString = function() {
	var holdStr = "[inventory ";
	for(var i = 0; i < this._items.length; i ++) {
		if(this._items[i]) {
			holdStr += this._items[i][0].type + ":" + this._items[i].length;
		}else{
			holdStr += "(null)";
		}
		if(i < this._items.length-1) holdStr += ", ";
	}
	return holdStr + "]";
};

dusk.items._init();

Object.seal(dusk.items);
Object.seal(dusk.items.Invent.prototype);
