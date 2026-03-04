// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Offline storage using localStorage (simple demo)
const saved = document.getElementById('saved');
const noteInput = document.getElementById('note');

const existing = localStorage.getItem('note');
if (existing) saved.textContent = "Saved: " + existing;

function saveNote() {
  const value = noteInput.value;
  localStorage.setItem('note', value);
  saved.textContent = "Saved: " + value;
}

// Network status
function updateStatus() {
  document.getElementById('status').textContent =
    navigator.onLine ? "🟢 Online" : "🔴 Offline";
}

window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();