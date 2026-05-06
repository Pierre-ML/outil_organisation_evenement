const { pbUrl, userId, authToken } = document.getElementById('__vars').dataset;

function authFetch(url, opts = {}) {
  const headers = { 'Authorization': `Bearer ${authToken}`, ...(opts.headers ?? {}) };
  return fetch(url, { ...opts, headers });
}

// ---- Avatar drag & drop ----
const avatarInput = document.getElementById('avatar-input');
const avatarDrop = document.getElementById('avatar-drop');
const avatarDropPreview = document.getElementById('avatar-drop-preview');
const avatarDropPlaceholder = document.getElementById('avatar-drop-placeholder');
const avatarDropName = document.getElementById('avatar-drop-name');
const avatarBtn = document.getElementById('avatar-btn');
const avatarError = document.getElementById('avatar-error');
const avatarSuccess = document.getElementById('avatar-success');

function showAvatarMsg(el, msg) {
  avatarError.classList.add('hidden');
  avatarSuccess.classList.add('hidden');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function showFilePreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarDropPreview.src = e.target.result;
    avatarDropPreview.classList.remove('hidden');
    avatarDropPlaceholder.classList.add('hidden');
    avatarDropName.textContent = file.name;
    avatarDropName.classList.remove('hidden');
    avatarDrop.style.borderColor = 'rgba(255,255,255,0.3)';
  };
  reader.readAsDataURL(file);
}

avatarInput.addEventListener('change', () => showFilePreview(avatarInput.files?.[0]));
avatarDrop.addEventListener('dragover', (e) => {
  e.preventDefault();
  avatarDrop.style.borderColor = 'rgba(255,255,255,0.4)';
  avatarDrop.style.background = 'rgba(255,255,255,0.05)';
});
avatarDrop.addEventListener('dragleave', () => {
  avatarDrop.style.borderColor = 'rgba(255,255,255,0.12)';
  avatarDrop.style.background = 'rgba(255,255,255,0.02)';
});
avatarDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  avatarDrop.style.borderColor = 'rgba(255,255,255,0.12)';
  avatarDrop.style.background = 'rgba(255,255,255,0.02)';
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    avatarInput.files = dt.files;
    showFilePreview(file);
  }
});

document.getElementById('avatar-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = avatarInput.files?.[0];
  if (!file) { showAvatarMsg(avatarError, 'Sélectionne une image.'); return; }

  avatarBtn.disabled = true;
  avatarBtn.textContent = 'Upload en cours…';

  try {
    const fd = new FormData();
    fd.append('avatar', file, file.name);
    const res = await authFetch(`${pbUrl}/api/collections/users/records/${userId}`, { method: 'PATCH', body: fd });
    const data = await res.json();
    if (!res.ok) {
      showAvatarMsg(avatarError, `[${res.status}] ${data.message ?? 'Erreur'}`);
    } else {
      showAvatarMsg(avatarSuccess, 'Photo mise à jour !');
      const raw = document.cookie.split(';').find(c => c.trim().startsWith('pb_auth='));
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw.split('=').slice(1).join('=')));
        document.cookie = `pb_auth=${encodeURIComponent(JSON.stringify({ token: parsed.token, record: data }))}; path=/; max-age=604800; SameSite=Strict`;
      }
      setTimeout(() => window.location.reload(), 800);
    }
  } catch {
    showAvatarMsg(avatarError, 'Erreur réseau.');
  } finally {
    avatarBtn.disabled = false;
    avatarBtn.textContent = 'Mettre à jour la photo';
  }
});

// ---- Mot de passe ----
const pwdBtn = document.getElementById('pwd-btn');
const pwdError = document.getElementById('pwd-error');
const pwdSuccess = document.getElementById('pwd-success');

pwdBtn.addEventListener('click', async () => {
  const oldPassword = document.getElementById('pwd-old').value;
  const password = document.getElementById('pwd-new').value;
  const passwordConfirm = document.getElementById('pwd-confirm').value;

  pwdError.classList.add('hidden');
  pwdSuccess.classList.add('hidden');

  if (!oldPassword || !password || !passwordConfirm) {
    pwdError.textContent = 'Tous les champs sont requis.';
    pwdError.classList.remove('hidden');
    return;
  }
  if (password !== passwordConfirm) {
    pwdError.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
    pwdError.classList.remove('hidden');
    return;
  }
  if (password.length < 8) {
    pwdError.textContent = 'Le mot de passe doit faire au moins 8 caractères.';
    pwdError.classList.remove('hidden');
    return;
  }

  pwdBtn.disabled = true;
  pwdBtn.textContent = 'Mise à jour…';

  try {
    const res = await authFetch(`${pbUrl}/api/collections/users/records/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, password, passwordConfirm }),
    });
    const data = await res.json();
    if (!res.ok) {
      pwdError.textContent = data.message ?? 'Erreur lors du changement de mot de passe.';
      pwdError.classList.remove('hidden');
    } else {
      pwdSuccess.textContent = 'Mot de passe changé ! Reconnexion…';
      pwdSuccess.classList.remove('hidden');
      setTimeout(() => {
        document.cookie = 'pb_auth=; path=/; max-age=0; SameSite=Strict';
        window.location.href = '/login';
      }, 1500);
    }
  } catch {
    pwdError.textContent = 'Erreur réseau.';
    pwdError.classList.remove('hidden');
  } finally {
    pwdBtn.disabled = false;
    pwdBtn.textContent = 'Changer le mot de passe';
  }
});

// ---- Supprimer stock ----
document.querySelectorAll('.delete-stock-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Supprimer cet article ?')) return;
    try {
      const res = await authFetch(`${pbUrl}/api/collections/stockage/records/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        e.currentTarget.closest('.stock-row')?.remove();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  });
});
