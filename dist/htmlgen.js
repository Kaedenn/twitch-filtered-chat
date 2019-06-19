/* HTML Generator for the Twitch Filtered Chat */"use strict";/* TODO:
 * Add more badge information on hover
 * Add emote information on hover
 * Format clip information
 * USERNOTICEs:
 *   rewardgift
 *   submysterygift
 *   primepaidupgrade
 *   giftpaidupgrade
 *     msg-param-promo-gift-total
 *     msg-param-promo-name
 *   anongiftpaidupgrade
 *     msg-param-promo-gift-total
 *     msg-param-promo-name
 *   unraid
 *   bitsbadgetier
 * Implement "light" and "dark" colorschemes
 *//* exported HTMLGenerator */var _slicedToArray=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{!d&&h["return"]&&h["return"]()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},_createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var HTMLGenerator=function(){function a(b){var c=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null;_classCallCheck(this,a),this._client=b,this._config=c||{},this._default_colors=["lightseagreen","forestgreen","goldenrod","dodgerblue","darkorchid","crimson"],this._user_colors={},this._bg_colors=["#1d1d1d","#0a0a0a","#d1d1d1"],this._config.Layout||(this._config.Layout={}),this._config.ShowClips||(this._config.ShowClips=!1)}return _createClass(a,[{key:"setValue",value:function c(a,b){this._config[a]=b}},{key:"getValue",value:function b(a){return this._config[a]}},{key:"getColorFor",value:function e(a){var b=""+a;if("string"!=typeof a){var f=("undefined"==typeof a?"undefined":_typeof(a))+", "+JSON.stringify(a);Util.Error("Expected string, got "+f)}if(!this._user_colors.hasOwnProperty(b)){for(var c=0,d=0;d<b.length;++d)c=(c<<5)-c+b.charCodeAt(d);/* Taken from Twitch vendor javascript */c%=this._default_colors.length,0>c&&(c+=this._default_colors.length),this._user_colors[b]=this._default_colors[c]}return this._user_colors[b]}/* Returns array of [css attr, css value] */},{key:"genBorderCSS",value:function c(a){var b=Util.GetMaxContrast(a,this._bg_colors);return["text-shadow","-0.8px -0.8px 0 "+b+", 0.8px -0.8px 0 "+b+",\n       -0.8px  0.8px 0 "+b+", 0.8px  0.8px 0 "+b]}/* Returns jquery node */},{key:"genName",value:function h(a,b){var c=$("<span class=\"username\"></span>");c.css("color",b||this.getColorFor(a)||"#ffffff");/* Determine the best border color to use */var d=this.genBorderCSS(c.css("color")),e=_slicedToArray(d,2),f=e[0],g=e[1];return c.css(f,g),c.attr("data-username","1"),c.text(a),c}/* Returns string */},{key:"twitchEmote",value:function b(a){return this._emote("twitch",this._client.GetEmote(a),{id:a})}},{key:"_checkUndefined",value:function c(a,b){-1<b[0].outerHTML.indexOf("undefined")&&(Util.Error("msg contains undefined"),Util.ErrorOnly(a,b,b[0].outerHTML))}/* Returns string */},{key:"_emote",value:function g(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,d=a.replace(/[^a-z0-9_]/g,"")+"-emote",e=$("<span class=\"emote-wrapper "+d+"\"></span>"),f=$("<img class=\"emote "+d+"\" />");return f.attr("src",b),f.attr("data-emote-src",a),c&&(c.id&&(f.attr("data-emote-id",c.id),f.attr("alt",c.name),f.attr("title",c.name),e.attr("data-emote-name",c.id)),c.name&&(f.attr("data-emote-name",c.name),f.attr("alt",c.name),f.attr("title",c.name),e.attr("data-emote-name",c.name)),(c.w||c.width)&&f.attr("width",c.w||c.width),(c.h||c.height)&&f.attr("height",c.h||c.height),c.def&&f.attr("data-emote-def",JSON.stringify(c.def))),e.append(f),e[0].outerHTML}/* Returns string */},{key:"_genCheer",value:function h(a,b){/* Use the highest tier image that doesn't exceed the cheered bits */var c=a.tiers.filter(function(a){return b>=a.min_bits}),d=c.max(function(a){return a.min_bits}),e=d.images.dark.animated[a.scales.min(function(a){return+a})],f=$("<img class=\"cheer-image\" />"),g=$("<span class=\"cheer cheermote\"></span>");/* Use the smallest scale available */return f.attr("alt",a.prefix).attr("title",a.prefix),f.attr("src",e),g.css("color",d.color),g.append(f),g.append(b),g[0].outerHTML}/* Returns jquery node */},{key:"_wrapBadge",value:function n(a){var b=$("<span class=\"badge\"></span>"),c=!0,d=!1,e=void 0;/* Copy all data attributes from elem to $s */try{for(var f,g,h=a.get()[0].getAttributeNames()[Symbol.iterator]();!(c=(f=h.next()).done);c=!0)g=f.value,g.match(/^data-/)&&b.attr(g,a.attr(g))}catch(a){d=!0,e=a}finally{try{!c&&h.return&&h.return()}finally{if(d)throw e}}var i=function(b){return a.attr("data-"+b)},j=[],k=i("badge");if(0<k.length){var o=JSON.parse(k);o.image_url_4x?b.attr("data-icon-large-src",o.image_url_4x):o.image_url_2x&&b.attr("data-icon-large-src",o.image_url_2x)}var l=""+i("badge-name");i("badge-num")&&(l+=" ("+i("badge-num")+")"),l=l.replace(/^[a-z]/,function(a){return a.toUpperCase()}),j.push(l);var m=i("badge-scope");return"global"===m?j.push("Global"):"channel"===m?(j.push("Channel Badge"),j.push("#"+i("badge-channel"))):"ffz"===m?j.push("FFZ"):"bttv"===m&&j.push("BTTV"),b.attr("data-text",j.map(function(a){return a.replace(/ /g,"\xA0")}).join("\n")),b.append(a)}/* Returns jquery node */},{key:"_genBadges",value:function y(a){function b(a){return $("<img class=\"badge\" width=\"18px\" height=\"18px\" />").addClass(a)}/* Add Twitch-native badges */var c=$("<span class=\"badges\" data-badges=\"1\"></span>"),d=0;if(a.flags.badges&&(d+=18*a.flags.badges.length),a.flags["ffz-badges"]&&(d+=18*a.flags["ffz-badges"].length),a.flags["bttv-badges"]&&(d+=18*a.flags["bttv-badges"].length),c.css("overflow","hidden"),c.css("width",d+"px"),c.css("max-width",d+"px"),a.flags.badges){var e=!0,f=!1,g=void 0;try{for(var h,i=a.flags.badges[Symbol.iterator]();!(e=(h=i.next()).done);e=!0){var j=h.value,k=_slicedToArray(j,2),l=k[0],m=k[1],n=b("twitch-badge");if(n.attr("data-badge-name",l),n.attr("data-badge-num",m),n.attr("data-badge-cause",JSON.stringify([l,m])),n.attr("data-badge","1"),n.attr("title",l+"/"+m),n.attr("alt",l+"/"+m),this._client.IsChannelBadge(a.channel,l,m)){var o=this._client.GetChannelBadge(a.channel,l,m),p=o.image_url_1x,q=a.channel.channel.replace(/^#/,"");n.attr("src",p),n.attr("data-badge",JSON.stringify(o)),n.attr("data-badge-scope","channel"),n.attr("data-badge-channel",q)}else if(this._client.IsGlobalBadge(l,m)){var z=this._client.GetGlobalBadge(l,m);n.attr("src",z.image_url_1x),n.attr("data-badge-scope","global"),n.attr("data-badge",JSON.stringify(z))}else{Util.Warn("Unknown badge",l,m,"for",a);continue}c.append(this._wrapBadge(n))}}catch(a){f=!0,g=a}finally{try{!e&&i.return&&i.return()}finally{if(f)throw g}}}/* Add FFZ badges */if(a.flags["ffz-badges"]){var r=!0,s=!1,t=void 0;try{for(var u,v=Object.values(a.flags["ffz-badges"])[Symbol.iterator]();!(r=(u=v.next()).done);r=!0){var w=u.value,x=b("ffz-badge");x.attr("data-badge","1"),x.attr("data-ffz-badge","1"),x.attr("data-badge-scope","ffz"),x.attr("data-badge-name",w.title),x.attr("src",Util.URL(w.image)),x.attr("alt",w.name),x.attr("title",w.title),c.append(this._wrapBadge(x))}}catch(a){s=!0,t=a}finally{try{!r&&v.return&&v.return()}finally{if(s)throw t}}}/* For if BTTV ever adds badges
    if (event.flags["bttv-badges"]) {
      for (let badge of Object.values(event.flags["bttv-badges"])) {
        let $b = makeBadge("bttv-badge");
        $b.attr("data-badge", "1");
        $b.attr("data-ffz-badge", "1");
        $b.attr("data-badge-scope", "bttv");
        $b.attr("data-badge-name", "Unknown BTTV Badge");
        $b.attr("src", Util.URL(badge.image));
        $b.attr("alt", "Unknown BTTV Badge");
        $b.attr("title", "Unknown BTTV Badge");
        $bc.append(this._wrapBadge($b));
      }
    } */return c}/* Returns jquery node */},{key:"_genName",value:function d(a){/* Display upper-case name, assign color to lower-case name */var b=a.name||a.user,c=a.flags.color||this.getColorFor(a.user);return c||(c="#ffffff"),this.genName(b,c)}},{key:"_remap",value:function h(a,b,c,d){for(var e=a[b],f=a[c],g=b;g<c;++g)/* Set values within the range to the end */a[g]=f+d;/* IDEA BEHIND MAP ADJUSTMENT:
     * 1) Maintain two parallel strings, `msg0` (original) and `msg` (final).
     * 2) Maintain the following invariant:
     *  a) msg0.indexOf("substr") === map[msg.indexOf("substr")]
     *  b) msg0[idx] === msg1[map[idx]]
     * Exceptions:
     *  If msg0[idx] is part of a formatted entity; msg[map[idx]] may not be
     *  the same character.
     * Usage:
     *  The map allows for formatting the final message based on where items
     *  appear in the original message.
     */for(var i=c;i<a.length;++i)/* Adjust values beyond the range by length */a[i]+=d-(f-e)}},{key:"_msgCheersTransform",value:function o(a,b,c,d,e){var f=b;if(a.flags.bits&&0<a.flags.bits){var g=a.flags.bits,h=this._client.FindCheers(a.channel,a.message);/* Sort the cheer matches from right-to-left */for(h.sort(function(c,a){return c.start-a.start});0<h.length;){var i=h.pop(),j=[c[i.start],c[i.end]],k=j[0],l=j[1],m=this._genCheer(i.cheer,i.bits),n=k+m.length;/* Insert the cheer HTML and adjust the map */for(f=f.substr(0,k)+m+f.substr(l),this._remap(c,i.start,i.end,m.length),k=l=n;n<f.length;){var p="";if(f[n].match(/\s/))n+=1;else{l=f.substr(n).search(/\s/),l=-1===l?f.length:n+l,p=f.substring(n,l);var q=GetCheerStyle(p.toLowerCase());if(q&&!q._disabled&&g>=q.cost)e.push(q),g-=q.cost;else{l=n;break}n=l}}k!==l&&(f=f.substr(0,k)+" "+f.substr(l),this._remap(c,k,l,0))}}return f}},{key:"_msgEmotesTransform",value:function j(a,b,c){var d=b;if(a.flags.emotes){var k=a.flags.emotes.map(function(a){return{id:a.id,name:a.name,start:a.start,end:a.end,def:a}});for(k.sort(function(d,a){return c[d.start]-c[a.start]});0<k.length;){var e=k.pop(),f=this._client.GetEmote(e.id),g=d.substr(0,c[e.start]),h=d.substr(c[e.end]+1),i=this._emote("twitch",f,e);d=""+g+i+h,this._remap(c,e.start,e.end,i.length-1)}}return d}},{key:"_msgFFZEmotesTransform",value:function w(a,b,c){var d=b,e=this._client.GetFFZEmotes(a.channel);if(e&&e.emotes){var f=[],g=!0,h=!1,i=void 0;try{for(var j,l=Object.entries(e.emotes)[Symbol.iterator]();!(g=(j=l.next()).done);g=!0){var m=j.value,n=_slicedToArray(m,2),o=n[0],k=n[1];f.push([k,o])}}catch(a){h=!0,i=a}finally{try{!g&&l.return&&l.return()}finally{if(h)throw i}}var x=Twitch.ScanEmotes(a.message,f);for(x.sort(function(c,a){return c.start-a.start});0<x.length;){var p=x.pop(),q=p.id,r=q.urls[Object.keys(q.urls).min()],s={id:q.id,w:q.width,h:q.height,def:q},t=this._emote("ffz",r,s),u=d.substr(0,c[p.start]),v=d.substr(c[p.end+1]);d=""+u+t+v,this._remap(c,p.start,p.end+1,t.length)}}return d}},{key:"_msgBTTVEmotesTransform",value:function N(a,b,c){var d=b,e=this._client.GetGlobalBTTVEmotes(),f=this._client.GetBTTVEmotes(a.channel),g={},h=!0,i=!1,j=void 0;try{for(var l,m=Object.entries(e)[Symbol.iterator]();!(h=(l=m.next()).done);h=!0){var n=l.value,o=_slicedToArray(n,2),p=o[0],k=o[1];g[p]=k}/* Channel emotes override global emotes */}catch(a){i=!0,j=a}finally{try{!h&&m.return&&m.return()}finally{if(i)throw j}}var q=!0,r=!1,s=void 0;try{for(var t,u=Object.entries(f)[Symbol.iterator]();!(q=(t=u.next()).done);q=!0){var v=t.value,w=_slicedToArray(v,2),x=w[0],y=w[1];g[x]=y}}catch(a){r=!0,s=a}finally{try{!q&&u.return&&u.return()}finally{if(r)throw s}}var z=[],A=!0,B=!1,C=void 0;try{for(var D,E,F=Object.keys(g)[Symbol.iterator]();!(A=(D=F.next()).done);A=!0)E=D.value,z.push([E,RegExp.escape(E)])}catch(a){B=!0,C=a}finally{try{!A&&F.return&&F.return()}finally{if(B)throw C}}var G=Twitch.ScanEmotes(a.message,z);for(G.sort(function(c,a){return c.start-a.start});0<G.length;){var H=G.pop(),I=g[H.id],J={id:I.id,name:I.code,def:I},K=this._emote("bttv",I.url,J),L=d.substr(0,c[H.start]),M=d.substr(c[H.end+1]);d=""+L+K+M,this._remap(c,H.start,H.end+1,K.length)}return d}},{key:"_msgAtUserTransform",value:function o(a,b,c){for(var d=b,e=/(?:^|\b\s*)(@\w+)(?:\s*\b|$)/g,f=[],g=null;null!==(g=e.exec(a.message));){var h=g.index+g[0].indexOf(g[1]),i=h+g[1].length;f.push({part:g[1],start:h,end:i})}/* Ensure the locations array is indeed sorted */for(f.sort(function(c,a){return c.start-a.start});0<f.length;){var j=f.pop(),k=$("<em class=\"at-user\"></em>").text(j.part);j.part.substr(1).equalsLowerCase(this._client.GetName())&&k.addClass("at-self");var l=d.substr(0,c[j.start]),m=k[0].outerHTML,n=d.substr(c[j.end]);d=l+m+n,this._remap(c,j.start,j.end,m.length)}return d}},{key:"_msgURLTransform",value:function p(a,b,c,d){for(var e=b,f=[],g=null;null!==(g=Util.URL_REGEX.exec(a.message));){/* arr = [wholeMatch, matchPart] */var h=g.index+g[0].indexOf(g[1]),i=h+g[1].length;f.push({whole:g[0],part:g[1],start:h,end:i})}/* Ensure the locations array is indeed sorted */for(f.sort(function(c,a){return c.start-a.start});0<f.length;){var j=f.pop(),k=null;try{k=new URL(Util.URL(j.part))}catch(a){Util.Error("Invalid URL",j,a);continue}this._config.ShowClips&&"clips.twitch.tv"===k.hostname&&d.attr("data-clip",k.pathname.strip("/"));var l=Util.CreateNode(k),m=e.substr(0,c[j.start]),n=l.outerHTML,o=e.substr(c[j.end]);e=m+n+o,this._remap(c,j.start,j.end,n.length)}return e}/* Returns msginfo object */},{key:"_genMsgInfo",value:function q(a){var b=$("<span class=\"message\" data-message=\"1\"></span>"),c=[],d=Util.EscapeWithMap(a.message),e=_slicedToArray(d,2),f=e[0],g=e[1];/* Escape the message, keeping track of how characters move *//* Prevent off-the-end mistakes *//* Handle early mod-only antics */if(g.push(f.length),this.enableAntics&&a.ismod){var r=a.message.split(" ")[0];if(-1<["force",/* Message is raw HTML */"force-eval",/* Message is a JavaScript expression */"forcejs",/* Message is a JavaScript function */"forcejs-only",/* As above, for the matched tag(s) */"forcebits",/* Prepend "cheer1000" to message */"forcecheer"/* Prepend "cheer1000" to message */].indexOf(r)&&(a.flags.force=!0),"forcebits"===r||"forcecheer"===r){for(/* Message length unchanged; no need to update the map */var h=r.length,i="cheer1000";i.length<r.length;)i+=" ";/* Modify message and event.message, as they're both used below */a.values.message=i+a.message.substr(h),f=i+f.substr(h),a.flags.bits=1e3}}else/* Prevent unauthorized access */a.flags.force=!1;var j=function(){};if(Util.DebugLevel===Util.LEVEL_TRACE){var s=1;j=function(){for(var a,b=arguments.length,c=Array(b),d=0;d<b;d++)c[d]=arguments[d];(a=Util).LogOnly.apply(a,[s++,f].concat(c))}}/* Apply message transformations *//* Handle mod-only antics */if(j(a),f=this._msgEmotesTransform(a,f,g,b,c),j(),f=this._msgCheersTransform(a,f,g,b,c),j(),f=this._msgFFZEmotesTransform(a,f,g,b,c),j(),f=this._msgBTTVEmotesTransform(a,f,g,b,c),j(),f=this._msgURLTransform(a,f,g,b,c),j(),f=this._msgAtUserTransform(a,f,g,b,c),j(),a.ismod&&this.enableAntics&&a.flags.force){/* NOTE: These will run twice for layout=double */var k=a.message,l=k.split(" ")[0],m=k.split(" ").slice(1).join(" ");if("force"===l)f=m;else if("force-eval"===l)f=new Function("return String("+m+")")();else if("forcejs"===l)f="<script>"+m+"</script>";else if("forcejs-only"===l&&0<m.length){/* forcejs-only: forcejs, limited to a ?tag value:
         *  <tag>: execute if ?tag value === <tag>
         *  ?<tag>: execute if ?tag value contains <tag> */var n=m.split(" ")[0],o=this.getValue("tag")||"",p=!1;n===o&&(p=!0),n.startsWith("?")&&-1<o.indexOf(n.substr(1))&&(p=!0),p&&(f="<script>"+m.split(" ").slice(1).join(" ")+"</script>")}}return b.html(f),{e:b,effects:c}}},{key:"_addChatAttrs",value:function c(a,b){a.attr("data-id",b.flags.id),a.attr("data-user",b.user),a.attr("data-user-id",b.flags["user-id"]),a.attr("data-channel",b.channel.channel.replace(/^#/,"")),a.attr("data-channel-id",b.flags["room-id"]),b.channel.room&&a.attr("data-room",b.channel.room),b.channel.roomuid&&a.attr("data-roomuid",b.channel.roomuid),b.issub&&a.attr("data-subscriber","1"),b.ismod&&a.attr("data-mod","1"),b.isvip&&a.attr("data-vip","1"),b.iscaster&&a.attr("data-caster","1"),a.attr("data-sent-ts",b.flags["tmi-sent-ts"]),a.attr("data-recv-ts",Date.now())}/* Returns jquery node */},{key:"_genSubWrapper",value:function c(a){var b=$("<div class=\"chat-line sub notice\"></div>");return this._addChatAttrs(b,a),b.append(this._genBadges(a)),b.append(this._genName(a)),b.html(b.html()+"&nbsp;"),b}/* Returns jquery node */},{key:"gen",value:function t(a){var b=$("<div class=\"chat-line\"></div>"),c=a.flags.color||this.getColorFor(a.user);this._client.IsUIDSelf(a.flags["user-id"])&&b.addClass("self"),this._addChatAttrs(b,a),this._config.Layout.Slim||(a.flags.subscriber&&b.addClass("chat-sub"),a.flags.mod&&b.addClass("chat-mod"),a.flags.vip&&b.addClass("chat-vip"),a.flags.broadcaster&&b.addClass("chat-caster")),b.append(this._genBadges(a)),b.append(this._genName(a));var d=this._genMsgInfo(a);if(!a.flags.action)b.html(b.html()+":");else{var e=this.genBorderCSS(c),f=_slicedToArray(e,2),g=f[0],h=f[1];d.e.css("color",c),d.e.css(g,h)}b.html(b.html()+"&nbsp;");var i=[],j=[];if(0<d.effects.length){var k=!0,l=!1,m=void 0;try{for(var n,o,p=d.effects[Symbol.iterator]();!(k=(n=p.next()).done);k=!0)o=n.value,o.class&&d.e.addClass(o.class),o.style&&d.e.attr("style",o.style),o.wclass&&b.addClass(o.wclass),o.wstyle&&b.attr("style",o.wstyle),o.html_pre&&i.push(o.html_pre),o.html_post&&j.unshift(o.html_post)}catch(a){l=!0,m=a}finally{try{!k&&p.return&&p.return()}finally{if(l)throw m}}}var q=i.join(""),r=d.e[0].outerHTML,s=j.join("");return b.append(q+r+s),b}/* Returns DOM HTMLDivElement */},{key:"sub",value:function e(a){var b=this._genSubWrapper(a),c=$("<span class=\"message sub-message\"></span>"),d=this.twitchEmote("PogChamp");return a.flags["system-msg"]?c.text(a.flags["system-msg"]):c.text(Strings.Sub(TwitchSubEvent.PlanName(""+a.plan_id))),c.addClass("effect-rainbow").addClass("effect-disco"),c.html(c.html()+d+"&nbsp;"),b.append(c),this._checkUndefined(a,b),b[0]}/* Returns jquery node */},{key:"resub",value:function h(a){var b=this._genSubWrapper(a),c=$("<span class=\"message sub-message\"></span>"),d=this.twitchEmote("PogChamp"),e=a.months||a.total_months,f=a.streak_months,g=a.plan||TwitchSubEvent.PlanName(""+a.plan_id);return c.addClass("effect-rainbow").addClass("effect-disco"),a.flags["system-msg"]?c.text(a.flags["system-msg"]):a.share_streak?c.text(Strings.ResubStreak(e,g,f)):c.text(Strings.Resub(e,g)),c.html(c.html()+"&nbsp;"+d),b.append(c),this._checkUndefined(a,b),b}/* Returns jquery node */},{key:"giftsub",value:function h(a){var b=this._genSubWrapper(a),c=$("<span class=\"message sub-message\"></span>"),d=this.twitchEmote("HolidayPresent");if(c.addClass("effect-rainbow").addClass("effect-disco"),a.flags["system-msg"])c.text(a.flags["system-msg"]);else{var e=a.recipient,f=a.user,g=TwitchSubEvent.PlanName(""+a.plan_id);c.text(Strings.GiftSub(f,g,e))}return c.html(c.html()+d+"&nbsp;"),b.append(c),this._checkUndefined(a,b),b}/* Returns jquery node */},{key:"anongiftsub",value:function g(a){var b=this._genSubWrapper(a),c=$("<span class=\"message sub-message\"></span>"),d=this.twitchEmote("HolidayPresent");if(c.addClass("effect-rainbow").addClass("effect-disco"),a.flags["system-msg"])c.text(a.flags["system-msg"]);else{var e=a.recipient_name||a.recipient,f=TwitchSubEvent.PlanName(""+a.plan_id);c.text(Strings.AnonGiftSub(f,e))}return c.html(c.html()+d+"&nbsp;"),b.append(c),this._checkUndefined(a,b),b}/* Returns jquery node */},{key:"raid",value:function g(a){var b=$("<div class=\"chat-line raid\"></div>"),c=$("<span class=\"message raid-message\"></span>"),d=this.twitchEmote("TombRaid");if(c.addClass("effect-rainbow").addClass("effect-disco"),a.flags["system-msg"])c.text(a.flags["system-msg"]);else{/* Unlikely */var e=a.flags["msg-param-displayName"]||a.flags["msg-param-login"],f=a.flags["msg-param-viewerCount"];c.html(Strings.Raid(e,f))}return b.append(c),b.html(d+"&nbsp;"+b.html()),this._checkUndefined(a,b),b}/* Returns jquery node */},{key:"newUser",value:function d(a){var b=$("<div class=\"chat-line new-user notice\"></div>"),c=$("<span class=\"message\" data-message=\"1\"></span>");return this._addChatAttrs(b,a),b.append(this._genBadges(a)),b.append(this._genName(a)),c.text(a.flags["system-msg"]+" Say hello!"),b.html(b.html()+":&nbsp;"),b.append(c),b}/* Returns jquery node */},{key:"rewardGift",value:function c(a){var b=a.command+" TODO";return $("<div class=\"message\">"+b+"</div>")}/* Returns jquery node */},{key:"mysteryGift",value:function c(a){var b=a.command+" TODO";return $("<div class=\"message\">"+b+"</div>")}/* Returns jquery node */},{key:"giftUpgrade",value:function c(a){var b=a.command+" TODO";return $("<div class=\"message\">"+b+"</div>")}/* Returns jquery node */},{key:"genClip",value:function n(a,b,c){Util.Debug("genClip",a,b,c);var d=$("<div class=\"clip-preview\"></div>"),e=b.broadcaster_name,f=c.name,g=b.creator_name,h=b.title,i=b.thumbnail_url,j=$("<img class=\"clip-thumbnail\" height=\"48px\"/>"),k=$("<div class=\"clip-title\"></div>"),l=$("<div class=\"clip-desc\"></div>"),m=$("<div class=\"clip-creator\"></div>");return d.attr("data-slug",a),d.append(j.attr("src",i)),d.append(k.text(h)),d.append(l.text(e+" playing "+f)),d.append(m.text("Clipped by "+g)),d}/* General-use functions below *//* Returns jquery node */},{key:"url",value:function m(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:null,b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null,d=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,e=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null,f=$("<a></a>");if(a?f.attr("href",a):f.attr("href","javascript:void(0)"),b?f.text(b):a?f.text(a):f.val("undefined"),Util.IsArray(d)){var g=!0,h=!1,i=void 0;try{for(var j,k,l=d[Symbol.iterator]();!(g=(j=l.next()).done);g=!0)k=j.value,f.addClass(k)}catch(a){h=!0,i=a}finally{try{!g&&l.return&&l.return()}finally{if(h)throw i}}}else d&&f.addClass(d);return e&&f.attr("id",e),f}/* Returns string */},{key:"checkbox",value:function m(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null,d=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,e=!!(3<arguments.length&&void 0!==arguments[3])&&arguments[3],f=$("<input type=\"checkbox\" />");if(f.attr("value",a),b&&f.attr("id",b),Util.IsArray(d)){var g=!0,h=!1,i=void 0;try{for(var j,k,l=d[Symbol.iterator]();!(g=(j=l.next()).done);g=!0)k=j.value,f.addClass(k)}catch(a){h=!0,i=a}finally{try{!g&&l.return&&l.return()}finally{if(h)throw i}}}else f.addClass(d);return e&&f.check(),f[0].outerHTML}},{key:"enableAntics",get:function a(){return!this.getValue("NoForce")&&!$("#cbForce").is(":checked")},set:function b(a){a?(this.setValue("NoForce",!0),$("#cbForce").check()):(this.setValue("NoForce",!1),$("#cbForce").uncheck())}}]),a}();/* globals Strings GetCheerStyle *//* vim: set ts=2 sts=2 sw=2 et: */