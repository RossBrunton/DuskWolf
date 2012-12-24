//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** @namespace dusk.gameStarter
 * 
 * @description This namespace, when imported, does nothing more than fire `{@dusk.onLoad}`, indicating that the engine has finished loading.
 * 
 * This namespace has no members.
 */
dusk.load.provide("dusk.gameStarter");

dusk.onLoad.fire();
