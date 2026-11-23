// The Sticky over USB: its setup protocol (sticky_device.h) and flashing.
//
// Setup protocol: newline-delimited JSON at 115200 baud on the console UART,
// shared with the log. We keep lines starting with '{' that carry
// "sticky":"setup". Commands: get, set (settings and/or wifi), reset. The board
// sends {"event":"hello",…} at boot. Its receive buffer is small: we send 64
// bytes at a time with short pauses.

import { ESPLoader, Transport } from "./vendor/esptool-js-0.7.1.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class StickySerial {
  constructor(port) {
    this.port = port;
    this.listeners = new Set();
    this.reading = false;
    this.log = [];            // the Sticky's own log lines, newest last
  }

  /** Opens the port at 115200 without disturbing the chip (DTR/RTS low). */
  async open() {
    await this.port.open({ baudRate: 115200, bufferSize: 8192 });
    try { await this.port.setSignals({ dataTerminalReady: false, requestToSend: false }); } catch {}
    this.writer = this.port.writable.getWriter();
    this.reading = true;
    this.readLoop();
  }

  async readLoop() {
    const decoder = new TextDecoder();
    let pending = "";
    while (this.reading && this.port.readable) {
      this.reader = this.port.readable.getReader();
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          let i;
          while ((i = pending.search(/[\r\n]/)) >= 0) {
            const line = pending.slice(0, i).trim();
            pending = pending.slice(i + 1);
            if (!line.startsWith("{") || !line.includes('"sticky"')) {
              if (line) this.logLine(line);
              continue;
            }
            try {
              const msg = JSON.parse(line);
              if (msg.sticky === "setup") this.listeners.forEach((f) => f(msg));
            } catch {}
          }
          if (pending.length > 65536) pending = pending.slice(-4096);
        }
      } catch { /* port closed or device reset */ }
      finally { try { this.reader.releaseLock(); } catch {} }
      if (this.reading) await sleep(200);
    }
  }

  /** Keeps and prints a Sticky log line so a crash is visible in F12. */
  logLine(line) {
    this.log.push(line);
    if (this.log.length > 60) this.log.shift();
    console.info("[sticky]", line);
  }

  /** The last lines the Sticky printed — paste them into a bug report. */
  recentLog() {
    return this.log.slice(-25).join("\n");
  }

  async close() {
    this.reading = false;
    try { await this.reader?.cancel(); } catch {}
    try { this.writer?.releaseLock(); } catch {}
    try { await this.port.close(); } catch {}
  }

  async send(obj) {
    const bytes = new TextEncoder().encode("\n" + JSON.stringify(obj) + "\n");
    for (let i = 0; i < bytes.length; i += 64) {
      await this.writer.write(bytes.slice(i, i + 64));
      await sleep(12);
    }
  }

  /** Next message matching `test` within `ms`, or null. */
  next(test, ms) {
    return new Promise((resolve) => {
      const done = (v) => { clearTimeout(t); this.listeners.delete(on); resolve(v); };
      const on = (m) => { if (!test || test(m)) done(m); };
      const t = setTimeout(() => done(null), ms);
      this.listeners.add(on);
    });
  }

  /** Asks for the info line, retrying; null if the firmware doesn't answer. */
  async info(tries = 3) {
    for (let i = 0; i < tries; i++) {
      const wait = this.next((m) => m.ok && m.event, 1500);
      await this.send({ sticky: "setup", cmd: "get" });
      const r = await wait;
      if (r) return r;
    }
    return null;
  }

  /** Starts a Wi-Fi scan (firmware 0.4+; older ones answer with an error, ignored). The list comes with info(). */
  async scan() { try { await this.send({ sticky: "setup", cmd: "scan" }); } catch {} }
  /** Forgets the key Home Assistant gave it, so Home Assistant can add it afresh. */
  async unpair() { try { await this.send({ sticky: "setup", cmd: "unpair" }); } catch {} }

  /** Saves settings and/or Wi-Fi; resolves once the board confirmed (it then restarts). */
  async set({ settings, wifi }) {
    const cmd = { sticky: "setup", cmd: "set" };
    if (settings) cmd.settings = settings;
    if (wifi) cmd.wifi = wifi;
    const wait = this.next((m) => m.saved || m.ok === false, 5000);
    await this.send(cmd);
    const r = await wait;
    if (!r) throw new Error("The Sticky didn't confirm. Try again, or reconnect the cable.");
    if (r.ok === false) throw new Error(r.error || "The Sticky refused the settings.");
    return r;
  }

  /** After a restart: waits for the board to answer again. */
  async waitForBoard(ms = 25000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      const r = await this.info(1);
      if (r) return r;
      await sleep(800);
    }
    return null;
  }
}

/** Flashes `data` (a factory image) at 0x0, reporting progress (0…1) and log lines. */
export async function flash(port, data, { eraseAll, onProgress, onLog }) {
  const transport = new Transport(port, false);
  const terminal = {
    clean() {},
    writeLine: (l) => onLog?.(l),
    write: (l) => onLog?.(l),
  };
  const loader = new ESPLoader({ transport, baudrate: 460800, romBaudrate: 115200, terminal });
  try {
    const chip = await loader.main("default_reset");
    onLog?.(`Connected to ${chip}`);
    if (!/ESP32-S3/i.test(chip)) throw new Error(`This is an ${chip}, not the Sticky's ESP32-S3.`);
    await loader.writeFlash({
      fileArray: [{ data, address: 0 }],
      flashMode: "keep", flashFreq: "keep", flashSize: "keep",
      eraseAll, compress: true,
      reportProgress: (_i, written, total) => onProgress?.(written / total),
    });
    onLog?.("Restarting the Sticky…");
    await loader.after("hard_reset");
  } finally {
    try { await transport.disconnect(); } catch {}
  }
}
