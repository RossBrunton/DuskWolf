//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.sgui.c");

/** @namespace dusk.sgui.c
 * @name dusk.sgui.c
 * 
 * @description  This namespace contains a number of constants that various components in the SGui system use.
 * 
 * You may assume that this has been imported if any SGui component has been imported.
 * @since 0.0.19-alpha
 */

/** The direction up, negative in the y axis.
 * @type integer
 * @value 0x01
 * @constant
 */
dusk.sgui.c.DIR_UP = 0x01;

/** The direction down, positive in the y axis.
 * @type integer
 * @value 0x02
 * @constant
 */
dusk.sgui.c.DIR_DOWN = 0x02;

/** The direction left, negative in the x axis.
 * @type integer
 * @value 0x04
 * @constant
 */
dusk.sgui.c.DIR_LEFT = 0x04;

/** The direction right, negative in the x axis.
 * @type integer
 * @value 0x08
 * @constant
 */
dusk.sgui.c.DIR_RIGHT = 0x08;


/** The horizontal orientation.
 * @type integer
 * @value 0x01
 * @constant
 */
dusk.sgui.c.ORIENT_HOR = 0x01;

/** The vertical orientation.
 * @type integer
 * @value 0x02
 * @constant
 */
dusk.sgui.c.ORIENT_VER = 0x02;
