"use strict";function SamplePlugin2(a,b,c){/* exported SamplePlugin2 */this.name="SamplePlugin2",this._debug=c.GetDebug(),ChatCommands.add("hi",function(){Content.addPre("Hello there!")},"From plugin SamplePlugin2: Say hello"),a(this)}SamplePlugin2.prototype.toString=function(){return"[object SamplePlugin2]"};