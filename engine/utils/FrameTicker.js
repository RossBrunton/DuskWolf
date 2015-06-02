//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.utils.frameTicker", (function() {
    var dusk = load.require("dusk");
    var EventDispatcher = load.require("dusk.utils.EventDispatcher");
    var sgui = load.suggest("dusk.sgui", function(p) {sgui = p});
    
    /** @namespace dusk.utils.frameTicker
     * @name dusk.utils.frameTicker
     * 
     * @description This module contains things that allow code to be run at a specified frame rate.
     * 
     * @since 0.0.14-alpha
     */
    var frameTicker = {};
    
    /** An event dispatcher which fires once every frame.
     * 
     * This system attempts to fire 60 frames in a second, although it may be less due to the system's performance or
     * more due to wierd refresh rates.
     * 
     * The events fired have no properties.
     * 
     * @type dusk.utils.EventDispatcher
     */
    frameTicker.onFrame = new EventDispatcher("dusk.utils.frameTicker.onFrame");
    
    var _do = function() {
        requestAnimationFrame(_do);
        
        if(sgui && sgui.highRate && sgui.framesTotal % 2 == 0) return;
        
        frameTicker.onFrame.fire();
    };
    requestAnimationFrame(_do);
    
    return frameTicker;
})());
