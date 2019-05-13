/* Twitch Filtered Chat Commands */

class TFCChatCommandStore {
  constructor() {
    this._command_list = [];
    this._commands = {};
    this._aliases = {};
    this._help_text = [];
    this.add("help", this.command_help.bind(this),
             "Obtain help for a specific command or all commands");
    this.addAlias("?", "help");
    this.addAlias("", "help");
    this.addUsage("help", null, "Obtain help for all commands");
    this.addUsage("help", "command", "Obtain the usage information for <command>");
  }

  add(command, func, desc, ...args) {
    if (!command.match(/^[a-z0-9_-]+$/)) {
      Util.Error(`Invalid command "${command.escape()}"`);
    } else {
      let c = {};
      c.name = command;
      c.func = func;
      c.desc = desc;
      c.dflt_args = args.length > 0 ? args : null;
      this._command_list.push(command);
      this._commands[command] = c;
    }
  }

  addAlias(command, referred_command) {
    this._aliases[command] = referred_command;
  }

  addUsage(command, argstr, usagestr, opts=null) {
    if (this.hasCommand(command, true)) {
      let c = this.getCommand(command);
      if (!c.usage) c.usage = [];
      c.usage.push({args: argstr, usage: usagestr, opts: opts || {}});
    } else {
      Util.Error(`Invalid command: ${command}`);
    }
  }

  addHelp(text, opts=null) {
    let o = opts || {};
    let t = text;
    if (!o.literal) t = this.formatArgs(t);
    if (o.indent) t = "&nbsp;&nbsp;" + t;
    if (o.command) {
      let cmd = t.substr(0, t.indexOf(':'));
      let msg = t.substr(t.indexOf(':')+1);
      t = this.helpLine(cmd, msg);
    }
    this._help_text.push(t);
  }

  isCommandStr(msg) {
    return !!msg.match(/^\/\//);
  }

  hasCommand(msg, native_only=false) {
    let cmd = msg.replace(/^\/\//, "");
    if (this._commands.hasOwnProperty(cmd)) {
      return true;
    } else if (!native_only && this._aliases.hasOwnProperty(cmd)) {
      return true;
    }
    return false;
  }

  execute(msg, client) {
    if (this.isCommandStr(msg)) {
      let cmd = msg.split(" ")[0].replace(/^\/\//, "");
      if (this.hasCommand(cmd)) {
        let tokens = msg.replace(/[\s]*$/, "").split(" ").slice(1);
        try {
          let c = this.getCommand(cmd);
          let obj = Object.create(this);
          obj.formatUsage = this.formatUsage.bind(this, c);
          obj.printUsage = this.printUsage.bind(this, c);
          obj.command = cmd;
          obj.cmd_func = c.func;
          obj.cmd_desc = c.desc;
          if (c.dflt_args) {
            c.func.bind(obj)(cmd, tokens, client, ...c.dflt_args);
          } else {
            c.func.bind(obj)(cmd, tokens, client);
          }
        }
        catch (e) {
          Content.addError(`${cmd}: ${e.name}: ${e.message}`);
          Util.Error(e);
        }
      } else {
        Content.addError(`${cmd}: unknown command`);
      }
    } else {
      Content.addError(`${JSON.stringify(msg)}: not a command string`);
    }
  }

  getCommands() {
    return Object.keys(this._commands);
  }

  getCommand(cmd, native_only=false) {
    let cname = cmd.replace(/^\/\//, "");
    let c = this._commands[cname];
    if (!c && !native_only && this._commands[this._aliases[cname]]) {
      c = this._commands[this._aliases[cname]];
    }
    return c;
  }

  formatHelp(cmd) {
    return this.helpLine("//" + cmd.name, cmd.desc, true);
  }

  formatUsage(cmd) {
    let usages = [];
    if (cmd.usage) {
      for (let entry of cmd.usage) {
        let fmtArg = (a) => `&lt;${this.arg(a)}&gt;`;
        if (entry.opts.literal) fmtArg = (a) => a;
        let argstr = "";
        let usagestr = this.formatArgs(entry.usage);
        if (Util.IsArray(entry.args)) {
          argstr = entry.args.map((a) => fmtArg(a)).join(" ");
          usages.push(this.helpLine(`//${cmd.name} ${argstr}`, usagestr));
        } else if (entry.args) {
          argstr = fmtArg(entry.args);
          usages.push(this.helpLine(`//${cmd.name} ${argstr}`, usagestr));
        } else {
          usages.push(this.helpLine(`//${cmd.name}`, usagestr));
        }
      }
    } else {
      usages.push(this.helpLine(`//${cmd.name}`, this.formatArgs(cmd.desc)));
    }
    return usages;
  }

  /* Built-in //help command */
  command_help(cmd, tokens/*, client*/) {
    if (tokens.length == 0) {
      Content.addHelp("Commands:");
      for (let c of Object.values(this._command_list)) {
        Content.addHelp(this.formatHelp(this._commands[c]));
      }
      Content.addHelp(this.formatArgs("Enter //help <command> for help on <command>"));
      for (let line of this._help_text) {
        Content.addHelp(line);
      }
    } else if (this.hasCommand(tokens[0])) {
      Content.addHelp("Commands:");
      let obj = this.getCommand(tokens[0]);
      for (let line of this.formatUsage(obj)) {
        Content.addHelp(line);
      }
    } else {
      Content.addError(`Invalid command ${tokens[0].escape()}`);
    }
  }

  arg(s) {
    return `<span class="arg">${s.escape()}</span>`;
  }

  helpLine(k, v, esc=false) {
    let d1 = `<div>${esc ? k.escape() : k}</div>`;
    let d2 = `<div>${esc ? v.escape() : v}</div>`;
    return `<div class="helpline">${d1}${d2}</div>`;
  }

  formatArgs(s) {
    return s.replace(/<([^>]+)>/g, (m, g) => '&lt;' + this.arg(g) + '&gt;');
  }

  printUsage(cmdobj) {
    Content.addHelp("Usage:");
    for (let line of this.formatUsage(cmdobj)) {
      Content.addHelp(line);
    }
  }
}

function command_log(cmd, tokens/*, client*/) {
  let logs = Util.GetWebStorage("debug-msg-log") || [];
  Content.addHelp(`Debug message log length: ${logs.length}`);
  if (tokens.length > 0) {
    if (tokens[0] == "show") {
      if (tokens.length > 1) {
        let idx = Number.parseInt(tokens[1]);
        Content.addHelp(`${idx}: ${JSON.stringify(logs[idx]).escape()}`);
      } else {
        for (let [i, l] of Object.entries(logs)) {
          Content.addHelp(`${i}: ${JSON.stringify(l).escape()}`);
        }
      }
    } else if (tokens[0] == "export") {
      let w = window.open(
        "assets/log-export.html",
        "TFCLogExportWindow",
        "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes"
      );
      if (w) {
        w.onload = function() {
          this.addEntries(logs);
        }
      }
    } else if (tokens[0] == "summary") {
      let lines = [];
      let line = [];
      for (let l of Object.values(logs)) {
        let desc = '';
        if (l._cmd) {
          desc = l._cmd;
        } else {
          desc = JSON.stringify(l).substr(0, 10);
        }
        line.push(desc);
        if (line.length >= 10) {
          lines.push(line);
          line = [];
        }
      }
      if (line.length > 0) lines.push(line);
      let lidx = 0;
      for (let l of Object.values(lines)) {
        Content.addHelp(`${lidx}-${lidx+l.length}: ${JSON.stringify(l)}`);
        lidx += l.length;
      }
    } else if (tokens[0] == "shift") {
      logs.shift();
      Content.addHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage("debug-msg-log", logs);
    } else if (tokens[0] == "pop") {
      logs.pop();
      Content.addHelp(`New logs length: ${logs.length}`);
      Util.SetWebStorage("debug-msg-log", logs);
    } else if (tokens[0] == "size") {
      let b = JSON.stringify(logs).length;
      Content.addHelp(`Logged bytes: ${b} (${b/1024.0} KB)`);
    } else if (tokens[0].match(/^[1-9][0-9]*$/)) {
      let idx = Number(tokens[0]);
      Content.addHelp(JSON.stringify(logs[idx]).escape());
    } else {
      Content.addHelp(`Unknown argument ${tokens[0]}`);
    }
  } else {
    Content.addHelp(`Use //log summary to view a summary`);
    Content.addHelp(`Use //log show to view them all`);
    Content.addHelp(this.formatArgs(`Use //log show <N> to show item <N>`));
    Content.addHelp(this.formatArgs(`Use //log <N> to show item <N>`));
    Content.addHelp(`Use //log shift to remove one entry from the start`);
    Content.addHelp(`Use //log pop to remove one entry from the end`);
    Content.addHelp(`Use //log export to open a new window with the logged items`);
    Content.addHelp(`Use //log size to display the number of bytes logged`);
  }
}

function command_clear(cmd, tokens/*, client*/) {
  if (tokens.length == 0) {
    $(".content").find(".line-wrapper").remove();
  } else if (tokens[0] == "module1") {
    $("#module1").find(".line-wrapper").remove();
  } else if (tokens[0] == "module2") {
    $("#module2").find(".line-wrapper").remove();
  } else {
    this.printUsage();
  }
}

function command_join(cmd, tokens, client) {
  if (tokens.length > 0) {
    client.JoinChannel(tokens[0]);
  } else {
    this.printUsage();
  }
}

function command_part(cmd, tokens, client) {
  if (tokens.length > 0) {
    client.LeaveChannel(tokens[0]);
  } else {
    this.printUsage();
  }
}

function command_badges(cmd, tokens, client) {
  let badges = [];
  /* Obtain global badges */
  for (let [bname, badge] of Object.entries(client.GetGlobalBadges())) {
    for (let bdef of Object.values(badge.versions)) {
      let url = bdef.image_url_2x;
      let size = 36;
      if (tokens.indexOf("small") > -1) {
        url = bdef.image_url_1x;
        size = 18;
      } else if (tokens.indexOf("large") > -1) {
        url = bdef.image_url_4x;
        size = 72;
      }
      let attr = `width="${size}" height="${size}" title="${bname}"`;
      badges.push(`<img src="${url}" ${attr} alt="${bname}" />`);
    }
  }
  /* Print global badges */
  Content.addNotice(badges.join(''));
  /* Obtain channel badges */
  for (let ch of client.GetJoinedChannels()) {
    badges = [];
    for (let [bname, badge] of Object.entries(client.GetChannelBadges(ch))) {
      let url = badge.image || badge.svg || badge.alpha;
      badges.push(`<img src="${url}" width="36" height="36" title="${bname}" alt="${bname}" />`);
    }
    /* Print channel badges */
    Content.addNotice(Twitch.FormatChannel(ch) + ": " + badges.join(''));
  }
}

function command_plugins(/*cmd, tokens, client*/) {
  try {
    for (let [n, p] of Object.entries(Plugins.plugins)) {
      let msg = `${n}: ${p.file} @ ${p.order}`;
      if (p._error) {
        Content.addError(`${msg}: Failed: ${JSON.stringify(p._error_obj)}`);
      } else if (p._loaded) {
        msg = `${msg}: Loaded`;
        if (p.commands) {
          msg = `${msg}: Commands: ${p.commands.join(" ")}`;
        }
        Content.addPre(msg);
      }
    }
  }
  catch (e) {
    if (e.name === "ReferenceError") {
      Content.addError("Plugin information unavailable");
    } else {
      throw e;
    }
  }
}

function command_client(cmd, tokens, client) {
  if (tokens.length === 0 || tokens[0] == "status") {
    Content.addHelp("Client information:");
    let cstatus = client.ConnectionStatus();
    Content.addHelpLine("Socket:", cstatus.open ? "Open" : "Closed");
    Content.addHelpLine("Status:", cstatus.connected ? "Connected" : "Not connected");
    Content.addHelpLine("Identified:", cstatus.identified ? "Yes" : "No");
    Content.addHelpLine("Authenticated:", cstatus.authed ? "Yes" : "No");
    Content.addHelpLine("Name:", client.GetName());
    Content.addHelpLine("FFZ:", client.FFZEnabled() ? "Enabled" : "Disabled");
    Content.addHelpLine("BTTV:", client.BTTVEnabled() ? "Enabled" : "Disabled");
    let channels = client.GetJoinedChannels();
    let us = client.SelfUserState() || {};
    if (channels && channels.length > 0) {
      Content.addHelp(`&gt; Channels connected to: ${channels.length}`);
      for (let c of channels) {
        let ci = client.GetChannelInfo(c);
        let nusers = (ci && ci.users ? ci.users.length : 0);
        let rooms = ci.rooms || {};
        let status = (ci.online ? "" : "not ") + "online";
        Content.addHelpLine(c, "Status: " + status + `; id=${ci.id}`);
        Content.addHelpLine("&nbsp;", `Active users: ${nusers}`);
        Content.addHelpLine("&nbsp;", `Rooms: ${Object.keys(rooms)}`);
        let ui = us[c];
        Content.addHelp("User information for " + c + ":");
        if (ui.color) { Content.addHelpLine("Color", ui.color); }
        if (ui.badges) { Content.addHelpLine("Badges", JSON.stringify(ui.badges)); }
        Content.addHelpLine("Name", `${ui["display-name"]}`);
      }
    }
    Content.addHelpLine("User ID", `${us.userid}`);
  } else {
    this.printUsage();
  }
}

function command_raw(cmd, tokens, client) {
  client.SendRaw(tokens.join(" "));
}

var ChatCommands = new TFCChatCommandStore();

ChatCommands.add("log", command_log,
                 "Display logged messages");
ChatCommands.addAlias("logs", "log");
ChatCommands.addUsage("log", null,
                       "Obtain all logged messages");
ChatCommands.addUsage("log", "number",
                      "Display the message numbered <number>");
ChatCommands.addUsage("log", "summary",
                      "Display a summary of the logged messages",
                      {literal: true});
ChatCommands.addUsage("log", "shift",
                      "Remove the first logged message",
                      {literal: true});
ChatCommands.addUsage("log", "pop",
                      "Remove the last logged message",
                      {literal: true});
ChatCommands.addUsage("log", "export",
                      "Open a new window with all of the logged items",
                      {literal: true});
ChatCommands.addUsage("log", "size",
                      "Display the number of bytes used by the log",
                      {literal: true});

ChatCommands.add("clear", command_clear,
                 "Clears all text from all visible modules");
ChatCommands.addUsage("clear", null,
                      "Clears all text from all visible modules");
ChatCommands.addUsage("clear", "module1",
                      "Clears all text from module1",
                      {literal: true});
ChatCommands.addUsage("clear", "module2",
                      "Clears all text from module2",
                      {literal: true});

ChatCommands.add("join", command_join,
                 "Join a channel");
ChatCommands.addUsage("join", "channel",
                      "Connect to <channel>; leading # is optional");

ChatCommands.add("part", command_part,
                 "Leave a channel");
ChatCommands.addAlias("leave", "part");
ChatCommands.addUsage("part", "channel",
                      "Disconnect from <channel>; leading # is optional");

ChatCommands.add("badges", command_badges,
                 "Display all known badges");

ChatCommands.add("plugins", command_plugins,
                 "Display plugin information, if plugins are enabled");

ChatCommands.add("client", command_client,
                 "Display numerous things about the client; use //help client for info");
ChatCommands.addUsage("client", null,
                      "Show general information about the client");
ChatCommands.addUsage("client", "status",
                      "Show current connection information",
                      {literal: true});

ChatCommands.add("raw", command_raw,
                 "Send a raw message to Twitch (for advanced users only!)");
ChatCommands.addUsage("raw", "message",
                      "Send <message> to Twitch servers (for advanced users only!)");

