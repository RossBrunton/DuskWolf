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
sgui.HMenu = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Group.call(this, parent, events, comName);
		
		this._registerStuff(this._hMenuStuff);
		
		if(!this._events.getVar("sg-def-hm-spacing")) this._events.setVar("sg-def-hm-spacing", "10");
		if(!this._events.getVar("sg-def-hm-count")) this._events.setVar("sg-def-hm-count", "5");
		if(!this._events.getVar("sg-def-hm-type")) this._events.setVar("sg-def-hm-type", "NullCom");
		
		this._spacing = this._events.getVar("sg-def-hm-spacing");
	}
};
sgui.HMenu.prototype = new sgui.Group();
sgui.HMenu.constructor = sgui.HMenu;

sgui.HMenu.prototype.className = "HMenu";

sgui.HMenu.prototype._hMenuStuff = function(data) {
	this._spacing = this._prop("spacing", data, this._spacing, true);
	
	if(typeof(this._prop("populate", data, null, false)) != "string" && this._prop("populate", data, null, false)){
		var pop = this._prop("populate", data, null, false);
		
		//Get data
		pop.count = pop.count?pop.count:this._events.getVar("sg-def-hm-count");
		pop.type = pop.type?pop.type:this._events.getVar("sg-def-hm-type");
		
		this.populate(pop);
	}
};

/** This creates a new population, erasing any existing ones.
 * @param type The type of component to use, without the "sg-" at the start.
 * @param count The number of elements to create.
 * @param spacing The spacing, in pixels, between them.
 */
sgui.HMenu.prototype.populate = function(pop) {
	//Delete all the existing ones
	for(var i = 0; true; i ++){
		if(!this.deleteComponent(String(i))){
			break;
		}
	}
	
	//Add them
	for(var n = 0; n < pop.count; n++){
		var com = this.newComponent(String(n), pop.type);
		com.doStuff(pop, this._thread);
		com.doStuff({"x":(n*com.getWidth()+n*this._spacing)}, this._thread);
	}
	
	this.focus("0");
};

/** Manages the flowing left of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the left of the list, so flow out of it).
 */
sgui.HMenu.prototype._leftAction = function() {
	if(this.getComponent(String(Number(this._getFocusName())-1), false)){
		this.focus(String(Number(this._getFocusName())-1));
		return false;
	}
	
	return true;
};

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.HMenu.prototype._rightAction = function() {
	if(this.getComponent(String(Number(this._getFocusName())+1), false)){
		this.focus(String(Number(this._getFocusName())+1));
		return false;
	}
	
	return true;
};


////----


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
sgui.VMenu = function (parent, events, comName) {
	if(parent !== undefined){
		sgui.Group.call(this, parent, events, comName);
		
		this._registerStuff(this._vMenuStuff);
		
		if(!this._events.getVar("sg-def-vm-spacing")) this._events.setVar("sg-def-vm-spacing", "2");
		if(!this._events.getVar("sg-def-vm-count")) this._events.setVar("sg-def-vm-count", "5");
		if(!this._events.getVar("sg-def-vm-type")) this._events.setVar("sg-def-vm-type", "NullCom");
		
		this._spacing = this._events.getVar("sg-def-vm-spacing");
	}
};
sgui.VMenu.prototype = new sgui.Group();
sgui.VMenu.constructor = sgui.HMenu;

sgui.VMenu.prototype.className = "VMenu";

sgui.VMenu.prototype._vMenuStuff = function(data) {
	this._spacing = this._prop("spacing", data, this._spacing, true);
	
	if(typeof(this._prop("populate", data, null, false)) != "string" && this._prop("populate", data, null, false)){
		var pop = this._prop("populate", data, null, false);
		
		//Get data
		pop.count = pop.count?pop.count:this._events.getVar("sg-def-vm-count");
		pop.type = pop.type?pop.type:this._events.getVar("sg-def-vm-type");
		
		this.populate(pop);
	}
};

/** This creates a new population, erasing any existing ones.
 * @param type The type of component to use, without the "sg-" at the start.
 * @param count The number of elements to create.
 * @param spacing The spacing, in pixels, between them.
 */
sgui.VMenu.prototype.populate = function(pop) {
	//Delete all the existing ones
	for(var i = 0; true; i ++){
		if(!this.deleteComponent(String(i))){
			break;
		}
	}
	
	//Add them
	for(var n = 0; n < pop.count; n++){
		var com = this.newComponent(String(n), pop.type);
		com.doStuff(pop, this._thread);
		com.doStuff({"y":(n*com.getHeight()+n*this._spacing)}, this._thread);
	}
	
	this.focus("0");
};

/** Manages the flowing left of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the left of the list, so flow out of it).
 */
sgui.VMenu.prototype._upAction = sgui.HMenu.prototype._leftAction;

/** Manages the flowing right of the children. 
 * @return <code>false</code> if the flow was successful, <code>true</code> if unsuccessful (Most likely we are at the right of the list, so flow out of it).
 */
sgui.VMenu.prototype._downAction = sgui.HMenu.prototype._rightAction;
