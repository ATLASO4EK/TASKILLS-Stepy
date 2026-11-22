(async () => {
  UI.navbar();
  let g, done;
  try {
    g = await Api.get(UI.param('id'));
    if (g) done = (await Api.progress(g.id)).done;
  } catch (e) { alert(Lang.t(e.message === 'network' ? 'err_network' : 'loadError')); return; }
  if (!g) {location.href = 'catalog.html' ; return; }

  document.getElementById('gTitle').textContent = g.title;
  document.getElementById('gDesc').textContent = g.description;
  if (g.author === Api.user().id) {
    const b = document.getElementById('editBtn');
    b.href = 'editor.html?id=' + encodeURIComponent(g.id);
    b.classList.remove('d-none');
  }
  document.getElementById('forkBtn').onclick = async () => {
    try {
      const f = await Api.fork(g.id);
      location.href = 'editor.html?id=' + encodeURIComponent(f.id);
    } catch (e) { alert(Lang.t('saveError')); }
  };

  const render = () => {
    const pct = g.steps.length ? Math.round(done.length / g.steps.length * 100) : 0;
    const bar = document.getElementById('bar');
    bar.style.width = pct + '%'; bar.textContent = pct + '%';
    document.getElementById('finished').classList.toggle('d-none', pct < 100);
    document.getElementById('steps').innerHTML = g.steps.map((s, i) => {
      const img = UI.safeUrl(s.image);
      return `<label class="list-group-item">
        <div class="d-flex gap-3">
          <input class="form-check-input flex-shrink-0" type="checkbox" data-i="${i}" ${done.includes(s.id) ? 'checked' : ''}>
          <span class="${done.includes(s.id) ? 'step-done' : ''}">${UI.esc(s.text)}</span>
        </div>
        ${img ? `<img src="${UI.esc(img)}" class="img-fluid rounded mt-2" alt="" loading="lazy">` : ''}
      </label>`;
    }).join('');
  };
  document.getElementById('steps').onchange = async e => {
    const stepId = g.steps[Number(e.target.dataset.i)].id;
    try {
      if (e.target.checked) { await Api.completeStep(g.id, stepId); done = done.concat(stepId); }
      else { await Api.uncompleteStep(g.id, stepId); done = done.filter(x => x !== stepId); }
    } catch (err) { alert(Lang.t('saveError')); }
    render();
  };
  render(); Lang.apply();
})();
