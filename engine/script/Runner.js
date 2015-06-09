//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.script.Runner", (function() {
	var dusk = load.require("dusk");
	var utils = load.require("dusk.utils");
	
	/** A script runner takes a series of actions, runs each one asynchronously and then fulfills a promise with the
	 * final value.
	 * 
	 * It is also possible to go backwards, by specifying an inverse function (that undoes what the forward function
	 * did). This is usefull for user interaction that can be cancelled.
	 * 
	 * An action is either a function, or an "action object", which has properties "forward" and "inverse". The function
	 * or the "forward" function is called with the output from the last action (or an initial value), and the output,
	 * which may be a promise, is fed to the next action when it is resolved (instantly, if the return value was not a
	 * promise).
	 * 
	 * If a promise returned by the forward function rejects with Runner.Cancel, the "inverse" function of the previous
	 * action is called with the value its forward function provided. The forward function of this previous action is
	 * then called again as normal with the same value as it did the first time. If the inverse function rejects with
	 * Runner.Cancel (or doesn't exist, or the "action" is just a single function). Then the inverse function of the one
	 * before that is ran, followed by its forward function and so on.
	 * 
	 * By convention, the input of an action should be an object. Each action should add or modify properties on this
	 * object and then return it. Thus an object "flows down" the script, gaining more properties as it goes.
	 * 
	 * The forward function is given two arguments; the value and an "addActions" function. The addAction function takes
	 * two arguments itself, the first is an array of actions to add (which will be ran after this resolves) and the
	 * optional second is a function that will be called when the actions are exhausted. If this function returns true
	 * then the actions will be repeated.
	 * 
	 * @param {array<object|function(*):*>} script The script to run.
	 * @since 0.0.21-alpha
	 */
	var Runner = function(script) {
		this._script = script;
	};
	
	/** Starts the script.
	 * @param {*} init The initial value.
	 * @return {Promise(*)} A promise that resolves to the final value of the script.
	 */
	Runner.prototype.start = function(init) {
		return new Promise((function(fulfill, reject) {
			var currentAction = _scriptToLL(this._script)[0];
			
			var addActions = function(actions, loopif) {
				var all = _scriptToLL(actions);
				
				all[1].next = currentAction.next;
				if(currentAction.next) currentAction.next.prev = all[1];
				
				all[0].prev = currentAction.next;
				currentAction.next = all[0];
				
				// Looping
				if(loopif) {
					all[1].loopCond = loopif;
					all[1].loopBack = all[0];
				}
			}
			
			var next = function(value) {
				if(Runner.log) {
					if("name" in currentAction.action && currentAction.action.name) {
						console.log("%cRunning action "+currentAction.action.name+" with %o", "color:#999999", value);
					}else{
						console.log("%cRunning unnamed action with %o", "color:#999999", value);
					}
				}
				
				var ret = undefined;
				
				if(typeof currentAction.action == "function") {
					ret = currentAction.action(value, addActions);
				}else{
					ret = currentAction.action.forward(value, addActions);
				}
				
				if(!(ret instanceof Promise)) ret = Promise.resolve(ret);
				
				ret.then(function(x) {
					currentAction.output = utils.copy(x);
					var hold = currentAction;
					
					if(currentAction.loopCond && currentAction.loopCond(x)) {
						currentAction = currentAction.loopBack;
						currentAction.forcedInput = true; // Have it read the input specified here
						currentAction.forceInputValue = x;
						next(x);
					}else{
						currentAction = currentAction.next;
						if(currentAction) {
							currentAction.prev = hold;
							currentAction.forcedInput = false; // Have it read the output from the previous action
							next(x);
						}else{
							fulfill(x);
						}
					}
				}, prev);
			}
			
			var prev = function(error) {
				if(!(error instanceof Runner.Cancel)) {
					reject(error);
					return;
				}
				
				// Go back one
				currentAction = currentAction.prev;
				if(!currentAction) reject(error);
				currentAction.next = currentAction.originalNext;
				
				if(Runner.log) {
					if("name" in currentAction.action && currentAction.action.name) {
						console.log("%cRunning inverse action "+currentAction.action.name+"", "color:#999999");
					}else{
						console.log("%cRunning unnamed inverse action", "color:#999999");
					}
				}
				
				var ret = undefined;
				if(typeof currentAction.action == "function" || !("inverse" in currentAction.action)) {
					ret = Promise.reject(new Runner.Cancel());
				}else{
					ret = currentAction.action.inverse(currentAction.output);
				}
				
				if(!(ret instanceof Promise)) ret = Promise.resolve(ret);
				
				ret.then(function(x) {
					var input;
					if(currentAction.forcedInput) {
						input = currentAction.forceInputValue;
					}else{
						input = currentAction.prev ? currentAction.prev.output : init;
					}
					
					next(input);
				}, prev);
			}
			
			next(init);
		}).bind(this));
	}
	
	/** Converts an array of actions to a linked list.
	 * @param {array} script The script to create.
	 * @return {array} A [first, last] array of linked list nodes.
	 * @private
	 */
	var _scriptToLL = function(script) {
		var head = undefined;
		var now = undefined;
		var node = undefined;
		
		for(var a of script) {
			node = {};
			node.action = a;
			node.prev = now;
			if(now) now.next = node;
			if(now) now.originalNext = node;
			now = node;
			if(!head) head = now;
		}
		
		return [head, now];
	}
	
	/** Whether script runners should describe each action they perfrom.
	 * @type boolean
	 * @default dusk.dev
	 */
	Runner.log = dusk.dev;
	
	/** Forward functions should reject with this error to indicate that the script should go back one action.
	 * @param {string} msg A message explaining why.
	 * @extends Error
	 */
	Runner.Cancel = function(msg) {
		this.name = "Cancelled Action";
		this.msg = msg ? msg : "No reason given";
	};
	Runner.Cancel.prototype = Object.create(Error.prototype);
	
	/** Returns an action object.
	 * @param {string} name The name of the action, for debugging.
	 * @param {function(*):*} forward The forward function.
	 * @param {function(*):*} inverse The inverse function.
	 * @return {object} An object suitable for adding to a script.
	 */
	Runner.action = function(name, forward, inverse) {
		return {
			"name":name,
			"forward":forward,
			"inverse":inverse ? inverse : function(x, ad) {return Promise.reject(new Runner.Cancel());},
		}
	};
	
	return Runner;
})());
