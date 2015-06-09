//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.script.Actions", (function() {
	var Runner = load.require("dusk.script.Runner");
	
	/** A selection of helpfull actions for scripts.
	 * 
	 * These are designed to be used as actions in `dusk.script.Runner`.
	 * 
	 * @see dusk.script.Runner
	 * @since 0.0.21-alpha
	 */
	var Actions = {};
	
	var id = function(x) {return x;};
	var rej = function(x) {return Promise.reject(new Runner.Cancel());};
	var constfn = function(x) {return function() {return x}};
	var singleArr = function(x) {if(!Array.isArray(x)) {return [x]} else {return x}};
	
	/** This action does not cause the cancel action to go any further behind it, and is to be used when a user should
	 * be unable to cancel an action after it.
	 * @return {object} The action object.
	 */
	Actions.block = constfn(Runner.action("block", id, function() {}));
	
	/** Displays a message to the console. "%" will be replaced by the value.
	 * @param {string} msg The message to display.
	 * @return {object} The action object.
	 */
	Actions.print = function(msg) {
		return Runner.action("print", function(x, add) {
			console.log(msg.replace(/%/g, ""+x));
			return x;
		});
	};
	
	/** If the function cond returns true (when this action is ran), then add the `thenClause` actions to the script,
	 * otherwise, add the `elseClause` actions.
	 * @param {function(*):boolean} The condition to check.
	 * @param {array=[]} thenClause An array of actions to do if the condition is true.
	 * @param {array=[]} elseClause An array of actions to do if the condition is false.
	 * @return {object} The action object.
	 */
	Actions.if = function(cond, thenClause, elseClause) {
		return Runner.action("if", function(x, add) {
			if(cond(x)) {
				if(thenClause) add(singleArr(thenClause));
			}else{
				if(elseClause) add(singleArr(elseClause));
			}
			
			return x;
		});
	};
	
	/** Keep repeating the body actions while the condition returns true.
	 * 
	 * The condition will be given the resolution value of the last action in the body if it has ran yet.
	 * @param {function(*):boolean} The condition to check.
	 * @param {array=[]} thenClause An array of actions to do while the condition is true.
	 * @return {object} The action object.
	 */
	Actions.while = function(cond, body) {
		return Runner.action("while", function(x, add) {
			if(cond(x)) {
				add(singleArr(body), cond);
			}
			
			return x;
		});
	};
	
	/** Simply calls "addActions" with it's body.
	 * @param {array=[]} thenClause An array of actions to do.
	 * @return {object} The action object.
	 */
	Actions.actions = function(body) {
		return Runner.action("actions", function(x, add) {
			add(singleArr(body));
			
			return x;
		});
	};
	
	return Actions;
})());
