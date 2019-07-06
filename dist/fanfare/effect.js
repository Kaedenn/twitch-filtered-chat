/* Twitch Filtered Chat Fanfare: Effects */"use strict";var _createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _possibleConstructorReturn(a,b){if(!a)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return b&&("object"==typeof b||"function"==typeof b)?b:a}function _inherits(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}/* 0}}} *//* exported FanfareEffect FanfareCheerEffect FanfareSubEffect *//* globals FanfareParticle *//* vim: set ts=2 sts=2 sw=2 et: */var FanfareEffect=function(){var b=Number.NaN;/* {{{0 */function a(b,c){_classCallCheck(this,a),this._host=b,this._config=c||{},this._particles=[],this._cb={}}/* Configuration getter */return _createClass(a,[{key:"config",value:function b(a){return this._config[a]}/* Total particle count */},{key:"_loadImage",/* Load the image data as either an <img> or an array of <img>s */value:function a(){return new Promise(function(a,b){var c="";if(this.emote)c=this._host._client.GetEmote(this.emote);else if(this.imageUrl)c=this.imageUrl;else return void b(new Error("No image configured for effect "+this.name));if(this.animated)Util.SplitGIF(c).then(function(c){var d=c.map(function(a){return Util.ImageFromPNGData(a)});if(0<c.length){var e=d[0];e.onload=function(){a(d)},e.onerror=function(a){b(a)}}else a(d)}).catch(function(a){return b(a)});else{var d=this._host.image(c);d.onload=function(){a(d)},d.onerror=function(a){b(a)}}}.bind(this))}/* Load the effect */},{key:"_load",value:function d(a,b){var c=this;this._loadImage().then(function(b){c._image=b,c.initialize(),a(c)}).catch(function(a){return b(a)})}/* Load the effect; returns a promise */},{key:"load",value:function a(){return new Promise(this._load.bind(this))}/* Handle particle movement */},{key:"tick",value:function h(){var a=0,b=!0,c=!1,d=void 0;try{for(var e,f,g=this._particles[Symbol.iterator]();!(b=(e=g.next()).done);b=!0)f=e.value,f.tick(),f.alive&&(a+=1)}catch(a){c=!0,d=a}finally{try{!b&&g.return&&g.return()}finally{if(c)throw d}}return 0<a}/* Draw the particles to the given context */},{key:"draw",value:function h(a){var b=!0,c=!1,d=void 0;try{for(var e,f,g=this._particles[Symbol.iterator]();!(b=(e=g.next()).done);b=!0)f=e.value,f.draw(a)}catch(a){c=!0,d=a}finally{try{!b&&g.return&&g.return()}finally{if(c)throw d}}}},{key:"count",get:function a(){return this._particles.length}/* Total number of alive particles */},{key:"alive",get:function a(){return this._particles.filter(function(a){return a.alive}).length}/* Fanfare name */},{key:"name",get:function a(){throw new Error("Abstract function call")}/* Default emote */},{key:"emote",get:function a(){return null}/* Default image URL */},{key:"imageUrl",get:function a(){return null}/* Default to static images over animated images */},{key:"animated",get:function a(){return!1}/* Width of a particle (used by num) */},{key:"imageWidth",get:function a(){if(this._image)if(Util.IsArray(this._image)&&0<this._image.length){if(this._image[0].width)return this._image[0].width;}else if(this._image.width)return this._image.width;return b}/* Height of a particle */},{key:"imageHeight",get:function a(){if(this._image)if(Util.IsArray(this._image)&&0<this._image.length){if(this._image[0].height)return this._image[0].height;}else if(this._image.height)return this._image.height;return b}/* Number of particles to render */},{key:"num",get:function b(){var a=Math.floor;return this.config("numparticles")?this.config("numparticles"):this.imageWidth?a(this._host.width/this.imageWidth):10}}]),a}(),FanfareCheerEffect=function(a){/* {{{0 */function b(a,c,d){_classCallCheck(this,b);var e=_possibleConstructorReturn(this,(b.__proto__||Object.getPrototypeOf(b)).call(this,a,c));return e._event=d,e._bits=d.bits||1,e}/* Fanfare name */return _inherits(b,a),_createClass(b,[{key:"cheerToURL",/* Get the URL for the given cheermote */value:function o(a,c){var d=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,e=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null,f=d||b.background,g=e||b.scale;a.backgrounds.includes(f)||(Util.DebugOnly("Background "+f+" not in "+JSON.stringify(a.backgrounds)),f=a.backgrounds[0]),a.scales.map(function(a){return""+a}).includes(g)||(Util.DebugOnly("Scale "+g+" not in "+JSON.stringify(a.scales)),g=a.scales[0]);/* Figure out the tier we're using */var h=a.tiers[0],i=!0,j=!1,k=void 0;try{for(var l,m,n=Object.values(a.tiers)[Symbol.iterator]();!(i=(l=n.next()).done);i=!0)m=l.value,0<m.min_bits&&c>=m.min_bits&&(h=m);/* Return the derived URL */}catch(a){j=!0,k=a}finally{try{!i&&n.return&&n.return()}finally{if(j)throw k}}try{return this.animated?h.images[f].animated[g]:h.images[f].static[g]}catch(a){return Util.ErrorOnly(a),Util.ErrorOnly(h,f,g),""}}/* Determine the image URL to use */},{key:"initialize",/* Called by base class */value:function d(){for(var a=this.imageWidth||30,b=this.imageHeight||30,c=0;c<this.num;++c)this._particles.push(new FanfareParticle({xmin:0,xmax:this._host.width-a,ymin:this._host.height-b-60,ymax:this._host.height-b,dxrange:[0,1],dyrange:[0,1],xforcerange:[-.1,.1],yforcerange:[-.5,0],image:this._image,canvasWidth:this._host.width,canvasHeight:this._host.height,borderAction:"bounce"}))}},{key:"name",get:function a(){return"FanfareCheerEffect"}/* If configured, use animated GIFs */},{key:"animated",get:function a(){return!this.config("static")}/* Default background */},{key:"imageUrl",get:function d(){if(this.config("cheerurl"))return this.config("cheerurl");if(this.config("imageurl"))return this.config("imageurl");if(!this._host._client.cheersLoaded)Util.Warn("Cheers are not yet loaded");else{var a="Cheer",b=null,c=null;this.config("cheermote")&&(a=this.config("cheermote")),this.config("cheerbg")&&(b=this.config("cheerbg")),this.config("cheerscale")&&(c=this.config("cheerscale"));var e=this._host._client.GetGlobalCheer(a);return this.cheerToURL(e,this._bits,b,c)}return""}}],[{key:"background",get:function a(){return $("body").hasClass("light")?"light":"dark"}/* Default scale */},{key:"scale",get:function a(){return"2"}}]),b}(FanfareEffect),FanfareSubEffect=function(a){/* {{{0 */function b(a,c,d){_classCallCheck(this,b);var e=_possibleConstructorReturn(this,(b.__proto__||Object.getPrototypeOf(b)).call(this,a,c));return e._event=d,e._kind=d.kind||TwitchSubEvent.KIND_SUB,e._tier=d.plan||TwitchSubEvent.PLAN_TIER1,e}/* Fanfare name */return _inherits(b,a),_createClass(b,[{key:"initialize",/* Called by base class */value:function d(){for(var a=this.imageWidth||30,b=this.imageHeight||30,c=0;c<this.num;++c)this._particles.push(new FanfareParticle({xmin:0,xmax:this._host.width-a,ymin:this._host.height-b-60,ymax:this._host.height-b,dxrange:[-5,5],dyrange:[-4,1],xforcerange:[-.1,.1],yforcerange:[-.5,0],image:this._image,canvasWidth:this._host.width,canvasHeight:this._host.height,borderAction:"bounce"}))}},{key:"name",get:function a(){return"FanfareSubEffect"}/* Determine the image URL to use */},{key:"imageUrl",get:function c(){if(this.config("suburl"))return this.config("suburl");if(this.config("imageurl"))return this.config("imageurl");var a="HolidayPresent",b="1.0";return this.config("subemote")?a=this.config("subemote"):this._kind===TwitchSubEvent.KIND_SUB?a="MrDestructoid":this._kind===TwitchSubEvent.KIND_RESUB?a="PraiseIt":this._kind===TwitchSubEvent.KIND_GIFTSUB?a="HolidayPresent":this._kind===TwitchSubEvent.KIND_ANONGIFTSUB?a="HolidayPresent":this.config("emote")&&(a=this.config("emote")),this._tier===TwitchSubEvent.PLAN_TIER2?b="2.0":this._tier===TwitchSubEvent.PLAN_TIER3&&(b="3.0"),this._host._client.GetEmote(a,b)}}]),b}(FanfareEffect);/* 0}}} *//* 0}}} */