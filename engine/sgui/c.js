//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.c", function() {
	var dirs = load.require("dusk.utils.dirs");
	
	/** @namespace dusk.sgui.c
	 * @name dusk.sgui.c
	 * 
	 * @description  This namespace contains a number of constants that various components in the SGui system use.
	 * 
	 * You may assume that this has been imported if any SGui component has been imported.
	 * @since 0.0.19-alpha
	 */
	var c = {};
	
	/** The direction up, negative in the y axis.
	 * @type integer
	 * @value 0x01
	 * @constant
	 */
	c.DIR_UP = dirs.N;
	
	/** The direction down, positive in the y axis.
	 * @type integer
	 * @value 0x02
	 * @constant
	 */
	c.DIR_DOWN = dirs.S;
	
	/** The direction left, negative in the x axis.
	 * @type integer
	 * @value 0x04
	 * @constant
	 */
	c.DIR_LEFT = dirs.W;
	
	/** The direction right, negative in the x axis.
	 * @type integer
	 * @value 0x08
	 * @constant
	 */
	c.DIR_RIGHT = dirs.E;
	
	
	/** The horizontal orientation.
	 * @type integer
	 * @value 0x01
	 * @constant
	 */
	c.ORIENT_HOR = 0x01;
	
	/** The vertical orientation.
	 * @type integer
	 * @value 0x02
	 * @constant
	 */
	c.ORIENT_VER = 0x02;
	
	
	/** The origin point of the component will be either the top or the left of its container.
	 * @type integer
	 * @value 0
	 * @constant
	 * @since 0.0.18-alpha
	 */
	c.ORIGIN_MIN = 0;
	
	/** The origin point of the component will be either the bottom or right of its container.
	 * @type integer
	 * @value 1
	 * @constant
	 * @since 0.0.18-alpha
	 */
	c.ORIGIN_MAX = 1;
	
	/** The origin point of the component will be the centre of its container.
	 * @type integer
	 * @value 2
	 * @constant
	 * @since 0.0.18-alpha
	 */
	c.ORIGIN_MIDDLE = 2;
	
	return c;
});
