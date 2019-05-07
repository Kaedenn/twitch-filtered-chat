/* HTML Generator for the Twitch Filtered Chat */

"use strict";

/* TODO:
 * Implement raid and calling code
 * Implement TwitchSubEvent htmlgen
 * Fix URL formatting
 * Fix the following username colors:
 *   #725ac1
 */

/** Chat message structure
 *
 * div.line.line-wrapper
 *  div.chat-line (has attrs)
 *   span.badges
 *    img.badge
 *   span.username
 *   span.message
 *
 * div.chat-line attrs:
 *  data-id
 *  data-user
 *  data-user-id
 *  data-channel
 *  data-channel-id
 *  data-subscriber
 *  data-vip
 *  data-mod
 *  data-caster
 *  data-sent-ts
 *  data-recv-ts
 */

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
    this._bg_colors = [];

    /* Ensure config has certain values */
    if (!this._config.Layout) this._config.Layout = {};
  }

  set client(c) { this._client = c; }
  setValue(k, v) { this._config[k] = v; }
  getValue(k) { return this._config[k]; }

  set bgcolors(colors) {
    this._bg_colors = [];
    for (let c of colors) {
      this._bg_colors.push(c);
    }
  }

  getColorFor(username) {
    let name = `${username}`;
    if (typeof(username) !== "string") {
      Util.Error(`Expected string, got ${username}: ${JSON.stringify(username)}`);
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

  _twitchEmote(emote) {
    if (emote.id !== null) {
      let $e = $(`<img class="emote twitch-emote" />`);
      $e.attr('tw-emote-id', emote.id);
      $e.attr('src', Twitch.URL.Emote(emote.id));
      if (emote.name) {
        $e.attr('alt', emote.name);
        $e.attr('title', emote.name);
      }
      let html = $e[0].outerHTML;
      emote.final_length = html.length;
      return html;
    }
    return null;
  }

  _genCheer(cheer, bits) {
    /* Use the highest tier that doesn't exceed the cheered bits */
    let t = cheer.tiers.filter((t) => bits >= t.min_bits).max((t) => t.min_bits);
    let color = t.color;
    /* Use the smallest scale available */
    let url = t.images.dark.animated[cheer.scales.min((s) => +s)];
    let $w = $(`<span class="cheer cheermote"></span>`);
    $w.css('color', t.color);
    let $img = $(`<img class="cheer-image" />`);
    $img.attr('alt', cheer.prefix).attr('title', cheer.prefix);
    $img.attr('src', url);
    $w.append($img);
    $w.append(bits);
    return $w[0].outerHTML;
  }

  _genTwitchBadge(event, badge_name, badge_num) {
    let $b = $(`<img class="badge" width="18px" height="18px" />`);
    $b.attr('tw-badge-cause', JSON.stringify([badge_name, badge_num]));
    $b.attr('data-badge', '1');
    $b.attr('data-badge-name', badge_name);
    $b.attr('data-badge-num', badge_num);
    $b.attr('title', `${badge_name}/${badge_num}`);
    $b.attr('alt', `${badge_name}/${badge_num}`);
    if (this._client.IsGlobalBadge(badge_name, badge_num)) {
      let badge_info = this._client.GetGlobalBadge(badge_name, badge_num);
      $b.attr('src', badge_info.image_url_1x);
      $b.attr('tw-badge-scope', 'global');
    } else if (this._client.IsChannelBadge(event.channel, badge_name)) {
      let badge_info = this._client.GetChannelBadge(event.channel, badge_name);
      let badge_src = !!badge_info.alpha ? badge_info.alpha : badge_info.image;
      $b.attr('src', badge_src);
      $b.attr('tw-badge', JSON.stringify(badge_info));
      if (!!event.channel) {
        $b.attr('tw-badge-scope', 'channel');
        $b.attr('tw-badge-channel', event.channel.channel.lstrip('#'));
      }
    } else {
      return null;
    }
    return $b;
  }

  _genBadges(event) {
    let $bc = $(`<span class="badges" data-badges="1"></span>`);
    $bc.addClass('badges');
    $bc.attr('data-badges', '1');
    let total_width = 0;
    if (event.flags['badges']) {
      total_width += 18 * event.flags['badges'].length
    }
    if (event.flags['ffz-badges']) {
      total_width += 18 * event.flags['ffz-badges'].length
    }
    if (event.flags['bttv-badges']) {
      total_width += 18 * event.flags['bttv-badges'].length
    }
    $bc.css("overflow", "hidden");
    $bc.css("width", `${total_width}px`);
    $bc.css("max-width", `${total_width}px`);
    /* Add Twitch-native badges */
    if (event.flags.badges) {
      for (let [badge_name, badge_num] of event.flags.badges) {
        let $b = this._genTwitchBadge(event, badge_name, badge_num);
        if ($b === null) {
          console.warn('Unknown badge', badge_name, badge_num, 'for', event);
          continue;
        } else {
          $bc.append($b);
        }
      }
    }
    /* Add FFZ badges */
    if (event.flags['ffz-badges']) {
      for (let badge of Object.values(event.flags['ffz-badges'])) {
        let $b = $(`<img class="badge ffz-badge" width="18px" height="18px" />`);
        $b.attr('data-badge', '1');
        $b.attr('data-ffz-badge', '1');
        $b.attr('tw-badge-scope', 'ffz');
        $b.attr('src', Util.URL(badge.image));
        $b.attr('alt', badge.name);
        $b.attr('title', badge.title);
        $bc.append($b);
      }
    }
    if (event.flags['bttv-badges']) {
      for (let badge of Object.values(event.flags['bttv-badges'])) {
        let $b = $(`<img class="badge bttv-badge" width="18px" height="18px" />`);
        $b.attr('data-badge', '1');
        $b.attr('data-ffz-badge', '1');
        $b.attr('tw-badge-scope', 'ffz');
        /* For if BTTV ever adds badges */
      }
    }
    return $bc;
  }

  _genName(event) {
    let user = event.flags["display-name"] || event.user;
    let color = event.flags.color || this.getColorFor(event.user);
    if (!color) { color = '#ffffff'; }
    let $e = $(`<span class="username" data-username="1"></span>`);
    $e.addClass('username');
    $e.attr('data-username', '1');
    $e.css('color', color);
    /* Calculate "brightness" of the username */
    let luma = (new Util.Color(color)).yiq[0];
    if (luma >= 128) {
      $e.addClass("luma-dark");
    } else if (luma >= 120) {
      $e.addClass("luma-mid");
    } else {
      $e.addClass("luma-light");
    }
    $e.text(user);
    return $e[0].outerHTML;
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
      if (word0 == "force") {
        event.flags.force = true;
      } else if (word0 == "forcejs") {
        event.flags.force = true;
      } else if (word0 == "forcebits" || word0 == "forcecheer") {
        /* Modify both message and event.message, as they're both used below */
        if (word0.length == 9) {
          event.values.message = "cheer1000" + event.message.substr(9);
          message = "cheer1000" + message.substr(9);
        } else if (word0.length == 10) {
          event.values.message = "cheer1000" + event.message.substr(10);
          message = "cheer1000 " + message.substr(10);
        }
        event.flags.bits = 1000;
        event.flags.force = true;
      }
    }

    /* Handle emotes */
    if (event.flags.emotes) {
      let emotes = event.flags.emotes.map(function(e) {
        return {'id': e.id, 'name': e.name,
                'start': map[e.start], 'end': map[e.end],
                'ostart': e.start, 'oend': e.end};
      });
      emotes.sort((a, b) => a.start - b.start);
      while (emotes.length > 0) {
        let emote = emotes.pop();
        let msg_start = message.substr(0, emote.start);
        let msg_end = message.substr(emote.end+1);
        let emote_str = this._twitchEmote(emote);
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        for (let idx = emote.ostart; idx < map.length; ++idx) {
          if (map[idx] >= emote.end) {
            map[idx] += emote.final_length - (emote.end - emote.start) - 1;
          }
        }
      }
    }

    /* Handle cheers */
    if (event.flags.bits && event.flags.bits > 0) {
      let bits_left = event.flags.bits;
      let matches = this._client.FindCheers(event.channel.channel, event.message);
      matches.sort((a, b) => a.start - b.start);
      while (matches.length > 0) {
        let match = matches.pop();
        let cheer = match.cheer;
        let bits = match.bits;
        let start = map[match.start];
        let end = map[match.end];
        let chtml = this._genCheer(cheer, bits);
        let msg_start = message.substr(0, start);
        let msg_end = message.substr(end);
        message = msg_start + chtml + msg_end;
        /* Adjust the map */
        for (let idx = match.start; idx < map.length; ++idx) {
          if (map[idx] - map[match.start] >= (end - start)) {
            map[idx] += chtml.length - (end - start);
          }
        }
        let end_words = msg_end.trimStart().split(" ");
        /* Scan for cheer effects */
        while (end_words.length > 0) {
          let word = end_words[0].toLowerCase();
          let s = GetCheerStyle(word);
          if (!s) { break; }
          if (!s._disabled) {
            if (bits_left < s.cost) { break; }
            $effects.push(s);
            bits_left -= s.cost;
          }
          end_words.shift();
        }
      }
    }

    /* Handle FFZ emotes */
    let ffz_emotes = this._client.GetFFZEmotes(event.channel.channel);
    if (ffz_emotes && ffz_emotes.emotes) {
      let ffz_emote_arr = [];
      for (let [k,v] of Object.entries(ffz_emotes.emotes)) {
        ffz_emote_arr.push([v, k]);
      }
      let results = Twitch.ScanEmotes(event.message, ffz_emote_arr);
      results.sort((a, b) => (a.start - b.start));
      while (results.length > 0) {
        let emote = results.pop();
        let start = emote.start;
        let end = emote.end+1;
        let mstart = map[start];
        let mend = map[end];
        let url = emote.id.urls[Object.keys(emote.id.urls).min()];
        let $i = $(`<img class="emote ffz-emote" ffz-emote-id=${emote.id.id} />`);
        $i.attr('src', url);
        $i.attr('width', emote.id.width);
        $i.attr('height', emote.id.height);
        let msg_start = message.substr(0, mstart);
        let msg_end = message.substr(mend);
        let emote_str = $i[0].outerHTML;
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        for (let idx = emote.start; idx < map.length; ++idx) {
          if (map[idx] - map[emote.start] >= (end - start)) {
            map[idx] += emote_str.length - (end - start);
          }
        }
      }
    }

    /* Handle BTTV emotes */
    let bttv_emotes = this._client.GetBTTVEmotes(event.channel.channel);
    if (bttv_emotes && bttv_emotes.emotes) {
      let bttv_emote_arr = [];
      for (let [k,v] of Object.entries(bttv_emotes.emotes)) {
        bttv_emote_arr.push([v, k]);
      }
      let results = Twitch.ScanEmotes(event.message, bttv_emote_arr);
      results.sort((a, b) => (a.start - b.start));
      while (results.length > 0) {
        let emote = results.pop();
        let start = emote.start;
        let end = emote.end+1;
        let mstart = map[start];
        let mend = map[end];
        let $i = $(`<img class="emote bttv-emote" bttv-emote-id="${emote.id.id}" />`);
        $i.attr("src", emote.id.url);
        let msg_start = message.substr(0, mstart);
        let msg_end = message.substr(mend);
        let emote_str = $i[0].outerHTML;
        message = `${msg_start}${emote_str}${msg_end}`;
        /* Adjust the map */
        for (let idx = emote.start; idx < map.length; ++idx) {
          if (map[idx] - map[emote.start] >= (end - start)) {
            map[idx] += emote_str.length - (end - start);
          }
        }
      }
    }

    /* @user highlighting */
    message = message.replace(/(^|\b\s*)(@\w+)(\s*\b|$)/g, (function(m, p1, p2, p3) {
      if (p2.substr(1).toLowerCase() == this._client.GetName().toLowerCase()) {
        $msg.addClass("highlight");
        return `${p1}<em class="at-user at-self">${p2}</em>${p3}`;
      } else {
        return `${p1}<em class="at-user">${p2}</em>${p3}`;
      }
    }).bind(this));

    /* Handle mod-only antics */
    if (event.ismod && !$("#cbForce").is(":checked") && event.flags.force) {
      if (event.message.startsWith('force ')) {
        /* "force": use raw message with no formatting */
        message = event.message.substr('force '.length);
      } else if (event.message.startsWith('forcejs ')) {
        /* "forcejs": use raw message wrapped in script tags */
        message = `<script>${event.message.substr('forcejs '.length)}</script>`;
      }
    }

    $msg.html(message);

    return {e: this.formatLinks($msg), effects: $effects};
  }

  _addChatAttrs($e, event) {
    $e.attr("data-id", event.flags.id);
    $e.attr("data-user", event.user);
    $e.attr("data-user-id", event.flags["user-id"]);
    $e.attr("data-channel", event.channel.channel.lstrip('#'));
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
    $e.addClass("chat-line").addClass("sub").addClass("notice");
    $e.append($(this._genBadges(event)));
    $e.append($(this._genName(event)));
    $e.html($e.html() + "&nbsp;");
    return $e;
  }

  gen(event) {
    let $e = $(`<div class="chat-line"></div>`);
    let color = event.flags.color || this.getColorFor(event.user);
    if (this._client.IsUIDSelf(event.flags["user-id"])) {
      $e.addClass('self');
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
    $e.append($(this._genBadges(event)));
    $e.append($(this._genName(event)));
    let msg_def = this._genMsgInfo(event);
    if (!event.values.action) {
      $e.html($e.html() + ":");
    } else {
      msg_def.e.css("color", color);
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
    return $e[0].outerHTML;
  }

  sub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    $m.text(`subscribed using ${event.value('sub_plan')}!`);
    $w.append($m);
    return $w[0].outerHTML;
  }

  resub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    let months = event.value('sub_months');
    let streak = event.value('sub_streak_months');
    if (streak) {
      $m.text(`resubscribed for ${months} months, a streak of ${streak} months!`);
    } else {
      $m.text(`resubscribed for ${months} months!`);
    }
    $w.append($m);
    return $w[0].outerHTML;
  }

  giftsub(event) {
    let $w = this._genSubWrapper(event);
    let $m = $(`<span class="message sub-message"></span>`);
    if (event.flags['system-msg']) {
      $m.text(event.flags['system-msg']);
    } else {
      let user = event.flags['msg-param-recipient-user-name'];
      let gifter = event.flags['login'];
      $m.text(`${gifter} gifted a subscription to ${user}!`);
    }
    $w.append($m);
    return $w[0].outerHTML;
  }

  anongiftsub(event) {
    let user = event.flags['msg-param-recipient-user-name'];
    let gifter = event.flags.login;
    let months = event.flags['msg-param-sub-months'];
    return `${event.command}: ${gifter} gifted to ${user} ${months}`;
  }

  raid(event) {
    /* TODO */
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
    return $l[0].outerHTML;
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

  formatLinks(msg) {
    /* Clone msg */
    let $m = $(msg[0].outerHTML);
    /* Format links in $m */
    for (let [i, e] of Object.entries($m.contents())) {
      if (e.nodeType === document.TEXT_NODE) {
        let m = e.nodeValue.match(Util.URL_REGEX);
        if (m && m.length > 0) {
          for (let url of m) {
            /* TODO: replace the node entirely */
            e.nodeValue = e.nodeValue.replace(url, this.url(url));
          }
        }
      }
    }
    /* TODO: return $m over msg */
    return msg;
  }
}
