(() => {
  UI.navbar();
  const q = (UI.param('q') || '').toLowerCase();
  const me = Api.user().name;
  const all = Api.list();
  let onlyMine = false;

  const render = () => {
    const list = all.filter(g => (!onlyMine || g.author === me) &&
      (g.title + ' ' + g.description).toLowerCase().includes(q));
    document.getElementById('grid').innerHTML = list.length ? list.map(g => {
      const pct = Math.round(Api.progress(g.id, g.steps).length / g.steps.length * 100);
      return `<div class="col-md-6 col-lg-4"><a href="guide.html?id=${encodeURIComponent(g.id)}" class="text-decoration-none">
        <div class="card guide-card h-100"><div class="card-body">
          <h5 class="card-title text-dark">${UI.esc(g.title)}</h5>
          <p class="card-text text-secondary">${UI.esc(g.description)}</p>
          <small class="text-secondary">${g.steps.length} ${Lang.t('steps')} | ${UI.esc(g.author)}</small>
          ${pct ? `<div class="progress mt-2" style="height:6px"><div class="progress-bar" style="width:${pct}%"></div></div>` : ''}
        </div></div></a></div>`;
    }).join('') : `<p class="text-secondary">${Lang.t('empty')}</p>`;
  };

  document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    onlyMine = b.dataset.filter === 'mine';
    document.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active', x === b));
    render();
  });
  render(); Lang.apply();
})();
