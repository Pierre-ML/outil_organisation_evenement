const { pbUrl } = document.getElementById('__vars').dataset;

const btn = document.getElementById('login-btn');
const errorDiv = document.getElementById('error-msg');

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.remove('hidden');
}

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) { showError('Remplis tous les champs.'); return; }

  btn.disabled = true;
  btn.textContent = 'Connexion…';
  errorDiv.classList.add('hidden');

  try {
    const res = await fetch(`${pbUrl}/api/collections/users/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.message ?? 'Identifiants incorrects.');
    } else {
      const val = encodeURIComponent(JSON.stringify({ token: data.token, record: data.record }));
      document.cookie = `pb_auth=${val}; path=/; max-age=604800; SameSite=Strict`;
      window.location.href = '/dashboard';
    }
  } catch {
    showError('Erreur réseau. Réessaie plus tard.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
}

btn.addEventListener('click', handleLogin);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
