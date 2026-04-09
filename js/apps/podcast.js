'use strict';

const PodcastApp = {
  _activeEpisodeId: null,
  _container: null,

  render(container) {
    this._container = container;
    container.innerHTML = `
      <div class="podcast-layout">
        <div class="podcast-sidebar">
          <div class="podcast-sidebar-header">${t('pod.sidebar_title')}</div>
          <div class="podcast-ep-list" id="podcast-ep-list"></div>
        </div>
        <div class="podcast-main" id="podcast-main">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;color:rgba(255,255,255,0.5);">
            <div style="font-size:48px;">🎙️</div>
            <div style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.8);">${t('pod.sidebar_title')}</div>
            <div style="font-size:13px;text-align:center;max-width:280px;line-height:1.5;">
              ${t('pod.empty_hint').replace('\n','<br>')}
            </div>
          </div>
        </div>
      </div>`;
    this._renderEpisodeList(container);
  },

  _renderEpisodeList(container) {
    const list = container.querySelector('#podcast-ep-list');
    const listenedEps = GameState.get('listenedEpisodes') || [];
    list.innerHTML = EXPERTS.map(e => `
      <div class="podcast-ep-item ${this._activeEpisodeId === e.id ? 'active' : ''} ${listenedEps.includes(e.id) ? 'listened' : ''}"
           data-expert-id="${e.id}">
        <div class="podcast-ep-avatar">${e.avatarEmoji || '👤'}</div>
        <div class="podcast-ep-info">
          <div class="podcast-ep-name">${e.name}</div>
          <div class="podcast-ep-topic">${e.expertise.slice(0,2).join(' · ')}</div>
        </div>
        ${listenedEps.includes(e.id) ? `<span class="podcast-ep-listened-badge">${t('pod.listened_badge')}</span>` : ''}
      </div>`).join('');

    list.querySelectorAll('.podcast-ep-item').forEach(item => {
      item.onclick = () => {
        this._activeEpisodeId = item.dataset.expertId;
        this._renderEpisodeList(container);
        this._renderEpisodeDetail(container, EXPERTS.find(e => e.id === item.dataset.expertId));
      };
    });
  },

  _renderEpisodeDetail(container, expert) {
    const main = container.querySelector('#podcast-main');
    const listenedEps = GameState.get('listenedEpisodes') || [];
    const listenCount = listenedEps.filter(id => id === expert.id).length;
    const listened = listenCount >= 1;
    const listenedTwice = listenCount >= 2;

    const listenLabel = listened
      ? (listenedTwice ? t('pod.deep_listened') : t('pod.listen_again'))
      : t('pod.listen_btn');

    const epTitle = listened
      ? t('pod.listen_times', { n: listenCount, name: expert.name })
      : t('pod.first_listen', { name: expert.name });

    const hasYoutube = !!expert.youtubeId;

    main.innerHTML = `
      <div class="podcast-hero">
        <div class="podcast-hero-art">${expert.avatarEmoji || '👤'}</div>
        <div class="podcast-hero-info">
          <div class="podcast-hero-name">${expert.name}</div>
          <div class="podcast-hero-title">${expert.title}</div>
          <div class="podcast-hero-tags">
            ${expert.expertise.map(tag => `<span class="podcast-tag">${tag}</span>`).join('')}
          </div>
        </div>
      </div>

      ${hasYoutube ? `
      <!-- YouTube embed -->
      <div style="padding:0 16px 12px;">
        <div style="position:relative;width:100%;padding-bottom:56.25%;border-radius:10px;overflow:hidden;background:#000;">
          <iframe id="podcast-yt-iframe"
            src="https://www.youtube.com/embed/${expert.youtubeId}?rel=0&modestbranding=1"
            style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;color:var(--text-secondary);">Lenny's Podcast on YouTube</span>
          <a href="https://www.youtube.com/watch?v=${expert.youtubeId}" target="_blank" rel="noopener"
             style="font-size:11px;color:var(--accent);text-decoration:none;">
            ${getLang() === 'en' ? 'Open in YouTube ↗' : '在 YouTube 中打开 ↗'}
          </a>
        </div>
      </div>` : `
      <!-- Fallback player (no YouTube link) -->
      <div class="podcast-player">
        <div class="podcast-progress">
          <div class="podcast-progress-fill" id="podcast-progress-fill" style="width:${listened ? '100' : '0'}%"></div>
        </div>
        <div class="podcast-controls">
          <button class="podcast-play-btn" id="podcast-play-btn">▶</button>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${epTitle}</div>
            <div style="font-size:11px;color:var(--text-secondary);">Lenny's Podcast</div>
          </div>
        </div>
      </div>`}

      <!-- Listen / unlock action -->
      <div style="padding:0 16px 10px;">
        <button class="podcast-listen-btn" id="podcast-listen-btn" style="width:100%;">${listenLabel}</button>
      </div>

      <div class="podcast-content">
        <div class="podcast-insight-section">
          <div class="podcast-insight-title">${t('pod.insight_title')}</div>
          ${expert.knowledge.map((k, i) => {
            const unlocked = listened || i === 0;
            const deepUnlocked = listenedTwice || k.depth === 1;
            const show = k.depth === 1 ? unlocked : (unlocked && deepUnlocked);
            return `<div class="podcast-insight-card ${show ? '' : 'locked'}">
              ${show
                ? `<strong>[${k.topic}]</strong> ${k.fragment}<br><span style="font-size:11px;color:var(--text-secondary);">— ${k.source}</span>`
                : t('pod.deep_locked')}
            </div>`;
          }).join('')}
        </div>
      </div>`;

    if (!hasYoutube) {
      main.querySelector('#podcast-play-btn')?.addEventListener('click', () => this._simulatePlayback(main, expert));
    }
    main.querySelector('#podcast-listen-btn').onclick = () => {
      this._listenEpisode(container, expert);
    };
  },

  _simulatePlayback(main, expert) {
    const fill = main.querySelector('#podcast-progress-fill');
    const btn = main.querySelector('#podcast-play-btn');
    if (!fill) return;
    let pct = parseInt(fill.style.width) || 0;
    if (pct >= 100) pct = 0;
    btn.textContent = '⏸';
    const interval = setInterval(() => {
      pct = Math.min(100, pct + 2);
      fill.style.width = pct + '%';
      if (pct >= 100) { clearInterval(interval); btn.textContent = '▶'; }
    }, 60);
  },

  _listenEpisode(container, expert) {
    const listened = GameState.get('listenedEpisodes') || [];
    listened.push(expert.id);
    GameState.set('listenedEpisodes', listened);
    GameState.set('insightFragments', (GameState.get('insightFragments') || 0) + 1);

    const discovered = GameState.get('discoveredExperts') || {};
    if (!discovered[expert.id]) {
      discovered[expert.id] = { discoveredAt: GameState.get('week'), channel: 'podcast', trustBonus: 3, added: false };
      GameState.set('discoveredExperts', discovered);
      MemoryManager.increaseTrust(expert.id, 15);
      NotificationSystem.show('🎙️', t('pod.discover_notif', { name: expert.name }), 4000);
    }

    ActivityLogger.log('listen_podcast', { expertId: expert.id });
    MemoryManager.updateBeliefs(expert.id, getLang() === 'en'
      ? `Player listened to episode about "${expert.expertise[0]}" in Week ${GameState.get('week')}`
      : `玩家在第 ${GameState.get('week')} 周收听了关于「${expert.expertise[0]}」的播客`);

    const timesListened = listened.filter(id => id === expert.id).length;
    const deepSuffix = timesListened >= 2 ? t('pod.deep_suffix') : '';
    NotificationSystem.show('🎙️', t('pod.listen_done', { deep: deepSuffix }), 3000);

    const profile = GameState.get('playerProfile');
    profile.actions.push({ week: GameState.get('week'), type: 'listened_podcast', expert: expert.id });
    GameState.set('playerProfile', profile);

    this._renderEpisodeList(container);
    this._renderEpisodeDetail(container, expert);

    // Show add contact button if not yet added
    const added = GameState.get('addedContacts') || [];
    if (!added.includes(expert.id)) {
      const main = container.querySelector('#podcast-main');
      if (main) {
        const existing = main.querySelector('.add-contact-banner');
        if (existing) existing.remove();
        const addBanner = document.createElement('div');
        addBanner.className = 'add-contact-banner';
        addBanner.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:10;';
        const btnLabel = t('pod.add_contact', { name: expert.name });
        addBanner.innerHTML = `
          <button onclick="PodcastApp._addContact('${expert.id}', this.parentElement)"
            style="padding:10px 20px;background:var(--accent);color:#fff;border:none;border-radius:20px;
                   font-size:14px;font-weight:700;cursor:pointer;font-family:var(--font-system);
                   box-shadow:0 4px 16px rgba(0,122,255,0.4);">${btnLabel}</button>`;
        main.style.position = 'relative';
        main.appendChild(addBanner);
      }
    }
  },

  _addContact(expertId, bannerEl) {
    const added = GameState.get('addedContacts') || [];
    if (added.includes(expertId)) { bannerEl?.remove(); return; }
    added.push(expertId);
    GameState.set('addedContacts', added);
    const expert = EXPERTS.find(e => e.id === expertId);
    NotificationSystem.show('✅', t('pod.added_notif', { name: expert?.name || expertId }), 3000);
    if (added.length === 1) {
      DockManager.unlock('contacts');
      NotificationSystem.show('🔓', t('notif.contacts_unlocked'), 3000);
    }
    EventBus.emit('expert:added', { expertId });
    bannerEl?.remove();
    // Update the button in detail if visible
    const btn = document.querySelector(`[data-add-expert="${expertId}"]`);
    if (btn) { btn.textContent = t('pod.already_added'); btn.style.background = 'rgba(52,199,89,0.1)'; btn.style.color = '#1a7a3f'; }
  }
};
