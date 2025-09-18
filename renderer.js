const titleInput = document.getElementById('title-input');
const bodyInput = document.getElementById('body-input');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const changeShortcutBtn = document.getElementById('change-shortcut-btn');
const shortcutValue = document.getElementById('shortcut-value');
const shortcutFeedback = document.getElementById('shortcut-feedback');

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+=';
const isMac = /Mac/i.test(navigator.platform);
const modifierOnlyCodes = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight'
]);

let currentShortcut = DEFAULT_SHORTCUT;
let isCapturingShortcut = false;

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

function clearForm() {
  titleInput.value = '';
  bodyInput.value = '';
  bodyInput.focus();
}

function closeWindow() {
  window.electronAPI.closeWindow();
  clearForm();
}

function updateShortcutDisplay(shortcut) {
  currentShortcut = shortcut;
  shortcutValue.textContent = formatShortcut(shortcut);
  shortcutValue.title = shortcut;
}

function formatShortcut(accelerator) {
  if (!accelerator) {
    return 'Not set';
  }

  const parts = accelerator.split('+');
  const key = parts.pop();
  const modifiers = parts;
  const formattedModifiers = modifiers.map(formatModifier);
  const formattedKey = formatKey(key, modifiers);

  if (!formattedModifiers.length) {
    return formattedKey;
  }

  if (isMac) {
    const joiner = formattedKey.length === 1 ? '' : ' ';
    return `${formattedModifiers.join('')}${joiner}${formattedKey}`;
  }

  return `${formattedModifiers.join('+')}+${formattedKey}`;
}

function formatModifier(modifier) {
  switch (modifier) {
    case 'Command':
    case 'Super':
    case 'CommandOrControl':
      return isMac ? '⌘' : 'Win';
    case 'Control':
      return isMac ? '⌃' : 'Ctrl';
    case 'Alt':
      return isMac ? '⌥' : 'Alt';
    case 'Shift':
      return isMac ? '⇧' : 'Shift';
    default:
      return modifier;
  }
}

function formatKey(key, modifiers) {
  const modifierSet = new Set(modifiers);
  if (key === '=') {
    return modifierSet.has('Shift') ? '+' : '=';
  }

  switch (key) {
    case ' ': return 'Space';
    case 'Space': return 'Space';
    case 'Tab': return 'Tab';
    case 'Enter': return '↩';
    case 'Backspace': return '⌫';
    case 'Delete': return '⌦';
    case 'Up': return '↑';
    case 'Down': return '↓';
    case 'Left': return '←';
    case 'Right': return '→';
    default:
      if (key.length === 1) {
        return key.toUpperCase();
      }
      return key;
  }
}

function showShortcutFeedback(message = '', status = 'info') {
  shortcutFeedback.textContent = message;
  shortcutFeedback.classList.remove('success', 'error');

  if (status === 'success') {
    shortcutFeedback.classList.add('success');
  } else if (status === 'error') {
    shortcutFeedback.classList.add('error');
  }
}

function startShortcutCapture() {
  if (isCapturingShortcut) {
    return;
  }

  isCapturingShortcut = true;
  changeShortcutBtn.textContent = 'Press new shortcut…';
  changeShortcutBtn.classList.add('capturing');
  showShortcutFeedback('Press the new shortcut now, or press Esc to cancel.', 'info');
}

function cancelShortcutCapture({ showMessage = false } = {}) {
  if (!isCapturingShortcut) {
    return;
  }

  isCapturingShortcut = false;
  changeShortcutBtn.textContent = 'Change';
  changeShortcutBtn.classList.remove('capturing');
  changeShortcutBtn.blur();

  if (showMessage) {
    showShortcutFeedback('Shortcut change cancelled.', 'info');
  }
}

function buildAcceleratorFromEvent(event) {
  const modifiers = [];

  if (event.metaKey) {
    modifiers.push(isMac ? 'Command' : 'Super');
  }

  if (event.ctrlKey) {
    modifiers.push('Control');
  }

  if (event.altKey) {
    modifiers.push('Alt');
  }

  if (event.shiftKey) {
    modifiers.push('Shift');
  }

  if (!modifiers.length) {
    return { error: 'Please include at least one modifier key.' };
  }

  const key = mapEventToAcceleratorKey(event);

  if (!key) {
    return { error: 'That key is not supported.' };
  }

  return { accelerator: [...modifiers, key].join('+') };
}

function mapEventToAcceleratorKey(event) {
  if (modifierOnlyCodes.has(event.code)) {
    return null;
  }

  const specialByCode = {
    Escape: 'Escape',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Space: 'Space',
    Enter: 'Enter',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Delete: 'Delete'
  };

  if (specialByCode[event.code]) {
    return specialByCode[event.code];
  }

  if (/^Key[A-Z]$/.test(event.code)) {
    return event.code.slice(3).toUpperCase();
  }

  if (/^Digit[0-9]$/.test(event.code)) {
    return event.code.slice(5);
  }

  const punctuation = {
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: '\'',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backquote: '`'
  };

  if (punctuation[event.code]) {
    return punctuation[event.code];
  }

  if (event.code.startsWith('Numpad')) {
    const numpadKey = event.code.substring(6);
    const numpadMap = {
      Add: '+',
      Subtract: '-',
      Multiply: '*',
      Divide: '/',
      Decimal: '.',
      Enter: 'Enter'
    };

    if (numpadMap[numpadKey]) {
      return numpadMap[numpadKey];
    }

    if (/^[0-9]$/.test(numpadKey)) {
      return numpadKey;
    }
  }

  if (event.key && event.key.length === 1) {
    return event.key.toUpperCase();
  }

  return null;
}

async function handleShortcutCapture(event) {
  if (event.key === 'Escape') {
    cancelShortcutCapture({ showMessage: true });
    return;
  }

  if (modifierOnlyCodes.has(event.code)) {
    return;
  }

  const { accelerator, error } = buildAcceleratorFromEvent(event);

  if (error) {
    showShortcutFeedback(error, 'error');
    return;
  }

  cancelShortcutCapture();
  showShortcutFeedback('Registering shortcut…', 'info');

  try {
    const result = await window.electronAPI.setShortcut(accelerator);
    if (result && result.success) {
      updateShortcutDisplay(result.shortcut);
      showShortcutFeedback('Shortcut updated.', 'success');
    } else {
      if (result?.shortcut) {
        updateShortcutDisplay(result.shortcut);
      }
      showShortcutFeedback(result?.error || 'Unable to set shortcut.', 'error');
    }
  } catch (err) {
    showShortcutFeedback('Unable to set shortcut.', 'error');
  }
}

async function loadShortcutPreference() {
  try {
    const result = await window.electronAPI.getShortcut();
    if (result && result.shortcut) {
      updateShortcutDisplay(result.shortcut);
      return;
    }
  } catch (err) {
    // Ignore and fall back to default
  }

  updateShortcutDisplay(DEFAULT_SHORTCUT);
}

saveBtn.addEventListener('click', saveNote);
cancelBtn.addEventListener('click', closeWindow);

changeShortcutBtn.addEventListener('click', () => {
  if (isCapturingShortcut) {
    cancelShortcutCapture({ showMessage: true });
  } else {
    startShortcutCapture();
  }
});

document.addEventListener('keydown', (event) => {
  if (isCapturingShortcut) {
    event.preventDefault();
    event.stopPropagation();
    handleShortcutCapture(event).catch(() => {
      showShortcutFeedback('Unable to set shortcut.', 'error');
    });
    return;
  }

  if (event.key === 'Escape') {
    closeWindow();
  } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    saveNote();
  }
});

window.electronAPI.onClearForm(() => {
  clearForm();
});

loadShortcutPreference();
