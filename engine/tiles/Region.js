//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.Path", (function() {
	var Region = load.suggest("dusk.tiles.Region", function(p) {Region = p;});
	var dirs = load.require("dusk.utils.dirs");
	
	var Path = function(region, x, y, z) {
		this.start = [];
		this.end = [x, y, z];
		this.region = region;
		
		this._path = [];
		
		this.find(x, y, z);
	};
	
	Path.prototype.toString = function() {
		return "[Path ("+this.start+") "+(this._path.map(function(e) {return dirs.toArrow(e[3]);}))+" ("+this.end+")]";
	};
	
	Path.prototype.append = function(dir) {
		this._path.push(dirs.translateDir(this.end[0], this.end[1], this.end[2], dir).concat(dir));
		this.end = dirs.translateDir(this.end[0], this.end[1], this.end[2], dir);
	};
	
	Path.prototype.length = function() {
		return this._path.length;
	};
	
	Path.prototype.find = function(x, y, z) {
		this._path = [];
		
		var t = this.region.get(x, y, z);
		while(t && t[Region.tfields.parentDir] != dirs.NONE) {
			this._path.push([
				t[Region.tfields.x], t[Region.tfields.y], t[Region.tfields.z],
				dirs.invertDir(t[Region.tfields.parentDir])
			]);
			
			t = this.region.get.apply(this.region, dirs.translateDir(t[0], t[1], t[2], t[Region.tfields.parentDir]));
		}
		
		this.start = [t[Region.tfields.x], t[Region.tfields.y], t[Region.tfields.z]];
		this._path = this._path.reverse();
	};
	
	Path.prototype.follow = function(path) {
		path.forEach(this.append.bind(this));
	};
	
	Path.prototype.optimise = function() {
		this.find.apply(this, this.end);
	};
	
	Path.prototype.has = function(x, y, z) {
		if(this.start[0] == x && this.start[1] == y & this.start[2] == z) return true;
		for(var p of this._path) {
			if(p[0] == x && p[1] == y & p[2] == z) return true;
		}
		return false;
	};
	
	return Path;
})());

load.provide("dusk.tiles.Region", (function() {
	var utils = load.require("dusk.utils");
	var Weights = load.require("dusk.tiles.Weights");
	var dirs = load.require("dusk.utils.dirs");
	var Path = load.require("dusk.tiles.Path");
	
	var Region = function(cols, rows, layers, parentPool, parentNode) {
		this.rows = rows;
		this.cols = cols;
		this.layers = layers;
		
		this._tiles = [];
		this._weightModifiers = [];
		this._validators = [];
		
		this._subTiles = new Map();
		this._parentPool = parentPool;
		this.parentNode = parentNode;
	};
	
	const STRUCT_SIZE = 7;
	Region.tfields = {
		"x":0,
		"y":1,
		"z":2,
		"weight":3,
		"parentDir":4,
		"childRegions":5,
		"stoppable":6,
	};
	
	Region.prototype.addWeightModifier = function(wm) {
		this._weightModifiers.push(wm);
	};
	
	Region.prototype.addValidator = function(v) {
		this._validators.push(v);
	};
	
	Region.prototype.addTile = function(x, y, z, w, pd, stop) {
		var t = [x, y, z, w, pd, new Map(), stop];
		this._tiles.push(t);
		if(this._parentPool) this._addToPool(t);
	};
	
	Region.prototype.inRange = function(x, y, z) {
		if(x < 0 || y < 0 || z < 0 || x >= this.cols || y >= this.rows || z >= this.layers) return false;
		return true;
	};
	
	Region.prototype.has = function(x, y, z) {
		for(var t of this._tiles) {
			if(t[Region.tfields.x] == x
			&& t[Region.tfields.y] == y
			&& t[Region.tfields.z] == z) {
				return true;
			}
		}
		
		return false;
	};
	
	Region.prototype.subHas = function(name, x, y, z) {
		for(var t of this._subTiles.get(name)) {
			if(t[0] == x && t[1] == y && t[2] == z) {
				return true;
			}
		}
		
		return false;
	};
	
	Region.prototype.getPath = function(x, y, z) {
		return new Path(this, x, y, z);
	};
	
	Region.prototype.get = function(x, y, z) {
		for(var t of this._tiles) {
			if(t[Region.tfields.x] == x
			&& t[Region.tfields.y] == y
			&& t[Region.tfields.z] == z) {
				return t;
			}
		}
		
		return null;
	};
	
	Region.prototype.clear = function() {
		this._tiles = [];
		
		this._subTiles = new Map();
		// In future have it clean out the parent pool
	};
	
	Region.prototype.expand = function(options) {
		if(!Array.isArray(options.ranges[0])) options.ranges = [options.ranges];
		
		// Cloud format:
		// [x, y, z, weight, parentdir, processed]
		
		// Read any weight modifiers/validators, and replace the current ones if we do
		if("weightModifiers" in options) {
			this._weightModifiers = options.weightModifiers;
		}
		if("validators" in options) {
			this._validators = options.validators;
		}
		
		// Calculate maximum range
		var maxRange = 0;
		for(var r of options.ranges) {
			if(r[1] > maxRange) maxRange = r[1];
		}
		
		// Create the cloud
		var cloud = [];
		
		// Add this to the cloud
		cloud.push([options.x, options.y, options.z, 0, dirs.NONE, false]);
		
		// Check we can actually generate a region
		if(!this._weightModifiers.length)
			throw TypeError("This region has no weight modifiers, it will never terminate.");
		
		// And loop
		for(var e = _removeCheapestFromCloud(cloud); e; e = _removeCheapestFromCloud(cloud)) {
			// Check if it can be added
			do {
				var stoppable = true;
				
				// Range check
				var rcheck = false;
				for(var r of options.ranges) {
					if(e[3] >= r[0] && e[3] <= r[1]) {
						rcheck = true;
					}
				}
				if(!rcheck) break;
				
				// Fail if it already exists
				if(this.has(e[0], e[1], e[2])) break;
				
				// Run the validators
				for(var f of this._validators) {
					if(!f(e[0], e[1], e[2], options)) {
						stoppable = false;
						break;
					}
				};
				
				// Add it
				this.addTile(e[0], e[1], e[2], e[3], e[4], stoppable);
				
				// Now calculate all the childnodes
				if(options.children && stoppable) {
					var t = _getFromCloud(cloud, e[0], e[1], e[2]);
					t[Region.tfields.childRegions] = new Map();
					
					for(var c in options.children) {
						if(!this._subTiles.has(c)) this._subTiles.set(c, []);
						
						t[Region.tfields.childRegions].set(c, new Region(
							this.cols, this.rows, this.layers, this._subTiles.get(c), t
						));
						
						options.children[c].x = e[0];
						options.children[c].y = e[1];
						options.children[c].z = e[2];
						t[Region.tfields.childRegions].get(c).expand(options.children[c]);
					}
				}
			} while(false);
			
			// Check children
			for(var t of this._getAllSides(e[0], e[1], e[2], options.includeNone)) {
				var newEntry = [
					t[0], t[1], t[2], this._calculateWeight(e[3], options, t[3], e, t), dirs.invertDir(t[3]), false
				];
				if(newEntry[3] <= maxRange) {
					var existing = _getFromCloud(cloud, t[0], t[1], t[2]);
					if(existing) {
						if(newEntry[3] <= existing[3]) {
							existing[3] = newEntry[3];
							existing[4] = dirs.invertDir(t[3])
						}
					}else{
						cloud.push(newEntry);
					}
				}
			}
		}
	};
	
	var _removeCheapestFromCloud = function(cloud) {
		var min = -1;
		var minValue = Infinity;
		for(var i = 0; i < cloud.length; i ++) {
			if(cloud[i] && cloud[i][3] < minValue && !cloud[i][5]) {
				min = i;
				minValue = cloud[i][3];
			}
		}
		
		if(min == -1) return null;
		
		cloud[min][5] = true;
		return cloud[min];
	};
	
	var _getFromCloud = function(cloud, x, y, z) {
		for(var i = 0; i < cloud.length; i ++) {
			if(cloud[i][0] == x && cloud[i][1] == y && cloud[i][2] == z) {
				return cloud[i];
			}
		}
		
		return null;
	};
	
	Region.prototype._getAllSides = function(x, y, z, includeNone) {
		var out = [];
		for(var d of dirs.arr) {
			if(d != dirs.NONE || includeNone) {
				var trans = dirs.translateDir(x, y, z, d);
				if(this.inRange.apply(this, trans)) {
					out.push(trans.concat([d]))
				}
			}
		}
		return out;
	};
	
	Region.prototype._calculateWeight = function(pweight, settings, dir, origin, dest) {
		var w = 0;
		for(var f of this._weightModifiers) {
			w = f(w, settings, dir, origin[0], origin[1], origin[2], dest[0], dest[1], dest[2], dest[3]);
		}
		return pweight + w;
	};
	
	Region.prototype._addToPool = function(node) {
		for(var n of this._parentPool) {
			if(n[0] == node[0] && n[1] == node[1] && n[2] == node[2]) {
				n[3].push(node);
				return;
			}
		}
		
		this._parentPool.push([node[0], node[1], node[2], [node]]);
	};
	
	Region.prototype.describe = function(sub) {
		var outstr = "";
		for(var z = 0; z < this.layers; z ++) {
			outstr += "\n";
			
			for(var y = 0; y < this.rows; y ++) {
				if(y == 0) {
					outstr += "\u250c";
					outstr += "\u2500\u2500\u2500\u2500\u252c".repeat(this.cols-1);
					outstr += "\u2500\u2500\u2500\u2500\u2510";
				} else {
					outstr += "\u251c";
					outstr += "\u2500\u2500\u2500\u2500\u253c".repeat(this.cols-1);
					outstr += "\u2500\u2500\u2500\u2500\u2524";
				}
				
				outstr += "\n";
				for(var x = 0; x < this.cols; x ++) {
					outstr += "\u2502";
					if(sub) {
						if(!this.has(x, y, z)) {
							outstr += " ";
						}else{
							outstr += dirs.toArrow(this.get(x, y, z)[Region.tfields.parentDir]);
						}
						
						if(!this.subHas(sub, x, y, z)) {
							outstr += "   ";
						}else{
							outstr += "XXX";
						}
					}else{
						if(!this.has(x, y, z)) {
							outstr += "    ";
						}else{
							if(this.get(x, y, z)[Region.tfields.stoppable]) {
								outstr += " ";
							}else{
								outstr += "#";
							}
							outstr += dirs.toArrow(this.get(x, y, z)[Region.tfields.parentDir]);
							var w = ""+this.get(x, y, z)[Region.tfields.weight];
							if(w.length < 2) w = " "+w;
							outstr += w;
						}
					}
				}
				outstr += "\u2502\n";
			}
			
			outstr += "\u2514";
			outstr += "\u2500\u2500\u2500\u2500\u2534".repeat(this.cols-1);
			outstr += "\u2500\u2500\u2500\u2500\u2518\n";
		}
		
		console.log(outstr);
	};
	
	return Region;
})());
