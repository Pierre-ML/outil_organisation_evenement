const { pbUrl, authToken } = document.getElementById('__vars').dataset;

function authFetch(url, opts = {}) {
  const headers = { 'Authorization': `Bearer ${authToken}`, ...(opts.headers ?? {}) };
  return fetch(url, { ...opts, headers });
}

function showMsg(el, msg, ok) {
  el.textContent = msg;
  el.style.cssText = ok
    ? 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);'
    : 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:rgba(255,255,255,0.65);';
  el.className = 'mt-3 text-sm p-3 rounded-xl';
}

// ---- Photo preview lieu ----
const lieuImgInput = document.getElementById('lieu-img');
const lieuImgDrop = document.getElementById('lieu-img-drop');
const lieuImgPreview = document.getElementById('lieu-img-preview');
const lieuImgPlaceholder = document.getElementById('lieu-img-placeholder');
const lieuImgName = document.getElementById('lieu-img-name');

function showLieuImgPreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    lieuImgPreview.src = e.target.result;
    lieuImgPreview.classList.remove('hidden');
    lieuImgPlaceholder.classList.add('hidden');
    lieuImgName.textContent = file.name;
    lieuImgName.classList.remove('hidden');
    lieuImgDrop.style.borderColor = 'rgba(255,255,255,0.25)';
  };
  reader.readAsDataURL(file);
}

lieuImgInput.addEventListener('change', () => showLieuImgPreview(lieuImgInput.files?.[0]));
lieuImgDrop.addEventListener('dragover', (e) => { e.preventDefault(); lieuImgDrop.style.borderColor = 'rgba(255,255,255,0.35)'; });
lieuImgDrop.addEventListener('dragleave', () => { lieuImgDrop.style.borderColor = 'rgba(255,255,255,0.1)'; });
lieuImgDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer(); dt.items.add(file); lieuImgInput.files = dt.files;
    showLieuImgPreview(file);
  }
});

// ---- Créer un utilisateur ----
const createUserBtn = document.getElementById('create-user-btn');
const createUserError = document.getElementById('create-user-error');
const createUserSuccess = document.getElementById('create-user-success');

createUserBtn.addEventListener('click', async () => {
  const name = document.getElementById('new-name').value.trim();
  const email = document.getElementById('new-email').value.trim();
  const password = document.getElementById('new-password').value;
  const passwordConfirm = document.getElementById('new-password-confirm').value;
  const admin = document.getElementById('new-admin').checked;

  createUserError.classList.add('hidden');
  createUserSuccess.classList.add('hidden');

  if (!name || !email || !password) { showMsg(createUserError, 'Nom, email et mot de passe requis.', false); return; }
  if (password !== passwordConfirm) { showMsg(createUserError, 'Les mots de passe ne correspondent pas.', false); return; }

  createUserBtn.disabled = true;
  createUserBtn.textContent = 'Création…';

  try {
    const res = await authFetch(`${pbUrl}/api/collections/users/records`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, passwordConfirm, admin }),
    });
    const data = await res.json();
    if (!res.ok) { showMsg(createUserError, data.message ?? 'Erreur.', false); }
    else { showMsg(createUserSuccess, 'Compte créé ! Rechargement…', true); setTimeout(() => window.location.reload(), 800); }
  } catch { showMsg(createUserError, 'Erreur réseau.', false); }
  finally { createUserBtn.disabled = false; createUserBtn.textContent = 'Créer le compte'; }
});

// ---- Supprimer un utilisateur ----
document.querySelectorAll('.delete-user-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Supprimer cet utilisateur ? Cette action est irréversible.')) return;
    try {
      const res = await authFetch(`${pbUrl}/api/collections/users/records/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) e.currentTarget.closest('.user-row')?.remove();
      else { const d = await res.json(); alert(d.message ?? 'Erreur.'); }
    } catch { alert('Erreur réseau.'); }
  });
});

// ---- Formulaire lieu ----
const saveLieuBtn = document.getElementById('save-lieu-btn');
const cancelLieuBtn = document.getElementById('cancel-lieu-btn');
const lieuxError = document.getElementById('lieu-error');
const lieuxSuccess = document.getElementById('lieu-success');
const editIdInput = document.getElementById('lieu-edit-id');

saveLieuBtn.addEventListener('click', async () => {
  const id = editIdInput.value;
  const nom = document.getElementById('lieu-nom').value.trim();
  const adresse = document.getElementById('lieu-adresse').value.trim();
  const imgFile = document.getElementById('lieu-img').files?.[0];

  lieuxError.classList.add('hidden');
  lieuxSuccess.classList.add('hidden');

  if (!nom || !adresse) { showMsg(lieuxError, 'Nom et adresse requis.', false); return; }

  saveLieuBtn.disabled = true;
  saveLieuBtn.textContent = 'Enregistrement…';

  const fd = new FormData();
  fd.append('nom', nom);
  fd.append('adresse', adresse);
  if (imgFile) fd.append('img', imgFile);

  try {
    const url = id ? `${pbUrl}/api/collections/lieux/records/${id}` : `${pbUrl}/api/collections/lieux/records`;
    const res = await authFetch(url, { method: id ? 'PATCH' : 'POST', body: fd });
    if (!res.ok) { const d = await res.json(); showMsg(lieuxError, d.message ?? 'Erreur.', false); }
    else { showMsg(lieuxSuccess, id ? 'Lieu modifié ! Rechargement…' : 'Lieu ajouté ! Rechargement…', true); setTimeout(() => window.location.reload(), 800); }
  } catch { showMsg(lieuxError, 'Erreur réseau.', false); }
  finally { saveLieuBtn.disabled = false; saveLieuBtn.textContent = 'Enregistrer'; }
});

cancelLieuBtn.addEventListener('click', () => {
  editIdInput.value = '';
  document.getElementById('lieu-nom').value = '';
  document.getElementById('lieu-adresse').value = '';
  lieuImgInput.value = '';
  lieuImgPreview.classList.add('hidden');
  lieuImgPlaceholder.classList.remove('hidden');
  lieuImgName.classList.add('hidden');
  lieuImgDrop.style.borderColor = 'rgba(255,255,255,0.1)';
  cancelLieuBtn.classList.add('hidden');
  saveLieuBtn.textContent = 'Enregistrer';
});

document.querySelectorAll('.edit-lieu-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const t = e.currentTarget;
    editIdInput.value = t.dataset.id;
    document.getElementById('lieu-nom').value = t.dataset.nom ?? '';
    document.getElementById('lieu-adresse').value = t.dataset.adresse ?? '';
    cancelLieuBtn.classList.remove('hidden');
    saveLieuBtn.textContent = 'Modifier';
    document.getElementById('lieu-nom')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

document.querySelectorAll('.delete-lieu-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Supprimer ce lieu ?')) return;
    try {
      const res = await authFetch(`${pbUrl}/api/collections/lieux/records/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) e.currentTarget.closest('.lieu-row')?.remove();
      else { const d = await res.json(); alert(d.message ?? 'Erreur.'); }
    } catch { alert('Erreur réseau.'); }
  });
});

// ---- Toggle révélé ----
document.querySelectorAll('.reveller-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    const next = e.currentTarget.dataset.reveller !== 'true';
    btn.disabled = true;
    try {
      const res = await authFetch(`${pbUrl}/api/collections/lieux/records/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reveller: next }),
      });
      if (res.ok) {
        btn.dataset.reveller = String(next);
        btn.textContent = next ? 'Révélé' : 'Non révélé';
        btn.style.cssText = next
          ? 'background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);border-radius:9999px;padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;'
          : 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);border-radius:9999px;padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;';
      } else { const d = await res.json(); alert(d.message ?? 'Erreur.'); }
    } catch { alert('Erreur réseau.'); }
    finally { btn.disabled = false; }
  });
});

// ---- Toggle actif ----
document.querySelectorAll('.active-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (e.currentTarget.dataset.active === 'true') return;
    btn.disabled = true;
    try {
      const res = await authFetch(`${pbUrl}/api/collections/lieux/records/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });
      if (res.ok) {
        document.querySelectorAll('.active-btn').forEach((b) => {
          b.dataset.active = 'false'; b.textContent = 'Activer';
          b.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);border-radius:9999px;padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;';
        });
        btn.dataset.active = 'true'; btn.textContent = 'Actif';
        btn.style.cssText = 'background:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.9);color:#0e0e0e;border-radius:9999px;padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;';
      } else { const d = await res.json(); alert(d.message ?? 'Erreur.'); }
    } catch { alert('Erreur réseau.'); }
    finally { btn.disabled = false; }
  });
});

// ---- Filtre stock ----
const filterType = document.getElementById('filter-type');
const filterUser = document.getElementById('filter-user');
function applyFilters() {
  const type = filterType.value;
  const search = filterUser.value.toLowerCase();
  document.querySelectorAll('.stock-table-row').forEach((row) => {
    row.style.display = (!type || row.dataset.type === type) && (!search || row.dataset.user?.includes(search)) ? '' : 'none';
  });
}
filterType.addEventListener('change', applyFilters);
filterUser.addEventListener('input', applyFilters);
