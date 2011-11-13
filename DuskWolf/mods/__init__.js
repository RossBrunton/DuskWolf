//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Package: mods
 * 
 * These are modules that extend the functionality of the events system.
 * 
 * The global variable "mods" is created when mods/__init__.js is ran, and all the module classes are attached to that object.
 * 
 * Also when init.js is ran, if there is a global variable "modsAvalable" (An array of strings), all the values inside it will be imported. If the var does not exist, a default list is imported.
 * 
 * Defualt Modules:
 * 	* <mods.Core>
 * 	* <mods.SimpleGui>
 * 	* <mods.LocalSaver>
 * 
 * See:
 * 	* <Events>
 * 	* <mods.IModule>
 */

window.mods = {};

/** Variable: modsAvalable
 * [array] A global array of strings. Each one is a module that should be imported, they are the names of files in the folder "mods". This is ether set by <Data> (if it's specified in the root.json) or here with default values.
 */
if(!("modsAvalable" in window)) {window.modsAvalable = ["Core", "SimpleGui", "LocalSaver"];};

var ims = ["mods/IModule.js"];

for(var i = modsAvalable.length-1; i >= 0; i--) {
	ims[ims.length] = "mods/"+modsAvalable[i]+".js";
}

__import__(ims);
