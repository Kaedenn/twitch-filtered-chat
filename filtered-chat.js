/* Twitch Filtered Chat Main Module */

"use strict";

/* TODO:
 * Add layout selection box to #settings (reloads page on change)
 * Add target to #settings help link
 * Add clip information
 * Hide get_config_object() within client_main()
 */

/* IDEA
 * Allow for a configurable number of columns?
 */

/* NOTES:
 * Filtering ws "recv>" messages:
 *   Util.Logger.add_filter(((m) => !`${m}`.startsWith('recv> ')), 'DEBUG');
 * Filtering ws PRIVMSG messages:
 *   Util.Logger.add_filter(((m) => `${m}`.indexOf(' PRIVMSG ') == -1, 'DEBUG');
 */

const CACHED_VALUE = "Cached";
const AUTOGEN_VALUE = "Auto-Generated";

/* Functions to sanitize configuration */
function verify_boolean(val) { return (typeof(val) == "boolean" ? val : ""); }
function verify_array(val) { return Util.IsArray(val) ? val : []; }

/* Document writing functions {{{0 */

class Content { /* exported Content */
  static addHTML(content) {
    let line = `<div class="line line-wrapper"></div>`;
    let $Content = $(".module").find($(".content"));
    $Content.append($(line).append(content));
    $Content.scrollTop(Math.pow(2, 31) - 1);
  }
  static addPre(content) {
    Content.addHTML($(`<div class="pre"></div>`).html(content));
  }
  static addInfo(content, pre=false) {
    let e = $(`<div class="info"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addNotice(content, pre=false) {
    let e = $(`<div class="notice"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
  static addError(content, pre=false) {
    let e = $(`<div class="error"></div>`).html(content);
    if (pre) e.addClass("pre");
    Content.addHTML(e);
  }
}

/* End document writing functions 0}}} */

/* Begin configuration section {{{0 */

/* Parse a query string into the config object given and return removals */
function parse_query_string(config, qs=null) {
  let qs_data;
  if (qs === null) {
    qs = window.location.search;
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof(qs) === "string") {
    qs_data = Util.ParseQueryString(qs);
  } else if (typeof(qs) === "object") {
    qs_data = qs;
  }

  if (qs_data.debug === undefined) qs_data.debug = false;
  if (qs_data.channels !== undefined) {
    if (typeof(qs_data.channels) != "string") {
      qs_data.channels = "";
    }
  }

  let query_remove = [];
  for (let [k, v] of Object.entries(qs_data)) {
    let key = k; /* config key */
    let val = v; /* config val */
    /* Parse specific items */
    if (k === "clientid") {
      key = "ClientID";
      config.__clientid_override = true;
      query_remove.push(k);
    } else if (k === "user" || k === "name" || k === "nick") {
      key = "Name";
    } else if (k === "pass") {
      key = "Pass";
      query_remove.push(k);
    } else if (k === "channel" || k === "channels") {
      key = "Channels";
      val = v.split(',').map((c) => Twitch.FormatChannel(c));
    } else if (k === "debug") {
      key = "Debug";
      val = Number(v);
      if (Number.isNaN(val)) {
        if (v === "debug") {
          val = Util.LEVEL_DEBUG;
        } else if (v === "trace") {
          val = Util.LEVEL_TRACE;
        } else {
          val = v ? 1 : 0;
        }
      }
      if (val < Util.LEVEL_MIN) val = Util.LEVEL_MIN;
      if (val > Util.LEVEL_MAX) val = Util.LEVEL_MAX;
    } else if (k === "noassets") {
      key = "NoAssets";
      val = v ? true : false;
    } else if (k === "noffz") {
      key = "NoFFZ";
      val = v ? true : false;
    } else if (k === "nobttv") {
      key = "NoBTTV";
      val = v ? true : false;
    } else if (k === "hmax") {
      key = "HistorySize";
      val = typeof(v) === "number" ? v : TwitchClient.DEFAULT_HISTORY_SIZE;
    } else if (k.match(/^module[12]?$/)) {
      if (k === "module") k = "module1";
      key = k === "module" ? "module1" : k;
      val = parse_module_config(v);
    } else if (k === "trans" || k === "transparent") {
      key = "Transparent";
      val = 1;
    } else if (k === "layout" && ParseLayout) {
      key = "Layout";
      val = ParseLayout(v);
    } else if (k == "reconnect") {
      key = "AutoReconnect";
      val = true;
    } else if (k == "size") {
      key = "Size";
      val = `${v}pt`;
    } else if (k == "plugins") {
      key = "Plugins";
      val = v ? true : false;
    } else if (k == "disable") {
      for (let e of `${v}`.split(',')) {
        if (CSSCheerStyles[e]) {
          CSSCheerStyles[e]._disabled = true;
        }
      }
    } else if (k == "max") {
      key = "MaxMessages";
      val = typeof(v) === "number" ? v : TwitchClient.DEFAULT_MAX_MESSAGES;
    } else if (k == "font") {
      key = "Font";
      val = `${v}`;
    } else if (k == "scroll") {
      key = "Scroll";
      val = v ? true : false;
    } else if (k == "clips") {
      key = "ShowClips";
      val = v ? true : false;
    }
    config[key] = val;
  }
  if (!config.hasOwnProperty('Layout')) {
    config.Layout = ParseLayout("double:chat");
  }
  return query_remove;
}

/* Obtain configuration key */
function get_config_key() {
  let config_key = 'tfc-config';
  let qs = Util.ParseQueryString();
  if (qs.hasOwnProperty('config_key')) {
    config_key = config_key + '-' + qs.config_key.replace(/[^a-z]/g, '');
  }
  return config_key;
}

/* Obtain configuration */
function get_config_object() {
  /* 1) Obtain configuration values
   *  a) from localStorage
   *  b) from query string (overrides (a))
   *  c) from settings elements (overrides (b))
   * 2) Store module configuration in each modules' settings window
   * 3) Remove sensitive values from the query string, if present
   */
  let config_key = get_config_key();

  /* Query String object, parsed */
  let qs = Util.ParseQueryString();
  Util.SetWebStorageKey(config_key);
  if (config_key !== "tfc-config") {
    Util.Log(`Using custom config key "${Util.GetWebStorageKey()}"`);
  }
  /* Items to remove from the query string */
  let query_remove = [];

  /* Parse localStorage config */
  let config = Util.GetWebStorage();
  if (!config) config = {};

  /* Persist the config key */
  config.key = Util.GetWebStorageKey();

  /* Certain unwanted items may be preserved in localStorage */
  if (config.hasOwnProperty('NoAssets')) delete config["NoAssets"];
  if (config.hasOwnProperty('Debug')) delete config["Debug"];
  if (config.hasOwnProperty('AutoReconnect')) delete config["AutoReconnect"];
  if (config.hasOwnProperty('Layout')) delete config['Layout'];
  if (config.hasOwnProperty('Plugins')) delete config['Plugins'];

  /* Ensure certain keys are present and have expected values */
  if (!config.hasOwnProperty("MaxMessages")) {
    config.MaxMessages = TwitchClient.DEFAULT_MAX_MESSAGES;
  }
  if (!config.hasOwnProperty("Channels") || !Util.IsArray(config.Channels)) {
    config.Channels = [];
  }
  if (typeof(config.Name) != "string") config.Name = "";
  if (typeof(config.ClientID) != "string") config.ClientID = "";
  if (typeof(config.Pass) != "string") config.Pass = "";

  /* Parse the query string */
  query_remove = parse_query_string(config, qs);

  /* Parse div#settings config */
  let txtChannel = $('input#txtChannel')[0];
  let txtNick = $('input#txtNick')[0];
  let txtPass = $('input#txtPass')[0];
  if (txtChannel.value) {
    for (let ch of txtChannel.value.split(',')) {
      let channel = Twitch.FormatChannel(ch.toLowerCase());
      if (config.Channels.indexOf(channel) == -1) {
        config.Channels.push(channel);
      }
    }
  }
  if (txtNick.value && txtNick.value != AUTOGEN_VALUE) {
    config.Name = txtNick.value;
  }
  if (txtPass.value && txtPass.value != CACHED_VALUE) {
    config.Pass = txtPass.value;
  }

  if (typeof(config.Scroll) !== "boolean") {
    config.Scroll = $("#cbScroll").is(":checked");
  }

  if (typeof(config.ShowClips) !== "boolean") {
    config.ShowClips = $("#cbClips").is(":checked");
  }

  /* Populate configs for each module */
  $('.module').each(function() {
    let id = $(this).attr('id');
    if (!config[id]) { config[id] = get_module_settings($(this)); }
    config[id].Pleb = verify_boolean(config[id].Pleb);
    config[id].Sub = verify_boolean(config[id].Sub);
    config[id].VIP = verify_boolean(config[id].VIP);
    config[id].Mod = verify_boolean(config[id].Mod);
    config[id].Event = verify_boolean(config[id].Event);
    config[id].Bits = verify_boolean(config[id].Bits);
    config[id].IncludeKeyword = verify_array(config[id].IncludeKeyword);
    config[id].IncludeUser = verify_array(config[id].IncludeUser);
    config[id].ExcludeUser = verify_array(config[id].ExcludeUser);
    config[id].ExcludeStartsWith = verify_array(config[id].ExcludeStartsWith);
    config[id].FromChannel = verify_array(config[id].FromChannel);
  });

  /* See if there's anything we need to remove */
  if (query_remove.length > 0) {
    /* The query string contains sensitive information; remove it */
    Util.SetWebStorage(config);
    let old_qs = window.location.search;
    let old_query = Util.ParseQueryString(old_qs.substr(1));
    let is_base64 = false;
    if (old_query.base64 && old_query.base64.length > 0) {
      is_base64 = true;
      old_query = Util.ParseQueryString(atob(old_query.base64));
    }
    for (let e of query_remove) {
      delete old_query[e];
    }
    let new_qs = Util.FormatQueryString(old_query);
    if (is_base64) {
      new_qs = "?base64=" + encodeURIComponent(btoa(new_qs));
    }
    window.location.search = new_qs;
  }

  /* Default ClientID */
  config.ClientID = [
     19, 86, 67,115, 22, 38,198,  3, 55,118, 67, 35,150,230, 71,
    134, 83,  3,119,166, 86, 39, 38,167,135,134,147,214, 38, 55
  ].map((i) => Util.ASCII[((i&15)*16+(i&240)/16)]).join("");

  return config;
}

/* Module configuration {{{1 */

/* Set the module's settings to the values given */
function set_module_settings(module, config) {
  if (config.Name) {
    $(module).find('label.name').html(config.Name);
    $(module).find('input.name').val(config.Name);
  }
  function check(sel) { $(module).find(sel).attr('checked', 'checked'); }
  function uncheck(sel) { $(module).find(sel).removeAttr('checked'); }
  if (config.Pleb) { check('input.pleb'); } else { uncheck('input.pleb'); }
  if (config.Sub) { check('input.sub'); } else { uncheck('input.sub'); }
  if (config.VIP) { check('input.vip'); } else { uncheck('input.vip'); }
  if (config.Mod) { check('input.mod'); } else { uncheck('input.mod'); }
  if (config.Event) { check('input.event'); } else { uncheck('input.event'); }
  if (config.Bits) { check('input.bits'); } else { uncheck('input.bits'); }
  function add_input(cls, label, values) {
    if (values && values.length > 0) {
      for (let val of values) {
        let $li = $(`<li></li>`);
        let isel = `input.${cls}[value="${val}"]`;
        if ($(module).find(isel).length == 0) {
          let $l = $(`<label></label>`).val(label);
          let $cb = $(`<input type="checkbox" value=${val.escape()} checked />`);
          $cb.addClass(cls);
          $cb.click(update_module_config);
          $l.append($cb);
          $l.html($l.html() + label + val.escape());
          $li.append($l);
          $(module).find(`li.${cls}`).before($li);
        }
      }
    }
  }
  add_input("include_user", "From user: ", config.IncludeUser);
  add_input("include_keyword", "Contains: ", config.IncludeKeyword);
  add_input("exclude_user", "From user: ", config.ExcludeUser);
  add_input("exclude_startswith", "Starts with: ", config.ExcludeStartsWith);
  add_input("from_channel", "Channel:", config.FromChannel);
}

/* Obtain the settings from the module's settings html */
function get_module_settings(module) {
  module = $(module);
  let s = {
    Name: module.find('input.name').val(),
    Pleb: module.find('input.pleb').is(':checked'),
    Sub: module.find('input.sub').is(':checked'),
    VIP: module.find('input.vip').is(':checked'),
    Mod: module.find('input.mod').is(':checked'),
    Event: module.find('input.event').is(':checked'),
    Bits: module.find('input.bits').is(':checked'),
    IncludeUser: [],
    IncludeKeyword: [],
    ExcludeUser: [],
    ExcludeStartsWith: [],
    FromChannel: []
  };

  module.find('input.include_user:checked').each(function() {
    s.IncludeUser.push($(this).val());
  });
  module.find('input.include_keyword:checked').each(function() {
    s.IncludeKeyword.push($(this).val());
  });
  module.find('input.exclude_user:checked').each(function() {
    s.ExcludeUser.push($(this).val());
  });
  module.find('input.exclude_startswith:checked').each(function() {
    s.ExcludeStartsWith.push($(this).val());
  });
  module.find('input.from_channel:checked').each(function() {
    s.FromChannel.push($(this).val());
  });

  return s;
}

/* Parse the module configuration from a query string component */
function parse_module_config(value) {
  let Decode = (vals) => vals.map((v) => decodeURIComponent(v));
  let parts = Decode(value.split(/,/g));
  while (parts.length < 7) parts.push("");
  let bits = Util.DecodeFlags(parts[1], 6);
  let config = {};
  config.Name = parts[0];
  config.Pleb = bits[0];
  config.Sub = bits[1];
  config.VIP = bits[2];
  config.Mod = bits[3];
  config.Event = bits[4];
  config.Bits = bits[5];
  config.IncludeKeyword = parts[2] ? Decode(parts[2].split(/,/g)) : [];
  config.IncludeUser = parts[3] ? Decode(parts[3].split(/,/g)) : [];
  config.ExcludeUser = parts[4] ? Decode(parts[4].split(/,/g)) : [];
  config.ExcludeStartsWith = parts[5] ? Decode(parts[5].split(/,/g)) : [];
  config.FromChannel = parts[6] ? Decode(parts[6].split(/,/g)) : [];
  return config;
}

/* Format the module configuration into a query string component */
function format_module_config(cfg) {
  let Encode = (vals) => vals.map((v) => encodeURIComponent(v));
  let bits = [cfg.Pleb, cfg.Sub, cfg.VIP, cfg.Mod, cfg.Event, cfg.Bits];
  let values = [
    cfg.Name,
    Util.EncodeFlags(bits, false),
    Encode(cfg.IncludeKeyword).join(","),
    Encode(cfg.IncludeUser).join(","),
    Encode(cfg.ExcludeUser).join(","),
    Encode(cfg.ExcludeStartsWith).join(","),
    Encode(cfg.FromChannel).join(",")
  ];
  return Encode(values).join(",");
}

/* Update the local storage config with the current module settings */
function update_module_config() {
  let config = get_config_object();
  $(".module").each(function() {
    config[$(this).attr('id')] = get_module_settings($(this));
  });
  Util.SetWebStorage(config);
}

/* End module configuration 1}}} */

/* Set the joined channels to the list given */
function set_channels(client, channels) {
  let fmt_ch = (ch) => Twitch.FormatChannel(Twitch.ParseChannel(ch));
  let new_chs = channels.map(fmt_ch);
  let old_chs = client.GetJoinedChannels().map(fmt_ch);
  let to_join = new_chs.filter((c) => old_chs.indexOf(c) == -1);
  let to_part = old_chs.filter((c) => new_chs.indexOf(c) == -1);
  /* Join all the channels added */
  for (let ch of to_join) {
    client.JoinChannel(ch);
    Content.addNotice(`Joining ${ch}`);
  }
  /* Leave all the channels removed */
  for (let ch of to_part) {
    client.LeaveChannel(ch);
    Content.addNotice(`Leaving ${ch}`);
  }
}

/* End configuration section 0}}} */

/* Return whether or not the event should be filtered */
function should_filter(module, event) {
  let rules = get_module_settings(module);
  if (event instanceof TwitchChatEvent) {
    /* sub < vip < mod for classification */
    let role = "pleb";
    if (event.issub) role = "sub";
    if (event.isvip) role = "vip";
    if (event.ismod) role = "mod";
    if (!rules.Pleb && role == "pleb") return true;
    if (!rules.Sub && role == "sub") return true;
    if (!rules.VIP && role == "vip") return true;
    if (!rules.Mod && role == "mod") return true;
    /* This also filters out cheer effects */
    if (!rules.Bits && event.flags.bits) return true;
    let user = event.user ? event.user.toLowerCase() : "";
    let message = event.message ? event.message.toLowerCase() : "";
    /* Includes take priority over excludes */
    if (rules.IncludeUser.any((u) => (u.toLowerCase() == user))) return false;
    if (rules.IncludeKeyword.any((k) => (message.indexOf(k) > -1))) return false;
    if (rules.ExcludeUser.any((u) => (u.toLowerCase() == user))) return true;
    if (rules.ExcludeStartsWith.any((m) => (message.startsWith(m)))) return true;
    if (rules.FromChannel.length > 0) {
      for (let s of rules.FromChannel) {
        let c = s.indexOf('#') == -1 ? '#' + s : s;
        if (event.channel && event.channel.channel) {
          if (event.channel.channel.toLowerCase() != c.toLowerCase()) {
            return true;
          }
        }
      }
    }
  } else if (event instanceof TwitchEvent) {
    if (!rules.Event) {
      /* Filter out events and notices */
      if (event.command === "USERNOTICE") {
        return true;
      } else if (event.command === "NOTICE") {
        return true;
      }
    }
  }
  return false;
}

/* Handle a chat command */
function handle_command(value, client) {
  let tokens = value.split(" ");
  let command = tokens.shift();

  /* Clear empty tokens at the end (\r\n related) */
  while (tokens.length > 0 && tokens[tokens.length-1].length == 0) {
    tokens.pop();
  }

  if (ChatCommands.is_command_str(value)) {
    if (ChatCommands.has_command(command)) {
      ChatCommands.execute(value, client);
      return true;
    }
  }

  /* Handle config command */
  if (command == "//config") {
    let config = get_config_object();
    if (tokens.length > 0) {
      if (tokens[0] == "clientid") {
        ChatCommands.addHelpLine("ClientID", config.ClientID);
      } else if (tokens[0] == "pass") {
        ChatCommands.addHelpLine("Pass", config.Pass);
      } else if (tokens[0] == "purge") {
        Util.SetWebStorage({});
        Content.addNotice(`Purged storage "${Util.GetWebStorageKey()}"`);
      } else if (tokens[0] == "url") {
        let url = location.protocol + '//' + location.hostname + location.pathname;
        if (tokens.length > 1) {
          if (tokens[1].startsWith('git')) {
            url = "https://kaedenn.github.io/twitch-filtered-chat/index.html";
          }
        }
        let qs = [];
        let qs_push = (k, v) => (qs.push(`${k}=${encodeURIComponent(v)}`));
        if (config.Debug > 0) { qs_push('debug', config.Debug); }
        if (config.__clientid_override) {
          if (config.ClientID && config.ClientID.length == 30) {
            qs_push('clientid', config.ClientID);
          }
        }
        if (config.Channels.length > 0) {
          qs_push('channels', config.Channels.join(","));
        }
        if (tokens.indexOf("auth") > -1) {
          if (config.Name && config.Name.length > 0) {
            qs_push('user', config.Name);
          }
          if (config.Pass && config.Pass.length > 0) {
            qs_push('pass', config.Pass);
          }
        }
        if (config.NoAssets) { qs_push('noassets', config.NoAssets); }
        if (config.NoFFZ) { qs_push('noffz', config.NoFFZ); }
        if (config.NoBTTV) { qs_push('nobttv', config.NoBTTV); }
        if (config.HistorySize) { qs_push('hmax', config.HistorySize); }
        qs_push("module1", format_module_config(config.module1));
        qs_push("module2", format_module_config(config.module2));
        qs_push("layout", FormatLayout(config.Layout));
        if (config.Transparent) { qs_push("trans", "1"); }
        if (config.AutoReconnect) { qs_push("reconnect", "1"); }
        {
          let font_size = Util.CSS.GetProperty("--body-font-size");
          let font_size_default = Util.CSS.GetProperty("--body-font-size-default");
          if (font_size != font_size_default) {
            qs_push("size", font_size.replace(/[^0-9]/g, ''));
          }
        }
        if (config.Plugins) { qs_push("plugins", "1"); }
        if (config.MaxMessages != TwitchClient.DEFAULT_MAX_MESSAGES) {
          qs_push("max", `${config.MaxMessages}`);
        }
        if (tokens[tokens.length-1] === "text") {
          url += "?" + qs.join("&");
        } else {
          url += "?base64=" + encodeURIComponent(btoa(qs.join("&")));
        }
        ChatCommands.addHelp(client.get('HTMLGen').url(url));
      } else if (config.hasOwnProperty(tokens[0])) {
        ChatCommands.addHelpLine(tokens[0], JSON.stringify(config[tokens[0]]));
      } else {
        Content.addError(`Unknown config key &quot;${tokens[0]}&quot;`, true);
      }
    } else {
      let wincfgs = [];
      for (let [k, v] of Object.entries(config)) {
        if (typeof(v) == "object" && v.Name && v.Name.length > 1) {
          /* It's a window configuration */
          wincfgs.push([k, v]);
        } else if (k == "ClientID" || k == "Pass") {
          ChatCommands.addHelpLine(k, `Omitted for security; use //config ${k.toLowerCase()} to show`);
        } else {
          ChatCommands.addHelpLine(k, v);
        }
      }
      ChatCommands.addHelp(`Window Configurations:`);
      for (let [k, v] of wincfgs) {
        ChatCommands.addHelp(`Module <span class="arg">${k}</span>: &quot;${v.Name}&quot;:`);
        for (let [cfgk, cfgv] of Object.entries(v)) {
          if (cfgk === "Name") continue;
          ChatCommands.addHelpLine(cfgk, `&quot;${cfgv}&quot;`);
        }
      }
    }
  } else {
    return false;
  }
  return true;
}

/* Populate and show the username context window */
function show_context_window(client, cw, line) {
  let $cw = $(cw);
  let $l = $(line);
  $(cw).html(""); /* Clear everything from the last time */

  /* Attributes of the host line */
  let id = $l.attr("data-id");
  let user = $l.attr("data-user");
  let name = $l.find(".username").text();
  let userid = $l.attr("data-user-id");
  let channel = `#${$l.attr("data-channel")}`;
  let chid = $l.attr("data-channelid");
  let sub = $l.attr("data-subscriber") === "1";
  let mod = $l.attr("data-mod") === "1";
  let vip = $l.attr("data-vip") === "1";
  let caster = $l.attr("data-caster") === "1";
  let timestamp = Number.parseInt($l.attr("data-sent-ts"));
  let time = new Date(timestamp);

  /* Set the attributes for the context window */
  $cw.attr("data-id", id);
  $cw.attr("data-user", user);
  $cw.attr("data-user-id", userid);
  $cw.attr("data-channel", channel);
  $cw.attr("data-chid", chid);
  $cw.attr("data-sub", sub);
  $cw.attr("data-mod", mod);
  $cw.attr("data-vip", vip);
  $cw.attr("data-caster", caster);
  $cw.attr("data-id", id);

  /* Define functions for building elements */
  let $Line = (s) => $(`<div class="item">${s}</div>`);
  let Link = (i, text) => client.get('HTMLGen').url(null, text, "cw-link", i);
  let Em = (t) => `<span class="em">${t}</span>`;
  let $EmItem = (s) => $(Em(s)).css('margin-left', '0.5em');

  /* Add user's display name */
  let $username = $l.find('.username');
  let classes = $username.attr("class");
  let css = $username.attr("style");
  let e_name = `<span class="${classes}" style="${css}">${name}</span>`;
  $cw.append($Line(`${e_name} in ${Em(channel)}`));

  /* Add link to timeout user */
  if (client.IsMod(channel)) {
    let $tl = $(`<div class="cw-timeout">Timeout:</div>`);
    for (let dur of "1s 10s 60s 10m 30m 1h 12h 24h".split(" ")) {
      let $ta = $(Link(`cw-timeout-${user}-${dur}`, dur));
      $ta.addClass("cw-timeout-dur");
      $ta.attr("data-channel", channel);
      $ta.attr("data-user", user);
      $ta.attr("data-duration", dur);
      $ta.click(function() {
        let ch = $(this).attr('data-channel');
        let u = $(this).attr('data-user');
        let d = $(this).attr('data-duration');
        client.Timeout(ch, u, d);
        Util.Log('Timed out user', u, 'from', ch, 'for', d);
        $(cw).fadeOut();
      });
      $tl.append($ta);
    }
    $cw.append($tl);
  }

  /* Add link which places "/ban <user>" into the chat textbox */
  if (client.IsMod(channel)) {
    let $ba = $(Link(`cw-ban-${user}`, "Ban"));
    $ba.attr("data-channel", channel);
    $ba.attr("data-user", user);
    $ba.click(function() {
      $("#txtChat").val(`/ban ${$(this).attr('data-user')}`);
    });
    $cw.append($ba);
  }

  /* Add other information */
  let sent_ts = Util.FormatDate(time);
  let ago_ts = Util.FormatInterval((Date.now() - timestamp) / 1000);
  $cw.append($Line(`Sent: ${sent_ts} (${ago_ts} ago)`));
  $cw.append($Line(`UserID: ${userid}`));
  $cw.append($Line(`MsgUID: ${id}`));

  /* Add roles (and ability to remove roles, for the caster) */
  if (mod || vip || sub || caster) {
    let $roles = $Line(`User Role:`);
    if (mod) { $roles.append($EmItem('Mod')); $roles.append(","); }
    if (vip) { $roles.append($EmItem('VIP')); $roles.append(","); }
    if (sub) { $roles.append($EmItem('Sub')); $roles.append(","); }
    if (caster) { $roles.append($EmItem('Host')); $roles.append(","); }
    /* Remove the last comma */
    $roles[0].removeChild($roles[0].lastChild);
    $cw.append($roles);
    if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
      if (mod) { $cw.append($Line(Link('cw-unmod', 'Remove Mod'))); }
      if (vip) { $cw.append($Line(Link('cw-unvip', 'Remove VIP'))); }
    }
  }

  /* Add the ability to add roles (for the caster) */
  if (client.IsCaster(channel) && !client.IsUIDSelf(userid)) {
    if (!mod) { $cw.append($Line(Link('cw-make-mod', 'Make Mod'))); }
    if (!vip) { $cw.append($Line(Link('cw-make-vip', 'Make VIP'))); }
  }

  let l_off = $l.offset();
  let offset = {top: l_off.top + $l.outerHeight() + 2, left: l_off.left};
  if (offset.top + $cw.outerHeight() + 2 > window.innerHeight) {
    offset.top = window.innerHeight - $cw.outerHeight() - 2;
  }
  if (offset.left + $cw.outerWidth() + 2 > window.innerWidth) {
    offset.left = window.innerWidth - $cw.outerWidth() - 2;
  }
  $cw.fadeIn().offset(offset);
}

/* Set or unset transparency */
function update_transparency(transparent) {
  let props = [];
  try {
    let ss = Util.CSS.GetSheet("main.css");
    let rule = Util.CSS.GetRule(ss, ":root");
    /* Find the prop="--<name>-color" rules */
    for (let prop of Util.CSS.GetPropertyNames(rule)) {
      if (prop.match(/^--[a-z-]+-color$/)) {
        props.push(prop);
      }
    }
  }
  catch (e) {
    /* Unable to enumerate properties; use hard-coded ones */
    Util.Error("Failed getting main.css :root", e);
    props = [
      "--body-color",
      "--header-color",
      "--menudiv-color",
      "--module-color",
      "--odd-line-color",
      "--sub-color",
      "--chat-color",
      "--textarea-color",
    ];
  }
  for (let prop of props) {
    if (transparent) {
      /* Set them all to transparent */
      Util.CSS.SetProperty(prop, 'transparent');
      $(".module").addClass("transparent");
      $("body").addClass("transparent");
    } else {
      /* Set them all to default */
      Util.CSS.SetProperty(prop, `var(${prop}-default)`);
      $(".module").removeClass("transparent");
      $("body").removeClass("transparent");
    }
  }
}

/* Called once when the document loads */
function client_main(layout) { /* exported client_main */
  let client;
  let ConfigCommon = {};

  /* Hook Logger messages */
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addError("ERROR: " + msg.escape());
    }
  }, "ERROR");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (args.length == 1 && args[0] instanceof TwitchEvent) {
      if (Util.DebugLevel >= Util.LEVEL_TRACE) {
        Content.addNotice("WARNING: " + args[0].repr());
      }
    } else if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      Content.addNotice("WARNING: " + msg.escape());
    }
  }, "WARN");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML("DEBUG: " + msg.escape());
    }
  }, "DEBUG");
  Util.Logger.add_hook(function(sev, with_stack, ...args) {
    let msg = JSON.stringify(args.length == 1 ? args[0] : args);
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML("TRACE: " + msg.escape());
    }
  }, "TRACE");

  /*
  let config_obj = new ConfigStore(
    get_config_key(),
    ["NoAssets", "NoFFZ", "NoBTTV", "Transparent", "Layout",
     "AutoReconnect", "Debug"]);
  for (let m of $(".module")) {
    let cfg = config_obj.getValue($(m).attr("id"));
    if (cfg) {
      set_module_settings(m, cfg);
    }
  }
  */

  /* Obtain configuration, construct client */
  (function _configure_construct_client() {
    let config = get_config_object();
    client = new TwitchClient(config);
    Util.DebugLevel = config.Debug;

    /* Change the document title to show our authentication state */
    document.title += " -";
    if (config.Pass && config.Pass.length > 0) {
      document.title += " Authenticated";
    } else {
      document.title += " Read-Only";
      if (config.Layout.Chat) {
        /* Change the chat placeholder and border to reflect read-only */
        $("#txtChat").attr("placeholder", "Authentication needed to send messages");
        Util.CSS.SetProperty('--chat-border', '#cd143c');
      }
    }

    /* Simulate clicking cbTransparent if config.Transparent is set */
    if (config.Transparent) {
      update_transparency(true);
    }

    /* Set the text size if given */
    if (config.Size) {
      Util.CSS.SetProperty('--body-font-size', config.Size);
    }

    /* Set the font if given */
    if (config.Font) {
      Util.CSS.SetProperty("--body-font", config.Font);
    }

    /* If scrollbars are configured, enable them */
    if (config.Scroll) {
      $(".module .content").css("overflow-y", "scroll");
      $("#cbScroll").attr("checked", "checked");
    } else {
      $("#cbScroll").removeAttr("checked");
    }

    /* After all that, sync the final settings up with the html */
    $(".module").each(function() {
      set_module_settings(this, config[$(this).attr('id')]);
    });

    /* Set values we'll want to use later */
    ConfigCommon = JSON.parse(JSON.stringify(config));
    delete ConfigCommon["Pass"];
    delete ConfigCommon["ClientID"];
    ConfigCommon.Plugins = config.Plugins ? true : false;
    ConfigCommon.MaxMessages = config.MaxMessages || 100;

    /* If no channels are configured, show the settings panel */
    if (config.Channels.length == 0) {
      $("#settings").fadeIn();
    }

    /* Apply the show-clips config to the settings div */
    if (config.ShowClips) {
      $("#cbClips").attr("checked", "checked");
    } else {
      $("#cbClips").removeAttr("checked");
    }
  })();

  /* Construct the HTML Generator and tell it and the client about each other */
  client.set('HTMLGen', new HTMLGenerator(client, ConfigCommon));

  /* Construct the plugins */
  if (ConfigCommon.Plugins) {
    try {
      Plugins.LoadAll(client);
      Plugins.set_commands_obj(ChatCommands);
    }
    catch (e) {
      if (e.name !== "ReferenceError") {
        throw e;
      } else {
        Util.Warn("Plugins object not present");
      }
    }
  }

  /* Allow JS access if debugging is enabled */
  if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
    window.client = client;
  }

  /* Add documentation for the moderator chat commands */
  ChatCommands.addHelp("Moderator commands:", {literal: true});
  ChatCommands.addHelp("!tfc reload: Force reload of this page", {literal: true,  command: true});
  ChatCommands.addHelp("!tfc force-reload: Force reload of this page, discarding cache", {literal: true,  command: true});
  ChatCommands.addHelp("!tfc nuke: Clear the chat", {literal: true,  command: true});
  ChatCommands.addHelp("!tfc nuke <user>: Remove all messages sent by <user>", { command: true});

  /* Bind all of the page assets {{{0 */

  /* Sending a chat message */
  $("#txtChat").keydown(function(e) {
    const isUp = (e.keyCode === Util.Key.UP);
    const isDown = (e.keyCode === Util.Key.DOWN);
    if (e.keyCode == Util.Key.RETURN) {
      if (e.target.value.trim().length > 0) {
        if (!handle_command(e.target.value, client)) {
          client.SendMessageToAll(e.target.value);
        }
        client.AddHistory(e.target.value);
        $(e.target).attr("hist-index", "-1");
        e.target.value = "";
      }
      /* Prevent bubbling */
      e.preventDefault();
      return false;
    } else if (isUp || isDown) {
      /* Handle traversing message history */
      let i = Number.parseInt($(e.target).attr("hist-index"));
      let l = client.GetHistoryLength();
      if (isUp) {
        i = (i + 1 >= l - 1 ? l - 1 : i + 1);
      } else if (isDown) {
        i = (i - 1 < 0 ? -1 : i - 1);
      }
      e.target.value = (i > -1 ? client.GetHistoryItem(i) : "");
      $(e.target).attr("hist-index", `${i}`);
      /* Delay moving the cursor until after the text is updated */
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.value.length;
        e.target.selectionEnd = e.target.value.length;
      });
    }
  });

  /* Pressing enter while on the settings box */
  $("#settings").keyup(function(e) {
    if (e.keyCode == Util.Key.RETURN) {
      update_module_config();
      $("#settings_button").click();
    }
  });

  /* Clicking the settings button */
  $("#settings_button").click(function() {
    if ($("#settings").is(':visible')) {
      $('#settings').fadeOut();
    } else {
      let config = get_config_object();
      $("#txtChannel").val(config.Channels.join(","));
      $("#txtNick").val(config.Name ? config.Name : AUTOGEN_VALUE);
      if (config.Pass && config.Pass.length > 0) {
        $("#txtPass").attr("disabled", "disabled").hide();
        $("#txtPassDummy").show();
      }
      $("#selDebug").val(`${config.Debug}`);
      $('#settings').fadeIn();
    }
  });

  /* Clicking on a "Clear" link */
  $(".clear-chat-link").click(function() {
    let id = $(this).parent().parent().parent().attr("id");
    $(`#${id} .content`).find(".line-wrapper").remove();
  });

  /* Pressing enter on the "Channels" text box */
  $("#txtChannel").keyup(function(e) {
    if (e.keyCode == Util.Key.RETURN) {
      set_channels(client, $(this).val().split(","));
      let cfg = get_config_object();
      cfg.Channels = client.GetJoinedChannels();
      Util.SetWebStorage(cfg);
    }
  });

  /* Leaving the "Channels" text box */
  $("#txtChannel").blur(function(/*e*/) {
    set_channels(client, $(this).val().split(","));
    let cfg = get_config_object();
    cfg.Channels = client.GetJoinedChannels();
    Util.SetWebStorage(cfg);
  });

  /* Changing the "Scrollbars" checkbox */
  $("#cbScroll").change(function() {
    let cfg = get_config_object();
    cfg.Scroll = $(this).is(":checked");
    Util.SetWebStorage(cfg);
    if (cfg.Scroll) {
      $(".module .content").css("overflow-y", "scroll");
    } else {
      $(".module .content").css("overflow-y", "hidden");
    }
  });

  /* Changing the "stream is transparent" checkbox */
  $("#cbTransparent").change(function() {
    return update_transparency($(this).is(":checked"));
  });

  /* Changing the value for "background image" */
  $("#txtBGStyle").keyup(function(e) {
    if (e.keyCode == Util.Key.RETURN) {
      $(".module").css("background-image", $(this).val());
    }
  });

  /* Changing the "Show Clips" checkbox */
  $("#cbClips").change(function() {
    if ($(this).is(":checked")) {
      client.get("HTMLGen").setValue("ShowClips", true);
    } else {
      client.get("HTMLGen").setValue("ShowClips", false);
    }
  });

  /* Changing the debug level */
  $("#selDebug").change(function() {
    let v = parseInt($(this).val());
    let old = client.GetDebug();
    Util.Log(`Changing debug level from ${Util.DebugLevel} (${old}) to ${v}`);
    client.SetDebug(v);
  });

  /* Clicking on the reconnect link in the settings box */
  $("#reconnect").click(function() {
    client.Connect();
  });

  /* Opening one of the module menus */
  $(".menu").click(function() {
    let $settings = $(this).parent().children(".settings");
    let $lbl = $(this).parent().children('label.name');
    let $tb = $(this).parent().children('input.name');
    if ($settings.is(":visible")) {
      /* Update module configurations on close */
      update_module_config();
      $tb.hide();
      $lbl.html($tb.val()).show();
    } else {
      $lbl.hide();
      $tb.val($lbl.html()).show();
    }
    $settings.fadeToggle();
  });

  /* Pressing enter on the module's name text box */
  $('.module .header input.name').on('keyup', function(e) {
    if (e.keyCode == Util.Key.RETURN) {
      let $settings = $(this).parent().children(".settings");
      let $lbl = $(this).parent().children('label.name');
      let $tb = $(this).parent().children('input.name');
      update_module_config();
      $tb.hide();
      $lbl.html($tb.val()).show();
      $settings.fadeToggle();
    }
  });

  /* Pressing enter on one of the module menu text boxes */
  $('.module .settings input[type="text"]').on('keyup', function(e) {
    let v = $(this).val();
    if (v.length > 0) {
      if (e.keyCode == Util.Key.RETURN) {
        let $cli = $(this).closest('li');
        let cls = $cli.attr('class').replace('textbox', '').trim();
        let cb = client.get('HTMLGen').checkbox(v, null, cls, true);
        let val = $cli.find('label').html();
        let $li = $(`<li><label>${cb}${val} ${v}</label></li>`);
        $cli.before($li);
        $(this).val('');
        update_module_config();
      }
    }
  });

  /* Clicking anywhere else on the document: reconnect, username context window */
  $(document).click(function(e) {
    let $t = $(e.target);
    let $cw = $("#username_context");
    let $m1s = $("#module1 .settings");
    let $m2s = $("#module2 .settings");
    /* Clicking off of module1 settings: hide it */
    if ($m1s.length > 0 && $m1s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m1s[0])
          && !Util.PointIsOn(e.clientX, e.clientY, $("#module1 .header")[0])) {
        update_module_config();
        let $tb = $m1s.siblings("input.name").hide();
        $m1s.siblings("label.name").html($tb.val()).show();
        $m1s.fadeOut();
      }
    }
    /* Clicking off of module2 settings: hide it */
    if ($m2s.length > 0 && $m2s.is(":visible")) {
      if (!Util.PointIsOn(e.clientX, e.clientY, $m2s[0])
          && !Util.PointIsOn(e.clientX, e.clientY, $("#module2 .header")[0])) {
        update_module_config();
        let $tb = $m2s.siblings("input.name").hide();
        $m2s.siblings("label.name").html($tb.val()).show();
        $m2s.fadeOut();
      }
    }
    /* Clicking on the username context window */
    if (Util.PointIsOn(e.clientX, e.clientY, $cw[0])) {
      let ch = $cw.attr("data-channel");
      let user = $cw.attr("data-user");
      let userid = $cw.attr("data-user-id");
      if (!client.IsUIDSelf(userid)) {
        if ($t.attr("id") === "cw-unmod") {
          /* Clicked on the "unmod" link */
          Util.Log("Unmodding", user, "in", ch);
          client.SendMessage(ch, `/unmod ${user}`);
        } else if ($t.attr("id") === "cw-unvip") {
          /* Clicked on the "unvip" link */
          Util.Log("Removing VIP for", user, "in", ch);
          client.SendMessage(ch, `/unvip ${user}`);
        } else if ($t.attr("id") === "cw-make-mod") {
          /* Clicked on the "mod" link */
          Util.Log("Modding", user, "in", ch);
          client.SendMessage(ch, `/mod ${user}`);
        } else if ($t.attr("id") === "cw-make-vip") {
          /* Clicked on the "vip" link */
          Util.Log("VIPing", user, "in", ch);
          client.SendMessage(ch, `/vip ${user}`);
        }
      }
    } else if ($t.attr('data-username') == '1') {
      /* Clicked on a username; show context window */
      let $l = $t.parent();
      if ($cw.is(":visible") && $cw.attr("data-user-id") == $l.attr("data-user-id")) {
        $cw.fadeOut();
      } else {
        show_context_window(client, $cw, $l);
      }
    } else if ($cw.is(":visible")) {
      /* Clicked somewhere else: close context window */
      $cw.fadeOut();
    }
    /* Clicking on a "Reconnect" link */
    if ($t.attr("data-reconnect") == '1') {
      /* Clicked on a reconnect link */
      Content.addNotice(`Reconnecting...`);
      client.Connect();
    }
  });

  /* End of the DOM event binding 0}}} */

  /* Bind to numerous TwitchEvent events {{{0 */

  /* WebSocket opened */
  client.bind('twitch-open', function _on_twitch_open(/*e*/) {
    $(".loading").remove();
    $("#debug").hide();
    if (Util.DebugLevel >= Util.LEVEL_DEBUG) {
      let notes = [];
      if (client.IsAuthed()) {
        notes.push("(authenticated)");
      } else {
        notes.push("(unauthenticated)");
      }
      Content.addInfo(`Connected ${notes.join(" ")}`);
    }
    if (get_config_object().Channels.length == 0) {
      Content.addInfo("No channels configured; type //join &lt;channel&gt; to join one!");
    }
  });

  /* WebSocket closed */
  client.bind('twitch-close', function _on_twitch_close(e) {
    let code = e.raw_line.code;
    let reason = e.raw_line.reason;
    let msg = "Connection closed";
    if (reason) {
      msg = `${msg} (code ${code}: ${reason})`;
    } else {
      msg = `${msg} (code ${code})`;
    }
    if (get_config_object().AutoReconnect) {
      Content.addError(msg);
      client.Connect();
    } else {
      Content.addError(`${msg}<span class="reconnect" data-reconnect="1">Reconnect</span>`);
    }
  });

  /* Received reconnect command from Twitch */
  client.bind('twitch-reconnect', function _on_twitch_reconnect(/*e*/) {
    client.Connect();
  });

  /* User joined (any user) */
  client.bind('twitch-join', function _on_twitch_join(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        Content.addInfo(`Joined ${e.channel.channel}`);
      }
    }
  });

  /* User left (any user) */
  client.bind('twitch-part', function _on_twitch_part(e) {
    if (!Util.Browser.IsOBS && !layout.Slim) {
      if (e.user == client.GetName().toLowerCase()) {
        Content.addInfo(`Left ${e.channel.channel}`);
      }
    }
  });

  /* Notice (or warning) from Twitch */
  client.bind('twitch-notice', function _on_twitch_notice(e) {
    /* Some notices are benign */
    switch (e.notice_msgid) {
      case "host_on":
        break;
      case "host_target_went_offline":
        break;
      case "cmds_available":
        Content.addInfo("Use //help to see Twitch Filtered Chat commands");
        break;
      default:
        Util.Warn(e);
    }
    let channel = Twitch.FormatChannel(e.channel);
    let message = e.message.escape();
    Content.addNotice(`${channel}: ${message}`);
  });

  /* Error from Twitch or Twitch Client API */
  client.bind('twitch-error', function _on_twitch_error(e) {
    Util.Error(e);
    let user = e.user;
    let command = e.values.command;
    let message = e.message.escape();
    Content.addError(`Error for ${user}: ${command}: ${message}`);
  });

  /* Message received from Twitch */
  client.bind('twitch-message', function _on_twitch_message(e) {
    if (Util.DebugLevel >= Util.LEVEL_TRACE) {
      Content.addHTML(`<span class="pre">${e.repr()}</span>`);
    }
    /* Avoid flooding the DOM with stale chat messages */
    let max = get_config_object().MaxMessages || 100;
    for (let c of $(".content")) {
      while ($(c).find(".line-wrapper").length > max) {
        $(c).find(".line-wrapper").first().remove();
      }
    }
  });

  /* Received streamer info */
  client.bind('twitch-streaminfo', function _on_twitch_streaminfo(e) {
    let cinfo = client.GetChannelInfo(e.channel.channel);
    if (!cinfo.online) {
      if (ConfigCommon.Layout && !ConfigCommon.Layout.Slim) {
        Content.addNotice(`${e.channel.channel} is not currently streaming`);
      }
    }
  });

  /* Received chat message */
  client.bind('twitch-chat', function _on_twitch_chat(event) {
    if (event instanceof TwitchChatEvent) {
      let m = typeof(event.message) === "string" ? event.message : "";
      if (event.flags && event.flags.mod && m.indexOf(' ') > -1) {
        let tokens = m.split(' ');
        if (tokens[0] === '!tfc') {
          if (tokens[1] === "reload") {
            location.reload();
          } else if (tokens[1] === "force-reload") {
            location.reload(true);
          } else if (tokens[1] === "clear") {
            $(".content").children().remove();
          } else if (tokens[1] === "removeuser"
                     || tokens[1] === "clearuser"
                     || tokens[1] === "remove-user"
                     || tokens[1] === "clear-user") {
            if (tokens[2] && tokens[2].length > 1) {
              $(`[data-user="${tokens[2].toLowerCase()}"]`).parent().remove();
            }
          } else if (tokens[1] == "nuke") {
            if (tokens[2] && tokens[2].length > 1) {
              $(`[data-user="${tokens[2].toLowerCase()}"]`).parent().remove();
            } else {
              $(".content").children().remove();
            }
            return;
          }
        }
      }
    }
    $(".module").each(function() {
      if (!should_filter($(this), event)) {
        let $w = $(`<div class="line line-wrapper"></div>`);
        $w.html(client.get('HTMLGen').gen(event));
        let $c = $(this).find('.content');
        $c.append($w);
        $c.scrollTop(Math.pow(2, 31) - 1);
      }
    });
  });

  /* Received CLEARCHAT event */
  client.bind('twitch-clearchat', function _on_twitch_clearchat(e) {
    if (e.has_flag("target-user-id")) {
      /* Moderator timed out a user */
      let r = e.flags["room-id"];
      let u = e.flags["target-user-id"];
      $(`.chat-line[data-channel-id="${r}"][data-user-id="${u}"]`).parent().remove();
    } else {
      /* Moderator cleared the chat */
      $("div.content").find(".line-wrapper").remove();
    }
  });

  /* Received CLEARMSG event */
  client.bind('twitch-clearmsg', function _on_twitch_clearmsg(e) {
    Util.StorageAppend("debug-msg-log", e);
    Util.Warn("Unhandled CLEARMSG:", e);
  });

  /* User subscribed */
  client.bind('twitch-sub', function _on_twitch_sub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get('HTMLGen').sub(e));
  });

  /* User resubscribed */
  client.bind('twitch-resub', function _on_twitch_resub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get('HTMLGen').resub(e));
  });

  /* User gifted a subscription */
  client.bind('twitch-giftsub', function _on_twitch_giftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get('HTMLGen').giftsub(e));
  });

  /* Anonymous user gifted a subscription */
  client.bind('twitch-anongiftsub', function _on_twitch_anongiftsub(e) {
    Util.StorageAppend("debug-msg-log", e);
    Content.addHTML(client.get('HTMLGen').anongiftsub(e));
  });

  /* Bind the rest of the events and warn about unbound events */
  client.bind("twitch-userstate", function() {});
  client.bind("twitch-roomstate", function() {});
  client.bind("twitch-globaluserstate", function() {});
  client.bind("twitch-ack", function() {});
  client.bind("twitch-ping", function() {});
  client.bind("twitch-names", function() {});
  client.bind("twitch-topic", function() {});
  client.bind("twitch-privmsg", function() {});
  client.bind("twitch-whisper", function() {});
  client.bind("twitch-other", function() {});
  client.bindDefault(function _on_default(e) { Util.Warn("Unbound event:", e); });

  /* End of all the binding 0}}} */

  /* Finally, connect */
  client.Connect();
}

