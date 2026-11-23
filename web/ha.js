// Home Assistant from the browser, over its WebSocket API (the REST API
// refuses other sites; WebSockets don't). The token stays in this page.

export class HAError extends Error {}

export class HAClient {
  constructor(url, token) {
    this.base = url.replace(/\/+$/, "");
    this.token = token;
    this.id = 1;
    this.pending = new Map();
    this.subs = new Map();
  }

  /** Why this page can't reach `url`, or null. */
  static problem(url) {
    let u;
    try { u = new URL(url); } catch { return "That isn't a valid address. Use something like https://homeassistant.example.com"; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return "The address must start with https://";
    if (u.protocol === "http:" && location.protocol === "https:" && !["localhost", "127.0.0.1"].includes(u.hostname))
      return "Browsers don't let a secure page (https) talk to an http:// address. Use your Home Assistant's https address (for example your Nabu Casa or reverse-proxy URL), or enter the entities by hand below.";
    return null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.base.replace(/^http/, "ws") + "/api/websocket");
      this.ws = ws;
      const fail = (m) => { reject(new HAError(m)); try { ws.close(); } catch {} };
      const timer = setTimeout(() => fail("Home Assistant didn't answer. Check the address."), 10000);
      ws.onerror = () => { clearTimeout(timer); fail("Couldn't reach Home Assistant at that address."); };
      ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.type === "auth_required") ws.send(JSON.stringify({ type: "auth", access_token: this.token }));
        else if (msg.type === "auth_invalid") { clearTimeout(timer); fail("Home Assistant refused the token."); }
        else if (msg.type === "auth_ok") { clearTimeout(timer); this.version = msg.ha_version; resolve(this); }
        else if (msg.type === "result" && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          msg.success ? res(msg.result) : rej(new HAError(msg.error?.message || "Request failed"));
        } else if (msg.type === "event" && this.subs.has(msg.id)) this.subs.get(msg.id)(msg.event);
      };
    });
  }

  call(payload) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, ...payload }));
    return new Promise((res, rej) => this.pending.set(id, { res, rej }));
  }

  states() { return this.call({ type: "get_states" }); }
  config() { return this.call({ type: "get_config" }); }
  /** Set-up flows waiting on the user (a re-authentication, for one). */
  flows() { return this.call({ type: "config_entries/flow/progress" }); }
  /** The integration's entries: {entry_id, title, state, …}. */
  entries(domain) { return this.call({ type: "config_entries/get", domain }); }

  /** Calls f(entity_id, {state, attributes}) whenever one of `entities` changes. */
  async watch(entities, f) {
    const id = this.id + 1, known = {};
    this.subs.set(id, (ev) => {
      for (const [eid, e] of Object.entries(ev.a || {})) {
        known[eid] = { state: e.s, attributes: e.a || {} };
        f(eid, known[eid]);
      }
      for (const [eid, diff] of Object.entries(ev.c || {})) {
        const k = known[eid] || (known[eid] = { state: "", attributes: {} });
        if (diff["+"]?.s !== undefined) k.state = diff["+"].s;
        if (diff["+"]?.a) Object.assign(k.attributes, diff["+"].a);
        for (const gone of diff["-"]?.a || []) delete k.attributes[gone];
        f(eid, k);
      }
    });
    await this.call({ type: "subscribe_entities", entity_ids: entities });
  }

  close() { try { this.ws?.close(); } catch {} }
}
