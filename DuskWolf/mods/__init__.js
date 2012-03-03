//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Package: mods
 * 
 * These are modules that extend the functionality of the events system.
 * 
 * The global variable "mods" is created when mods/__init__.js is ran, and all the module classes are attached to that object.
 * 
 * If the root.json does not contain a "mods" property, a defualt list of modules is set here.
 * 
 * Defualt Modules:
 * 	* <mods.Core>
 * 	* <mods.SimpleGui>
 * 	* <mods.LocalSaver>
 * 	* <mods.Math>
 * 
 * See:
 * 	* <Events>
 * 	* <mods.IModule>
 */

window.mods = {};

/** Variable: modsAvalable
 * [array] A global array of strings. Each one is a module that should be imported, they are the names of files in the folder "mods". This is ether set by <Data> (if it's specified in the root.json) or here with default values.
 */
window.modsAvalable = ["Core", "SimpleGui", "LocalSaver", "Math"];
