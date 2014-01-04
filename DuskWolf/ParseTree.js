//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.parseTree");

/** @namespace dusk.parseTree
 * 
 * @description This module provides the ability to create parse trees.
 * 
 * It has two classes, `{@link dusk.parseTree.Compiler}` and 
 *  `{@link dusk.parseTree.Node}` for building and evaluating parse trees.
 * 
 * @since 0.0.20-alpha
 */
dusk.parseTree = {};

/** Creates a new parse tree compiler.
 * 
 * @class dusk.parseTree.Compiler
 * 
 * @classdesc A parse tree compiler is a class that takes an arbitary string and uses it's own list
 *  of operators to make a parse tree.
 * 
 * In it's constructor, you specify an array of operators. Each operator is an array itself, in the
 *  form of a two element array, first is the "string" describing what the operator should be
 *  detected as, such as "and", "+" or "&&". The second element is a function that will be called
 *  when the operator should be evaluated. The earlier the element in the array, the higher the
 *  priority.
 * 
 * @param {array} operators An array of binary operators.
 * @param {array} uoperators An array of unary operators.
 * @param {int=dusk.parseTree.Compiler.WS_ONLYCHARS} whitespace Whether whitespace needs to
 *  surround the operators.
 * @constructor
 * @since 0.0.20-alpha
 */
dusk.parseTree.Compiler = function(operators, uoperators, whitespace) {
	/** The operators, as described in class descriptor. A third propetry is added, which is a
	 *  boolean saying whether the operator contains only characters. Another fourth propetry is
	 *  added, which is a list of all the operators that end with this operator, to check for 
	 *  things like "=" and "!=".
	 * @type array
	 * @private
	 */
	this._ops = operators;
	
	/** The unary operators, as described in class descriptor. A third propetry is added, which is a
	 *  boolean saying whether the operator contains only characters. Another fourth propetry is
	 *  added, which is a list of all the operators that end with this operator, to check for 
	 *  things like "=" and "!=".
	 * @type array
	 * @private
	 */
	this._uops = uoperators;
	
	/** The whitespace policy.
	 * @type int
	 * @private
	 */
	this._whitespace = whitespace?whitespace:dusk.parseTree.Compiler.WS_ONLYCHARS;
	
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
	
	//Populate forth and 4th properties
	for(var i = this._ops.length-1; i >= 0; i --) {
		this._ops[i][2] = /^[a-z0-9]+$/i.test(this._ops[i][0]);
		
		this._ops[i][3] = [];
		for(var j = this._ops.length-1; j >= 0; j --) {
			if(this._ops[j][0].endsWith(this._ops[i][0]) && i != j) {
				this._ops[i][3].push(this._ops[j][0]);
			}
		}
	}
	
	for(var i = this._uops.length-1; i >= 0; i --) {
		this._uops[i][2] = /^[a-z0-9]+$/i.test(this._uops[i][0]);
		
		this._uops[i][3] = [];
		for(var j = this._uops.length-1; j >= 0; j --) {
			if(this._uops[j][0].endsWith(this._uops[i][0]) && i != j) {
				this._uops[i][3].push(this._uops[j][0]);
			}
		}
	}
};

/** Whitespace should surround operators only if the operators consist only of a-z characters.
 * @type int
 * @value 0
 * @constant
 */
dusk.parseTree.Compiler.WS_ONLYCHARS = 0;

/** Whitespace should always surround operators.
 * @type int
 * @value 1
 * @constant
 */
dusk.parseTree.Compiler.WS_ALWAYS = 1;

/** Whitespace is optional for all operators.
 * @type int
 * @value 2
 * @constant
 */
dusk.parseTree.Compiler.WS_OPTIONAL = 2;

/** This takes a string, and then compiles it down into a parse tree made using
 *  `{@link dusk.parseTree.Node}` instances.
 * 
 * @param {string} str The string to compile.
 * @param {int=0} init The character to start evaluating from.
 * @param {boolean=false} noCache If true, then there will be no caching, and the tree won't be saved for later.
 * @returns {dusk.parseTree.Node} The root of the tree it was compiled to.
 */
dusk.parseTree.Compiler.prototype.compile = function(str, init, noCache) {
	if(!noCache && str in this._caches && (init == 0 || init == undefined)) {
		return this._caches[str];
	}
	
	var read = [];
	var i = init?init:0;
	var root = null;
	
	while(read = this._read(str, i)) {
		i = read[4];
		
		if(read[1] != "(") {
			var opand = new dusk.parseTree.Node(read[0], 0);
			for(var uo = 0; uo < read[5].length; uo ++) {
				opand = new dusk.parseTree.Node(read[5][uo][0], 0, read[5][uo][1], opand);
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
				this._caches[str] = root;
			return root;
		}else if(read[1] == "("){
			var bop = new dusk.parseTree.Node("bracket_guard", 0, function(o, l, r) {
					return l.eval();
				}, this.compile(str, i)
			);
			
			for(var uo = 0; uo < read[5].length; uo ++) {
				bop = new dusk.parseTree.Node(read[5][uo][0], 0, read[5][uo][1], bop);
			}
			
			if(root == null) {
				root = bop;
			}else{
				var n = root;
				while(n.rhs) n = n.rhs;
				n.rhs = bop;
			}
			
			while(str[i] != ")") {
				i ++;
				if(i >= str.length) {
					throw new dusk.parseTree.ParseTreeCompileError("Brackets not closed properly.");
				}
			}
			i ++;
		}else{
			var op = new dusk.parseTree.Node(read[1], read[3], read[2]);
			
			var p = null;
			var n = root;
			var count = 0;
			while(n.lhs && n.lhs.value != "bracket_guard" && n.lhs.priority >= op.priority) {
				p = n;
				n = n.rhs;
				count ++;
			}
			
			op.lhs = n;
			if(!p) root = op;
			else p.rhs = op;
		}
	}
};

/** Compiles a string directly to a function with caching.
 * @param {string} The string to compile.
 * @returns {function():*} A function that returns the value of the evaluated string.
 */
dusk.parseTree.Compiler.prototype.compileToFunct = function(str) {
	if(str in this._functCaches) return this._functCaches[str];
	
	var f = this.compile(str, 0, true).toFunction();
	this._functCaches[str] = f;
	return f;
}

/** Reads until it finds an operand and then an operator.
 * 
 * @param {string} str The string to read.
 * @param {integer} init When to start reading from.
 * @returns {array} Array containing, in order, the operand, the operator, exec function, priority, 
 *  the new "init" value and array of [op, function] pairs for all the unary operations on the
 *  operand. Operand may be null if there is no more operators in the string. It may also be an open
 *  or close bracket.
 * @private
 */
dusk.parseTree.Compiler.prototype._read = function(str, init) {
	var buffer = "";
	var uops = [];
	
	for(var c = init; c < str.length; c ++) {
		buffer += str[c];
		
		if(str[c] == "(") {
			//Bracketing time!
			return ["", "(", "THIS_IS_A_BRACKET", 0, c+1, uops];
		}else if(str[c] == ")") {
			//Unbracketing time...
			return [buffer.substring(0, buffer.length-1).trim(), ")", "THIS_IS_A_BRACKET",
				0, c+1, uops
			];
		}
		
		for(var i = 0; i < this._uops.length; i++) {
			if(buffer.trim() == this._uops[i][0]) {
				var op = this._uops[i][0];
				
				for(var j = 0; j < this._uops[i][3].length; j ++) {
					if(buffer.endsWith(this._uops[i][3][j])) continue;
				}
				
				if(this._whitespace == dusk.parseTree.Compiler.WS_ALWAYS
				|| (this._whitespace == dusk.parseTree.Compiler.WS_ONLYCHARS && this._uops[i][2])) {
					if(/\s/.test(str[c+1])) {
						uops.push([op, this._uops[i][1]]);
						buffer = "";
					}
				}else{
					uops.push([op, this._uops[i][1]]);
					buffer = "";
				}
			}
		}
		
		opsloop: for(var i = 0; i < this._ops.length; i++) {
			if(buffer.endsWith(this._ops[i][0])) {
				var op = buffer.substring(buffer.length-this._ops[i][0].length);
				var opand = buffer.substring(0, buffer.length-this._ops[i][0].length);
				
				for(var j = 0; j < this._ops[i][3].length; j ++) {
					if(buffer.endsWith(this._ops[i][3][j])) continue opsloop;
				}
				
				if(this._whitespace == dusk.parseTree.Compiler.WS_ALWAYS
				|| (this._whitespace == dusk.parseTree.Compiler.WS_ONLYCHARS && this._ops[i][2])) {
					if(/\s/.test(str[c+1]) && /\s$/.test(opand)) {
						return [opand.trim(), op, this._ops[i][1], i+1, c+1, uops];
					}
				}else{
					return [opand.trim(), op, this._ops[i][1], i+1, c+1, uops];
				}
			}
		}
	}
	
	return [buffer.trim(), null, null, 0, 0, uops];
};

Object.seal(dusk.parseTree.Compiler);
Object.seal(dusk.parseTree.Compiler.prototype);

// ----

/** Creates a new parse tree compile error.
 * 
 * @class dusk.parseTree.ParseTreeCompileError
 * 
 * @classdesc An error that is thrown whenever compiling a parse tree fails.
 * 
 * @param {string} message The error message.
 * @constructor
 * @since 0.0.20-alpha
 */
dusk.parseTree.ParseTreeCompileError = function(message) {
	this.name = "ParseTreeCompileError";
	this.message = message;
}	
dusk.parseTree.ParseTreeCompileError.prototype = Object.create(Error.prototype);

Object.seal(dusk.parseTree.ParseTreeCompileError);
Object.seal(dusk.parseTree.ParseTreeCompileError.prototype);

// ----

/** Creates a new node.
 * 
 * @class dusk.parseTree.Node
 * 
 * @classdesc A single node of the compiled parse tree.
 * 
 * It can be evaluated to a single value using `{@link dusk.parseTree.Node#eval}`.
 * 
 * @param {string} value For leaves it is it's value, for nodes it is the operator.
 * @param {int=0} priority Used when building the tree, priority  of the operator. Lower values are
 *  higher priority.
 * @param {?function(string, *, *):* | function(string, *):*} exec The function that should be
 *  called to evaluate this node. In leaves, this is null and serves as a way to identify that it is
 *  a leaf.

 * @param {?dusk.parseTree.Node} lhs The left branch, if it is known.
 * @param {?dusk.parseTree.Node} rhs The right branch, if it is known.
 * @constructor
 * @since 0.0.20-alpha
 */
dusk.parseTree.Node = function(value, priority, exec, lhs, rhs) {
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
	 * @type ?dusk.parseTree.Node
	 */
	this.lhs = lhs?lhs:null;
	
	/** The right hand side of the operator or null if it is a leaf.
	 * @type ?dusk.parseTree.Node
	 */
	this.rhs = rhs?rhs:null;
};

/** Returns true if and only if the node is a leaf node.
 * @return {boolean} Whether this is a leaf node.
 */
dusk.parseTree.Node.prototype.isLeaf = function() {
	return !this.exec;
};

/** Returns true if and only if the node represents a unary operation.
 * @return {boolean} Whether this is a unary node.
 */
dusk.parseTree.Node.prototype.isUnary = function() {
	return !this.rhs;
};

/** Evaluates this node, and returns its value.
 * @return {*} The value of this node.
 */
dusk.parseTree.Node.prototype.eval = function() {
	if(this.isLeaf()) return this.value;
	if(this.isUnary()) return this.exec(this.value, this.lhs.eval());
	return this.exec(this.value, this.lhs.eval(), this.rhs.eval());
};

/** Returns a function that, when called, will return the value of evaluating this tree.
 * @return {function():*} A function representing this tree.
 */
dusk.parseTree.Node.prototype.toFunction = function() {
	if(this.isLeaf()) return (function(){return this}).bind(this);
	
	if(this.isUnary()) {
		return (function(l) {
			return this.exec(this.value, l());
		}).bind(this, this.lhs.toFunction());
	}else{
		return (function(l, r) {
			return this.exec(this.value, l(), r());
		}).bind(this, this.lhs.toFunction(), this.rhs.toFunction());
	}
};

/** Returns a multiline string representation of this node and it's children.
 * @param {int=0} indent The indentation of the node.
 * @return {string} A string representation of this node.
 */
dusk.parseTree.Node.prototype.toString = function(indent) {
	if(!indent) indent = 0;
	
	var out = "";
	for(var i = 0; i < indent; i ++) {
		out += " ";
	}
	
	out += "[node "+this.value+":"+this.priority;
	if(this.isLeaf()) {
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
}

Object.seal(dusk.parseTree.Node);
Object.seal(dusk.parseTree.Node.prototype);
Object.seal(dusk.parseTree);
