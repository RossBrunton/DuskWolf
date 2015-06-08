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
			var actionStack = [[-1, this._script.map(function(e) {return [{}, e];})]];
			var goneBack = false;
			
			var pushStack = function(actions, loopif) {
				actionStack.push([-1, actions.map(function(e) {return [{}, e];}), loopif]);
			};
			
			var next = function(value) {
				var top = actionStack[actionStack.length-1];
				
				var p = top[0];
				if(goneBack) {
					if(p) {
						value = top[1][p-1][0];
					}else{
						value = init;
					}
					goneBack = false;
				}else{
					var p = ++top[0];
				}
				
				if(p < top[1].length) {
					if(p) {
						top[1][p-1][0] = utils.copy(value, true); // Actions are paired with their output
					}
					
					if(Runner.log) {
						if("name" in top[1][p][1] && top[1][p][1].name) {
							console.log("%cRunning action "+top[1][p][1].name+" with %o", "color:#999999", value);
						}else{
							console.log("%cRunning unnamed action with %o", "color:#999999", value);
						}
					}
					
					var ret = undefined;
					
					if(typeof top[1][p][1] == "function") {
						ret = top[1][p][1](value, pushStack);
					}else{
						ret = top[1][p][1].forward(value, pushStack);
					}
					
					if(!(ret instanceof Promise)) ret = Promise.resolve(ret);
					ret.then(next, prev);
				}else{
					if(top[2] && top[2](value)) {
						top[0] = -1;
						next(value);
					}else if(actionStack.length > 1) {
						actionStack.pop();
						next(value);
					}else{
						fulfill(value);
					}
				}
			};
			
			var prev = function(err) {
				var top = actionStack[actionStack.length-1];
				var p = --top[0];
				goneBack = true;
				
				if(!(err instanceof Runner.Cancel)) {
					// A real error
					reject(err);
					return;
				}
				
				if(p >= 0) {
					var lastOutput = top[1][p][0]; // Actions are paired with their output
					
					var ret = undefined;
					
					if(Runner.log) {
						if(typeof top[1][p][1] == "function" || !("inverse" in top[1][p][1])) {
							console.log(
								"%cRunning inverse of unnamed action with %o, but it lacks an inverse function",
								"color:#999999", lastOutput
							);
						}else if("name" in top[1][p][1] && top[1][p][1].name) {
							console.log(
								"%cRunning inverse of action "+top[1][p][1].name+" with %o", "color:#999999",
								lastOutput
							);
						}else{
							console.log("%cRunning inverse of unnamed action with %o", "color:#999999", lastOutput);
						}
					}
					
					if(typeof top[1][p][1] == "function" || !("inverse" in top[1][p][1])) {
						ret = Promise.reject(new Runner.Cancel());
					}else{
						ret = top[1][p][1].inverse(lastOutput, err);
					}
					
					if(!(ret instanceof Promise)) ret = Promise.resolve(ret);
					ret.then(next, prev);
				}else if(actionStack.length > 1) {
					actionStack.pop();
					prev(err);
				}else{
					reject(err);
				}
			};
			
			next(init);
		}).bind(this));
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
