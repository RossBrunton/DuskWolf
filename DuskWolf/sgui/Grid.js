//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Group");

/** This is a horizontal group of components.
 * 
 * <p><img src='HMenu.png'/></p>
 * 
 * <p>This group arranges components horizontally, and manages the focus relations between them.</p>
 * 
 * <p>It is filled up or "populated" using the property <code>&lt;populate&gt;</code>. Everything in the menu must be of the same type, and are given names as a number starting from 0. The first one is called "0", the second "1", that kind of thing. Components can be accessed in the same way as any other group.</p>
 * 
 * <p>Only one population can be there at a time, if you give another populate property, the current population will be erased.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;populate [count='(count)'] [spacing='(spacing)']&gt;(type)&lt;/populate&gt;</code> --
 * Creates a new population of type <code>type</code> containing <code>count</code> (default 5) components with a space of <code>spacing</code> (default 10) spacing between them, in pixels.</p>
 * 
 * @see VMenu
 */
sgui.Grid = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Group.call(this, parent, events, comName);
		
		this._registerStuff(this._gridStuff);
		
		if(!this._events.getVar("sg-def-grid-spacing-h")) this._events.setVar("sg-def-grid-spacing-h", "0");
		if(!this._events.getVar("sg-def-grid-spacing-v")) this._events.setVar("sg-def-grid-spacing-v", "0");
		if(!this._events.getVar("sg-def-grid-rows")) this._events.setVar("sg-def-grid-rows", "5");
		if(!this._events.getVar("sg-def-grid-cols")) this._events.setVar("sg-def-grid-cols", "5");
		if(!this._events.getVar("sg-def-grid-type")) this._events.setVar("sg-def-grid-type", "NullCom");
		
		this._hspacing = this._events.getVar("sg-def-grid-spacing-h");
		this._vspacing = this._events.getVar("sg-def-grid-spacing-v");
		
		this.rows = 0;
		this.cols = 0;
	}
};
sgui.Grid.prototype = new sgui.Group();
sgui.Grid.constructor = sgui.Grid;

sgui.Grid.prototype.className = "Grid";

sgui.Grid.prototype._gridStuff = function(data) {
	this._hspacing = this._prop("spacing-h", data, this._hspacing, true, 1);
	this._vspacing = this._prop("spacing-v", data, this._vspacing, true, 1);
	
	if(typeof(this._prop("populate", data, null, false)) != "string" && this._prop("populate", data, null, false)){
		var pop = this._prop("populate", data, null, false);
		
		//Get data
		pop.rows = pop.rows?pop.rows:this._events.getVar("sg-def-grid-rows");
		pop.cols = pop.cols?pop.cols:this._events.getVar("sg-def-grid-cols");
		pop.type = pop.type?pop.type:this._events.getVar("sg-def-grid-type");
		
		this.populate(pop);
	}
};

/** This creates a new population, erasing any existing ones.
 * @param type The type of component to use, without the "sg-" at the start.
 * @param count The number of elements to create.
 * @param spacing The spacing, in pixels, between them.
 */
sgui.Grid.prototype.populate = function(pop) {
	//Delete all the existing ones
	for(var i = 0; true; i ++){
		for(var j = 0; true; j ++){
			if(!this.deleteComponent(String(i)+","+String(j))){
				break;
			}
		}
		
		if(!this.getComponent((i+1)+",0", false)){
			break;
		}
	}
	
	//Add them
	for(var hy = 0; hy < pop.rows; hy++){
		for(var hx = 0; hx < pop.cols; hx++){
			var com = this.newComponent(hx+","+hy, pop.type);
			com.doStuff(pop, this._thread);
			com.doStuff({"y":(hy*com.getHeight()+hy*this._vspacing), "x":(hx*com.getWidth()+hx*this._vspacing)}, this._thread);
		}
	}
	
	this.rows = pop.rows;
	this.cols = pop.cols;
	
	this.focus("0,0");
};

sgui.Grid.prototype.ajust = function() {
	for(var hy = 0; hy < this.rows; hy++){
		for(var hx = 0; hx < this.cols; hx++){
			var com = this.getComponent(hx+","+hy);
			com.doStuff({"y":(hy*com.getHeight()+hy*this._vspacing), "x":(hx*com.getWidth()+hx*this._hspacing)}, this._thread);
		}
	}
};

/** Manages the flowing left of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the left of the list, so flow out of it).
 */
sgui.Grid.prototype._leftAction = function() {
	var cx = this._getFocusName().split(",")[0];
	var cy = this._getFocusName().split(",")[1];
	if(this.getComponent((cx-1)+","+cy)){
		this.focus((cx-1)+","+cy);
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.Grid.prototype._rightAction = function() {
	var cx = this._getFocusName().split(",")[0];
	var cy = this._getFocusName().split(",")[1];
	if(this.getComponent((Number(cx)+1)+","+cy)){
		this.focus((Number(cx)+1)+","+cy);
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.Grid.prototype._upAction = function() {
	var cx = this._getFocusName().split(",")[0];
	var cy = this._getFocusName().split(",")[1];
	if(this.getComponent(cx+","+(cy-1))){
		this.focus(cx+","+(cy-1));
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.Grid.prototype._downAction = function() {
	var cx = this._getFocusName().split(",")[0];
	var cy = this._getFocusName().split(",")[1];
	if(this.getComponent(cx+","+(Number(cy)+1))){
		this.focus(cx+","+(Number(cy)+1));
		return false;
	}
	
	return true;
};
