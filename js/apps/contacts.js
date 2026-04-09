'use strict';

const ContactsApp = {
  _container: null,
  _selectedExpert: null,

  render(container) {
    this._container = container;
    const discovered = GameState.get('discoveredExperts') || {};
    const discoveredExperts = EXPERTS.filter(e => discovered[e.id]);

    container.innerHTML = `
      <div style="display:flex;height:100%;background:#fff;">
        <!-- Sidebar: expert list -->
        <div style="width:220px;background:rgba(247,247,248,0.95);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;">
          <div style="padding:16px 14px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-secondary);">
            人脉网络 (${discoveredExperts.length}/${EXPERTS.length})
          </div>
          <div style="flex:1;overflow-y:auto;">
            ${discoveredExperts.length === 0 ? `
              <div style="padding:20px;font-size:13px;color:var(--text-secondary);text-align:center;line-height:1.5;">
                还没有发现任何专家。<br><br>通过 Podcast、Safari 或 Discord 发现专家。
              </div>` :
              discoveredExperts.map(e => {
                const mem = MemoryManager.getMemory(e.id);
                const isSelected = this._selectedExpert?.id === e.id;
                return `
                  <div class="contacts-item ${isSelected ? 'selected' : ''}" data-expert-id="${e.id}"
                       style="padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:pointer;
                              border-bottom:1px solid rgba(0,0,0,0.04);
                              background:${isSelected ? 'var(--accent)' : 'transparent'};">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.06);
                                display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
                      ${e.avatarEmoji || '👤'}
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13px;font-weight:600;color:${isSelected ? '#fff' : 'var(--text-primary)'};
                                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.name}</div>
                      <div style="font-size:11px;color:${isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'};
                                  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${mem.relationship} · 信任 ${mem.trustScore}</div>
                    </div>
                  </div>`;
              }).join('')
            }
          </div>
        </div>

        <!-- Main: network graph + detail -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
          <!-- Network graph -->
          <div style="flex:1;position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(247,247,248,0.5) 0%,#fff 100%);">
            <canvas id="contacts-canvas" style="width:100%;height:100%;"></canvas>
            <div style="position:absolute;top:12px;left:12px;font-size:11px;font-weight:700;
                        text-transform:uppercase;letter-spacing:0.5px;color:var(--text-secondary);">
              人脉关系图
            </div>
            ${discoveredExperts.length === 0 ? `
              <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-secondary);">
                <div style="font-size:48px;">🗂️</div>
                <div style="font-size:15px;font-weight:600;">暂无人脉数据</div>
                <div style="font-size:13px;color:var(--text-weak);">发现专家后，这里将显示你的人脉关系图</div>
              </div>` : ''}
          </div>
          <!-- Detail panel -->
          <div id="contacts-detail" style="height:180px;border-top:1px solid var(--border);overflow-y:auto;padding:16px;background:#fff;flex-shrink:0;">
            <div style="font-size:13px;color:var(--text-secondary);">选择左侧联系人查看详情</div>
          </div>
        </div>
      </div>`;

    if (discoveredExperts.length > 0) {
      this._drawGraph(container, discoveredExperts);
    }

    container.querySelectorAll('.contacts-item').forEach(item => {
      item.onclick = () => {
        this._selectedExpert = EXPERTS.find(e => e.id === item.dataset.expertId);
        this._renderDetail(container);
        this.render(container);
      };
    });
  },

  _drawGraph(container, experts) {
    const canvas = container.querySelector('#contacts-canvas');
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Place "you" at center
    const nodes = [{ id: '__player', x: cx, y: cy, emoji: '👤', label: '你', isPlayer: true }];

    // Place experts in a circle
    const angleStep = (2 * Math.PI) / experts.length;
    const radius = Math.min(W, H) * 0.32;
    experts.forEach((e, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const mem = MemoryManager.getMemory(e.id);
      const trust = mem.trustScore / 100;
      const r = radius * (0.6 + trust * 0.4);
      nodes.push({
        id: e.id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle),
        emoji: e.avatarEmoji || '👤', label: e.name.split(' ')[0],
        relationship: mem.relationship, trust: mem.trustScore
      });
    });

    // Draw edges
    experts.forEach(e => {
      const node = nodes.find(n => n.id === e.id);
      if (!node) return;
      const mem = MemoryManager.getMemory(e.id);
      const alpha = 0.1 + (mem.trustScore / 100) * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(node.x, node.y);
      ctx.strokeStyle = `rgba(0,122,255,${alpha})`;
      ctx.lineWidth = 1 + (mem.trustScore / 100) * 2;
      ctx.stroke();

      // Draw referral connections between experts
      const expert = EXPERTS.find(ex => ex.id === e.id);
      if (expert?.network) {
        expert.network.forEach(refId => {
          const refNode = nodes.find(n => n.id === refId);
          if (refNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(refNode.x, refNode.y);
            ctx.strokeStyle = 'rgba(175,82,222,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      }
    });

    // Draw nodes
    nodes.forEach(n => {
      const r = n.isPlayer ? 28 : 22;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = n.isPlayer ? 'rgba(0,122,255,0.15)' : `rgba(${n.trust > 60 ? '52,199,89' : n.trust > 30 ? '255,149,0' : '142,142,147'},0.15)`;
      ctx.fill();
      ctx.strokeStyle = n.isPlayer ? 'rgba(0,122,255,0.6)' : `rgba(${n.trust > 60 ? '52,199,89' : n.trust > 30 ? '255,149,0' : '142,142,147'},0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${n.isPlayer ? 18 : 15}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.emoji, n.x, n.y);

      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.fillStyle = '#666';
      ctx.fillText(n.label, n.x, n.y + r + 12);
    });
  },

  _renderDetail(container) {
    const detail = container.querySelector('#contacts-detail');
    if (!detail || !this._selectedExpert) return;
    const e = this._selectedExpert;
    const mem = MemoryManager.getMemory(e.id);
    const discovered = (GameState.get('discoveredExperts') || {})[e.id] || {};

    const trustColor = mem.trustScore > 60 ? 'var(--success)' : mem.trustScore > 30 ? 'var(--warning)' : 'var(--text-secondary)';
    const relColors = { '深度伙伴': 'var(--success)', '合作中': 'var(--accent)', '认识': 'var(--warning)', '陌生': 'var(--text-secondary)' };

    detail.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;font-size:22px;">${e.avatarEmoji || '👤'}</div>
        <div>
          <div style="font-size:15px;font-weight:700;">${e.name}</div>
          <div style="font-size:12px;color:var(--text-secondary);">${e.title}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button onclick="DockManager.launchApp('imessage')" style="padding:5px 12px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--font-system);font-weight:600;">💬 发消息</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:6px 10px;font-size:12px;">
          <span style="color:var(--text-secondary);">关系：</span>
          <span style="font-weight:600;color:${relColors[mem.relationship] || 'var(--text-secondary)'};">${mem.relationship}</span>
        </div>
        <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:6px 10px;font-size:12px;">
          <span style="color:var(--text-secondary);">信任分：</span>
          <span style="font-weight:600;color:${trustColor};">${mem.trustScore}/100</span>
        </div>
        <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:6px 10px;font-size:12px;">
          <span style="color:var(--text-secondary);">发现渠道：</span>
          <span style="font-weight:600;">${{ podcast: '🎙️ 播客', safari: '🌐 搜索', community: '👥 社群', referral: '🤝 引荐', initial: '✨ 初始' }[discovered.channel] || discovered.channel || '未知'}</span>
        </div>
        <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:6px 10px;font-size:12px;">
          <span style="color:var(--text-secondary);">专长：</span>
          <span style="font-weight:600;">${e.expertise.slice(0,3).join(', ')}</span>
        </div>
        <div style="background:rgba(0,0,0,0.04);border-radius:6px;padding:6px 10px;font-size:12px;">
          <span style="color:var(--text-secondary);">咨询费：</span>
          <span style="font-weight:600;color:var(--danger);">¥${e.consultFee}/次</span>
        </div>
      </div>
      ${mem.beliefs.length > 0 ? `
        <div style="margin-top:10px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-secondary);margin-bottom:6px;">他对你的了解</div>
          ${mem.beliefs.slice(-2).map(b => `<div style="font-size:12px;color:var(--text-primary);padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);">• ${b}</div>`).join('')}
        </div>` : ''}`;
  }
};
