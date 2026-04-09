'use strict';

// ===== NotificationSystem =====
const NotificationSystem = {
  show(title, body, duration = 3000) {
    const container = document.getElementById('notification-container');
    const el = document.createElement('div');
    el.className = 'notification';
    el.innerHTML = `<div class="notification-title">${title}</div><div class="notification-body">${body}</div>`;
    container.appendChild(el);
    const dismiss = () => {
      el.style.animation = 'notifOut 0.2s cubic-bezier(0.16,1,0.3,1) forwards';
      setTimeout(() => el.remove(), 200);
    };
    el.onclick = dismiss;
    if (duration > 0) setTimeout(dismiss, duration);
  }
};

// ===== WindowManager =====
const WindowManager = {
  _windows: {},
  _zIndex: 100,
  _dragState: null,

  init() {
    document.addEventListener('mousemove', e => this._onMouseMove(e));
    document.addEventListener('mouseup', () => this._onMouseUp());
  },

  open(appId, title, contentFn, opts = {}) {
    if (this._windows[appId]) { this.focus(appId); return; }
    const w = opts.width || 700, h = opts.height || 500;
    const container = document.getElementById('window-container');
    const rect = container.getBoundingClientRect();
    const x = Math.max(20, (rect.width - w) / 2 + (Math.random() * 40 - 20));
    const y = Math.max(20, (rect.height - h) / 2 + (Math.random() * 40 - 20));

    const win = document.createElement('div');
    win.className = 'app-window';
    win.id = `window-${appId}`;
    win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${++this._zIndex}`;
    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-controls">
          <button class="window-btn close"></button>
          <button class="window-btn minimize"></button>
          <button class="window-btn maximize"></button>
        </div>
        <div class="window-title">${title}</div>
      </div>
      <div class="window-body"></div>`;

    const body = win.querySelector('.window-body');
    if (typeof contentFn === 'function') contentFn(body);
    else body.innerHTML = contentFn;

    win.querySelector('.window-btn.close').onclick = () => this.close(appId);
    win.querySelector('.window-btn.minimize').onclick = () => this.minimize(appId);
    win.querySelector('.window-btn.maximize').onclick = () => this.toggleMaximize(appId);
    win.querySelector('.window-titlebar').addEventListener('mousedown', e => {
      if (e.target.classList.contains('window-btn')) return;
      this._startDrag(appId, e);
    });
    win.addEventListener('mousedown', () => this.focus(appId));

    container.appendChild(win);
    this._windows[appId] = { el: win, maximized: false, prevRect: null };
    this.focus(appId);
    DockManager.setActive(appId, true);
    EventBus.emit('window:opened', appId);
  },

  close(appId) {
    const w = this._windows[appId];
    if (!w) return;
    w.el.style.animation = 'windowClose 0.1s ease-in forwards';
    setTimeout(() => {
      w.el.remove();
      delete this._windows[appId];
      DockManager.setActive(appId, false);
      this._updateActiveApp();
      EventBus.emit('window:closed', appId);
    }, 100);
  },

  minimize(appId) {
    const w = this._windows[appId];
    if (!w) return;
    w.el.style.display = 'none';
    this._updateActiveApp();
  },

  restore(appId) {
    const w = this._windows[appId];
    if (!w) return;
    w.el.style.display = '';
    this.focus(appId);
  },

  toggleMaximize(appId) {
    const w = this._windows[appId];
    if (!w) return;
    if (w.maximized) {
      const r = w.prevRect;
      w.el.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;z-index:${w.el.style.zIndex};border-radius:10px;`;
      w.maximized = false;
    } else {
      w.prevRect = { x: parseInt(w.el.style.left), y: parseInt(w.el.style.top), w: parseInt(w.el.style.width), h: parseInt(w.el.style.height) };
      w.el.style.cssText = `left:0;top:0;width:100%;height:100%;z-index:${++this._zIndex};border-radius:0;`;
      w.maximized = true;
    }
  },

  focus(appId) {
    const w = this._windows[appId];
    if (!w) return;
    Object.values(this._windows).forEach(ww => ww.el.classList.add('window-inactive'));
    w.el.style.zIndex = ++this._zIndex;
    w.el.classList.remove('window-inactive');
    const name = appId.charAt(0).toUpperCase() + appId.slice(1);
    document.getElementById('active-app-name').textContent = name;
  },

  _startDrag(appId, e) {
    const w = this._windows[appId];
    if (!w || w.maximized) return;
    this.focus(appId);
    this._dragState = { appId, startX: e.clientX - parseInt(w.el.style.left), startY: e.clientY - parseInt(w.el.style.top) };
  },
  _onMouseMove(e) {
    if (!this._dragState) return;
    const w = this._windows[this._dragState.appId];
    if (!w) return;
    w.el.style.left = Math.max(0, e.clientX - this._dragState.startX) + 'px';
    w.el.style.top = Math.max(0, e.clientY - this._dragState.startY) + 'px';
  },
  _onMouseUp() { this._dragState = null; },

  _updateActiveApp() {
    let topZ = 0, topApp = 'Finder';
    Object.entries(this._windows).forEach(([id, w]) => {
      if (w.el.style.display !== 'none') {
        const z = parseInt(w.el.style.zIndex) || 0;
        if (z > topZ) { topZ = z; topApp = id.charAt(0).toUpperCase() + id.slice(1); }
      }
    });
    document.getElementById('active-app-name').textContent = topApp;
  },

  isOpen(appId) { return !!this._windows[appId]; },
  getOpen() { return Object.keys(this._windows); }
};

// ===== App Definitions =====
const APPS = [
  { id: 'mail',     icon: '📧', labelKey: 'app.mail',     phase: 'initial' },
  { id: 'imessage', icon: '💬', labelKey: 'app.telegram', phase: 'initial' },
  { id: 'todo',     icon: '📝', labelKey: 'app.todo',     phase: 'initial' },
  { id: 'calendar', icon: '📅', labelKey: 'app.calendar', phase: 'initial' },
  { id: 'numbers',  icon: '📊', labelKey: 'app.numbers',  phase: 'initial' },
  { id: 'podcast',  icon: '🎙️', labelKey: 'app.podcast',  phase: 'initial' },
  { id: '__sep1', separator: true },
  { id: 'safari',   icon: '🌐', labelKey: 'app.safari',   phase: 'week2' },
  { id: 'discord',  icon: '👥', labelKey: 'app.discord',  phase: 'week3' },
  { id: 'contacts', icon: '🗂️', labelKey: 'app.contacts', phase: 'expert' },
  { id: '__sep2', separator: true },
  { id: 'settings', icon: '⚙️', labelKey: 'app.settings', phase: 'initial' },
];

// ===== DockManager =====
const DockManager = {
  init() {
    const dock = document.getElementById('dock');
    const unlockedApps = GameState.get('unlockedApps');
    APPS.forEach(app => {
      if (app.separator) {
        const sep = document.createElement('div');
        sep.className = 'dock-separator';
        dock.appendChild(sep);
        return;
      }
      const locked = !unlockedApps.includes(app.id);
      const item = document.createElement('div');
      item.className = `dock-item${locked ? ' locked' : ''}`;
      item.dataset.appId = app.id;
      item.innerHTML = `<div class="dock-tooltip">${t(app.labelKey)}</div><div class="dock-icon">${app.icon}</div><div class="dock-dot"></div>`;
      if (!locked) item.onclick = () => this.launchApp(app.id);
      dock.appendChild(item);
    });
  },

  launchApp(appId) {
    if (WindowManager.isOpen(appId)) { WindowManager.restore(appId); WindowManager.focus(appId); return; }
    const appDef = APPS.find(a => a.id === appId);
    if (!appDef) return;

    const appMap = {
      settings: () => WindowManager.open(appId, t('app.settings'), b => SettingsApp.render(b), { width: 680, height: 480 }),
      mail:     () => WindowManager.open(appId, t('app.mail'), b => MailApp.render(b), { width: 860, height: 560 }),
      imessage: () => WindowManager.open(appId, t('app.telegram'), b => iMessageApp.render(b), { width: 720, height: 500 }),
      todo:     () => WindowManager.open(appId, t('app.todo'), b => TodoApp.render(b), { width: 420, height: 560 }),
      calendar: () => WindowManager.open(appId, t('app.calendar'), b => CalendarApp.render(b), { width: 780, height: 540 }),
      numbers:  () => WindowManager.open(appId, t('app.numbers'), b => NumbersApp.render(b), { width: 600, height: 540 }),
      podcast:  () => WindowManager.open(appId, t('app.podcast'), b => PodcastApp.render(b), { width: 760, height: 540 }),
      safari:   () => WindowManager.open(appId, t('app.safari'), b => SafariApp.render(b), { width: 800, height: 560 }),
      discord:  () => WindowManager.open(appId, t('app.discord'), b => DiscordApp.render(b), { width: 820, height: 560 }),
      contacts: () => WindowManager.open(appId, t('app.contacts'), b => ContactsApp.render(b), { width: 800, height: 560 }),
    };

    if (appMap[appId]) appMap[appId]();
    else WindowManager.open(appId, t(appDef.labelKey || 'app.settings'), b => { b.innerHTML = `<div class="placeholder-app"><div class="icon">${appDef.icon}</div><div class="title">${t(appDef.labelKey)}</div></div>`; });
  },

  setActive(appId, active) {
    const item = document.querySelector(`.dock-item[data-app-id="${appId}"]`);
    if (!item) return;
    item.querySelector('.dock-dot')?.classList.toggle('active', active);
  },

  unlock(appId) {
    const item = document.querySelector(`.dock-item[data-app-id="${appId}"]`);
    if (!item) return;
    item.classList.remove('locked');
    item.onclick = () => this.launchApp(appId);
    const apps = GameState.get('unlockedApps');
    if (!apps.includes(appId)) { apps.push(appId); GameState.set('unlockedApps', apps); }
  }
};

// ===== MenuBarManager =====
const MenuBarManager = {
  _realClockInterval: null,

  init() {
    this._updateRealClock();
    this._realClockInterval = setInterval(() => this._updateRealClock(), 10000);

    document.getElementById('apple-menu-trigger').onclick = e => { e.stopPropagation(); this._toggleMenu('apple-dropdown'); };
    document.querySelectorAll('#menubar-left .menu-item[data-menu]').forEach(item => {
      item.onclick = e => { e.stopPropagation(); this._toggleMenu(item.dataset.menu + '-dropdown'); };
    });
    document.addEventListener('click', () => this._closeAll());

    // Menu item actions
    document.getElementById('menu-settings')?.addEventListener('click', () => DockManager.launchApp('settings'));
    document.getElementById('menu-save')?.addEventListener('click', () => { GameState.persist(); NotificationSystem.show('系统', t('notif.saved'), 2000); });

    EventBus.on('state:changed', ({ key }) => {
      if (key === 'day') {
        const dayEl = document.getElementById('game-week');
        if (dayEl) {
          const d = GameState.get('day') || 1;
          dayEl.textContent = getLang() === 'en' ? `Day ${d}` : `第 ${d} 天`;
        }
      }
    });

    EventBus.on('phase:changed', phase => {
      const wallpapers = { growing: 'wallpaper-black', scaling: 'wallpaper-quote', exit: 'wallpaper-success' };
      const desktop = document.getElementById('desktop');
      Object.values(wallpapers).forEach(c => desktop.classList.remove(c));
      if (wallpapers[phase]) desktop.classList.add(wallpapers[phase]);
    });
  },

  _updateRealClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2,'0');
    const m = now.getMinutes().toString().padStart(2,'0');
    const el = document.getElementById('menubar-clock');
    if (el) el.textContent = `${now.getMonth()+1}/${now.getDate()} ${h}:${m}`;
  },

  _toggleMenu(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const wasOpen = el.classList.contains('show');
    this._closeAll();
    if (!wasOpen) el.classList.add('show');
  },

  _closeAll() { document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('show')); }
};

// ===== Spotlight =====
const Spotlight = {
  _visible: false, _selectedIdx: 0, _results: [],

  init() {
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') { e.preventDefault(); this.toggle(); }
      if (this._visible) {
        if (e.key === 'Escape') this.hide();
        if (e.key === 'ArrowDown') { e.preventDefault(); this._navigate(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); this._navigate(-1); }
        if (e.key === 'Enter') { e.preventDefault(); this._execute(); }
      }
    });
    document.getElementById('spotlight-overlay').onclick = e => { if (e.target.id === 'spotlight-overlay') this.hide(); };
    document.getElementById('spotlight-input').oninput = e => this._search(e.target.value);
  },

  toggle() { this._visible ? this.hide() : this.show(); },

  show() {
    this._visible = true;
    document.getElementById('spotlight-overlay').classList.add('show');
    const input = document.getElementById('spotlight-input');
    input.value = ''; input.focus();
    this._search('');
  },

  hide() {
    this._visible = false;
    document.getElementById('spotlight-overlay').classList.remove('show');
  },

  _search(query) {
    const q = query.toLowerCase().trim();
    const unlocked = GameState.get('unlockedApps');
    this._results = APPS
      .filter(a => !a.separator && unlocked.includes(a.id))
      .filter(a => !q || a.label.toLowerCase().includes(q) || a.id.includes(q))
      .map(a => ({ id: a.id, icon: a.icon, label: a.label, type: 'App' }));

    this._selectedIdx = 0;
    const results = document.getElementById('spotlight-results');
    results.innerHTML = this._results.map((r, i) =>
      `<div class="spotlight-result ${i === 0 ? 'selected' : ''}" data-idx="${i}">
        <span class="sp-icon">${r.icon}</span><span class="sp-label">${r.label}</span><span class="sp-type">${r.type}</span>
      </div>`
    ).join('');
    results.querySelectorAll('.spotlight-result').forEach(el => {
      el.onclick = () => { this._selectedIdx = parseInt(el.dataset.idx); this._execute(); };
    });
  },

  _navigate(dir) {
    if (!this._results.length) return;
    this._selectedIdx = (this._selectedIdx + dir + this._results.length) % this._results.length;
    document.querySelectorAll('.spotlight-result').forEach((el, i) => el.classList.toggle('selected', i === this._selectedIdx));
  },

  _execute() {
    const r = this._results[this._selectedIdx];
    if (!r) return;
    this.hide();
    DockManager.launchApp(r.id);
  }
};

// ===== ContextMenu =====
const ContextMenu = {
  init() {
    const menu = document.getElementById('context-menu');
    document.getElementById('desktop').addEventListener('contextmenu', e => {
      if (e.target.closest('.app-window, #dock, #menubar')) return;
      e.preventDefault();
      menu.style.display = 'block';
      menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
      menu.style.top = Math.min(e.clientY, window.innerHeight - 180) + 'px';
    });
    document.addEventListener('click', () => { menu.style.display = 'none'; });
    menu.querySelectorAll('.ctx-item').forEach(item => {
      item.onclick = () => {
        const action = item.dataset.action;
        if (action === 'tidy') {
          const ach = GameState.get('achievements');
          if (!ach.includes('tidy_desktop')) {
            ach.push('tidy_desktop');
            GameState.set('achievements', ach);
            NotificationSystem.show('🏆 成就解锁', '「整理桌面」—— 你在虚拟桌面上整理了桌面', 5000);
          } else {
            NotificationSystem.show('桌面', '桌面已经很整洁了 ✨');
          }
        } else if (action === 'about') {
          NotificationSystem.show('OPC创始人', 'v0.2 — Phase 2 核心循环版本', 4000);
        }
        menu.style.display = 'none';
      };
    });
  }
};

// ===== Battery =====
const Battery = {
  _startTime: null,
  init() {
    this._startTime = Date.now();
    setInterval(() => {
      const elapsed = (Date.now() - this._startTime) / 60000;
      const level = Math.max(5, 100 - elapsed * 0.5);
      const icon = document.getElementById('battery-icon');
      icon.textContent = level > 30 ? '🔋' : '🪫';
    }, 60000);
  }
};
