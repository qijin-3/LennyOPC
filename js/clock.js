'use strict';

// ===== ActivityLogger =====
const ActivityLogger = {
  log(type, meta = {}) {
    const activity = GameState.get('recentActivity') || [];
    const day = GameState.get('day') || 1;
    const entry = {
      type, meta,
      gameTime: { day, hour: (typeof GameClock !== 'undefined') ? GameClock.getHour() : 8 },
      realTs: Date.now(),
      desc: this._describe(type, meta)
    };
    activity.push(entry);
    if (activity.length > 30) activity.splice(0, activity.length - 30);
    GameState.set('recentActivity', activity);
    EventBus.emit('activity:logged', entry);
  },

  _describe(type, meta) {
    const lang = getLang();
    const zh = {
      message:        `与 ${meta.expertId || 'NPC'} 对话：「${meta.topic || ''}」`,
      search:         `在 Safari 搜索了「${meta.query || ''}」`,
      discover_expert:`通过 ${meta.channel || ''} 发现了 ${meta.expertId || ''}`,
      paid_consult:   `支付 ¥${meta.fee || 0} 进行了付费咨询`,
      open_link:      `访问了链接：${meta.url || ''}`,
      discord_message:`在 Discord 发言：「${(meta.text || '').slice(0,20)}」`,
      listen_podcast: `收听了 ${meta.expertId || ''} 的播客`,
      mail_choice:    `处理邮件「${meta.subject || ''}」：${meta.choice || ''}`,
    };
    const en = {
      message:        `Messaged ${meta.expertId || 'NPC'}: "${meta.topic || ''}"`,
      search:         `Searched for "${meta.query || ''}"`,
      discover_expert:`Discovered ${meta.expertId || ''} via ${meta.channel || ''}`,
      paid_consult:   `Paid ¥${meta.fee || 0} for consultation`,
      open_link:      `Opened: ${meta.url || ''}`,
      discord_message:`Posted in Discord: "${(meta.text || '').slice(0,20)}"`,
      listen_podcast: `Listened to ${meta.expertId || ''}'s podcast`,
      mail_choice:    `Handled email "${meta.subject || ''}": ${meta.choice || ''}`,
    };
    return (lang === 'en' ? en : zh)[type] || type;
  },

  getRecent(n = 10) {
    return (GameState.get('recentActivity') || []).slice(-n);
  }
};

// ===== GameClock =====
// 2 real minutes = 1 game hour  |  48 real minutes = 1 game day  (at 1x speed)
const REAL_MS_PER_GAME_HOUR = 2 * 60 * 1000;
const GAME_HOURS_PER_DAY = 24;
const TICK_INTERVAL_MS = 1000;
const SPEED_OPTIONS = [0.5, 1, 2, 4];

const GameClock = {
  _gameHour: 8,
  _accumulatedMs: 0,
  _speed: 1,
  _paused: false,
  _tickInterval: null,
  _lastTickTs: null,

  init() {
    // Restore from GameState (single source of truth)
    const day = GameState.get('day') || 1;
    const savedHour = GameState.get('_clockHour') ?? 8;
    const savedSpeed = GameState.get('_clockSpeed') ?? 1;
    // Reconstruct accMs from saved day so clock picks up exactly where it left off
    // Use day-1 complete days + saved hour offset
    this._accumulatedMs = ((day - 1) * GAME_HOURS_PER_DAY + savedHour) * REAL_MS_PER_GAME_HOUR;
    this._gameHour = savedHour;
    this._speed = savedSpeed;
    this._start();
    this._renderClockUI();
  },

  _start() {
    if (this._tickInterval) clearInterval(this._tickInterval);
    this._lastTickTs = Date.now();
    this._tickInterval = setInterval(() => this._tick(), TICK_INTERVAL_MS);
  },

  _tick() {
    if (this._paused) return;
    const now = Date.now();
    const realElapsed = now - (this._lastTickTs || now);
    this._lastTickTs = now;

    this._accumulatedMs += realElapsed * this._speed;

    const totalGameHours = this._accumulatedMs / REAL_MS_PER_GAME_HOUR;
    const newHour = Math.floor(totalGameHours) % GAME_HOURS_PER_DAY;
    const newDay = Math.floor(totalGameHours / GAME_HOURS_PER_DAY) + 1;

    const hourChanged = newHour !== this._gameHour;
    const prevDay = GameState.get('day') || 1;
    const dayChanged = newDay !== prevDay;

    this._gameHour = newHour;

    if (hourChanged) {
      this._persist(); // save hour + day together
      EventBus.emit('clock:hour', { day: newDay, hour: this._gameHour });
      this._renderClockUI();
    }
    if (dayChanged) {
      GameState.set('day', newDay); // also persists via GameState.set
      const newCash = Math.max(0, (GameState.get('cash') || 0) - 430);
      GameState.set('cash', newCash);
      EventBus.emit('clock:day', { day: newDay });
      if (newCash <= 0) EventBus.emit('game:over', { reason: 'cash' });
    }
  },

  _persist() {
    // Store clock state inside GameState so it shares the same save key
    GameState._state._clockHour = this._gameHour;
    GameState._state._clockSpeed = this._speed;
    GameState.persist();
  },

  getHour() { return this._gameHour; },
  getDay() { return GameState.get('day') || 1; },
  getDayLabel() {
    const d = this.getDay();
    return getLang() === 'en' ? `Day ${d}` : `第 ${d} 天`;
  },
  getSpeed() { return this._speed; },
  isPaused() { return this._paused; },

  setSpeed(s) {
    this._speed = s;
    this._persist();
    this._renderClockUI();
  },

  pause() {
    if (this._paused) return;
    this._paused = true;
    this._renderClockUI();
    this._showPauseOverlay(true);
    EventBus.emit('clock:paused');
  },

  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._lastTickTs = Date.now();
    this._renderClockUI();
    this._showPauseOverlay(false);
    EventBus.emit('clock:resumed');
  },

  toggle() { if (this._paused) this.resume(); else this.pause(); },

  _showPauseOverlay(show) {
    let overlay = document.getElementById('pause-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pause-overlay';
      overlay.style.cssText = `
        position:fixed;inset:28px 0 56px 0;background:rgba(0,0,0,0.25);
        backdrop-filter:blur(2px);z-index:8000;pointer-events:all;
        display:flex;align-items:center;justify-content:center;`;
      overlay.innerHTML = `
        <div style="background:rgba(255,255,255,0.92);border-radius:12px;padding:16px 24px;
                    font-size:15px;font-weight:600;color:var(--text-primary);
                    box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">⏸</span>
          <span>${t('clock.paused_banner')}</span>
          <button onclick="GameClock.resume()" style="margin-left:12px;padding:5px 14px;background:var(--accent);
                  color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:600;
                  cursor:pointer;font-family:var(--font-system);">▶ ${t('clock.resume')}</button>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.style.display = show ? 'flex' : 'none';
  },

  _renderClockUI() {
    const container = document.getElementById('clock-controls');
    if (!container) return;
    const h = String(this._gameHour).padStart(2, '0');
    container.innerHTML = `
      <button title="${this._paused ? t('clock.resume') : t('clock.pause')}"
        style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--menubar-text);padding:0 4px;"
        onclick="GameClock.toggle()">${this._paused ? '▶' : '⏸'}</button>
      <div style="display:flex;gap:2px;">
        ${SPEED_OPTIONS.map(s => `
          <button onclick="GameClock.setSpeed(${s})"
            style="background:${s === this._speed ? 'rgba(255,255,255,0.2)' : 'none'};
                   border:none;cursor:pointer;font-size:11px;color:var(--menubar-text);
                   padding:1px 5px;border-radius:4px;font-family:var(--font-system);
                   font-weight:${s === this._speed ? '700' : '400'};">${s}x</button>`).join('')}
      </div>
      <div style="font-size:12px;color:var(--menubar-text);margin-left:4px;opacity:0.85;">
        ${this.getDayLabel()} ${h}:00
      </div>`;
  }
};
