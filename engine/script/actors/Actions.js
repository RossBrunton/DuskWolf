//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.script.Actions", function() {
	var Runner = load.require("dusk.script.Runner");
	
	/** A selection of helpful actions for scripts.
	 * 
	 * These are designed to be used as actions in `dusk.script.Runner`.
	 * 
	 * @see dusk.script.Runner
	 * @since 0.0.21-alpha
	 * @namespace
	 * @memberof dusk.script
	 */
	var Actions = {};
	
	var id = function(x) {return x;};
	var rej = function(x) {return Promise.reject(new Runner.Cancel());};
	var constfn = function(x) {return function() {return x}};
	var singleArr = function(x) {if(!Array.isArray(x)) {return [x]} else {return x}};
	
	/** This action does not cause the cancel action to go any further behind it, and is to be used when a user should
	 * be unable to cancel an action after it.
	 * @return {object} The action object.
	 * @function
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
	 * @param {function(*):boolean} cond The condition to check.
	 * @param {array=} thenClause An array of actions to do if the condition is true, defaults to empty.
	 * @param {array=} elseClause An array of actions to do if the condition is false, defaults to empty.
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
	 * @param {function(*):boolean} cond The condition to check.
	 * @param {array=} thenClause An array of actions to do while the condition is true, defaults to empty
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
	
	/** Given an iterable, run the body once for each element. The value of the element will be set to the `bind`
	 * property on the passed argument.
	 * 
	 * Iterable may be a string, in which case the object specified by that name on the passed argument will be used.
	 * It also may be a function, in which case it is called and should return an iterable.
	 * 
	 * @param {(iterable|string|function(object):iterable)} iterable The object, name of object or a function that
	 *  returns an object to iterate.
	 * @param {string} bind The iterable element will be bound to this value.
	 * @param {array=} body An array of actions to do with each element, defaults to empty.
	 * @return {object} The action object.
	 */
	Actions.forEach = function(iterable, bind, body) {
		return Runner.action("forEach", function(x, add) {
			var literable = iterable;
			if(typeof literable == "string") literable = x[literable];
			if(typeof literable == "function") literable = literable(x);
			
			var it = literable[Symbol.iterator]();
			
			var update = {"name":"forEachUpdate", 
				"forward":function(x) {
					x[bind] = ob.value;
					ob = it.next();
					return x;
				},
				"inverse":id,
			};
			
			var ob = it.next();
			
			if(!ob.done) {
				add([update].concat(singleArr(body)), function(x) {return !ob.done;});
			}
			
			return x;
		});
	};
	
	/** Returns an action that fullfills after `duration` milliseconds.
	 * 
	 * @param {int} How long to wait.
	 * @return {object} The action object.
	 */
	Actions.wait = function(duration) {
		return Runner.action("forEach", function(x, add) {
			return new Promise(function(f, r) {
				setTimeout(f.bind(undefined, x), duration);
			});
		});
	};
	
	/** Simply calls "addActions" with it's body.
	 * @param {array=} thenClause An array of actions to do, defaults to empty.
	 * @return {object} The action object.
	 */
	Actions.actions = function(body) {
		return Runner.action("actions", function(x, add) {
			add(singleArr(body));
			
			return x;
		});
	};
	
	/** Copies x[from] to x[to]..
	 * @param {string} from The original name.
	 * @param {string} to The new name.
	 * @return {object} The action object.
	 */
	Actions.copy = function(from, to) {
		return Runner.action("copy", function(x, add) {
			x[to] = x[from];
			
			return x;
		});
	};
	
	return Actions;
});
