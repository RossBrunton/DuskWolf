//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.frameTicker", (function() {
    var dusk = load.require("dusk");
    var EventDispatcher = load.require("dusk.EventDispatcher");
    var sgui = load.suggest("dusk.sgui", function(p) {sgui = p});
    
    /** @namespace dusk.frameTicker
     * @name dusk.frameTicker
     * 
     * @description This module contains things that allow code to be run at a specified frame rate.
     * 
     * @since 0.0.14-alpha
     */
    var frameTicker = {};
    
    /** An event dispatcher which fires once every frame.
     * 
     * There are `{@link dusk.frameRate}` frames in a second, although it may be less due to the system's performance.
     * 
     * The events fired have no properties.
     * 
     * @type dusk.EventDispatcher
     */
    frameTicker.onFrame = new EventDispatcher("dusk.frameTicker.onFrame");
    
    //setInterval(dusk.frameTicker.onFrame.fire.bind(dusk.frameTicker.onFrame), 1000/dusk.frameRate);
    
    var _do = function() {
        requestAnimationFrame(_do);
        
        if(sgui && sgui.highRate && sgui.framesTotal % 2 == 0) return;
        
        frameTicker.onFrame.fire();
    };
    requestAnimationFrame(_do);
    
    Object.seal(frameTicker);
    
    dusk.frameTicker = frameTicker; //Legacy import code
    return frameTicker;
})());
