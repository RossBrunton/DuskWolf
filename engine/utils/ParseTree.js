//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.parseTree", (function() {
	/** This module provides the ability to create parse trees.
	 * 
	 * It has two classes, `{@link dusk.utils.parseTree.Compiler}` and 
	 *  `{@link dusk.utils.parseTree.Node}` for building and evaluating parse trees.
	 * 
	 * @since 0.0.20-alpha
	 */
	var parseTree = {};
	
	/** A parse tree compiler is a class that takes an arbitary string and uses it's own list
	 *  of operators to make a parse tree.
	 * 
	 * In it's constructor, you specify an array of operators. Each operator is an array itself, in the
	 *  form of a two element array, first is the "string" describing what the operator should be
	 *  detected as, such as "and", "+" or "&&". The second element is a function that will be called
	 *  when the operator should be evaluated. The earlier the element in the array, the higher the
	 *  priority.
	 * 
	 * A few basic operators are included as a convienience. These operators have a higher priority than the custom ones,
	 *  and are as follows, from low to high priority:
	 * 
	 * - `lhs,rhs`: Builds an array, e.g. `a,b,c,d` would result in `[a, b, c, d]`. You can also insert an object into an
	 *  array using `a, arr`.
	 * 
	 * - `lhs|rhs`: Is true iff `lhs` or `rhs` are true.
	 * - `lhs&rhs`: Is true iff `lhs` and `rhs` are true.
	 * - `lhs<=rhs`: Is true iff `lhs` is less than or equal to `rhs`.
	 * - `lhs>=rhs`: Is true iff `lhs` is greater than or equal to `rhs`.
	 * - `lhs<rhs`: Is true iff `lhs` is less than `rhs`.
	 * - `lhs>rhs`: Is true iff `lhs` is greater than `rhs`.
	 * - `lhs!=rhs`: Is true iff `lhs` is not equal to `rhs`.
	 * - `lhs=rhs`: Is true iff `lhs` is equal to `rhs`.
	 * 
	 * - `lhs in rhs`: Is true iff `lhs` is in the array `rhs` or `lhs` is a key in the object `rhs`.
	 * - `lhs@rhs`: Concats two arrays together.
	 * - `lhs^rhs`: Is the string made from concating `lhs` and `rhs`.
	 * - `lhs-rhs`: Is the value from subtracting the number `rhs` from `lhs`. If `lhs` is an array, instead returns the
	 *  array minus any `rhs` elements.
	 * - `lhs+rhs`: Is the value from the sum of the numbers `lhs` and `rhs`.
	 * - `lhs/rhs`: Is the vaule of the number `lhs` divided by `rhs`.
	 * - `lhs*rhs`: Is the product of the numbers `lhs` and `rhs`.
	 * 
	 * - `lhs.rhs`: Do a property look up, like `lhs`[`rhs`] in JS. This also handles numbers, like `1.5`.
	 * 
	 * - `false`: The constant boolean `false`.
	 * - `true`: The constant boolean `true`.
	 * - `!op`: The negation of `op`.
	 * - `+op`: Casts `op` to a number.
	 * - `-op`: Negative `op`, where `op` is a number.
	 * - `JSON op`: Runs `JSON.parse` on `op`. Note that in most cases, you need to sepecify `op` as a string to avoid
	 *  problems with the `:` operator.
	 * - `sl op`: Makes `op` into a singleton list. i.e. returns `[op]`.
	 * 
	 * 
	 * @param {array} operators An array of binary operators.
	 * @param {array} uoperators An array of unary operators.
	 * @param {array} consts An array of constant operators.
	 * @param {int=dusk.utils.parseTree.Compiler.WS_ONLYCHARS} whitespace Whether whitespace needs to
	 *  surround the operators.
	 * @param {boolean=false} noBuiltins If true, then the built in "basic" operators will not be used.
	 * @constructor
	 * @since 0.0.20-alpha
	 */
	parseTree.Compiler = function(operators, uoperators, consts, whitespace, noBuiltins) {
		/** The operators, as described in class descriptor. A fourth propetry is added, which is a
		 *  boolean saying whether the operator contains only characters. Another fifth propetry is
		 *  added, which is a list of all the operators that end with this operator, to check for 
		 *  things like "=" and "!=".
		 * @type array
		 * @private
		 */
		this._ops = [];
		
		if(!noBuiltins) {
			this._ops = [];
			for(var i = 0; i < _defOps.length; i ++) {
				this._ops.push(_defOps[i]);
			}
		}
		
		if(operators) {
			this._ops = this._ops.concat(operators);
		}
		
		/** The unary operators, as described in class descriptor. A fourth propetry is added, which is a
		 *  boolean saying whether the operator contains only characters. Another fifth propetry is
		 *  added, which is a list of all the operators that end with this operator, to check for 
		 *  things like "=" and "!=".
		 * @type array
		 * @private
		 */
		this._uops = [];
		
		if(!noBuiltins) {
			this._uops = [];
			for(var i = 0; i < _defUops.length; i ++) {
				this._uops.push(_defUops[i]);
			}
		}
		
		if(uoperators) {
			this._uops = this._uops.concat(uoperators);
		}
		
		/** The constant operators, as described in class descriptor. A fourth propetry is added, which is a
		 *  boolean saying whether the operator contains only characters. Another fifth propetry is
		 *  added, which is a list of all the operators that end with this operator, to check for 
		 *  things like "=" and "!=".
		 * @type array
		 * @private
		 */
		this._nops = [];
		
		if(!noBuiltins) {
			this._nops = [];
			for(var i = 0; i < _defNops.length; i ++) {
				this._nops.push(_defNops[i]);
			}
		}
		
		if(consts) {
			this._nops = this._nops.concat(consts);
		}
		
		/** The whitespace policy.
		 * @type int
		 * @private
		 */
		this._whitespace = whitespace?whitespace:parseTree.WS_ONLYCHARS;
		
		/** Cached trees for all that have been run with this compiler, for faster reteival.
		 * @type object
		 * @private
		 */
		this._caches = {};
		
		/** Cached functions for all that have been run with this compiler, for faster reteival.
		 * @type object
		 * @private
		 */
		this._functCaches = {};
		
		//Populate third and fourth properties
		for(var i = this._ops.length-1; i >= 0; i --) {
			this._ops[i][3] = /^[a-z0-9]+$/i.test(this._ops[i][0]);
			
			this._ops[i][4] = [];
			for(var j = this._ops.length-1; j >= 0; j --) {
				if(this._ops[j][0].endsWith(this._ops[i][0]) && i != j) {
					this._ops[i][4].push(this._ops[j][0]);
				}
			}
		}
		
		for(var i = this._uops.length-1; i >= 0; i --) {
			this._uops[i][3] = /^[a-z0-9]+$/i.test(this._uops[i][0]);
			
			this._uops[i][4] = [];
			for(var j = this._uops.length-1; j >= 0; j --) {
				if(this._uops[j][0].endsWith(this._uops[i][0]) && i != j) {
					this._uops[i][4].push(this._uops[j][0]);
				}
			}
		}
		
		for(var i = this._nops.length-1; i >= 0; i --) {
			this._nops[i][3] = /^[a-z0-9]+$/i.test(this._nops[i][0]);
			
			this._nops[i][4] = [];
			for(var j = this._nops.length-1; j >= 0; j --) {
				if(this._nops[j][0].endsWith(this._nops[i][0]) && i != j) {
					this._nops[i][4].push(this._nops[j][0]);
				}
			}
		}
	};
	
	/** Whitespace should surround operators only if the operators consist only of a-z characters.
	 * @type int
	 * @value 0
	 * @constant
	 */
	parseTree.WS_ONLYCHARS = parseTree.Compiler.WS_ONLYCHARS = 0;
	
	/** Whitespace should always surround operators.
	 * @type int
	 * @value 1
	 * @constant
	 */
	parseTree.WS_ALWAYS = parseTree.Compiler.WS_ALWAYS = 1;
	
	/** Whitespace is optional for all operators.
	 * @type int
	 * @value 2
	 * @constant
	 */
	parseTree.WS_OPTIONAL = parseTree.Compiler.WS_OPTIONAL = 2;
	
	/** This takes a string, and then compiles it down into a parse tree made using
	 *  `{@link dusk.utils.parseTree.Node}` instances.
	 * 
	 * @param {string} str The string to compile.
	 * @param {int=0} init The character to start evaluating from.
	 * @param {boolean=false} noCache If true, then there will be no caching, and the tree won't be saved for later.
	 * @returns {dusk.utils.parseTree.Node} The root of the tree it was compiled to.
	 */
	parseTree.Compiler.prototype.compile = function(str, init, noCache) {
		if(!noCache && str in this._caches && (init == 0 || init == undefined)) {
			return this._caches[str];
		}
		
		//Think of it as everything on the lhs of a node being data to the left, and the rhs being data to the right.
		
		var read = [];
		var i = init?init:0;
		var root = null;
		var justClosedBracket = false;
		
		while(read = this._read(str, i, justClosedBracket)) {
			i = read[5];
			read[6] = read[6].reverse();
			justClosedBracket = false;
			
			// Strip the quotes surrounding the first entry, if they are there
			if(read[0] && (read[0].charAt(0) == "'" || read[0].charAt(0) == '"')) read[0] = read[0].substring(1);
			if(read[0] && (read[0].charAt(read[0].length-1) == "'" || read[0].charAt(read[0].length-1) == '"'))
				read[0] = read[0].substring(0, read[0].length-1);
			
			var op = new parseTree.Node(read[1], read[4], read[2], read[3]);
			
			//Unary operators
			if(read[1] != "(") {
				var opand = null;
				if(read[7]) {
					justClosedBracket = true;
					opand = new parseTree.Node(read[1], 0, read[2], read[3]);
				}else{
					opand = new parseTree.Node(read[0], 0, undefined, true);
				}
				
				for(var uo = 0; uo < read[6].length; uo ++) {
					opand = new parseTree.Node(read[6][uo][0], 0, read[6][uo][1], read[6][uo][2], opand);
				}
				
				if(root == null) {
					root = opand;
				}else{
					var n = root;
					while(n.rhs) n = n.rhs;
					n.rhs = opand;
				}
			}
			
			
			if(!read[1] || read[1] == ")") {
				if(!read[1])
					this._caches[str] = root.collapse();
				
				return root.collapse();
			}else if(read[1] == "("){
				var bop = new parseTree.Node("bracket_guard", 0, function(o, l, r) {
						return l;
					}, true, this.compile(str, i, noCache)
				);
				
				for(var uo = 0; uo < read[6].length; uo ++) {
					bop = new parseTree.Node(read[6][uo][0], 0, read[6][uo][1], read[6][uo][2], bop);
				}
				
				if(root == null) {
					root = bop;
				}else{
					var n = root;
					while(n.rhs) n = n.rhs;
					n.rhs = bop;
				}
				
				var bracketsOpen = 1;
				while(bracketsOpen) {
					if(str[i] == "(") bracketsOpen ++;
					if(str[i] == ")") bracketsOpen --;
					if(i >= str.length) {
						throw new parseTree.ParseTreeCompileError("Brackets not closed properly.");
					}
					i ++;
				}
				i --;
				
				i ++;
				justClosedBracket = true;
			}else if(!read[7]) {
				if(root.value != "bracket_guard") {
					var p = null;
					var n = root;
					var count = 0;
					while(n.lhs && n.lhs.value != "bracket_guard" && n.priority >= op.priority) {
						p = n;
						n = n.rhs;
						count ++;
					}
					
					op.lhs = n;
					if(!p) root = op;
					else p.rhs = op;
				}else{
					op.lhs = root;
					root = op;
				}
			}
		}
	};
	
	/** Compiles a string directly to a function with caching.
	 * @param {string} The string to compile.
	 * @returns {function():*} A function that returns the value of the evaluated string.
	 */
	parseTree.Compiler.prototype.compileToFunct = function(str) {
		if(str in this._functCaches) return this._functCaches[str];
		
		var f = this.compile(str, 0, true).toFunction();
		this._functCaches[str] = f;
		return f;
	}
	
	/** Reads until it finds an operand and then an operator.
	 * 
	 * @param {string} str The string to read.
	 * @param {integer} init When to start reading from.
	 * @param {boolean} afterBracket Whether a bracket has just been closed, this means that unaries are forbidden, and 
	 *  binary operators may have an empty string as an operand.
	 * @returns {array} Array containing, in order, the operand, the operator, exec function, priority, 
	 *  the new "init" value and array of [op, function] pairs for all the unary operations on the
	 *  operand, and whether this is a constant or not.
	 * 
	 * Operand may be null if there is no more operators in the string. It may also be an open or close bracket.
	 * @private
	 */
	parseTree.Compiler.prototype._read = function(str, init, afterBracket) {
		var buffer = "";
		var uops = [];
		
		for(var c = init; c < str.length; c ++) {
			buffer += str[c];
			
			//Constant operators
			if(!afterBracket) {
				for(var i = 0; i < this._nops.length; i++) {
					if(buffer.trim() == this._nops[i][0]) {
						var op = this._nops[i][0];
						
						for(var j = 0; j < this._nops[i][4].length; j ++) {
							if(buffer.endsWith(this._nops[i][4][j])) continue;
						}
						
						if(this._whitespace == parseTree.Compiler.WS_ALWAYS
						|| (this._whitespace == parseTree.Compiler.WS_ONLYCHARS && this._nops[i][3])) {
							if(c == str.length-1 || /[^a-zA-Z0-9]/.test(str[c+1])) {
								return ["", op, this._nops[i][1], this._nops[i][2], 0, c+1, uops, true];
							}
						}else{
							return ["", op, this._nops[i][1], this._nops[i][2], 0, c+1, uops, true];
						}
					}
				}
			}
			
			//Unary operators
			if(!afterBracket) {
				for(var i = 0; i < this._uops.length; i++) {
					if(buffer.trim() == this._uops[i][0]) {
						var op = this._uops[i][0];
						
						for(var j = 0; j < this._uops[i][4].length; j ++) {
							if(buffer.endsWith(this._uops[i][4][j])) continue;
						}
						
						if(this._whitespace == parseTree.Compiler.WS_ALWAYS
						|| (this._whitespace == parseTree.Compiler.WS_ONLYCHARS && this._uops[i][3])) {
							if(c == str.length-1 || /[^a-zA-Z0-9]/.test(str[c+1])) {
								uops.push([op, this._uops[i][1], this._uops[i][2]]);
								buffer = "";
							}
						}else{
							uops.push([op, this._uops[i][1], this._uops[i][2]]);
							buffer = "";
						}
					}
				}
			}
			
			//Brackets
			if(str[c] == "(") {
				//Bracketing time!
				return ["", "(", "THIS_IS_A_BRACKET", true, 0, c+1, uops];
			}else if(str[c] == ")") {
				//Unbracketing time...
				return [buffer.substring(0, buffer.length-1).trim(), ")", "THIS_IS_A_BRACKET", true,
					0, c+1, uops
				];
			}
			
			//Binary operators
			opsloop: for(var i = 0; i < this._ops.length; i++) {
				if(buffer.endsWith(this._ops[i][0])) {
					var op = buffer.substring(buffer.length-this._ops[i][0].length);
					var opand = buffer.substring(0, buffer.length-this._ops[i][0].length);
					var topand = opand.trim();
					
					if(topand === "" && !afterBracket) continue;
					
					// Check if opand is a string
					if(['"', "'"].indexOf(topand.charAt(0)) != -1) {
						if(topand.charAt(0) != topand.charAt(topand.length-1) || topand.length == 1) {
							continue;
						}
					}
					
					for(var j = 0; j < this._ops[i][4].length; j ++) {
						if(buffer.endsWith(this._ops[i][4][j])) continue opsloop;
					}
					
					if(this._whitespace == parseTree.Compiler.WS_ALWAYS
					|| (this._whitespace == parseTree.Compiler.WS_ONLYCHARS && this._ops[i][3])) {
						if(/\s/.test(str[c+1]) && /\s$/.test(opand)) {
							return [topand, op, this._ops[i][1], this._ops[i][2], i+1, c+1, uops];
						}
					}else{
						return [topand, op, this._ops[i][1], this._ops[i][2], i+1, c+1, uops];
					}
				}
			}
		}
		
		return [buffer.trim(), null, null, true, 0, 0, uops];
	};
	
	// ----
	
	/** All the built in binary operators.
	 * @type array
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _defOps = [
		[".", function(o, l, r) {
			if(!isNaN(Number(l+"."+r))) {
				return Number(l+"."+r);
			}
			if(l == undefined) return undefined;
			if(typeof l == "object" && !(r in l) && "get" in l) return l.get(r);
			return l[r];
		}, false],
		
		["*", function(o, l, r) {return +l * +r;}, true],
		["/", function(o, l, r) {return +l / +r;}, true],
		["+", function(o, l, r) {return +l + +r;}, true],
		["-", function(o, l, r) {
			if(Array.isArray(l)) {
				var out = [];
				for(var i = 0; i < l.length; i ++) {
					if(l[i] != r) out.push(l[i]);
				}
				return out;
			}else{
				return +l - +r;
			}
		}, true],
		["^", function(o, l, r) {return "" + l +r;}, true],
		["@", function(o, l, r) {return l.concat(r);}, true],
		["in", function(o, l, r) {
			if(Array.isArray(r)) {
				return r.indexOf(l) !== -1;
			}else{
				return l in r;
			}
		}, true],
		
		["=", function(o, l, r) {return l == r || l && r == "true"}, true],
		["!=", function(o, l, r) {return l != r}, true],
		[">", function(o, l, r) {return l > r}, true],
		["<", function(o, l, r) {return l < r}, true],
		[">=", function(o, l, r) {return l >= r}, true],
		["<=", function(o, l, r) {return l <= r}, true],
		
		["&", function(o, l, r) {return l && r}, true],
		["|", function(o, l, r) {return l || r}, true],
		
		[",", function(o, l, r) {return [l].concat(r);}, true],
	];
	
	
	/** All the built in unary operators.
	 * @type array
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _defUops = [
		["!", function(o, l) {return l === "false"?true:!l;}, true],
		["+", function(o, l) {return +l;}, true],
		["-", function(o, l) {return 0-l;}, true],
		["sl", function(o, l) {return [l]}, true],
		
		["JSON", function(o, l) {
			try {
				return JSON.parse(l);
			} catch(e) {
				console.error(e);
				return {};
			}
		}, true]
	];
	
	/** All the built in constant operators.
	 * @type array
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _defNops = [
		["false", function(o) {return false;}, true],
		["true", function(o) {return true;}, true],
		["null", function(o) {return null;}, true],
		["undefined", function(o) {return undefined;}, true],
	];
	
	// ----
	
	/** Creates a new parse tree compile error.
	 * 
	 * @class dusk.utils.parseTree.ParseTreeCompileError
	 * 
	 * @classdesc An error that is thrown whenever compiling a parse tree fails.
	 * 
	 * @param {string} message The error message.
	 * @constructor
	 * @since 0.0.20-alpha
	 */
	parseTree.ParseTreeCompileError = function(message) {
		this.name = "ParseTreeCompileError";
		this.message = message;
	}	
	parseTree.ParseTreeCompileError.prototype = Object.create(Error.prototype);
	
	// ----
	
	/** A single node of the compiled parse tree.
	 * 
	 * It can be evaluated to a single value using `{@link dusk.utils.parseTree.Node#eval}`.
	 * 
	 * @param {string} value For leaves it is it's value, for nodes it is the operator.
	 * @param {int=0} priority Used when building the tree, priority  of the operator. Lower values are
	 *  higher priority.
	 * @param {?function(string, *, *):* | function(string, *):* | function(string):*} exec The function that should be
	 *  called to evaluate this node.

	 * @param {?dusk.utils.parseTree.Node} lhs The left branch, if it is known and exists.
	 * @param {?dusk.utils.parseTree.Node} rhs The right branch, if it is known and exists.
	 * @param {boolean} con If true, then this node will always have the same value if both it's chilren are con.
	 * @constructor
	 * @since 0.0.20-alpha
	 */
	parseTree.Node = function(value, priority, exec, con, lhs, rhs) {
		/** The value of this operator. For leaves this is the value, for nodes it is the operator.
		 * @type string
		 */
		this.value = value;
		
		/** The priority of the operator. Lower means higher priority.
		 * @type int
		 */
		this.priority = priority?priority:0;
		
		/** The function this node calls to eval, or null if it is a leaf.
		 * @type ?function(string, *, *):*
		 */
		this.exec = exec?exec:null;
		
		/** The left hand side of the operator or null if it is a leaf.
		 * @type ?dusk.utils.parseTree.Node
		 */
		this.lhs = lhs?lhs:null;
		
		/** The right hand side of the operator or null if it is a leaf.
		 * @type ?dusk.utils.parseTree.Node
		 */
		this.rhs = rhs?rhs:null;
		
		/** If all of this node's children are con, then this is con. If this is con, then the value will not change.
		 * @type boolean
		 * @private
		 * @since 0.0.21-alpha
		 */
		this._con = con;
	};
	
	/** Returns true if and only if the node has a function it can execute.
	 * @return {boolean} Whether this has a function.
	 */
	parseTree.Node.prototype.hasNoFunct = function() {
		return !this.exec;
	};
	
	/** Returns true if and only if the node is a leaf node.
	 * @return {boolean} Whether this is a leaf node.
	 */
	parseTree.Node.prototype.isLeaf = function() {
		return !(this.lhs && this.lhs.value !== "") && !(this.rhs && this.rhs.value !== "");
	};
	
	/** Returns true if and only if the node and all of it's children are con.
	 * @return {boolean} Whether this is con.
	 */
	parseTree.Node.prototype.isCon = function() {
		if(!this._con) return false;
		if(this.rhs && !this.rhs.isCon()) return false;
		if(this.lhs && !this.lhs.isCon()) return false;
		return true;
	};
	
	/** Returns true if and only if the node represents a unary operation.
	 * @return {boolean} Whether this is a unary node.
	 */
	parseTree.Node.prototype.isUnary = function() {
		return !(this.rhs && this.rhs.value !== "");
	};
	
	/** Evaluates this node, and returns its value.
	 * @param {?*} arg Argument, will be passed as the last argument to the exec function, and to the `eval` methods
	 *  of it's children.
	 * @return {*} The value of this node.
	 */
	parseTree.Node.prototype.eval = function(arg) {
		if(this.hasNoFunct()) return this.value;
		if(!this.hasNoFunct() && this.isLeaf()) return this.exec(this.value, arg);
		if(this.isUnary()) return this.exec(this.value, this.lhs.eval(arg), arg);
		return this.exec(this.value, this.lhs.eval(arg), this.rhs.eval(arg), arg);
	};
	
	/** Returns a function that, when called, will return the value of evaluating this tree.
	 * 
	 * Will not work with an arg like the param for `eval` does.
	 * @return {function():*} A function representing this tree.
	 */
	parseTree.Node.prototype.toFunction = function() {
		if(this.hasNoFunct()) return (function(){return this.value}).bind(this);
		
		if(!this.hasNoFunct() && this.isLeaf()) return (function() {
			return this.exec(this.value);
		}).bind(this);
		
		if(this.isUnary()) {
			return (function(l) {
				return this.exec(this.value, l());
			}).bind(this, this.lhs.toFunction());
		}
		
		return (function(l, r) {
			return this.exec(this.value, l(), r());
		}).bind(this, this.lhs.toFunction(), this.rhs.toFunction());
	};
	
	/** If this is con, then will evaluate this and turn it into a leaf node with the value. This modifies the original
	 *  node.
	 * 
	 * Otherswise, will call `collapse` on all its children.
	 * 
	 * @return {dusk.utils.parseTree.Node} This node; as a convienience.
	 * @since 0.0.21-alpha
	 */
	parseTree.Node.prototype.collapse = function() {
		if(this.isCon()) {
			this.value = this.eval();
			this.lhs = null;
			this.rhs = null;
			this.exec = null;
			this.priority = 0;
		}else{
			if(this.lhs) this.lhs.collapse();
			if(this.rhs) this.rhs.collapse();
		}
		
		return this;
	};
	
	/** Returns a multiline string representation of this node and it's children.
	 * @param {int=0} indent The indentation of the node.
	 * @return {string} A string representation of this node.
	 */
	parseTree.Node.prototype.toString = function(indent) {
		if(!indent) indent = 0;
		
		var out = "";
		for(var i = 0; i < indent; i ++) {
			out += " ";
		}
		
		if(this.value === "") {
			out += "[node empty:"+this.priority;
		}else{
			out += "[node "+this.value+":"+this.priority;
		}
		
		if(this.isCon()) out += " CON";
		
		if(this.hasNoFunct()) {
			out += "]";
		}else{
			out += "\n";
			if(this.lhs) {
				out += this.lhs.toString(indent + 4) + "\n";
			}else{
				for(var i = 0; i < indent+4; i ++) {
					out += " ";
				}
				out += "null\n";
			}
			
			if(this.rhs) {
				out += this.rhs.toString(indent + 4) + "\n";
			}else{
				for(var i = 0; i < indent+4; i ++) {
					out += " ";
				}
				out += "null\n";
			}
			
			for(var i = 0; i < indent; i ++) {
				out += " ";
			}
			
			out += "]";
		}
		
		return out;
	};
	
	/** Builds a representation (not the original representation) of this node.
	 * 
	 * @return {string} This expression.
	 * @since 0.0.21-alpha
	 */
	parseTree.Node.prototype.toExpr = function() {
		var out = "";
		
		if(this.hasNoFunct()) out += this.value;
		if(!this.hasNoFunct() && this.isLeaf()) out += this.value;
		if(this.isUnary() && this.lhs) out += "("+this.value + " " + this.lhs.toExpr()+")";
		if(this.lhs && this.rhs) out += "("+this.lhs.toExpr() + " " + this.value + " " + this.rhs.toExpr()+")"
		return out;
	};
	
	return parseTree;
})(), {"alsoSeal":["Node", "Compiler", "ParseTreeCompileError"]});
