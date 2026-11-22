(async () => {
  UI.navbar();
  const q = UI.param('q') || '';
  const me = Api.user().id;
  const grid = document.getElementById('grid');
  let onlyMine = false, items = [];

  try {
    const guides = await Api.list(q);
    items = await Promise.all(guides.map(async g => {
      const p = await Api.progress(g.id).catch(() => ({ done: [], total: 0}));
      return { g, total: p.total, pct: p.total ? Math.round(p.done.length / p.total * 100) : 0};
    }));
  } catch (e) {
    grid.innerHTML = `<p class="text-danger">${Lang.t(e.message === 'network' ? 'err_network' : 'loadError')}</p>`;
    Lang.apply(); return;
  }

  const render = () => {
    const list = items.filter(i => !onlyMine || i.g.author === me);
      grid.innerHTML = list.length ? list.map(({ g, total, pct}) => `<div class="col-md-6 col-lg-4"><a href="guide.html?id=${encodeURIComponent(g.id)}" class="text-decoration-none">
        <div class="card guide-card h-100"><div class="card-body">
          <h5 class="card-title text-dark">${UI.esc(g.title)}</h5>
          <p class="card-text text-secondary">${UI.esc(g.description)}</p>
          <small class="text-secondary">${total} ${Lang.t('steps')} | ${UI.esc(g.authorName)}</small>
          ${pct ? `<div class="progress mt-2" style="height:6px"><div class="progress-bar" style="width:${pct}%"></div></div>` : ''}
        </div></div></a></div>`).join('') : `<p class="text-secondary">${Lang.t('empty')}</p>`;
  };

  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    onlyMine = b.dataset.filter === 'mine';
    document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active', x === b));
    render();
  });
  render(); Lang.apply();
})();
