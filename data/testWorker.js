//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("testworker", (function(global) {
	load.require("dusk.utils");
	
	return function(order) {
		console.log("Worker: Doing...");
		order.processed = true;
		
		return [order];
	}
})(this));
