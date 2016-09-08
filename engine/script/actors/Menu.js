//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Basic actors
 *
 * @namespace actors
 * @memberof dusk.script
 */

load.provide("dusk.script.actors.menu", function() {
	var Runner = load.require("dusk.script.Runner");
	var utils = load.require("dusk.utils");
	
	/** Creating and using a sgui menu to make choices
	 * 
	 * @see dusk.script.Runner
	 * @since 0.0.21-alpha
	 * @memberof dusk.script.actors
	 * @namespace
	 */
	var menu = {};
	
	/** Given an array of choices, it creates a vertical menu allowing the user to choose them.
	 *
	 * The choices are specified as `[display, result]`, with the first element being properties to set to the menu,
	 * option, and the second argument either being the script to run, or a value to pass through.
	 *
	 * If the second argument is falsey, then the menu cancels.
	 *
	 * The options param can have the following properties:
	 * - `copyChoices`: If defined, choices from the passed arg's `menuChoices` properties will be joined with the
	 *  provided choices.
	 * - `noAdd`: If true, the result of the menu option will not be appended to the script, and instead be written to
	 *  the `menuChoice` property of the passed arg.
	 *
	 * @param {array<string, *>} choices The choices for the user to pick from.
	 * @param {dusk.sgui.DynamicGrid} com The component to use for the menu.
	 * @param {object} options An options object as described above.
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
					
					com.visible = false;
					com.action.unlisten(l);
					com.cancel.unlisten(can);
					com.getRoot().popActive();
					
					if(!choice[1]) {
						reject(new Runner.Cancel());
					}else{
						if(!options.noAdd) {
							add(choice[1]);
						}else{
							x.menuChoice = choice[1];
						}
					}
					
					fulfill(x);
				}).bind(this));
				
				var can = com.cancel.listen((function(e) {
					com.getRoot().popActive();
					com.visible = false;
					com.cancel.unlisten(can);
					com.action.unlisten(l);
					
					reject(new Runner.Cancel());
				}).bind(this));
			}).bind(this));
		}).bind(this),
		
		function() {}
		);
	};
	
	return menu;
});
