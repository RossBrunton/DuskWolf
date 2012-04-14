//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.pai = {
"Pai":"Pai",
"Stayer":"Pai",
"BackForth":"BackForth",
"Controlled":"Controlled",
"Fade":"Fade",
"Fall":"Fall"
};

window.loadPai = function(name) {
	if(typeof(pai[name]) != "string") return;
	__import__("platAi/"+pai[name]+".js");
	if(typeof(pai[name]) != "function") duskWolf.warn("Pai "+name+" failed to load.");
};
