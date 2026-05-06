const { pbUrl, userId, authToken } = document.getElementById('__vars').dataset;

function authFetch(url, opts = {}) {
  const headers = { 'Authorization': `Bearer ${authToken}`, ...(opts.headers ?? {}) };
  return fetch(url, { ...opts, headers });
}

// ---- Photo preview ----
const stockImgInput = document.getElementById('stock-img');
const stockImgDrop = document.getElementById('stock-img-drop');
const stockImgPreview = document.getElementById('stock-img-preview');
const stockImgPlaceholder = document.getElementById('stock-img-placeholder');
const stockImgName = document.getElementById('stock-img-name');

function showStockImgPreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    stockImgPreview.src = e.target.result;
    stockImgPreview.classList.remove('hidden');
    stockImgPlaceholder.classList.add('hidden');
    stockImgName.textContent = file.name;
    stockImgName.classList.remove('hidden');
    stockImgDrop.style.borderColor = 'rgba(255,255,255,0.25)';
  };
  reader.readAsDataURL(file);
}

stockImgInput.addEventListener('change', () => showStockImgPreview(stockImgInput.files?.[0]));
stockImgDrop.addEventListener('dragover', (e) => { e.preventDefault(); stockImgDrop.style.borderColor = 'rgba(255,255,255,0.35)'; });
stockImgDrop.addEventListener('dragleave', () => { stockImgDrop.style.borderColor = 'rgba(255,255,255,0.1)'; });
stockImgDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer(); dt.items.add(file); stockImgInput.files = dt.files;
    showStockImgPreview(file);
  }
});

const formError = document.getElementById('form-error');
const formSuccess = document.getElementById('form-success');
const addBtn = document.getElementById('add-stock-btn');

addBtn.addEventListener('click', async () => {
  const nom = document.getElementById('stock-nom').value.trim();
  const combien = document.getElementById('stock-combien').value;
  const type = document.getElementById('stock-type').value;
  const imgFile = document.getElementById('stock-img').files?.[0];

  formError.classList.add('hidden');
  formSuccess.classList.add('hidden');

  if (!nom || !combien || Number(combien) < 1) {
    formError.textContent = 'Nom et quantité valide requis.';
    formError.classList.remove('hidden');
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = 'Ajout en cours…';

  const fd = new FormData();
  fd.append('qui', userId);
  fd.append('nom', nom);
  fd.append('combien', combien);
  fd.append('type', type);
  if (imgFile) fd.append('img', imgFile);

  try {
    const res = await authFetch(`${pbUrl}/api/collections/stockage/records`, { method: 'POST', body: fd });
    if (!res.ok) {
      const data = await res.json();
      formError.textContent = data.message ?? "Erreur lors de l'ajout.";
      formError.classList.remove('hidden');
    } else {
      formSuccess.textContent = 'Article ajouté !';
      formSuccess.classList.remove('hidden');
      setTimeout(() => window.location.reload(), 700);
    }
  } catch {
    formError.textContent = 'Erreur réseau.';
    formError.classList.remove('hidden');
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Ajouter';
  }
});

document.querySelectorAll('.delete-btn').forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Supprimer cet article ?')) return;
    try {
      const res = await authFetch(`${pbUrl}/api/collections/stockage/records/${id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        e.currentTarget.closest('.stock-item')?.remove();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  });
});
