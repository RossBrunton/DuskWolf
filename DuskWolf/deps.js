//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.deps");

/** @namespace dusk.deps
 * 
 * @description This "namespace" is imported by `{@link dusk.load}` when it starts, and contains the dependency information for every importable thing.
 * 
 * It provides no methods or properties.
 */

dusk.load.addDependency(__duskdir__+"/Data.js", ["dusk.data"], ["dusk", "dusk.utils", "dusk.game"]);
dusk.load.addDependency(__duskdir__+"/DuskWolf.js", ["dusk"], ["dusk.EventDispatcher", "dusk.utils"]);
dusk.load.addDependency(__duskdir__+"/Game.js", ["dusk.game"], ["dusk", "dusk.data", "dusk.utils"]);
dusk.load.addDependency(__duskdir__+"/Load.js", ["dusk.load"], ["dusk", "dusk.game"]);
dusk.load.addDependency(__duskdir__+"/Utils.js", ["dusk.utils"], []);
dusk.load.addDependency(__duskdir__+"/EventDispatcher.js", ["dusk.EventDispatcher"], []);

dusk.load.addDependency(__duskdir__+"/mods/Keyboard.js", ["dusk.mods.keyboard"], ["dusk.EventDispatcher"]);
dusk.load.addDependency(__duskdir__+"/mods/FrameTicker.js", ["dusk.mods.frameTicker"], ["dusk.EventDispatcher"]);
dusk.load.addDependency(__duskdir__+"/mods/Performance.js", ["dusk.mods.performance"], ["dusk.mods.frameTicker", "dusk.mods.simpleGui"]);
dusk.load.addDependency(__duskdir__+"/mods/Plat.js", ["dusk.mods.plat"], ["dusk.mods.simpleGui", "dusk.sgui.PlatMain", "dusk.sgui.CentreScroller", "dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/mods/SimpleGui.js", ["dusk.mods.simpleGui"], ["dusk.mods.keyboard", "dusk.mods.frameTicker", "dusk.sgui.Pane"]);

dusk.load.addDependency(__duskdir__+"/sgui/Component.js", ["dusk.sgui.Component", "dusk.sgui.NullCom"], []);
dusk.load.addDependency(__duskdir__+"/sgui/Group.js", ["dusk.sgui.Group"], ["dusk.sgui.IContainer"]);
dusk.load.addDependency(__duskdir__+"/sgui/IContainer.js", ["dusk.sgui.IContainer"], ["dusk.sgui.Component"]);
dusk.load.addDependency(__duskdir__+"/sgui/Pane.js", ["dusk.sgui.Pane"], ["dusk.sgui.Group"]);
dusk.load.addDependency(__duskdir__+"/sgui/CentreScroller.js", ["dusk.sgui.CentreScroller"], ["dusk.sgui.Single"]);
dusk.load.addDependency(__duskdir__+"/sgui/DecimalTile.js", ["dusk.sgui.DecimalTile"], ["dusk.sgui.Component"]);
dusk.load.addDependency(__duskdir__+"/sgui/EditableTileMap.js", ["dusk.sgui.EditableTileMap"], ["dusk.sgui.TileMap"]);
dusk.load.addDependency(__duskdir__+"/sgui/FocusChecker.js", ["dusk.sgui.FocusChecker"], ["dusk.sgui.Image"]);
dusk.load.addDependency(__duskdir__+"/sgui/Grid.js", ["dusk.sgui.Grid"], ["dusk.sgui.Group"]);
dusk.load.addDependency(__duskdir__+"/sgui/Image.js", ["dusk.sgui.Image"], ["dusk.sgui.Component"]);
dusk.load.addDependency(__duskdir__+"/sgui/PlatEntity.js", ["dusk.sgui.PlatEntity"], ["dusk.sgui.Tile"]);
dusk.load.addDependency(__duskdir__+"/sgui/PlatMain.js", ["dusk.sgui.PlatMain"], ["dusk.sgui.Group", "dusk.sgui.PlatEntity", "dusk.sgui.EditableTileMap", "dusk.sgui.EntityGroup"]);
dusk.load.addDependency(__duskdir__+"/sgui/Rect.js", ["dusk.sgui.Rect"], ["dusk.sgui.Component"]);
dusk.load.addDependency(__duskdir__+"/sgui/Saybox.js", ["dusk.sgui.Saybox"], ["dusk.sgui.Grid", "dusk.sgui.Text", "dusk.sgui.Rect"]);
dusk.load.addDependency(__duskdir__+"/sgui/Single.js", ["dusk.sgui.Single"], ["dusk.sgui.IContainer"]);
dusk.load.addDependency(__duskdir__+"/sgui/Text.js", ["dusk.sgui.Label", "dusk.sgui.Text", "dusk.sgui.TextBox"], []);
dusk.load.addDependency(__duskdir__+"/sgui/Tile.js", ["dusk.sgui.Tile"], ["dusk.sgui.Component"]);
dusk.load.addDependency(__duskdir__+"/sgui/TileMap.js", ["dusk.sgui.TileMap"], ["dusk.sgui.Component"]);
dusk.load.addDependency(__duskdir__+"/sgui/EntityGroup.js", ["dusk.sgui.EntityGroup"], ["dusk.sgui.Group"]);

dusk.load.addDependency(__duskdir__+"/platBehaviours/PBehave.js", ["dusk.pbehave.PBehave"], ["dusk.sgui.PlatEntity"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/BackForth.js", ["dusk.pbehave.BackForth"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/Controlled.js", ["dusk.pbehave.Controlled"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/Fall.js", ["dusk.pbehave.Fall"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/Push.js", ["dusk.pbehave.Push"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/MarkTrigger.js", ["dusk.pbehave.MarkTrigger"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/SimpleAni.js", ["dusk.pbehave.SimpleAni"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/Persist.js", ["dusk.pbehave.Persist"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/HitDam.js", ["dusk.pbehave.HitDam"], ["dusk.pbehave.PBehave"]);
dusk.load.addDependency(__duskdir__+"/platBehaviours/Killable.js", ["dusk.pbehave.Killable"], ["dusk.pbehave.PBehave"]);

dusk.load.require("dusk.data");
