//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.script.actors.menu", (function() {
	var Runner = load.require("dusk.script.Runner");
	var utils = load.require("dusk.utils");
	
	/** A selection of helpfull actions for scripts.
	 * 
	 * These are designed to be used as actions in `dusk.script.Runner`.
	 * 
	 * @see dusk.script.Runner
	 * @since 0.0.21-alpha
	 */
	var menu = {};
	
	/** Simply calls "addActions" with it's body.
	 * @param {array=[]} thenClause An array of actions to do.
	 * @return {object} The action object.
	 */
	menu.gridMenu = function(choices, com, options) {
		return Runner.action("dusk.script.actors.Menu.gridMenu", (function(x, add) {
			return new Promise((function(fulfill, reject) {
				var nowChoices = utils.copy(choices);
				
				if(options.copyChoices) {
					nowChoices = nowChoices.concat(x.menuChoices);
				}
				
				com.rows = nowChoices.length;
				com.cols = 1;
				com.populate(nowChoices.map(function(x){return x[0];}));
				com.getRoot().pushActive();
				com.becomeActive();
				com.visible = true;
				
				var l = com.action.listen((function(e) {
					var s = com.getFocusedChild();
					var choice = nowChoices[s.name.split(",")[1]];
					
					x.menuChoice = choice[1];
					
					com.visible = false;
					com.action.unlisten(l);
					com.cancel.unlisten(can);
					com.getRoot().popActive();
					
					if(!choice[1]) {
						reject(new Runner.Cancel());
					}else{
						if(!options.noAdd) {
							add(choice[1]);
						}
					}
					
					fulfill(x);
				}).bind(this));
				
				var can = com.cancel.listen((function(e) {
					com.getRoot().popActive();
					com.visible = false;
					com.cancel.unlisten(can);
					com.action.unlisten(l);
					com.getRoot().popActive();
					
					reject(new Runner.Cancel());
				}).bind(this));
			}).bind(this));
		}).bind(this),
		
		function() {}
		);
	};
	
	return menu;
})());
