/* HTML Generator for the Twitch Filtered Chat */

"use strict";

/* TODO:
 * Add more badge information on hover
 * Add emote information on hover
 * Add clip information
 * Implement "new user" ritual
 * Implement "light" and "dark" colorschemes
 */

/* exported HTMLGenerator */
class HTMLGenerator {
  constructor(client, config=null) {
    this._client = client;
    this._config = config || {};
    this._default_colors = [
      "lightseagreen",
      "forestgreen",
      "goldenrod",
      "dodgerblue",
      "darkorchid",
      "crimson"];
    this._user_colors = {};
    this._bg_colors = ["#1d1d1d", "#0a0a0a", "#d1d1d1"];

    /* Ensure config has certain values */
    if (!this._config.Layout) this._config.Layout = {};
    if (!this._config.ShowClips) this._config.ShowClips = false;
  }

  setValue(k, v) {
    this._config[k] = v;
  }

  getValue(k) {
    return this._config[k];
  }

  getColorFor(username) {
    let name = `${username}`;
    if (typeof(username) !== "string") {
      Util.Error("Expected string, got", typeof(username), JSON.stringify(username));
    }
    if (!this._user_colors.hasOwnProperty(name)) {
      /* Taken from Twitch vendor javascript */
      let r = 0;
      for (let i = 0; i < name.length; ++i) {
        r = (r << 5) - r + name.charCodeAt(i);
      }
      r = r % this._default_colors.length;
      if (r < 0) r += this._default_colors.length;
      this._user_colors[name] = this._default_colors[r];
    }
    return this._user_colors[name];
  }

  genBorderCSS(color) {
    let border = Util.GetMaxContrast(color, this._bg_colors);
    return [
      "text-shadow",
      `-0.8px -0.8px 0 ${border}, 0.8px -0.8px 0 ${border},
       -0.8px  0.8px 0 ${border}, 0.8px  0.8px 0 ${border}`
    ];
  }

  genName(name, color) {
    let $e = $(`<span class="username"></span>`);
    $e.css("color", color || this.getColorFor(name) || "#ffffff");
    /* Determine the best border color to use */
    let [attr, val] = this.genBorderCSS($e.css("color"));
    $e.css(attr, val);
    /* Clicking on the name will open the context window */
    $e.attr("data-username", "1");
    $e.text(name);
    return $e;
  }

  twitchEmote(id) {
    return this._emote("twitch", this._client.GetEmote(id), {id: id});
  }

  _checkUndefined(ev, $w) {
    /* Verify the message doesn't contain "undefined" */
    if ($w[0].outerHTML.indexOf("undefined") > -1) {
      Util.Error("msg contains undefined");
      Util.ErrorOnly(ev, $w, $w[0].outerHTML);
    }
  }

  _emote(source, url, opts=null) {
    let cls = `${source.replace(/[^a-z0-9_]/g, "")}-emote`;
    let $w = $(`<span class="emote-wrapper ${cls}"></span>`);
    let $i = $(`<img class="emote ${cls}" />`);
    $i.attr("src", url);
    $i.attr("data-emote-src", source);
    if (opts) {
      if (opts.id) {
        $i.attr("data-emote-id", opts.id);
        $i.attr("alt", opts.name);
        $i.attr("title", opts.name);
        $w.attr("data-emote-name", opts.id);
      }
      /* opts.name overrides opts.id for all but $i[data-emote-id] */
      if (opts.name) {
        $i.attr("data-emote-name", opts.name);
        $i.attr("alt", opts.name);
        $i.attr("title", opts.name);
        $w.attr("data-emote-name", opts.name);
      }
      if (opts.w || opts.width) {
        $i.attr("width", opts.w || opts.width);
      }
      if (opts.h || opts.height) {
        $i.attr("height", opts.h || opts.height);
      }
      if (opts.def) {
        $i.attr("data-emote-def", JSON.stringify(opts.def));
      }
    }
    $w.append($i);
    return $w[0].outerHTML;
  }

  _genCheer(cheer, bits) {
    /* Use the highest tier image that doesn't exceed the cheered bits */
    let t = cheer.tiers.filter((n) => bits >= n.min_bits).max((n) => n.min_bits);
    /* Use the smallest scale available */
    let url = t.images.dark.animated[cheer.scales.min((s) => +s)];
    let $img = $(`<img class="cheer-image" />`);
    let $w = $(`<span class="cheer cheermote"></span>`);
    $img.attr("alt", cheer.prefix).attr("title", cheer.prefix);
    $img.attr("src", url);
    $w.css("color", t.color);
    $w.append($img);
    $w.append(bits);
    return $w[0].outerHTML;
  }

  _wrapBadge(elem) {
    let $s = $(`<span class="badge"></span>`);
    /* Copy all data attributes from elem to $s */
    for (let attr of elem.get()[0].getAttributeNames()) {
      if (attr.match(/^data-/)) {
        $s.attr(attr, elem.attr(attr));
      }
    }
    let getData = (aname) => elem.attr("data-" + aname);
    let lines = [];
    let info_str = getData("badge");
    if (info_str.length > 0) {
      let info = JSON.parse(info_str);
      if (info.image_url_4x) {
        $s.attr("data-icon-large-src", info.image_url_4x);
      } else if (info.image_url_2x) {
        $s.attr("data-icon-large-src", info.image_url_2x);
      }
    }
    let badge_desc = `${getData("badge-name")} (${getData("badge-num")})`;
    badge_desc = badge_desc.replace(/^[a-z]/, (e) => e.toUpperCase());
    lines.push(badge_desc);
    let scope = getData("badge-scope");
    if (scope === "global") {
      lines.push("Global");
    } else if (scope === "channel") {
      lines.push("Channel Badge");
      lines.push("#" + getData("badge-channel"));
    } else if (scope === "ffz") {
      lines.push("FFZ");
    } else if (scope === "bttv") {
      lines.push("BTTV");
    }
    /* TODO: Add more to $s.attr("data-text") */
    /* Replace spaces in each line with &nbsp; (\xa0, 160) */
    $s.attr("data-text", lines.map((l) => l.replace(/ /g, "\xa0")).join("\n"));
    return $s.append(elem);
  }

  _genBadges(event) {
    let $bc = $(`<span class="badges" data-badges="1"></span>`);
    $bc.addClass("badges");
    let total_width = 0;
    if (event.flags["badges"]) {
      total_width += 18 * event.flags["badges"].length
    }
    if (event.flags["ffz-badges"]) {
      total_width += 18 * event.flags["ffz-badges"].length
    }
    if (event.flags["bttv-badges"]) {
      total_width += 18 * event.flags["bttv-badges"].length
    }
    $bc.css("overflow", "hidden");
    $bc.css("width", `${total_width}px`);
    $bc.css("max-width", `${total_width}px`);
    /* Add Twitch-native badges */
    if (event.flags.badges) {
      for (let [badge_name, badge_num] of event.flags.badges) {
        let $b = $(`<img class="badge" width="18px" height="18px" />`);
        $b.attr("data-badge-name", badge_name);
        $b.attr("data-badge-num", badge_num);
        $b.attr("data-badge-cause", JSON.stringify([badge_name, badge_num]));
        $b.attr("data-badge", "1");
        $b.attr("title", `${badge_name}/${badge_num}`);
        $b.attr("alt", `${badge_name}/${badge_num}`);
        if (this._client.IsGlobalBadge(badge_name, badge_num)) {
          let badge_info = this._client.GetGlobalBadge(badge_name, badge_num);
          $b.attr("src", badge_info.image_url_1x);
          $b.attr("data-badge-scope", "global");
          $b.attr("data-badge", JSON.stringify(badge_info));
        } else if (this._client.IsChannelBadge(event.channel, badge_name)) {
          let badge_info = this._client.GetChannelBadge(event.channel, badge_name);
          let badge_src = badge_info.alpha || badge_info.image;
          $b.attr("src", badge_src);
          $b.attr("data-badge", JSON.stringify(badge_info));
          $b.attr("data-badge-scope", "channel");
          $b.attr("data-badge-channel", event.channel.channel.replace(/^#/, ""));
        } else {
          Util.Warn("Unknown badge", badge_name, badge_num, "for", event);
          continue;
        }
        $bc.append(this._wrapBadge($b));
      }
    }
    /* Add FFZ badges */
    if (event.flags["ffz-badges"]) {
      for (let badge of Object.values(event.flags["ffz-badges"])) {
        let $b = $(`<img class="badge ffz-badge" width="18px" height="18px" />`);
        $b.attr("data-badge", "1");
        $b.attr("data-ffz-badge", "1");
        $b.attr("data-badge-scope", "ffz");
        $b.attr("src", Util.URL(badge.image));
        $b.attr("alt", badge.name);
        $b.attr("title", badge.title);
        $bc.append(this._wrapBadge($b));
      }
    }
    /* For if BTTV ever adds badges
    if (event.flags["bttv-badges"]) {
      for (let badge of Object.values(event.flags["bttv-badges"])) {
        let $b = $(`<img class="badge bttv-badge" width="18px" height="18px" />`);
        $b.attr("data-badge", "1");
        $b.attr("data-ffz-badge", "1");
        $b.attr("data-badge-scope", "bttv");
        $b.attr("src", Util.URL(badge.image));
        $b.attr("alt", "Unknown BTTV Badge");
        $b.attr("title", "Unknown BTTV Badge");
        $bc.append(this._wrapBadge($b));
      }
    } */
    return $bc;
  }

  _genName(event) {
    /* Display upper-case name, assign color to lower-case name */
    let user = event.name || event.user;
    let color = event.flags.color || this.getColorFor(event.user);
    if (!color) { color = "#ffffff"; }
    return this.genName(user, color);
  }

  _remap(map, start, end, len) {
    /* IDEA BEHIND MAP ADJUSTMENT:
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
     */
    let mstart = map[start];
    let mend = map[end];
    for (let idx = start; idx < end; ++idx) {
      /* Set values within the range to the end */
      map[idx] = mend + len;
    }
    for (let idx = end; idx < map.length; ++idx) {
      /* Adjust values beyond the range by length */
      map[idx] += len - (mend - mstart);
    }
  }

  _msgCheersTransform(event, message, map, $msg, $effects) {
    if (event.flags.bits && event.flags.bits > 0) {
      let bits_left = event.flags.bits;
      let matches = this._client.FindCheers(event.channel, event.message);
      /* Sort the cheer matches from right-to-left */
      matches.sort((a, b) => a.start - b.start);
      while (matches.length > 0) {
        let match = matches.pop();
        let [start, end] = [map[match.start], map[match.end]];
        let cheer_html = this._genCheer(match.cheer, match.bits);
        let pos = start + cheer_html.length;
        /* Insert the cheer HTML and adjust the map */
        message = message.substr(0, start) + cheer_html + message.substr(end);
        this._remap(map, match.start, match.end, cheer_html.length);
        /* Scan for cheer effects */
        start = end = pos;
        while (pos < message.length) {
          let word = "";
          if (message[pos].match(/\s/)) {
            pos += 1;
          } else {
            /* NOTE: This would be cleaner with some kind of "search starting
             * from" function: message.matchFrom(/\s/, pos) */
            end = message.substr(pos).search(/\s/);
            end = end === -1 ? message.length : pos + end;
            word = message.substring(pos, end);
            let s = GetCheerStyle(word.toLowerCase());
            if (s && !s._disabled && bits_left >= s.cost) {
              /* Continue scanning for disabled effects and effects using more
               * bits than are left */
              $effects.push(s);
              bits_left -= s.cost;
            } else {
              /* Stop scanning at the first non-effect word */
              end = pos;
              break;
            }
            pos = end;
          }
        }
        if (start !== end) {
          /* Remove [start:end] from the message and adjust the map */
          message = message.substr(0, start) + " " + message.substr(end);
          this._remap(map, start, end, 0);
        }
      }
    }
    return message;
  }

  _msgEmotesTransform(event, message, map, $msg, $effects) {
    if (event.flags.emotes) {
      let emotes = event.flags.emotes.map(function(e) {
        return {id: e.id, name: e.name, start: e.start, end: e.end, def: e};
      });
      emotes.sort((a, b) => map[a.start] - map[b.start]);
      while (emotes.length > 0) {
        let emote = emotes.pop();
        let msg_start = message.substr(0, map[emote.start]);
        let msg_end = message.substr(map[emote.end]+1);
        let emote_str = this._emote("twitch", this._client.GetEmote(emote.id), emote);
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        this._remap(map, emote.start, emote.end, emote_str.length - 1);
      }
    }
    return message;
  }

  _msgFFZEmotesTransform(event, message, map, $msg, $effects) {
    let ffz_emotes = this._client.GetFFZEmotes(event.channel);
    if (ffz_emotes && ffz_emotes.emotes) {
      let ffz_emote_arr = [];
      for (let [k,v] of Object.entries(ffz_emotes.emotes)) {
        ffz_emote_arr.push([v, k]);
      }
      let results = Twitch.ScanEmotes(event.message, ffz_emote_arr);
      results.sort((a, b) => (a.start - b.start));
      while (results.length > 0) {
        let emote = results.pop();
        let edef = emote.id;
        let url = edef.urls[Object.keys(edef.urls).min()];
        let emote_opts = {id: edef.id, w: edef.width, h: edef.height, def: edef};
        let emote_str = this._emote("ffz", url, emote_opts);
        let msg_start = message.substr(0, map[emote.start]);
        let msg_end = message.substr(map[emote.end+1]);
        message = `${msg_start}${emote_str}${msg_end}`;
        this._remap(map, emote.start, emote.end+1, emote_str.length)
      }
    }
    return message;
  }

  _msgBTTVEmotesTransform(event, message, map, $msg, $effects) {
    let all_emotes = this._client.GetGlobalBTTVEmotes();
    let ch_emotes = this._client.GetBTTVEmotes(event.channel);
    let emotes = {};
    for (let [k, v] of Object.entries(all_emotes)) {
      emotes[k] = v;
    }
    /* Channel emotes override global emotes */
    for (let [k, v] of Object.entries(ch_emotes)) {
      emotes[k] = v;
    }
    let emote_arr = [];
    for (let k of Object.keys(emotes)) {
      emote_arr.push([k, RegExp.escape(k)]);
    }
    let results = Twitch.ScanEmotes(event.message, emote_arr);
    results.sort((a, b) => (a.start - b.start));
    while (results.length > 0) {
      let emote = results.pop();
      let edef = emotes[emote.id];
      let emote_opts = {id: edef.id, name: edef.code, def: edef};
      let emote_str = this._emote("bttv", edef.url, emote_opts);
      let msg_start = message.substr(0, map[emote.start]);
      let msg_end = message.substr(map[emote.end+1]);
      message = `${msg_start}${emote_str}${msg_end}`;
      this._remap(map, emote.start, emote.end+1, emote_str.length);
    }
    return message;
  }

  _msgAtUserTransform(event, message, map, $msg, $effects) {
    let pat = /(?:^|\b\s*)(@\w+)(?:\s*\b|$)/g;
    let locations = [];
    let arr = null;
    while ((arr = pat.exec(event.message)) !== null) {
      let start = arr.index + arr[0].indexOf(arr[1]);
      let end = start + arr[1].length;
      locations.push({part: arr[1], start: start, end: end});
    }
    /* Ensure the locations array is indeed sorted */
    locations.sort((a, b) => (a.start - b.start));
    while (locations.length > 0) {
      let location = locations.pop();
      let node = $(`<em class="at-user"></em>`).text(location.part);
      if (location.part.substr(1).equalsLowerCase(this._client.GetName())) {
        node.addClass("at-self");
      }
      let msg_start = message.substr(0, map[location.start]);
      let msg_part = node[0].outerHTML;
      let msg_end = message.substr(map[location.end]);
      message = msg_start + msg_part + msg_end;
      this._remap(map, location.start, location.end, msg_part.length);
    }
    return message;
  }

  _msgURLTransform(event, message, map, $msg, $effects) {
    let locations = [];
    let arr = null;
    while ((arr = Util.URL_REGEX.exec(event.message)) !== null) {
      /* arr = [wholeMatch, matchPart] */
      let start = arr.index + arr[0].indexOf(arr[1]);
      let end = start + arr[1].length;
      locations.push({whole: arr[0], part: arr[1], start: start, end: end});
    }
    /* Ensure the locations array is indeed sorted */
    locations.sort((a, b) => (a.start - b.start));
    while (locations.length > 0) {
      let location = locations.pop();
      let url = null;
      try {
        url = new URL(Util.URL(location.part));
      }
      catch (e) {
        Util.Error("Invalid URL", location, e);
        continue;
      }
      if (this._config.ShowClips && url.hostname === "clips.twitch.tv") {
        $msg.attr("data-clip", url.pathname.strip("/"));
      }
      let new_node = Util.CreateNode(url);
      let msg_start = message.substr(0, map[location.start]);
      let msg_part = new_node.outerHTML;
      let msg_end = message.substr(map[location.end]);
      message = msg_start + msg_part + msg_end;
      this._remap(map, location.start, location.end, msg_part.length);
    }
    return message;
  }

  _genMsgInfo(event) {
    let $msg = $(`<span class="message" data-message="1"></span>`);
    let $effects = [];

    /* Escape the message, keeping track of how characters move */
    let [message, map] = Util.EscapeWithMap(event.message);
    map.push(message.length); /* Prevent off-the-end mistakes */

    /* Handle early mod-only antics */
    if (!$("#cbForce").is(":checked") && event.ismod) {
      let word0 = event.message.split(" ")[0];
      if (word0 === "force") {
        event.flags.force = true;
      } else if (word0 === "forcejs") {
        event.flags.force = true;
      } else if (word0 === "forcebits" || word0 === "forcecheer") {
        let wordlen = word0.length;
        let msgprefix = "cheer1000";
        while (msgprefix.length < word0.length) {
          msgprefix += " ";
        }
        /* Modify message and event.message, as they're both used below */
        event.values.message = msgprefix + event.message.substr(wordlen);
        message = msgprefix + message.substr(wordlen);
        event.flags.bits = 1000;
        event.flags.force = true;
        /* The map doesn't need updating because the message lengths don't change */
      }
    }

    /* Apply message transformations */
    message = this._msgEmotesTransform(event, message, map, $msg, $effects);
    message = this._msgCheersTransform(event, message, map, $msg, $effects);
    message = this._msgFFZEmotesTransform(event, message, map, $msg, $effects);
    message = this._msgBTTVEmotesTransform(event, message, map, $msg, $effects);
    message = this._msgURLTransform(event, message, map, $msg, $effects);
    message = this._msgAtUserTransform(event, message, map, $msg, $effects);

    /* Handle mod-only antics */
    if (event.ismod && !$("#cbForce").is(":checked") && event.flags.force) {
      if (event.message.startsWith("force ")) {
        /* "force": use raw message with no formatting */
        message = event.message.substr("force ".length);
      } else if (event.message.startsWith("forcejs ")) {
        /* "forcejs": use raw message wrapped in script tags */
        message = `<script>${event.message.substr("forcejs ".length)}</script>`;
      }
    }

    $msg.html(message);

    return {e: $msg, effects: $effects};
  }

  _addChatAttrs($e, event) {
    $e.attr("data-id", event.flags.id);
    $e.attr("data-user", event.user);
    $e.attr("data-user-id", event.flags["user-id"]);
    $e.attr("data-channel", event.channel.channel.replace(/^#/, ""));
    if (event.channel.room) {
      $e.attr("data-room", event.channel.room);
    }
    if (event.channel.roomuid) {
      $e.attr("data-roomuid", event.channel.roomuid);
    }
    $e.attr("data-channel-id", event.flags["room-id"]);
    if (event.issub) {
      $e.attr("data-subscriber", "1");
    }
    if (event.ismod) {
      $e.attr("data-mod", "1");
    }
    if (event.isvip) {
      $e.attr("data-vip", "1");
    }
    if (event.iscaster) {
      $e.attr("data-caster", "1");
    }
    $e.attr("data-sent-ts", event.flags["tmi-sent-ts"]);
    $e.attr("data-recv-ts", Date.now());
  }

  _genSubWrapper(event) {
    let $e = $(`<div></div>`);
    this._addChatAttrs($e, event);
    $e.addClass("chat-line").addClass("sub").addClass("notice");
    $e.append(this._genBadges(event));
    $e.append(this._genName(event));
    $e.html($e.html() + "&nbsp;");
    return $e;
  }

  gen(event) {
    let $e = $(`<div class="chat-line"></div>`);
    let color = event.flags.color || this.getColorFor(event.user);
    if (this._client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass("self");
    }
    /* Add data attributes */
    this._addChatAttrs($e, event);
    /* Add attributes as classes */
    if (!this._config.Layout.Slim) {
      if (event.flags.subscriber) $e.addClass("chat-sub");
      if (event.flags.mod) $e.addClass("chat-mod");
      if (event.flags.vip) $e.addClass("chat-vip");
      if (event.flags.broadcaster) $e.addClass("chat-caster");
    }
    /* Generate line content */
    $e.append(this._genBadges(event));
    $e.append(this._genName(event));
    let msg_def = this._genMsgInfo(event);
    if (!event.flags.action) {
      $e.html($e.html() + ":");
    } else {
      let [attr, val] = this.genBorderCSS(color);
      msg_def.e.css("color", color);
      msg_def.e.css(attr, val);
    }
    $e.html($e.html() + "&nbsp;");
    let html_pre = [];
    let html_post = [];
    if (msg_def.effects.length > 0) {
      for (let effect of msg_def.effects) {
        if (effect.class) msg_def.e.addClass(effect.class);
        if (effect.style) msg_def.e.attr("style", effect.style);
        if (effect.wclass) $e.addClass(effect.wclass);
        if (effect.wstyle) $e.attr("style", effect.wstyle);
        if (effect.html_pre) html_pre.push(effect.html_pre);
        if (effect.html_post) html_post.unshift(effect.html_post);
      }
    }
    $e.append($(html_pre.join("") + msg_def.e[0].outerHTML + html_post.join("")));
    return $e;
  }

  sub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this.twitchEmote("PogChamp");
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      $m.text(Strings.Sub(TwitchSubEvent.PlanName(`${event.plan_id}`)));
    }
    $m.addClass("effect-rainbow").addClass("effect-disco");
    $m.html($m.html() + e + "&nbsp;");
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w[0];
  }

  resub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let e = this.twitchEmote("PogChamp");
    let months = event.months || event.total_months;
    let streak = event.streak_months;
    let plan = event.plan || TwitchSubEvent.PlanName(`${event.plan_id}`);
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else if (event.share_streak) {
      $m.text(Strings.ResubStreak(months, plan, streak));
    } else {
      $m.text(Strings.Resub(months, plan));
    }
    $m.addClass("effect-rainbow").addClass("effect-disco");
    $m.html($m.html() + "&nbsp;" + e);
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  giftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      let user = event.recipient;
      let gifter = event.user;
      let plan = TwitchSubEvent.PlanName(`${event.plan_id}`);
      $m.text(Strings.GiftSub(gifter, plan, user));
    }
    let e = this.twitchEmote("HolidayPresent");
    $m.addClass("effect-rainbow").addClass("effect-disco");
    $m.html($m.html() + e + "&nbsp;");
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  anongiftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      let user = event.recipient_name || event.recipient;
      let plan = TwitchSubEvent.PlanName(`${event.plan_id}`);
      $m.text(Strings.AnonGiftSub(plan, user));
    }
    let e = this.twitchEmote("HolidayPresent");
    $m.addClass("effect-rainbow").addClass("effect-disco");
    $m.html($m.html() + e + "&nbsp;");
    $w.append($m);
    this._checkUndefined(event, $w);
    return $w;
  }

  raid(event) {
    let $w = $(`<div class="chat-line raid"></div>`);
    let $m = $(`<span class="message raid-message"></span>`);
    if (event.flags["system-msg"]) {
      $m.text(event.flags["system-msg"]);
    } else {
      /* Unlikely */
      let raider = event.flags["msg-param-displayName"] ||
                   event.flags["msg-param-login"];
      let count = event.flags["msg-param-viewerCount"];
      $m.html(Strings.Raid(raider, count));
    }
    let e = this.twitchEmote("TombRaid");
    $m.addClass("effect-rainbow").addClass("effect-disco");
    $w.append($m);
    $w.html(e + "&nbsp;" + $w.html());
    this._checkUndefined(event, $w);
    return $w;
  }

  new_user(event) { /* TODO */
    /* Strings.NewUser(event.user) */
  }

  genClip(slug, clip_data, game_data) {
    /* TODO: Polish, CSS */
    Util.Log("genClip", slug, clip_data, game_data);
    let $w = $("<div class=\"clip-preview\"></div>");
    let streamer = clip_data.broadcaster_name;
    let game = game_data.name;
    let clipper = clip_data.creator_name;
    let title = clip_data.title;
    let image = clip_data.thumbnail_url;
    $w.attr("data-slug", slug);
    $w.append($("<img class=\"clip-thumbnail\" height=\"48px\"/>").attr("src", image));
    $w.append($("<div class=\"clip-title\"></div>").text(title));
    $w.append($("<div class=\"clip-desc\"></div>").text(`${streamer} playing ${game}`));
    $w.append($("<div class=\"clip-creator\"></div>").text(`Clipped by ${clipper}`));
    return $w;
  }

  /* General-use functions below */

  url(href=null, text=null, classes=null, id=null) {
    let $l = $(`<a></a>`);
    if (href !== null) {
      $l.attr("href", href);
    } else {
      $l.attr("href", "javascript:void(0)");
    }
    if (text !== null) {
      $l.text(text);
    } else if (href !== null) {
      $l.text(href);
    } else {
      $l.val("undefined");
    }
    if (classes !== null) {
      if (typeof(classes) === "string") {
        $l.addClass(classes);
      } else {
        for (let c of classes) {
          $l.addClass(c);
        }
      }
    }
    if (id !== null) {
      $l.attr("id", id);
    }
    return $l;
  }

  checkbox(value, id=null, classes=null, checked=false) {
    let $e = $(`<input type="checkbox" />`);
    $e.attr("value", value);
    if (id !== null) {
      $e.attr("id", id);
    }
    if (typeof(classes) === "string") {
      $e.addClass(classes);
    } else {
      for (let c of classes) {
        $e.addClass(c);
      }
    }
    if (checked !== null) {
      $e.attr("checked", "checked");
    }
    return $e[0].outerHTML;
  }
}

/* vim: set ts=2 sts=2 sw=2 et: */
