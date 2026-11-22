(() => {
  UI.navbar();
  const g = Api.get(UI.param('id'));
  if (!g) { location.href = 'catalog.html'; return; }
  let done = Api.progress(g.id, g.steps);

  document.getElementById('gTitle').textContent = g.title;
  document.getElementById('gDesc').textContent = g.description;
  if (g.author === Api.user().name) {
    const b = document.getElementById('editBtn');
    b.href = 'editor.html?id=' + encodeURIComponent(g.id);
    b.classList.remove('d-none');
  }
  document.getElementById('forkBtn').onclick = () => {
    const f = Api.fork(g.id);
    location.href = 'editor.html?id=' + encodeURIComponent(f.id);
  };

  const render = () => {
    const pct = Math.round(done.length / g.steps.length * 100);
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
  document.getElementById('steps').onchange = e => {
    const stepId = g.steps[Number(e.target.dataset.i)].id;
    done = e.target.checked ? done.concat(stepId) : done.filter(x => x !== stepId);
    Api.setProgress(g.id, done); render();
  };
  render(); Lang.apply();
})();
