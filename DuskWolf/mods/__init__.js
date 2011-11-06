//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.mods = {};
if(!("modsAvalable" in window)) {window.modsAvalable = ["Core", "SimpleGui"];}

var ims = ["mods/IModule.js"];

for(var i = modsAvalable.length-1; i >= 0; i--) {
	ims[ims.length] = "mods/"+modsAvalable[i]+".js";
}

__import__(ims);
