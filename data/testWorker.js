//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("testworker", (function(global) {
	load.require("dusk.utils");
	
	return function(order) {
		console.log("Worker: Doing...");
		order.processed = true;
		
		for(var i = 0; i < order.arr.length; i ++) {
			order.arr[i] = i;
		}
		
		return [order, [order.arr.buffer]];
	}
})(this));
