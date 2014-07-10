//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.reversiblePromiseChain", (function() {
	var utils = load.require("dusk.utils");
	var UserCancelError = load.require(">dusk.UserCancelError", function(p) {UserCancelError = p});
	
	/** @namespace dusk.reversiblePromiseChain
	 * @name dusk.reversiblePromiseChain
	 * 
	 * @description This is a namespace containing only one function.
	 * @since 0.0.21-alpha
	 */
	
	/** Creates a promise that is a chain of promises that if any reject, a previous one in the sequence is used.
	 * 
	 * This consists of an array of functions. Each function should return a promise or not (think functions that can be 
	 *  fed to Promise.then). The first function in the array is ran with `initalArg`, if this fulfils or returns a constant
	 *  value, the next element in the array is called with the fulfill or return value. If there are no more elements,
	 *  then the promise returned by `dusk.reversiblePromiseChain` fulfills with the value.
	 * 
	 * If at any point, any promise rejects, the "inverse" function of the previous element is called with the argument of
	 *  the value the forward function fulfilled. Then the previous element's forward function is called with the same
	 *  argument it was originally called with. If you reject in an inverse function, then you go back another step. It's
	 *  expected that all inverse functions reject if they are not a promise to get user input.
	 * 
	 * The `promises` array is an array of either arrays or functions. These are the functions that will be used in this
	 *  chain. If you provide an array as an element, it will be treated as a `[normal, inverse]` pair of functions.
	 *  Omitting the inverse will cause it to be skipped when cancelling.
	 * 
	 * If you bind the first two parameters, you can use this as a function for `Promise.next`.
	 * 
	 * @param {array} promises The promise generating functions, as described above.
	 * @param {cancelOut} boolean If true, then if the first element rejects, then the whole promise rejects. If false, 
	 *  the first element is tried again.
	 * @param {*} initialArg The initial argument for the first promise function.
	 * @memberof dusk.reversiblePromiseChain
	 */
	var reversiblePromiseChain = function(promises, cancelOut, initialArg) {
		return new Promise((function(fulfill, reject) {
			var scope = {};
			scope.promises = promises;
			scope.cancelOut = cancelOut;
			scope.inverse = false;
			
			scope.p = -1;
			
			scope.toAdd = [];
			
			for(var i = 0; i < scope.promises.length; i ++) {
				if(!Array.isArray(scope.promises[i])) scope.promises[i] = [scope.promises[i]];
			}
			
			scope.queue = (function(promise) {
				if(!Array.isArray(promise)) promise = [promise];
				this.toAdd.push(promise);
			}).bind(scope);
			
			scope.next = (function(value) {
				if(!this.inverse) {
					this.p ++;
					if(this.p > 0) {
						this.promises[this.p - 1][2] = utils.clone(value);
					}
				}
				
				if(this.p > 0) {
					this.promises[this.p - 1][3] = this.toAdd.length;
				}
				
				if(this.toAdd.length) {
					for(var i = this.toAdd.length-1; i >= 0; i --) {
						this.promises.splice(this.p, 0, this.toAdd[i]);
					}
					
					this.toAdd = [];
				}
				
				this.inverse = false;
				
				if(this.p >= this.promises.length || this.promises[this.p][0] == reversiblePromiseChain.STOP) {
					return fulfill(value);
				}
				
				var ret = null;
				if(this.p > 0) {
					ret = this.promises[this.p][0](this.promises[this.p -1][2], this.queue);
				}else{
					ret = this.promises[this.p][0](initialArg, this.queue);
				}
				
				if(!(ret instanceof Promise)) {
					ret = new Promise(function(f, r) {f(ret);});
				}
				
				return ret.then(this.next, this.cancel);
			}).bind(scope);
			
			scope.cancel = (function(value) {
				this.inverse = true;
				this.p --;
				
				if(this.p >= 0) {
					this.promises.splice(this.p+1, this.promises[this.p][3]);
				}
				
				if(!(value instanceof UserCancelError)) {
					return reject(value);
				}else if(!value) {
					console.warn("Undefined cancel value, opening debugger.");
					debugger;
					return reject(value);
				}
				
				if(this.p < 0) {
					if(cancelOut) {
						return reject(new UserCancelError());
					}else{
						this.p = 0;
						return this.next(initialArg);
					}
				}
				
				if(!this.promises[this.p][1]) return this.cancel(new UserCancelError());
				
				return this.promises[this.p][1](this.promises[this.p][2], this.queue).then(this.next, this.cancel);
			}).bind(scope);
			
			scope.next();
		}));
	};
	
	/** Special function that when it is reached in a reversible promise chain will cause the chain to terminate
	 *  instantly.
	 * 
	 * Calling this function has no effect.
	 * @static
	 */
	reversiblePromiseChain.STOP = function(){};
	
	return reversiblePromiseChain;
})());

load.provide("dusk.UserCancelError", (function() {
	/** @class dusk.UserCancelError
	 * 
	 * @classdesc Exception representing that the user has cancelled an action.
	 * 
	 * @extends Error
	 * @constructor
	 * @since 0.0.21-alpha
	 */
	var UserCancelError = function(parent, comName) {
		Error.call(this);
		
		this.name = "UserCancelError";
		this.message = "User Cancelled";
	};
	UserCancelError.prototype = Object.create(Error.prototype);
	
	Object.seal(UserCancelError);
	Object.seal(UserCancelError.prototype);
	
	return UserCancelError;
})());
