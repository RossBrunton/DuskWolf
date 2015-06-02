//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.functionStore", (function() {
    var utils = load.require("dusk.utils");
    
    /** Function stores provide a way to store functions and refer to them as strings.
     * 
     * You register functions on this namespace (with the `register`) function, and then whenever you need to use them
     * (such as in a condition for entity animation, or a transition function) you describe the function as a string.
     * This allows functions to be used on places where functions cannot, such as in a level editor or in JSON data.
     * 
     * Functions are described in a similar function to lisp, in the form of s expressions like
     * `(function-name arg1 arg2)`. Arguments themselves may be strings (using JS' string notation), numbers, functions
     * or other s expressions, for example `(print 1 2 (concat "Hello" "World"))` is valid. The s expressions are fully
     * evaluated and called only when they are not the "root" s expression.
     * 
     * When you translate an s expression into a function, you get the function with the first n arguments bound with
     * the values of the second, third and so on element of the s expression. This function can still be called with
     * more arguments, and it is expected that anything that uses the stored functions will call them with appropriate
     * arguments.
     * 
     * As a use case, consider you want some event to happen only if some object matches some criteria. The system that
     * controls this will allow you to specify a function in the store to use to describe said criteria, and when it
     * needs to check whether the event will happen, the function will be called with the appropriate object as an
     * argument. You would write the s expression under the assumption that this object will be joined onto the end of
     * the s expression itself.
     * 
     * There are a few built in functions as follows:
     * - list: Returns its arguments as an array.
     * - fn: Returns the function from the store with this name.
     * - print: Uses console.log to display its arguments.
     * - if: If the first argument is true, then returns the second argument, otherwise returns the third. Note that
     * both will be fully evaluated.
     * - +: Returns the sum of all its arguments.
     * - -: If given one argument x, returns -x. Otherwise returns x - the sum of all the other arguments.
     * - *: Returns the product of all its arguments.
     * - /: If given one argument x, returns 1/x. Otherwise returns x / a / b / ... For all its arguments.
     * - and: Returns true iff all of its arguments are true.
     * - or: Returns true iff at least one of its arguments are true.
     * - not: Returns true iff the first argument is false.
     * - ==, ===, <=, <, >, >=: Work as in JavaScript.
     * - concat: Calls the "concat" method of the first argument with the rest of the arguments.
     * - in: Returns whether the first argument is a property name of the second.
     * - get: Returns a[b] where a is the first argument, and b is the second.
     * - set: Sets a[b] to c and returns c for the arguments a, b, c.
     * - getf, setf: Same as get and set, only calls a get and set function rather than using the square brackets.
     * - callf: Calls a[b] with the rest of the arguments.
     * - global: Takes no arguments and returns the global object (which is probably window).
     * - let: When called like (let a b c), it will bind the value of a to c when evaluating b. This means that whenever
     *  the token `a` is found in any of b's sexprs, it will have the value of c. `a` must not be surrounded by quotes,
     *  nor should its occurences in b.
     * 
     * @since 0.0.21-alpha
     */
	var functionStore = {};
	
    /** Variable list
     * 
     * Set a key on here, and a token will evaluate to the value when encountered and not bound to a let statement.
     * Please have the name be of the form "namespace-name". If you wish, you may set this before you call the
     * function returned from eval to pass data that you can't pass as arguments.
     * 
     * @type Map<string, *>
     */
    functionStore.vars = new Map();
    
    /** Stores the raw functions
     * 
     * @type Map<string, function(**):*>
     * @private
     */
	var _raws = new Map();
    
    /** Registers a function to be used in the system
     * @param {string} name The name of the function, if this name is the first in an s expression that function will
     * be used for it.
     * @param {function(**):*} The function to call, the arguments will be the rest of the terms in the s expression
     */
    functionStore.register = function(name, fn) {
        if(_raws.has(name)) throw new Error("FunctionStore tried to store "+name+", but it already exists.");
        if(name.includes("(") || name.includes(")") || name.includes("\"") || name.includes("'"))
            throw new TypeError("FunctionStore tried to store "+name+", but it isn't a valid name.");
        
        _raws.set(name, fn);
    };
    
    /** Simple wrapper to indicate a value is a token rather than a raw string, used when parsing
     * @param {string} val The value to wrap
     * @private
     * @constructor
     */
    var _fsToken = function(val) {
        /** The value being wrapped, as a string
         * @type string
         */
        this.val = ""+val;
    }
    _fsToken.prototype.toString = function() {
        return this.val;
    }
    /** Resolves the token into either its value or a function
     * 
     * It first checks the let stack to see if the token is bound by a "let" expression, if so it returns that value,
     *  otherwise it returns the function with the appropriate name from the store.
     * @return {function(**):*|*} What this token refers to.
     */
    _fsToken.prototype.resolve = function() {
        for(var i = _letStack.length-1; i >= 0; i --) {
            if(_letStack[i][0] == this.val) {
                return _letStack[i][1];
            }
        }
        
        if(functionStore.vars.has(this.val)) {
            return functionStore.vars.get(this.val);
        }
        
        if(_raws.has(this.val)) {
            return _raws.get(this.val);
        }
        
        throw TypeError("Token "+this.val+" is not a stored function or variable");
    }
    
    /** Used while parsing, stores the offset of the current character
     * @type integer
     * @private
     */
    var _parsePointer = 0;
    
    /** The stack for let values, as a [key, value] array
     * 
     * This is used while parsing and while calling the let function (if it is the root sexpr).
     * @type array<array<string, string|number|function(**):*|array>
     * @private
     */
    var _letStack = [];
    
    /** Converts a string to an s expression for one term starting at the offset `_parsePointer`.
     * 
     * The value returned will be of the appropriate type, either a string, number, function or array
     * 
     * @param {string} expr The string to read
     * @return {string|number|function(**)|array}
     * @private
     */
    var _toSexpr = function(expr) {
        while(expr.charAt(_parsePointer).match(/\s/) && _parsePointer < expr.length) _parsePointer ++;
        
        if(expr.charAt(_parsePointer) == "(") {
            // (a b c)
            var arr = [];
            _parsePointer ++;
            while(expr.charAt(_parsePointer).match(/\s/) && _parsePointer < expr.length) _parsePointer ++;
            while(expr.charAt(_parsePointer) != ")") {
                arr.push(_toSexpr(expr));
                if(_parsePointer >= expr.length) {
                    throw new Error("Unbalanced brackets!");
                    return;
                }
                while(expr.charAt(_parsePointer).match(/\s/) && _parsePointer < expr.length) _parsePointer ++;
            }
            _parsePointer ++;
            return arr;
        }else if("1234567890-".includes(expr.charAt(_parsePointer))){
            // 1243
            var buff = expr.charAt(_parsePointer);
            while(expr.charAt(++_parsePointer).match(/[\d.eE]/) && _parsePointer < expr.length) {
                buff += ""+expr.charAt(_parsePointer);
            }
            if(Number.isNaN(Number.parseFloat(buff))){
                return _raws.get(buff);
            }else{
                return Number.parseFloat(buff);
            }
        }else if("\"'".includes(expr.charAt(_parsePointer))){
            // "String"
            var terminate = expr.charAt(_parsePointer);
            
            var buff = "";
            var escape = false;
            while((expr.charAt(++_parsePointer) != terminate || escape)
            && _parsePointer < expr.length) {
                if(expr.charAt(_parsePointer) == "\\" && !escape) {
                    escape = true;
                }else{
                    if(escape) {
                        switch(expr.charAt(_parsePointer)) {
                            case "t": buff += "\t"; break;
                            case "0": buff += "\0"; break;
                            case "n": buff += "\n"; break;
                            case "r": buff += "\r"; break;
                            case "v": buff += "\v"; break;
                            case "b": buff += "\b"; break;
                            case "f": buff += "\f"; break;
                            
                            default: buff += ""+expr.charAt(_parsePointer);
                        }
                    }else{
                        buff += ""+expr.charAt(_parsePointer);
                    }
                    
                    escape = false;
                }
            }
            _parsePointer ++;
            return buff;
        }else{
            // SomeName
            var buff = expr.charAt(_parsePointer);
            while(!expr.charAt(++_parsePointer).match(/[\s()]/) && _parsePointer < expr.length) {
                buff += ""+expr.charAt(_parsePointer);
            }
            
            return new _fsToken(buff);
        }
    }
    
    /** Evaluates a string describing a function and returns a bound function as appropriate
     * @param {expr} The string to evaluate
     * @return {function(**):*} The evaluated function
     */
    functionStore.eval = function(expr) {
        _parsePointer = 0;
        _letStack = [];
        var sexpr = _toSexpr(expr);
        
        var _letfn = function(bind, expr, val) {
            _letStack.push([bind.val, val]);
            var output = _bindSexpr(true, expr);
            _letStack.pop();
            return output;
        }
        
        var _bindSexpr = function(call, sexpr) {
            if(Array.isArray(sexpr)) {
                if(sexpr[0].val == "let") {
                    if(call) {
                        // If we should call it, that means it must have all arguments
                        _letStack.push([sexpr[1].val, _bindSexpr(true, sexpr[3])]);
                        var val = _bindSexpr(true, sexpr[2]);
                        _letStack.pop();
                        return val;
                    }else{
                        // Otherwise bind the letfn as appropriate
                        return Function.prototype.bind.apply(_letfn, [undefined].concat(sexpr.splice(1)));
                    }
                }else{
                    var fn = Function.prototype.bind.apply(
                        sexpr[0].resolve(), [undefined].concat(sexpr.splice(1).map(_bindSexpr.bind(undefined, true)))
                    );
                    if(call) return fn.call(undefined);
                    return fn;
                }
            }else if(sexpr instanceof _fsToken){
                if(call) {
                    return sexpr.resolve();
                }else{
                    return function() {return sexpr.resolve();}
                }
            }else{
                if(call) {
                    return sexpr;
                }else{
                    return function() {return sexpr;}
                }
            }
        }
        
        return _bindSexpr(false, sexpr);
    };
    
    // Builtin functions
    functionStore.register("list", function(){return Array.prototype.slice.call(arguments);});
    functionStore.register("fn", function(x){return _raws.get(x)});
    functionStore.register("print", function(){console.log.apply(console, arguments);});
    functionStore.register("if", function(c, t, f){return c ? t : f});
    functionStore.register("+", function(){
        var sum = 0;
        for(var i = 0; i < arguments.length; i ++) sum += arguments[i];
        return sum;
    });
    functionStore.register("-", function(){
        if(arguments.length == 1) {
            return -arguments[0];
        }else{
            var sum = arguments[0];
            for(var i = 1; i < arguments.length; i ++) sum -= arguments[i];
            return sum;
        }
    });
    functionStore.register("*", function(){
        var prod = 1;
        for(var i = 0; i < arguments.length; i ++) prod *= arguments[i];
        return prod;
    });
    functionStore.register("/", function(){
        if(arguments.length == 1) {
            return 1 / arguments[0];
        }else{
            var prod = arguments[0];
            for(var i = 1; i < arguments.length; i ++) prod /= arguments[i];
            return prod;
        }
    });
    
    functionStore.register("and", function(){
        return Array.prototype.every.call(arguments, function(x) {return x});
    });
    functionStore.register("or", function(){
        return Array.prototype.some.call(arguments, function(x) {return x});
    });
    functionStore.register("not", function(x){return !x});
    
    functionStore.register("==", function(a, b){return a == b});
    functionStore.register("===", function(a, b){return a === b});
    functionStore.register("!==", function(a, b){return a != b});
    functionStore.register("!===", function(a, b){return a !== b});
    functionStore.register("<", function(a, b){return a < b});
    functionStore.register("<=", function(a, b){return a <= b});
    functionStore.register(">", function(a, b){return a > b});
    functionStore.register(">=", function(a, b){return a >= b});
    
    functionStore.register("concat", function(a){return a.concat.apply(a, Array.prototype.splice.call(arguments, 1))});
    functionStore.register("in", function(a, b){return a in b});
    functionStore.register("get", function(a, b){return a[b]});
    functionStore.register("set", function(a, b, c){return a[b] = c, c});
    functionStore.register("getf", function(a, b){return a.get(b)});
    functionStore.register("setf", function(a, b, c){return a.set(b, c), c});
    functionStore.register("callf", function(a, b){return a[b].apply(a, Array.prototype.splice.call(arguments, 2))});
    functionStore.register("global", function(){return window});
	
	return functionStore;
})());
