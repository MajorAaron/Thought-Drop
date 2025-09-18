const titleInput = document.getElementById('title-input');
const bodyInput = document.getElementById('body-input');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Save note
async function saveNote() {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!body) {
    bodyInput.focus();
    return;
  }

  await window.electronAPI.saveNote({ title, body });
  clearForm();
}

// Clear form
function clearForm() {
  titleInput.value = '';
  bodyInput.value = '';
  bodyInput.focus();
}

// Cancel/close
function closeWindow() {
  window.electronAPI.closeWindow();
  clearForm();
}

// Event listeners
saveBtn.addEventListener('click', saveNote);
cancelBtn.addEventListener('click', closeWindow);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeWindow();
  } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    saveNote();
  }
});

// Listen for clear form event from main process
window.electronAPI.onClearForm(() => {
  clearForm();
});