//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

mods.IModule = function(events) {if(events !== undefined) {this._events = events;}}

mods.IModule.prototype.addActions = function() {duskWolf.warn("Module has not implemented \"addActions\".");}
