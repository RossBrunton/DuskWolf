//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Single");

/** This is a simple single that allows you to run actions when a direction arrow is pressed.
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;action-up&gt;(actions)&lt;/action-up&gt;</code> --
 * Runs <code>actions</code> when the up direction is pressed. If this is empty, normal flowing occurs.</p>
 * 
 * <p><code>&lt;action-down&gt;(actions)&lt;/action-down&gt;</code> --
 * Runs <code>actions</code> when the down direction is pressed. If this is empty, normal flowing occurs.</p>
 * 
 * <p><code>&lt;action-left&gt;(actions)&lt;/action-left&gt;</code> --
 * Runs <code>actions</code> when the left direction is pressed. If this is empty, normal flowing occurs.</p>
 * 
 * <p><code>&lt;action-right&gt;(actions)&lt;/action-right&gt;</code> --
 * Runs <code>actions</code> when the right direction is pressed. If this is empty, normal flowing occurs.</p>
 */

sgui.DirListener = function(parent, events, comName) {
	if(parent !== undefined){
		sgui.Single.call(this, parent, events, comName);
		/** This creates a new focus checker! See <code>Component</code> for parameter details.
		 * @see sg.Component
		 */
			
		this._up = [];
		this._down = [];
		this._left = [];
		this._right = [];

		this._registerStuff(this._dirListenerStuff);
	}
};
sgui.DirListener.prototype = new sgui.Single();
sgui.DirListener.constructor = sgui.DirListener;

sgui.DirListener.prototype._dirListenerStuff = function(data) {
	//Directions
	this._up = this._prop("action-up", data, this._up);
	this._down = this._prop("action-down", data, this._down);
	this._left = this._prop("action-left", data, this._left);
	this._right = this._prop("action-right", data, this._right);
};

/** This is called when the up key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
sgui.DirListener.prototype._upAction = function() {
	if(this._up){
		this._events.run(this._up, "_sg-dirListener");
		return false;
	}
	
	return true;
};

/** This is called when the down key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
sgui.DirListener.prototype._downAction = function() {
	if(this._down){
		this._events.run(this._down, "_sg-dirListener");
		return false;
	}
	
	return true;
};

/** This is called when the left key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
sgui.DirListener.prototype._leftAction = function() {
	if(this._left){
		this._events.run(this._left, "_sg-dirListener");
		return false;
	}
	
	return true;
};

/** This is called when the right key is pressed, and in this object it runs some actions.
 * @return If some code was ran. If no code was ran, then control should flow out of this.
 */
sgui.DirListener.prototype._rightAction = function() {
	if(this._right){
		this._events.run(this._right, "_sg-dirListener");
		return false;
	}
	
	return true;
};
