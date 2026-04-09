'use strict';

const NumbersApp = {
  _container: null,

  render(container) {
    this._container = container;
    this._draw(container);
    EventBus.on('state:changed', ({ key }) => {
      if (['cash','reputation','network','insightFragments','week','achievements'].includes(key)) this._draw(this._container);
    });
  },

  refresh() { if (this._container) this._draw(this._container); },

  _draw(container) {
    if (!container) return;
    const s = GameState.getAll();
    const history = WeekCycleEngine._weekHistory || [];
    const phase = t('phase.' + s.phase);
    const expertsCount = Object.keys(s.discoveredExperts || {}).length;
    container.innerHTML = `
      <div class="numbers-layout">
        <div class="numbers-title">${t('num.title')}</div>
        <div class="numbers-subtitle">${t('num.subtitle', { week: s.week, phase })}</div>
        <div class="numbers-grid">
          <div class="numbers-card cash">
            <div class="numbers-card-label">${t('num.cash_label')}</div>
            <div class="numbers-card-value">¥${(s.cash||0).toLocaleString()}</div>
            <div class="numbers-card-sub">${t('num.cash_sub')}</div>
          </div>
          <div class="numbers-card reputation">
            <div class="numbers-card-label">${t('num.rep_label')}</div>
            <div class="numbers-card-value">${s.reputation||0}</div>
            <div class="numbers-card-sub">${t('num.rep_sub')}</div>
          </div>
          <div class="numbers-card network">
            <div class="numbers-card-label">${t('num.net_label')}</div>
            <div class="numbers-card-value">${s.network||0}</div>
            <div class="numbers-card-sub">${t('num.net_sub', { n: expertsCount })}</div>
          </div>
          <div class="numbers-card" style="background:rgba(175,82,222,0.06);border-color:rgba(175,82,222,0.2);">
            <div class="numbers-card-label">💡 ${t('res.insight')}</div>
            <div class="numbers-card-value" style="color:#af52de;">${s.insightFragments||0}</div>
            <div class="numbers-card-sub">${getLang()==='en'?'Gained from podcasts & research':'来自播客与调研'}</div>
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <div class="numbers-bar-row">
            <div class="numbers-bar-label"><span>${t('num.cash_safety')}</span><span>${Math.min(100,Math.round((s.cash||0)/500))}%</span></div>
            <div class="numbers-bar-track"><div class="numbers-bar-fill" style="width:${Math.min(100,(s.cash||0)/500)}%;background:var(--success);"></div></div>
          </div>
          <div class="numbers-bar-row">
            <div class="numbers-bar-label"><span>${t('num.reputation_bar')}</span><span>${s.reputation||0}/100</span></div>
            <div class="numbers-bar-track"><div class="numbers-bar-fill" style="width:${Math.min(100,s.reputation||0)}%;background:var(--accent);"></div></div>
          </div>
          <div class="numbers-bar-row">
            <div class="numbers-bar-label"><span>${t('num.insight_bar')}</span><span>${s.insightFragments||0}</span></div>
            <div class="numbers-bar-track"><div class="numbers-bar-fill" style="width:${Math.min(100,(s.insightFragments||0)*10)}%;background:#af52de;"></div></div>
          </div>
        </div>
        <div class="numbers-history">
          <div class="numbers-history-header">${t('num.history_title')}</div>
          ${history.length === 0
            ? `<div class="numbers-history-row" style="color:var(--text-secondary);">${t('num.no_history')}</div>`
            : history.slice(-5).reverse().map(h => {
                const actionCount = h.actions.length;
                return `<div class="numbers-history-row">
                  <span>${t('num.week_row', { n: h.week })}</span>
                  <span style="color:var(--text-secondary);">${t('num.actions_count', { n: actionCount })}</span>
                  <span>${h.actions.map(id => ACTION_DEFS.find(a => a.id === id)?.name.split(' ')[0] || '').join(' ')}</span>
                </div>`;
              }).join('')
          }
        </div>
        <div style="margin-top:16px;">
          <div class="numbers-history-header" style="border-radius:10px 10px 0 0;border:1px solid var(--border);border-bottom:none;">${t('num.achievements_title')}</div>
          <div style="padding:10px 14px;border:1px solid var(--border);border-top:none;border-radius:0 0 10px 10px;">
            ${(s.achievements||[]).length === 0
              ? `<div style="font-size:12px;color:var(--text-secondary);">${t('num.no_achievements')}</div>`
              : (s.achievements||[]).map(a => `<span style="display:inline-block;background:rgba(255,149,0,0.1);color:#c47000;border-radius:4px;padding:2px 8px;font-size:12px;margin:2px;">🏆 ${a}</span>`).join('')
            }
          </div>
        </div>
      </div>`;
  }
};
