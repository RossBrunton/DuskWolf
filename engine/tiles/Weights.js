//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.Weights", (function() {
	var utils = load.require("dusk.utils");
	
	/** Stores weights of tilemap schematic layers.
	 * 
	 * Essentially, it maps a given tile on the schematic layer to a weight.
	 * 
	 * Tiles not set have a weight of 1. Tiles cannot have a weight of less than 1 or larger than 127.
	 * 
	 * Tiles can also be either solid or not solid.
	 * 
	 * @param {integer} rows The number of rows in the source image.
	 * @param {integer} cols The number of columns in the source image.
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var Weights = function(cols, rows) {
		this.rows = rows;
		this.cols = cols;
		
		this.weights = new Uint8Array(this.rows * this.cols * STRUCT_SIZE);
	};
	
	const STRUCT_SIZE = 11;
	
	Weights.fields = {
		"enterW":0,
		"enterE":1,
		"enterN":2,
		"enterB":3,
		"enterU":4,
		"enterD":5,
		"exitW":6,
		"exitE":7,
		"exitN":8,
		"exitS":9,
		"exitU":10,
		"exitD":11
	};
	
	Weights.prototype.getWeights = function(i) {
		return i * STRUCT_SIZE;
	};
	
	Weights.prototype.getWeightsCoord = function(x, y) {
		return ((y * this.cols) + x) * STRUCT_SIZE;
	};
	
	Weights.prototype.addSimpleWeight = function(x, y, enter, out) {
		var p = this.getWeightsCoord(x, y);
		this.weights[p+Weights.fields.enterW] = enter;
		this.weights[p+Weights.fields.enterE] = enter;
		this.weights[p+Weights.fields.enterN] = enter;
		this.weights[p+Weights.fields.enterS] = enter;
		this.weights[p+Weights.fields.exitW] = out;
		this.weights[p+Weights.fields.exitE] = out;
		this.weights[p+Weights.fields.exitN] = out;
		this.weights[p+Weights.fields.exitS] = out;
	};
	
	Weights.prototype.translate = function(arr, cols, rows) {
		var translation = new Uint8Array(rows * cols);
		
		for(var i = 0; i < rows * cols * 2; i += 2) {
			translation[i/2] = this.getWeightsCoord(arr[i], arr[i+1]);
		}
		
		return translation;
	};
	
	Weights.prototype.describe = function(arr, cols, rows, feTop, feBottom) {
		var outstr = "";
		if(!feTop) feTop = function(x, y) {return "  ";}
		if(!feBottom) feBottom = function(x, y) {return "  ";} 
		
		for(var y = 0; y < rows; y ++) {
			var border = "";
			var l1 = "";
			var l2 = "";
			var l3 = "";
			var l4 = "";
			for(var x = 0; x < cols; x ++) {
				var p = arr[y * cols + x];
				
				if(x == 0) {
					border += "\u251c\u2500\u2500\u2500\u2500";
				}else if(x == cols-1) {
					border += "\u253c\u2500\u2500\u2500\u2500";
				}else{
					border += "\u253c\u2500\u2500\u2500\u2500";
				}
				
				l1 += "\u2502";
				l2 += "\u2502";
				l3 += "\u2502";
				l4 += "\u2502";
				
				l1 += " ";
				if(this.weights[p+Weights.fields.enterN] < 100) {
					l1 += "\u2193";
				}else{
					l1 += " ";
				}
				if(this.weights[p+Weights.fields.exitN] < 100) {
					l1 += "\u2191";
				}else{
					l1 += " ";
				}
				l1 += " ";
				
				if(this.weights[p+Weights.fields.enterW] < 100) {
					l2 += "\u2192";
				}else{
					l2 += " ";
				}
				l2 += feTop(x, y);
				if(this.weights[p+Weights.fields.exitE] < 100) {
					l2 += "\u2192";
				}else{
					l2 += " ";
				}
				
				if(this.weights[p+Weights.fields.exitW] < 100) {
					l3 += "\u2190";
				}else{
					l3 += " ";
				}
				l3 += feBottom(x, y);
				if(this.weights[p+Weights.fields.enterE] < 100) {
					l3 += "\u2190";
				}else{
					l3 += " ";
				}
				
				l4 += " ";
				if(this.weights[p+Weights.fields.exitS] < 100) {
					l4 += "\u2193";
				}else{
					l4 += " ";
				}
				if(this.weights[p+Weights.fields.enterS] < 100) {
					l4 += "\u2191";
				}else{
					l4 += " ";
				}
				l4 += " ";
			}
			
			border += "\u2524";
			l1 += "\u2502";
			l2 += "\u2502";
			l3 += "\u2502";
			l4 += "\u2502";
			
			outstr += "\n";
			if(y == 0) {
				outstr += [
					border.replace(/\u253c/g, "\u252c").replace(/\u2524/g, "\u2510").replace(/\u251c/g, "\u250c"),
					l1, l2, l3, l4
				].join("\n");
			}else if(y == rows - 1) {
				outstr += [
					border, l1, l2, l3, l4,
					border.replace(/\u253c/g, "\u2534").replace(/\u2524/g, "\u2518").replace(/\u251c/g, "\u2514")
				].join("\n");
			}else{
				outstr += [border, l1, l2, l3, l4].join("\n");
			}
		}
		
		console.log(outstr);
	};
	
	return Weights;
})());
