//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.tiles.Path", (function() {
	var Region = load.suggest("dusk.tiles.Region", function(p) {Region = p;});
	var dirs = load.require("dusk.utils.dirs");
	
	var Path = function(region, x, y, z, clamp) {
		this.start = [];
		this.end = [x, y, z];
		this.region = region;
		
		// [x, y, z, entrydir, singleweight, stoppable]
		this._path = [];
		
		this.backPop = false;
		this.validPath = false;
		this.completePath = true;
		this.find(x, y, z);
		this.clamp = clamp ? clamp : -1;
	};
	
	Path.prototype.forEach = function(f) {
		f(this.start[0], this.start[1], this.start[2], dirs.NONE, 0, true);
		
		for(var p of this._path) {
			f(p[0], p[1], p[2], p[3], p[4], p[5]);
		}
	};
	
	Path.prototype.append = function(dir) {
		if(!this.validPath) return;
		
		if(this._path.length > 0 && dirs.invertDir(dir) == this._path[this._path.length-1][3]) {
			this._path.pop();
			if(this._path.length) {
				this.end = [
					this._path[this._path.length-1][0], this._path[this._path.length-1][1],
					this._path[this._path.length-1][2]
				];
				this.completePath = this._path[this._path.length-1][5];
			}else{
				this.completePath = this.region.get.apply(this.region, this.start)[Region.tfields.stoppable];
				this.end = this.start;
			}
			return;
		}
		
		var t = this.region.get.apply(this.region, dirs.translateDir(this.end[0], this.end[1], this.end[2], dir));
		
		if(!t) {
			this.validPath = false;
			return;
		}
		
		this._path.push([
			t[Region.tfields.x], t[Region.tfields.y], t[Region.tfields.z],
			dir, t[Region.tfields.singleWeight], t[Region.tfields.stoppable], 
		]);
		
		this.end = [t[Region.tfields.x], t[Region.tfields.y], t[Region.tfields.z]];
		
		if((this.clamp >= 0 && this.lengthWeight() > this.clamp)) {
			this.optimise();
		};
		
		this.completePath = this._path[this._path.length-1][5];
	};
	
	Path.prototype.length = function() {
		return this._path.length;
	};
	
	Path.prototype.lengthWeight = function() {
		var w = 0;
		for(var p of this._path) {
			w += p[4];
		}
		return w;
	};
	
	Path.prototype.find = function(x, y, z) {
		this._path = [];
		
		var t = this.region.get(x, y, z);
		while(t && t[Region.tfields.parentDir] != dirs.NONE) {
			this._path.push([
				t[Region.tfields.x], t[Region.tfields.y], t[Region.tfields.z],
				dirs.invertDir(t[Region.tfields.parentDir]), t[Region.tfields.singleWeight],
				t[Region.tfields.stoppable]
			]);
			
			t = this.region.get.apply(this.region, dirs.translateDir(t[0], t[1], t[2], t[Region.tfields.parentDir]));
		}
		
		if(t) {
			this.start = [t[Region.tfields.x], t[Region.tfields.y], t[Region.tfields.z]];
			this.completePath = t[Region.tfields.stoppable];
			this.validPath = true;
		}else{
			this.validPath = false;
		}
		
		this.end = [x, y, z];
		
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
	
	Path.prototype.dirs = function() {
		return this._path.map(function(e) {return e[3];});
	};
	
	Path.prototype.toString = function() {
		return "[Path ("+this.start+") "+(this._path.map(function(e) {return dirs.toArrow(e[3]);}))+
		" ["+this.length()+","+this.lengthWeight()+"]"
		+(!this.validPath ? " !invalid!" : "") + (!this.completePath ? " !incomplete!" : "")
		+" ("+this.end+")]";
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
		
		this.x = -1;
		this.y = -1;
		this.z = -1;
		this.maxRange = 0;
	};
	
	const STRUCT_SIZE = 8;
	Region.tfields = {
		"x":0,
		"y":1,
		"z":2,
		"weight":3,
		"singleWeight":4,
		"parentDir":5,
		"childRegions":6,
		"stoppable":7,
	};
	
	Region.prototype.addWeightModifier = function(wm) {
		this._weightModifiers.push(wm);
	};
	
	Region.prototype.addValidator = function(v) {
		this._validators.push(v);
	};
	
	Region.prototype.addTile = function(x, y, z, w, sw, pd, children, stop) {
		var t = [x, y, z, w, sw, pd, children, stop];
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
	
	Region.prototype.subWith = function(name, x, y, z) {
		for(var t of this._subTiles.get(name)) {
			if(t[0] == x && t[1] == y && t[2] == z) {
				return t[3];
			}
		}
		
		return [];
	};
	
	Region.prototype.all = function() {
		return this._tiles;
	};
	
	Region.prototype.allSub = function(sub) {
		if(this._subTiles.has(sub)) {
			return this._subTiles.get(sub);
		}else{
			return [];
		}
	};
	
	Region.prototype.getPath = function(x, y, z, clamp) {
		return new Path(this, x, y, z, clamp ? this.maxRange : undefined);
	};
	
	Region.prototype.followPath = function(path, clamp) {
		var p = new Path(this, path.start[0], path.start[1], path.start[2], clamp ? this.maxRange : undefined);
		
		for(var d of path.dirs()) {
			p.append(d);
		}
		
		return p;
	};
	
	Region.prototype.emptyPath = function(clamp) {
		return new Path(this, this.x, this.y, this.z, clamp ? this.maxRange : undefined);
	};
	
	Region.prototype.pathToRegion = function(region, clamp) {
		return new Path(this, region.x, region.y, region.z, clamp ? this.maxRange : undefined);
	};
	
	Region.prototype.getChild = function(x, y, z, name) {
		return this.get(x, y, z)[Region.tfields.childRegions].get(name);
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
		
		this.x = options.x;
		this.y = options.y;
		this.z = options.z;
		
		// Cloud format:
		// [x, y, z, weight, single weight, parentdir, processed]
		
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
		
		this.maxRange = maxRange;
		
		// Create the cloud
		var cloud = [];
		
		// Add this to the cloud
		cloud.push([options.x, options.y, options.z, 0, 0, dirs.NONE, false]);
		
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
				var m = new Map();
				this.addTile(e[0], e[1], e[2], e[3], e[4], e[5], m, stoppable);
				
				// Now calculate all the childnodes
				if(options.children && stoppable) {
					var t = _getFromCloud(cloud, e[0], e[1], e[2]);
					t[Region.tfields.childRegions] = new Map();
					
					for(var c in options.children) {
						if(!this._subTiles.has(c)) this._subTiles.set(c, []);
						
						m.set(c, new Region(
							this.cols, this.rows, this.layers, this._subTiles.get(c), t
						));
						
						options.children[c].x = e[0];
						options.children[c].y = e[1];
						options.children[c].z = e[2];
						m.get(c).expand(options.children[c]);
					}
				}
			} while(false);
			
			// Check children
			for(var t of this._getAllSides(e[0], e[1], e[2], options.includeNone)) {
				var sw = this._calculateWeight(options, t[3], e, t);
				
				var newEntry = [t[0], t[1], t[2], e[3]+sw, sw, dirs.invertDir(t[3]), false];
				if(newEntry[3] <= maxRange) {
					var existing = _getFromCloud(cloud, t[0], t[1], t[2]);
					if(existing) {
						if(newEntry[3] <= existing[3]) {
							existing[3] = newEntry[3];
							existing[5] = dirs.invertDir(t[3])
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
			if(cloud[i] && cloud[i][3] < minValue && !cloud[i][6]) {
				min = i;
				minValue = cloud[i][3];
			}
		}
		
		if(min == -1) return null;
		
		cloud[min][6] = true;
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
	
	Region.prototype._calculateWeight = function(settings, dir, origin, dest) {
		var w = 0;
		for(var f of this._weightModifiers) {
			w = f(w, settings, dir, origin[0], origin[1], origin[2], dest[0], dest[1], dest[2], dest[3]);
		}
		return w;
	};
	
	Region.prototype._addToPool = function(node) {
		for(var n of this._parentPool) {
			if(n[0] == node[0] && n[1] == node[1] && n[2] == node[2]) {
				n[3].push(this);
				return;
			}
		}
		
		this._parentPool.push([node[0], node[1], node[2], [this]]);
	};
	
	Region.prototype.describe = function(single, sub) {
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
							
							
							var w = "";
							if(!single) {
								w = ""+this.get(x, y, z)[Region.tfields.weight];
							}else{
								w = ""+this.get(x, y, z)[Region.tfields.singleWeight];
							}
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
