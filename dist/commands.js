/* Twitch Filtered Chat Commands */"use strict";/** Chat Commands
 *
 * Adding a chat command:
 * ChatCommands.add(command, function, description, args...)
 *   command      (string) chat command to add, executed via //command
 *   function     a function taking the following arguments
 *     cmd        the command being executed (value of `command` parameter)
 *     tokens     the arguments passed to the command when ran
 *     client     a reference to the TwitchClient object
 *     args...    extra arguments passed to ChatCommands.add, as-is
 *   description  (string) a description of the command to be printed in //help
 *   args         (optional) extra arguments to pass to the function
 *
 * Example:
 * Run the following JavaScript:
 *   ChatCommands.add("mycommand", myFunc, "My new command", 1, 2)
 * Type the following into chat:
 *   "//mycommand value1 value2"
 * This results in the following call:
 *   myFunc("mycommand", ["value1", "value2"], client, 1, 2)
 *//* TODO
 * Retain text after tab completion: "foo @<tab> foo" -> "foo @user foo"
 * Implement ChatCommands.addComplete(command, func)
 * Implement //plugins addremote <class> <url> [<config>]
 */var _slicedToArray=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{!d&&h["return"]&&h["return"]()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),_createClass=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _toConsumableArray(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}return Array.from(a)}function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var ChatCommands=null,ChatCommandManager=function(){function a(){_classCallCheck(this,a),this._command_list=[],this._commands={},this._aliases={},this._completions={},this._help_text=[],this.add("help",this.onCommandHelp.bind(this),"Show help information"),this.addUsage("help",null,"Show help for all commands"),this.addUsage("help","command","Show usage information for <command>"),this.addAlias("?","help")}/* Trim leading "//" or "." */return _createClass(a,[{key:"_trim",value:function b(a){return a.replace(/^\/\//,"").replace(/^\./,"")}/* Add text to be shown in //help */},{key:"addHelpText",value:function g(a){var b=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null,c=b||{},d=a;if(c.indent&&(d="&nbsp;&nbsp;"+d),c.literal&&(d=d.escape()),c.args&&(d=this.formatArgs(d)),c.command){var e=d.substr(0,d.indexOf(":")),f=d.substr(d.indexOf(":")+1);d=this.helpLine(e,f)}this._help_text.push(d)}/* Add a new command */},{key:"add",value:function h(a,b,d){var e={};if(!a.match(/^[a-z0-9_-]+$/))Util.Error("Invalid command \""+a.escape()+"\"");else{"function"!=typeof b&&Util.Warn("Adding command "+a+": \"func\" is not a function"),d||Util.Warn("Adding command "+a+": description is empty"),e.name=a,e.func=b,e.desc=d,e.aliases=[],e.extra_help=[];for(var c=arguments.length,f=Array(3<c?c-3:0),g=3;g<c;g++)f[g-3]=arguments[g];e.dflt_args=0<f.length?f:null,this._command_list.push(a),this._commands[a]=e}}/* Add an alias to an existing command */},{key:"addAlias",value:function c(a,b){this.hasCommand(b,!0)?(this._aliases[a]=b,this._commands[b].aliases.push(a)):Util.Error("Invalid command: "+b)}/* Add a usage line to an existing command */},{key:"addUsage",value:function f(a,b,d){var e=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;if(this.hasCommand(a,!0)){var g=this.getCommand(a);g.usage||(g.usage=[]),g.usage.push({args:b,usage:d,opts:e||{}})}else Util.Error("Invalid command: "+a)}/* Add extra text to be shown in a command's help text */},{key:"addHelp",value:function c(a,b){this.hasCommand(a)?this._commands[a].extra_help.push(b):Util.Error("addHelpText: No such command "+a)}/* Tab completion API {{{0 *//* Gather completions for user names */},{key:"tcGatherUsers",value:function r(a,b){var d=[],e=[b.GetName()],f=!0,g=!1,h=void 0;try{for(var i,j=b.GetJoinedChannels()[Symbol.iterator]();!(f=(i=j.next()).done);f=!0){var k=i.value,c=b.GetChannelInfo(k);c.users&&(e=e.concat(c.users))}}catch(a){g=!0,h=a}finally{try{!f&&j.return&&j.return()}finally{if(g)throw h}}var l=!0,m=!1,n=void 0;try{for(var o,p,q=e[Symbol.iterator]();!(l=(o=q.next()).done);l=!0)p=o.value,(0===a.length||p.startsWith(a))&&d.push(p)}catch(a){m=!0,n=a}finally{try{!l&&q.return&&q.return()}finally{if(m)throw n}}return d}/* Request completion of the given completion object */},{key:"complete",value:function A(a,b){var d=b.oText,e=b.oPos,f=b.index,g=[],h=d.substr(0,e),i=h.search(/\W[\w]*$/),j=h,l=b.oText;/* Text before tab: "test te<tab>" -> "test te" *//* Word being tab-completed: "test te<tab>" -> "te" *//* Text to insert before the match (including any leading symbols) */if(-1<i&&(l=h.substr(0,i),j=h.substr(i).trimStart()),j.startsWith("@"))g=this.tcGatherUsers(j.substr(1),a),l+="@";else if(this.isCommandStr(d)){/* Complete commands */var m=this._trim(d.substr(0,e)),n=!0,o=!1,p=void 0;try{for(var q,r,s=Object.keys(this._commands).sort()[Symbol.iterator]();!(n=(q=s.next()).done);n=!0)r=q.value,(0===m.length||r.startsWith(m))&&g.push(r)}catch(a){o=!0,p=a}finally{try{!n&&s.return&&s.return()}finally{if(o)throw p}}l=m?d.substr(0,d.indexOf(m)):d}else if(j.startsWith("#")){/* Complete channel-specific messages */var t=d.substr(0,e).toLowerCase(),u=!0,v=!1,w=void 0;try{for(var x,y,z=a.GetJoinedChannels()[Symbol.iterator]();!(u=(x=z.next()).done);u=!0)y=x.value,(0===t.length||y.toLowerCase().startsWith(t))&&g.push(y)}catch(a){v=!0,w=a}finally{try{!u&&z.return&&z.return()}finally{if(v)throw w}}}/* If matches were found, return one */return 0<g.length?(f<g.length&&(d=l+g[f],e=d.length,f+=1),f>=g.length&&(f=0)):(d=b.oText,e=b.oPos),{oText:b.oText,oPos:b.oPos,cText:d,cPos:d.length,index:f}}/* End tab completion API 0}}} *//* Return whether or not the message is a command */},{key:"isCommandStr",value:function b(a){return a.match(/^\/\//)||a.match(/^\./)}/* Return whether or not the message invokes a valid command */},{key:"hasCommand",value:function d(a){var b=!!(1<arguments.length&&void 0!==arguments[1])&&arguments[1],c=this._trim(a);return!!this._commands.hasOwnProperty(c)||!b&&this._aliases.hasOwnProperty(c)}/* Execute a command */},{key:"execute",value:function g(a,b){if(this.isCommandStr(a)){var d=this._trim(a.split(" ")[0]),e=a.replace(/[\s]*$/,"").split(" ").slice(1);/* Executing "//" or "." invokes "//help" */if(0===this._trim(a).length&&(d="help",e=[]),this.hasCommand(d))try{var f=this.getCommand(d),c=Object.create(this);c.formatUsage=this.formatUsage.bind(this,f),c.printUsage=this.printUsage.bind(this,f),c.formatHelp=this.formatHelp.bind(this,f),c.printHelp=this.printHelp.bind(this,f),c.command=d,c.cmd_func=f.func,c.cmd_desc=f.desc,c.cmd_extra_help=f.extra_help,c.cmd_dflt_args=f.dflt_args,f.dflt_args?f.func.bind(c).apply(void 0,[d,e,b].concat(_toConsumableArray(f.dflt_args))):f.func.bind(c)(d,e,b)}catch(a){Content.addErrorText(d+": "+a.name+": "+a.message),Util.Error(a)}else Content.addErrorText(d+": unknown command")}else Content.addErrorText(JSON.stringify(a)+": not a command string")}/* Return an array of valid command names */},{key:"getCommands",value:function a(){return Object.keys(this._commands)}/* Return a command object by command name (optionally excluding aliases) */},{key:"getCommand",value:function f(a){var b=!!(1<arguments.length&&void 0!==arguments[1])&&arguments[1],d=this._trim(a),e=this._commands[d];return e||b||!this._commands[this._aliases[d]]||(e=this._commands[this._aliases[d]]),e}/* Formatting API {{{0 *//* Format the help text for the given command object */},{key:"formatHelp",value:function b(a){return this.helpLine("//"+a.name,a.desc,!0)}/* Format the usage text for the given command name */},{key:"formatUsage",value:function q(b){var c=[];if(b.usage){var d=!0,e=!1,f=void 0;try{for(var g,h=b.usage[Symbol.iterator]();!(d=(g=h.next()).done);d=!0){var i=g.value,j=this.formatArgs(i.usage);if(i.args){var r=this.formatArgs(i.args);c.push(this.helpLine("//"+b.name+" "+r,j))}else c.push(this.helpLine("//"+b.name,j))}}catch(a){e=!0,f=a}finally{try{!d&&h.return&&h.return()}finally{if(e)throw f}}}else c.push(this.helpLine("//"+b.name,this.formatArgs(b.desc)));var k=!0,l=!1,m=void 0;try{for(var n,o,p=b.aliases[Symbol.iterator]();!(k=(n=p.next()).done);k=!0)o=n.value,c.push(this.helpLine("//"+o,"Alias for command //"+b.name,!0))}catch(a){l=!0,m=a}finally{try{!k&&p.return&&p.return()}finally{if(l)throw m}}return c}/* Helper: format a string as an argument */},{key:"arg",value:function b(a){return"<span class=\"arg\">"+a.escape()+"</span>"}/* Helper: format a help line key/value pair (optionally escaping HTML) */},{key:"helpLine",value:function f(a,b){var c=!!(2<arguments.length&&void 0!==arguments[2])&&arguments[2],d="<div>"+(c?a.escape():a)+"</div>",e="<div>"+(c?b.escape():b)+"</div>";return"<div class=\"help-line\">"+d+e+"</div>"}/* Helper: format "<arg>" and "*arg*" in the given string */},{key:"formatArgs",value:function n(a){var b=this,c=a,d=[[/<(\w+)>/g,function(a,c){return"&lt;"+b.arg(c)+"&gt;"}],[/\*(\w+)\*/g,function(a,b){return"<span class=\"b\">"+b.escape()+"</span>"}]],e=!0,f=!1,g=void 0;try{for(var h,i=d[Symbol.iterator]();!(e=(h=i.next()).done);e=!0){var j=h.value,k=_slicedToArray(j,2),l=k[0],m=k[1];c=c.replace(l,m)}}catch(a){f=!0,g=a}finally{try{!e&&i.return&&i.return()}finally{if(f)throw g}}return c}/* End formatting API 0}}} *//* Print the usage information for the given command object */},{key:"printUsage",value:function h(a){Content.addHelpText("Usage:");var b=!0,c=!1,d=void 0;try{for(var e,f,g=this.formatUsage(a)[Symbol.iterator]();!(b=(e=g.next()).done);b=!0)f=e.value,Content.addHelp(f)}catch(a){c=!0,d=a}finally{try{!b&&g.return&&g.return()}finally{if(c)throw d}}}/* Print the help information for the given command object */},{key:"printHelp",value:function b(a){Content.addHelp(this.formatHelp(a))}/* Handle builtin //help command */},{key:"onCommandHelp",value:function C(a,b){if(0===b.length){Content.addHelpText("Commands:");var d=!0,e=!1,f=void 0;try{for(var g,h,i=this._command_list[Symbol.iterator]();!(d=(g=i.next()).done);d=!0)h=g.value,this.printHelp(this._commands[h])}catch(a){e=!0,f=a}finally{try{!d&&i.return&&i.return()}finally{if(e)throw f}}Content.addHelp(this.formatArgs("Enter //help <command> for help on <command>"));var j=!0,k=!1,l=void 0;try{for(var m,n,o=this._help_text[Symbol.iterator]();!(j=(m=o.next()).done);j=!0)n=m.value,Content.addHelp(n)}catch(a){k=!0,l=a}finally{try{!j&&o.return&&o.return()}finally{if(k)throw l}}}else if(this.hasCommand(b[0])){Content.addHelpText("Commands:");var p=this.getCommand(b[0]),q=!0,r=!1,s=void 0;try{for(var t,u,v=this.formatUsage(p)[Symbol.iterator]();!(q=(t=v.next()).done);q=!0)u=t.value,Content.addHelp(u)}catch(a){r=!0,s=a}finally{try{!q&&v.return&&v.return()}finally{if(r)throw s}}var w=!0,x=!1,y=void 0;try{for(var z,A,B=p.extra_help[Symbol.iterator]();!(w=(z=B.next()).done);w=!0)A=z.value,Content.addHelp(A)}catch(a){x=!0,y=a}finally{try{!w&&B.return&&B.return()}finally{if(x)throw y}}}else Content.addErrorText("Invalid command "+b[0])}}]),a}();/* exported ChatCommands *//* //log: manage debug-msg-log content */function onCommandLog(a,c,d){/* JSON-encode an object, inserting spaces around items */function e(a){return JSON.stringify(a,null,1).replace(/\[[ \n]*/g,"[").replace(/[\n ]*\]/g,"]").replace(/{[ \n]*/g,"{").replace(/[\n ]*}/g,"}").replace(/[ ]*\n[ ]*/g," ")}/* Format a log message for printing */function f(a){var b=!(1<arguments.length&&void 0!==arguments[1])||arguments[1],c=e(a);if(a&&a._cmd&&a._raw&&a._parsed){/* Smells like a TwitchEvent */var d=["TwitchEvent",a._cmd,e(a._raw),e(a._parsed)];a._stacktrace&&d.push(e(a._stacktrace)),c=d.join(" ")}return b?c.escape():c}var g=0<c.length?c[0]:"",h=Util.GetWebStorage(LOG_KEY)||[],j=function(a,b){return a+" "+b+(1===a?"":"s")};if(Content.addHelpText("Debug message log length: "+h.length),!(0<c.length))this.printUsage();else if("help"===g)this.printHelp(),this.printUsage();else if("show"===g){var k=!0,m=!1,o=void 0;try{for(var p,q=Object.entries(h)[Symbol.iterator]();!(k=(p=q.next()).done);k=!0){var r=p.value,s=_slicedToArray(r,2),t=s[0],i=s[1];Content.addHelp(t+": "+f(i))}}catch(a){m=!0,o=a}finally{try{!k&&q.return&&q.return()}finally{if(m)throw o}}}else if("export"===g)Util.Open(AssetPaths.LOG_EXPORT_WINDOW,"_blank",{});else if("summary"===g){var l=[],u=[],v=!0,w=!1,x=void 0;try{for(var y,z,A=Object.values(h)[Symbol.iterator]();!(v=(y=A.next()).done);v=!0)z=y.value,u.push(z._cmd||e(z).substr(0,10)),10<=u.length&&(l.push(u),u=[])}catch(a){w=!0,x=a}finally{try{!v&&A.return&&A.return()}finally{if(w)throw x}}0<u.length&&l.push(u);for(var B,C=0,D=0;D<l.length;++D)B=l[D],Content.addHelp(C+"-"+(C+B.length-1)+": "+f(B,!1)),C+=B.length}else if(-1<["search","filter","filter-out"].indexOf(g)){if(1<c.length){var E=c.slice(1).join(" "),F=[],G=[],H=!0,I=!1,J=void 0;try{for(var K,L=Object.entries(h)[Symbol.iterator]();!(H=(K=L.next()).done);H=!0){var M=K.value,N=_slicedToArray(M,2),O=N[0],P=N[1],Q=e(P).includes(E);"filter-out"===g&&(Q=!Q),Q?G.push([O,P]):F.push([O,P])}}catch(a){I=!0,J=a}finally{try{!H&&L.return&&L.return()}finally{if(I)throw J}}var qa=j(G.length,"item");if(Content.addHelpText("Found "+qa+" containing \""+E+"\""),"search"===g){var R=!0,S=!1,T=void 0;try{for(var U,V=G[Symbol.iterator]();!(R=(U=V.next()).done);R=!0){var W=U.value,X=_slicedToArray(W,2),Y=X[0],Z=X[1],_=Z._cmd||e(Z).substr(0,10);Content.addHelpText(Y+": "+_)}}catch(a){S=!0,T=a}finally{try{!R&&V.return&&V.return()}finally{if(S)throw T}}}else Content.addHelpText("Removing "+F.length+"/"+h.length+" items"),Content.addHelpText("New logs length: "+G.length),Util.SetWebStorage(LOG_KEY,G.map(function(a){return a[1]}))}else Content.addHelpText("Usage: //log "+g+" <string>");}else if("remove"===g){var ra=c.slice(1).map(function(a){return Util.ParseNumber(a)}).filter(function(a){var b=Number.isNaN;return!b(a)});if(0<ra.length){Content.addHelpText("Removing "+j(ra.length,"item"));for(var aa=[],ba=0;ba<h.length;++ba)-1===ra.indexOf(ba)&&aa.push(h[ba]);Content.addHelpText("New logs length: "+aa.length),Util.SetWebStorage(LOG_KEY,aa)}else Content.addHelpText("No items to remove")}else if("shift"===g){var n=1;1<c.length&&Util.IsNumber(c[1])&&(n=Util.ParseNumber(c[1]));for(var sa=0;sa<n&&0<h.length;++sa)h.shift();Content.addHelpText("New logs length: "+h.length),Util.SetWebStorage(LOG_KEY,h)}else if("pop"===g){var ta=1;1<c.length&&Util.IsNumber(c[1])&&(ta=Util.ParseNumber(c[1]));for(var ua=0;ua<ta&&0<h.length;++ua)h.pop();Content.addHelpText("New logs length: "+h.length),Util.SetWebStorage(LOG_KEY,h)}else if("size"===g){var va=e(h).length;Content.addHelpText("Logged bytes: "+va+" ("+va/1024+" KB)")}else if("clear"===g)Util.SetWebStorage(LOG_KEY,[]),Content.addHelpText("Log cleared");else if("replay"===g){if(1<c.length){var ca=[],da=Util.ParseNumber(c[1]);if("all"===c[1]){var ea=!0,fa=!1,ga=void 0;try{for(var ha,ia,ja=h[Symbol.iterator]();!(ea=(ha=ja.next()).done);ea=!0)ia=ha.value,ia&&ia._cmd&&ia._raw&&ca.push(ia._raw)}catch(a){fa=!0,ga=a}finally{try{!ea&&ja.return&&ja.return()}finally{if(fa)throw ga}}}else if(0<=da&&da<h.length){var b=h[da];if(b&&b._cmd&&b._raw)ca.push(b._raw);else{Content.addErrorText("Item "+(""+b)+" doesn't seem to be a chat message")}}else Content.addErrorText("Index "+da+" not between 0 and "+h.length);var ka=!0,la=!1,ma=void 0;try{for(var na,oa,pa=ca[Symbol.iterator]();!(ka=(na=pa.next()).done);ka=!0)oa=na.value,Content.addHelpText("Replaying "+oa),d._onWebsocketMessage({data:oa})}catch(a){la=!0,ma=a}finally{try{!ka&&pa.return&&pa.return()}finally{if(la)throw ma}}}else Content.addHelpText("Usage: //log "+g+" <number>");}else if(Util.IsNumber(g)){var wa=Util.ParseNumber(g);Content.addHelp(f(h[wa]))}else Content.addHelpText("Unknown argument "+g)}/* //clear: clear one or all modules */function onCommandClear(a,b){if(0===b.length)$(".content").find(".line-wrapper").remove();else if(b[0].match(/module[\d]+/)){var c=document.getElementById(b[0]);c?$(c).find(".line-wrapper").remove():Content.addHelpText("Unknown module "+b[0])}else this.printUsage()}/* //join: join a channel */function onCommandJoin(a,b,c){if(0<b.length){var d=Twitch.ParseChannel(b[0]),e=c.GetChannelInfo(d.channel),f=null;if(Twitch.IsRoom(d))/* It's a well-formed room specification; join it */f=b[0];else if(!d.room&&!d.roomuid)/* Normal channel; join it */f=b[0];else{/* Join cdef.channel, room named cdef.room */var g=d.channel,h=d.room;if(e.rooms&&e.rooms[h]){var i=e.rooms[h].owner_id,j=e.rooms[h].uid;f=Twitch.FormatRoom(i,j)}else Content.addErrorText("No such room "+g+" "+h),Util.LogOnlyOnce(g,h,d,e)}f.match(/^#/)||(f="#"+f),null!==f&&(c.IsInChannel(f)?Content.addNoticeText("Failed joining "+f+": already in channel"):c.JoinChannel(f))}else this.printUsage()}/* //part: leave a channel */function onCommandPart(a,b,c){if(0<b.length){var d=Twitch.ParseChannel(b[0]),e=c.GetChannelInfo(d.channel),f=null;if(Twitch.IsRoom(d))/* It's a well-formed room specification; part it */f=b[0];else if(!d.room&&!d.roomuid)/* Normal channel; part it */f=b[0];else{/* Leave cdef.channel, room named cdef.room */var g=d.channel,h=d.room;if(e.rooms&&e.rooms[h]){var i=e.rooms[h].owner_id,j=e.rooms[h].uid;f=Twitch.FormatRoom(i,j)}else Content.addErrorText("No such room "+g+" "+h),Util.LogOnlyOnce(g,h,d,e)}f.match(/^#/)||(f="#"+f),null!==f&&(c.IsInChannel(f)?c.LeaveChannel(f):Content.addNoticeText("Failed leaving "+f+": not in channel"))}else this.printUsage()}/* //badges: display known badge images */function onCommandBadges(a,c,d){var e=[],f=!0,g=!1,h=void 0;/* Obtain global badges */try{for(var i,j=Object.entries(d.GetGlobalBadges())[Symbol.iterator]();!(f=(i=j.next()).done);f=!0){var k=i.value,l=_slicedToArray(k,2),m=l[0],n=l[1],o=!0,p=!1,q=void 0;try{for(var r,s=Object.values(n.versions)[Symbol.iterator]();!(o=(r=s.next()).done);o=!0){var t=r.value,u=t.image_url_2x,v=36;-1<c.indexOf("small")?(u=t.image_url_1x,v=18):-1<c.indexOf("large")&&(u=t.image_url_4x,v=72);var V="width=\""+v+"\" height=\""+v+"\" title=\""+m+"\"";e.push("<img src=\""+u+"\" "+V+" alt=\""+m+"\" />")}}catch(a){p=!0,q=a}finally{try{!o&&s.return&&s.return()}finally{if(p)throw q}}}/* Print global badges */}catch(a){g=!0,h=a}finally{try{!f&&j.return&&j.return()}finally{if(g)throw h}}Content.addNotice(e.join(""));/* Obtain channel badges */var w=!0,x=!1,y=void 0;try{for(var z,A,B=d.GetJoinedChannels()[Symbol.iterator]();!(w=(z=B.next()).done);w=!0){A=z.value,e=[];var C=!0,D=!1,E=void 0;try{for(var F,G=Object.entries(d.GetChannelBadges(A))[Symbol.iterator]();!(C=(F=G.next()).done);C=!0){var H=F.value,I=_slicedToArray(H,2),J=I[0],K=I[1],b=!0,L=!1,M=void 0;try{for(var N,O=Object.entries(K)[Symbol.iterator]();!(b=(N=O.next()).done);b=!0){var P=N.value,Q=_slicedToArray(P,2),R=Q[0],S=Q[1],T=S.image_url_4x||S.image_url_2x||S.image_url_1x,U=J+" "+R+" "+S.description+" "+S.title;e.push("<img src=\""+T+"\" "+"width=\"36\" height=\"36\""+" title=\""+U+"\" alt=\""+U+"\" />")}}catch(a){L=!0,M=a}finally{try{!b&&O.return&&O.return()}finally{if(L)throw M}}}/* Print channel badges */}catch(a){D=!0,E=a}finally{try{!C&&G.return&&G.return()}finally{if(D)throw E}}Content.addNotice(Twitch.FormatChannel(A)+": "+e.join(""))}}catch(a){x=!0,y=a}finally{try{!w&&B.return&&B.return()}finally{if(x)throw y}}}/* //cheers: display known cheermotes */function onCommandCheers(a,b,c){var d=c.GetCheers(),e=null,f=null,g=null;b.includes("dark")?e="dark":b.includes("light")&&(e="light"),b.includes("scale1")?f="1":b.includes("scale1.5")?f="1.5":b.includes("scale2")?f="2":b.includes("scale3")?f="3":b.includes("scale4")&&(f="4"),b.includes("static")?g="static":b.includes("animated")&&(g="animated");var h=function(a,b){var c=[],d=e,h=f,i=g;null===e&&(d=b.backgrounds.includes("dark")?"dark":b.backgrounds[0]),null===f&&(h=b.scales.map(function(a){return Util.ParseNumber(a)}).min()),null===g&&($("#cbAnimCheers").is(":checked")?i=b.states.includes("animated")?"animated":b.states[0]:i=b.states.includes("static")?"static":b.states[0]);var j=!0,k=!1,l=void 0;try{for(var m,n=Object.values(b.tiers)[Symbol.iterator]();!(j=(m=n.next()).done);j=!0){var o=m.value,p=o.min_bits,q=o.images[d][i][h],r=(a+" "+b.prefix+" "+p).escape();c.push("<img src=\""+q+"\" alt=\""+r+"\" title=\""+r+"\" />")}}catch(a){k=!0,l=a}finally{try{!j&&n.return&&n.return()}finally{if(k)throw l}}return c.join("")},i={},j=!0,k=!1,l=void 0;try{for(var m,n=Object.entries(d)[Symbol.iterator]();!(j=(m=n.next()).done);j=!0){var o=m.value,p=_slicedToArray(o,2),q=p[0],r=p[1],s=[],t=!0,u=!1,v=void 0;try{for(var w,x=Object.entries(r)[Symbol.iterator]();!(t=(w=x.next()).done);t=!0){var y=w.value,z=_slicedToArray(y,2),A=z[0],B=z[1];i[A]||(s.push(h(q,B)),i[A]=1)}}catch(a){u=!0,v=a}finally{try{!t&&x.return&&x.return()}finally{if(u)throw v}}0<s.length&&("GLOBAL"===q?Content.addInfoText("Global cheermotes:"):Content.addInfoText("Cheermotes for channel "+q+":"),Content.addInfo(s.join("")))}}catch(a){k=!0,l=a}finally{try{!j&&n.return&&n.return()}finally{if(k)throw l}}}/* //emotes: display known emotes */function onCommandEmotes(a,b,c){var d=[],e=function(a,b){var c=a.escape(),d=b.escape();return"<img src=\""+d+"\" alt=\""+c+"\" title=\""+c+"\" />"},f={},g=!0,h=!1,i=void 0;try{for(var j,l=Object.entries(c.GetEmoteSets())[Symbol.iterator]();!(g=(j=l.next()).done);g=!0){var m=j.value,n=_slicedToArray(m,2),o=n[0],p=n[1],q=[],r=!0,s=!1,t=void 0;try{for(var u,w=p[Symbol.iterator]();!(r=(u=w.next()).done);r=!0){var x=u.value,y=c.GetEmoteName(x),z=e(x+" "+y,c.GetEmote(x));-1===q.indexOf(z)&&q.push(z)}}catch(a){s=!0,t=a}finally{try{!r&&w.return&&w.return()}finally{if(s)throw t}}0<q.length&&(f[o]=q)}}catch(a){h=!0,i=a}finally{try{!g&&l.return&&l.return()}finally{if(h)throw i}}if((-1<b.indexOf("global")||-1<b.indexOf("all"))&&d.push("Global: "+f[0].join("")),-1<b.indexOf("channel")||-1<b.indexOf("all")){var A=!0,B=!1,C=void 0;try{for(var D,E=Object.entries(f)[Symbol.iterator]();!(A=(D=E.next()).done);A=!0){var F=D.value,G=_slicedToArray(F,2),H=G[0],q=G[1];"0"!=""+H&&d.push("Set "+H+": "+q.join(""))}}catch(a){B=!0,C=a}finally{try{!A&&E.return&&E.return()}finally{if(B)throw C}}}if(-1<b.indexOf("ffz")||-1<b.indexOf("all"))if(!c.FFZEnabled())Content.addErrorText("FFZ support is disabled");else{var I=!0,J=!1,K=void 0;try{for(var L,M=c.GetJoinedChannels()[Symbol.iterator]();!(I=(L=M.next()).done);I=!0){var N=L.value,O=[],P=c.GetFFZEmotes(N)||{},Q=P.emotes||[],R=!0,S=!1,T=void 0;try{for(var U,V=Object.entries(Q)[Symbol.iterator]();!(R=(U=V.next()).done);R=!0){var W=U.value,X=_slicedToArray(W,2),Y=X[0],k=X[1];if(0<Object.entries(k.urls).length){var Ba=Object.values(k.urls)[0];O.push(e(Y,Ba))}}}catch(a){S=!0,T=a}finally{try{!R&&V.return&&V.return()}finally{if(S)throw T}}0<O.length&&d.push("FFZ: "+N+": "+O.join(""))}}catch(a){J=!0,K=a}finally{try{!I&&M.return&&M.return()}finally{if(J)throw K}}}if(-1<b.indexOf("bttv")||-1<b.indexOf("all"))if(!c.BTTVEnabled())Content.addErrorText("BTTV support is disabled");else{var v=c.GetGlobalBTTVEmotes(),Z=[],_=!0,aa=!1,ba=void 0;try{for(var ca,da=Object.entries(v)[Symbol.iterator]();!(_=(ca=da.next()).done);_=!0){var ea=ca.value,fa=_slicedToArray(ea,2),ga=fa[0],ha=fa[1];Z.push(e(ga,ha.url))}}catch(a){aa=!0,ba=a}finally{try{!_&&da.return&&da.return()}finally{if(aa)throw ba}}0<Z.length&&d.push("BTTV: "+Z.join(""));var ia=!0,ja=!1,ka=void 0;try{for(var la,ma,na=c.GetJoinedChannels()[Symbol.iterator]();!(ia=(la=na.next()).done);ia=!0){ma=la.value,Z=[];var oa=!0,pa=!1,qa=void 0;try{for(var ra,sa=Object.values(c.GetBTTVEmotes(ma))[Symbol.iterator]();!(oa=(ra=sa.next()).done);oa=!0){var ta=ra.value,ua=ta.code+" (#"+ta.channel+")";Z.push(e(ua,ta.url))}}catch(a){pa=!0,qa=a}finally{try{!oa&&sa.return&&sa.return()}finally{if(pa)throw qa}}0<Z.length&&d.push("BTTV: "+ma+": "+Z.join(""))}}catch(a){ja=!0,ka=a}finally{try{!ia&&na.return&&na.return()}finally{if(ja)throw ka}}}if(0===d.length)this.printHelp(),this.printUsage(),Content.addHelpText("There are "+f.length+" available emote sets");else{var va=!0,wa=!1,xa=void 0;try{for(var ya,za,Aa=d[Symbol.iterator]();!(va=(ya=Aa.next()).done);va=!0)za=ya.value,Content.addNotice(za)}catch(a){wa=!0,xa=a}finally{try{!va&&Aa.return&&Aa.return()}finally{if(wa)throw xa}}}}/* //plugins: manage plugins */function onCommandPlugins(a,b,c){var d=0<b.length?b[0]:null;if(!Plugins.plugins)Content.addErrorText("Plugin information unavailable");else if(null===d||"list"===d){var e=!0,f=!1,g=void 0;try{for(var h,i=Object.entries(Plugins.plugins)[Symbol.iterator]();!(e=(h=i.next()).done);e=!0){var j=h.value,k=_slicedToArray(j,2),l=k[0],m=k[1],n=l+": "+m.file+" @ "+m.order;if(m._error){var r=JSON.stringify(m._error_obj);Content.addErrorText(n+": Failed: "+r)}else m._loaded&&(n+=": Loaded",m.commands&&(n=n+": Commands: "+m.commands.join(" ")),Content.addPreText(n))}}catch(a){f=!0,g=a}finally{try{!e&&i.return&&i.return()}finally{if(f)throw g}}}else if("add"!==d&&"load"!==d)"help"===d?(this.printHelp(),this.printUsage()):(Content.addErrorText("Unknown command "+d),this.printHelp());else if(3<=b.length){var o=b[1],p=b[2],q={};if(Plugins.add({ctor:o,file:p}),4<=b.length){var s=b.slice(3).join(" ");try{q=JSON.parse(s)}catch(a){Content.addErrorText("Malformed JSON string \""+s+"\"; ignoring")}}Plugins.load(o,c,{PluginConfig:q}).then(function(){Content.addInfoText("Successfully loaded plugin "+o)}).catch(function(a){Util.Error("Failed to load plugin",o,a),Content.addErrorText("Failed to load plugin "+o+": "+a)}),Content.addInfoText("Added plugin "+o+" from "+p)}else Content.addErrorText("//plugins add: not enough arguments")}/* //client: display client status information */function onCommandClient(a,b,d){var e=d.ConnectionStatus(),f=d.GetJoinedChannels()||[],g=d.SelfUserState()||{};Content.addHelpText("Client information:"),Content.addHelpLine("Socket:",e.open?"Open":"Closed"),Content.addHelpLine("Endpoint:",e.endpoint,!0),Content.addHelpLine("Status:",e.connected?"Connected":"Not connected"),Content.addHelpLine("Identified:",e.identified?"Yes":"No"),Content.addHelpLine("Authenticated:",e.authed?"Yes":"No"),Content.addHelpLine("Name:",d.GetName(),!0),Content.addHelpLine("FFZ:",d.FFZEnabled()?"Enabled":"Disabled"),Content.addHelpLine("BTTV:",d.BTTVEnabled()?"Enabled":"Disabled"),Content.addHelpLine("User ID:",""+g.userid,!0),Content.addHelpText("Channels connected to: "+f.length);var h=!0,i=!1,j=void 0;try{for(var k,l=f[Symbol.iterator]();!(h=(k=l.next()).done);h=!0){var m=k.value,c=g[m]||{},n=d.GetChannelInfo(m)||{},o=Object.keys(n.rooms||{});Content.addHelpText("Channel "+m+":"),Content.addHelpLine("Status:",(n.online?"On":"Off")+"line",!0),Content.addHelpLine("ID:",n.id,!0),Content.addHelpLine("Active users:",n.users?n.users.length:0,!0),Content.addHelpLine("Rooms: "+o.length,o.join(", "),!0),0<Object.entries(c).length&&(Content.addHelpLine("User Color:",c.color||"not set",!0),Content.addHelpLine("User Badges:",JSON.stringify(c.badges),!0),Content.addHelpLine("Display Name:",""+c["display-name"],!0),Content.addHelpText("User Info: "+JSON.stringify(c)))}}catch(a){i=!0,j=a}finally{try{!h&&l.return&&l.return()}finally{if(i)throw j}}}/* //raw: send a message directly to Twitch, without parsing */function onCommandRaw(a,b,c){c.SendRaw(b.join(" "))}/* //channels: display connected channels */function onCommandChannels(a,b,c){Content.addHelpText("Active channels:");var d=!0,e=!1,f=void 0;try{for(var g,h=c.GetJoinedChannels()[Symbol.iterator]();!(d=(g=h.next()).done);d=!0){var i=g.value,j=c.GetChannelInfo(i);if(i.startsWith("#chatrooms:")){var t=Twitch.ParseChannel(i);j=c.GetChannelById(Util.ParseNumber(t.room));var k=!0,l=!1,m=void 0;try{for(var n,o=Object.entries(j.rooms)[Symbol.iterator]();!(k=(n=o.next()).done);k=!0){var p=n.value,q=_slicedToArray(p,2),r=q[0],s=q[1];t.roomuid===s.uid&&Content.addHelpText(j.cname+" "+r+" "+s.uid)}}catch(a){l=!0,m=a}finally{try{!k&&o.return&&o.return()}finally{if(l)throw m}}}else Content.addHelpText(i+" "+j.id)}}catch(a){e=!0,f=a}finally{try{!d&&h.return&&h.return()}finally{if(e)throw f}}}/* //rooms: display available rooms */function onCommandRooms(a,b,c){var d=!0,e=!1,f=void 0;try{for(var g,h=c.GetJoinedChannels()[Symbol.iterator]();!(d=(g=h.next()).done);d=!0){var i=g.value,j=c.GetChannelInfo(i);if(j.rooms){Content.addHelpText("Available rooms for "+i+":");var k=!0,l=!1,m=void 0;try{for(var n,o=Object.entries(j.rooms)[Symbol.iterator]();!(k=(n=o.next()).done);k=!0){var p=n.value,q=_slicedToArray(p,2),r=q[0],s=q[1],t=s.owner_id,u=s.uid,v=Twitch.FormatRoom(t,u),w="$('#txtChat').val('//join "+v.escape()+"')";Content.addHelp(i+" <a onclick=\""+w+"\">"+(r+" "+u)+"</a>")}}catch(a){l=!0,m=a}finally{try{!k&&o.return&&o.return()}finally{if(l)throw m}}}}}catch(a){e=!0,f=a}finally{try{!d&&h.return&&h.return()}finally{if(e)throw f}}}/* //highlight: manage highlight patterns */function onCommandHighlight(a,b,c){var d=c.get("HTMLGen");if(0===b.length||"show"===b[0]){Content.addHelpText("Current highlight patterns:");for(var j,k=0;k<d.highlightMatches.length;++k)j=d.highlightMatches[k],Content.addHelpLine("Index "+(k+1),""+j,!0)}else if("add"===b[0]){var l=b.slice(1).join(" ");if(0<l.length){var m=Util.StringToRegExp(l,"g");d.addHighlightMatch(m),Content.addHelpText("Added pattern "+m)}else Content.addErrorText("\"//highlight add\" requires argument"),this.printUsage()}else if(!("remove"===b[0]))this.printUsage();else if(1<b.length){var e=Util.ParseNumber(b[1]),f=d.highlightMatches,g=d.highlightMatches.length;if(0<e&&e<=g){if(1===e)f.shift();else if(e===f.length)f.pop();else{var h=f.slice(0,e-1),i=f.slice(e);d.highlightMatches=h.concat(i)}Content.addHelpText("Now storing "+d.highlightMatches.length+" patterns")}else Content.addErrorText("Invalid index "+e+"; must be between 1 and "+g)}else Content.addErrorText("\"//highlight remove\" requires argument"),this.printUsage()}/* //auth: authentication help */function onCommandAuth(a,b,c){var d=$("<a href=\"https://twitchapps.com/tmi/\" target=\"_blank\"></a>");d.text(d.attr("href")),$("#txtChat")&&$("#txtChat").attr("placeholder")&&$("#txtChat").attr("placeholder",Strings.ANON_PLACEHOLDER),c.IsAuthed()?Content.addHelpText("You are authenticated as "+c.GetName()):(Content.addHelpText("Click the following link to generate an OAuth token:"),Content.addHelp(d),Content.addHelpText("Then enter your Twitch username and that OAuth token in the settings panel. You can open the settings panel by clicking the gear icon in the upper-right corner of the page."))}function InitChatCommands(){/* exported InitChatCommands *//* Default command definition
   * Structure:
   *  <name>: {
   *    func: <function>,
   *    desc: description of the command (used by //help)
   *    alias: array of command aliases (optional)
   *    usage: array of usage objects:
   *      [0]: string, array, or null: parameter name(s)
   *      [1]: description
   *      [2]: formatting options (optional)
   *    extra: array of extra help text (optional)
   *  }
   */var a={log:{func:onCommandLog,desc:"Display or manipulate logged messages",alias:["logs"],usage:[[null,"Display log command usage"],["<number>","Display the message numbered <number>"],["show","Display all logged messages (can be a lot of text!)"],["summary","Display a summary of the logged messages"],["search <string>","Show logs containing <string>"],["remove <index...>","Remove items with the given indexes"],["filter <string>","Remove items that don't contain <string>"],["filter-out <string>","Remove items containing <string>"],["shift","Remove the first logged message"],["pop","Remove the last logged message"],["export","Open a new window with all the logged items"],["size","Display the number of bytes used by the log"],["clear","Clears the entire log (cannot be undone!)"],["replay <index>","Re-inject logged message <index>"]]},clear:{func:onCommandClear,desc:"Clears all text from either all modules or the specified module",alias:["nuke"],usage:[[null,"Clears all text from all visible modules"],["<module>","Clears all text from <module> (module1, module2)"]]},join:{func:onCommandJoin,desc:"Join a channel",alias:["j"],usage:[["<channel>","Connect to <channel>; leading # is optional"]]},part:{func:onCommandPart,desc:"Leave a channel",alias:["p","leave"],usage:[["<channel>","Disconnect from <channel>; leading # is optional"]]},badges:{func:onCommandBadges,desc:"Display all known badges"},cheers:{func:onCommandCheers,desc:"Display all known cheermotes"},emotes:{func:onCommandEmotes,desc:"Display the requested emotes",usage:[["[<kinds>]","Display emotes; <kinds> can be one or more of: global, channel, ffz, bttv, or all"]],extra:["Emotes are organized by set, one set per channel. Set 0 is for global emotes."]},plugins:{func:onCommandPlugins,desc:"Display plugin information, if plugins are enabled",alias:["plugin"],usage:[[null,"Show loaded plugins and their status"],["help","Show loaded plugins and command help"],["add <class> <file> [<config>]","Add a plugin by class name and filename, optionally with a config object"],["load <class> <file> [<config>]","Alias to `//plugin add`"]/* TODO: //plugins addremote */]},client:{func:onCommandClient,desc:"Display client and connection information"},raw:{func:onCommandRaw,desc:"Send a raw message to Twitch (for advanced users only!)",usage:[["<message>","Send <message> to Twitch servers (for advanced users only!)"]]},channels:{func:onCommandChannels,desc:"List connected channels",alias:["channels","ch","joined"]},rooms:{func:onCommandRooms,desc:"List available rooms",extra:["This command may not work if you're running un-authenticated"]},highlight:{func:onCommandHighlight,desc:"Add, show, or remove highlight patterns",alias:["hl"],usage:[[null,"List highlight patterns"],["show","List highlight patterns"],["add <pattern>","Highlight messages containing <pattern>"],["remove <index>","Remove the pattern numbered <index>"]],extra:["Patterns can be either regexes (such as /foo/) or text (such as \"foo\")","Regexes may contain flag characters: /foo/i will match \"foo\", \"Foo\", \"FOO\", etc.","By default, patterns are case-sensitive; highlighting \"foo\" will not highlight \"Foo\""]},auth:{func:onCommandAuth,desc:"Display help on authenticating with Twitch Filtered Chat"}};ChatCommands=new ChatCommandManager;var b=!0,c=!1,d=void 0;try{for(var e,f=Object.entries(a)[Symbol.iterator]();!(b=(e=f.next()).done);b=!0){var g=e.value,h=_slicedToArray(g,2),i=h[0],j=h[1];if(ChatCommands.add(i,j.func,j.desc),j.usage){var k=!0,l=!1,m=void 0;try{for(var n,o,p=j.usage[Symbol.iterator]();!(k=(n=p.next()).done);k=!0)o=n.value,ChatCommands.addUsage(i,o[0],o[1],o[2])}catch(a){l=!0,m=a}finally{try{!k&&p.return&&p.return()}finally{if(l)throw m}}}if(j.alias){var q=!0,r=!1,s=void 0;try{for(var t,u,v=j.alias[Symbol.iterator]();!(q=(t=v.next()).done);q=!0)u=t.value,ChatCommands.addAlias(u,i)}catch(a){r=!0,s=a}finally{try{!q&&v.return&&v.return()}finally{if(r)throw s}}}if(j.extra){var w=!0,x=!1,y=void 0;try{for(var z,A,B=j.extra[Symbol.iterator]();!(w=(z=B.next()).done);w=!0)A=z.value,ChatCommands.addHelp(i,A)}catch(a){x=!0,y=a}finally{try{!w&&B.return&&B.return()}finally{if(x)throw y}}}}}catch(a){c=!0,d=a}finally{try{!b&&f.return&&f.return()}finally{if(c)throw d}}}/* globals LOG_KEY AssetPaths Strings *//* vim: set ts=2 sts=2 sw=2 et: */