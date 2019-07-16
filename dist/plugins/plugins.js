/* Twitch Filtered Chat: Plugin support */"use strict";/* TODO:
 * Make a README
 * Require an async load() function from plugins
 *//* Plugin configuration
 *
 * To configure plugins, pass a plugincfg= value in the query string. Value
 * must be a URI-encoded object of the following form:
 *   {
 *     <plugin tag>: {
 *       <config key>: <config value>,
 *       ...
 *     }
 *   }
 *
 * Plugins may or may not use this configuration. See each plugin's
 * documentation for their expected tag and configuration keys.
 *//* Plugin registration and usage
 *
 * To add your own plugins, place them in this directory and call
 * Plugins.add with the plugin's definition object:
 *   ctor: function that, when called, constructs the plugin
 *   file: the path to the plugin relative to this directory
 *   args: passed as a 4th argument to the plugin constructor
 *   order: the order in which the plugins are constructed
 *   silent: if present and non-falsy, silence loading errors
 *   remote: if present and non-falsy, treat file as an absolute path
 *
 * All registered plugins are loaded once the page loads. To load a
 * plugin after that, add it with Plugins.add and call Plugins.load.
 *
 * Plugins with lower order are constructed before plugins with higher
 * order. Default order is 1000.
 *//* Expected plugin API
 *
 * constructor(resolve, reject[, client [, args[, config]]])
 *   resolve: call with `this` when the plugin has finished constructing
 *   reject:  call with an Error() if loading the plugin fails
 *   client:  reference to the TwitchClient object
 *   args:    value of the plugin definition "args" key
 *   config:  configuration object, excluding sensitive items
 * name       plugin's name, as a string or getter attribute
 *
 * shouldFilter(module, event)
 *   Return true to filter out the event, false to show it, or null to continue
 *   the filtering logic.
 *   module:  a HTML DOM element referring to one of the modules
 *   event:   a TwitchEvent (or TwitchChatEvent, or TwitchSubEvent)
 */var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var PluginStorageClass=function(){function a(){if(_classCallCheck(this,a),a.disabled)throw new Error("Disabled");this._plugins={};for(var b=arguments.length,c=Array(b),d=0;d<b;d++)c[d]=arguments[d];var e=!0,f=!1,g=void 0;try{for(var h,i,j=c[Symbol.iterator]();!(e=(h=j.next()).done);e=!0)i=h.value,this.add(i)}catch(a){f=!0,g=a}finally{try{!e&&j.return&&j.return()}finally{if(f)throw g}}}/* Return the plugin objects */return _createClass(a,[{key:"_getPath",/* Determine the path to the plugin */value:function c(a){if(a.remote)return a.file;var b=window.location.pathname;return b.endsWith("/index.html")&&(b=b.substr(0,b.lastIndexOf("/"))),b+"/plugins/"+a.file}/* Load the given plugin object with the TwitchClient instance given */},{key:"_load",value:function h(b,c,d){var f=this;if(!(this.disabled||a.disabled)){Util.LogOnly("Loading plugin "+JSON.stringify(b));var g=b.ctor;return new Promise(function(a,h){var i=document.createElement("script");i.src=f._getPath(b),i.onload=function(){Util.Defined(g)||h(new Error("Constructor \""+g+"\" not found"));try{/* Last level of security against ACE: sanitize plugin names */var e=g.replace(/[^A-Za-z0-9_]/g,""),i=new Function("return "+e)(),j=Util.JSONClone(d)||{};/* Obtain plugin name and construct it *//* Ensure the configuration object is present */j.PluginConfig||(j.PluginConfig={});/* Construct the plugin */var k=new i(a,h,c,b.args,j);/* Ensure plugin defines a name attribute */"string"!=typeof k.name&&(k.name=g),k._plugin_name=g,f._plugins[g]._loaded=!0,f._plugins[g].obj=k,Util.DebugOnly("Plugin",f._plugins[g],"loaded")}catch(b){f._plugins[g].silent?(Util.LogOnly(b),a(null)):(f._plugins[g]._error=!0,f._plugins[g]._error_obj=b,h(b))}},i.onerror=function(b){/* Silent plugins fail silently */if(f._plugins[g].silent)a(null);else{var c=new Error("Loading "+g+" failed: "+JSON.stringify(b));f._plugins[g]._error=!0,f._plugins[g]._error_obj=c,Util.ErrorOnly(c),h(c)}},document.head.appendChild(i)})}}/* Add a plugin object */},{key:"add",value:function c(b){if(!(this.disabled||a.disabled)){/* Validate plugin before adding */if(!b.ctor.match(/^[A-Za-z0-9_]+$/))throw new Error("Invalid plugin name: "+b.ctor);Util.IsArray(b.args)||(b.args=[]),"number"!=typeof b.order&&(b.order=1e3),this._plugins[b.ctor]=b,b._loaded=!1}}/* Load all added plugin objects */},{key:"loadAll",value:function f(b,c){var d=this;if(!(this.disabled||a.disabled)){var e=Object.values(this._plugins);return Promise.all(e.map(function(a){return d._load(a,b,c)}))}}/* Load a plugin by name */},{key:"load",value:function e(b,c,d){this.disabled||a.disabled||this._load(this._plugins[b],c,d).catch(function(a){throw Util.Error("Failed loading plugin",b,a),Content.addError(a),a})}/* Call a plugin function and return an array of results */},{key:"invoke",value:function l(a){for(var b=[],c=arguments.length,d=Array(1<c?c-1:0),e=1;e<c;e++)d[e-1]=arguments[e];var f=!0,g=!1,h=void 0;try{for(var i,j,k=Object.values(this._plugins)[Symbol.iterator]();!(f=(i=k.next()).done);f=!0)j=i.value,"function"==typeof j[a]&&b.push(j[a].apply(j,d))}catch(a){g=!0,h=a}finally{try{!f&&k.return&&k.return()}finally{if(g)throw h}}return b}/* Disable plugin support entirely */},{key:"disable",value:function b(){Util.Log("Disabling plugin support"),a.disabled=!0,this.disabled=!0,window.Plugins&&(window.Plugins=null),window.PluginStorageClass&&(window.PluginStorageClass=null),window.PluginsAreDisabled=!0}},{key:"plugins",get:function b(){return this.disabled||a.disabled?null:this._plugins}}]),a}(),Plugins=new PluginStorageClass({ctor:"SamplePlugin",args:["Example","arguments"],file:"plugin-sample.js"},{ctor:"SamplePlugin2",file:"plugin-sample-2.js"});/* Two example plugins; see plugins/<file> for their contents *//* The following plugin is custom and not distributed */"file:"===window.location.protocol&&Plugins.add({ctor:"DwangoACPlugin",silent:!0,file:"dwangoAC.js",order:999});