//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Interface: mods.IModule
 * 
 * This interface is what all modules should implement.
 * 
 * A module adds, manages and processes actions, adding functionality to the events system.
 * 
 * This is a base class, that while not an actual "interface" (as JS does not support them), will complain if you have not implemented a function.
 * 
 * See:
 * * <Events>
 */

/**
 * Function: mods.IModule
 * 
 * This will take the events system, and store it in this._events so the module can use it.
 * 
 * Params:
 * 	events - [<Events>] The events system that this will be used for.
 */
mods.IModule = function(events) {
	if(events !== undefined) {
		this._events = events;
	}
}

/** Function: addActions
 * 
 * Called when it's time to add the actions, implementers should add all the actions that need registering here.
 * 
 * See:
 * * <Events.registerAction>
 */
mods.IModule.prototype.addActions = function() {duskWolf.warn("Module has not implemented \"addActions\".");}
