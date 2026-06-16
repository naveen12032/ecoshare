import { initAuth } from './auth.js';
import { initResources, renderResources } from './resources.js';
import { initChats } from './chats.js';
import { 
  tryInitializeFirebase, 
  removeFirebaseConfig, 
  getActiveProviderName, 
  isFirebaseActive,
  onProviderChanged 
} from './firebase-config.js';

// Global Toast System
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      icon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      break;
    case 'warning':
      icon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    default:
      icon = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger exit transition
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// Make toast system globally accessible
window.showToastNotification = showToast;

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Modules
  initAuth(showToast);
  initResources(showToast);
  initChats(showToast);

  // 2. Client Side Routing (Sidebar nav triggers)
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');

  function handleRoute(hash) {
    const targetId = hash.replace('#', '') || 'dashboard';
    
    // Deactivate all
    navLinks.forEach(link => link.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));

    // Special behavior for settings config overlay
    if (targetId === 'settings') {
      const configModal = document.getElementById('configModal');
      configModal.classList.add('active');
      const modalBody = configModal.querySelector('.modal-body');
      if (modalBody) modalBody.scrollTop = 0;
      // Set hash back to previous or dashboard to avoid route lock
      window.location.hash = '#dashboard';
      return;
    }

    // Activate target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      const activeLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }

      // If returning to dashboard, trigger resources re-render to lay out Leaflet map if active
      if (targetId === 'dashboard') {
        renderResources();
      } else if (targetId === 'admin' && window.renderAdminPanel) {
        window.renderAdminPanel();
      }
    }
  }

  window.addEventListener('hashchange', () => {
    handleRoute(window.location.hash);
  });

  // Initial Route Load
  handleRoute(window.location.hash);

  // 3. Firebase Connection Manager (Modal and status)
  const configModal = document.getElementById('configModal');
  const configForm = document.getElementById('configForm');
  const configModalClose = document.getElementById('configModalClose');
  const disconnectFirebaseBtn = document.getElementById('disconnectFirebaseBtn');
  const currentProviderBadge = document.getElementById('currentProviderBadge');
  const firebaseStatusText = document.getElementById('firebaseStatusText');
  const cancelConfigBtn = document.getElementById('cancelConfigBtn');

  // Load existing configuration in inputs if present
  const saved = localStorage.getItem('ecoshare_firebase_config');
  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      document.getElementById('apiKey').value = cfg.apiKey || '';
      document.getElementById('authDomain').value = cfg.authDomain || '';
      document.getElementById('projectId').value = cfg.projectId || '';
      document.getElementById('storageBucket').value = cfg.storageBucket || '';
      document.getElementById('messagingSenderId').value = cfg.messagingSenderId || '';
      document.getElementById('appId').value = cfg.appId || '';
    } catch (e) {
      console.error(e);
    }
  }

  // Bind Open/Close settings triggers
  configModalClose.addEventListener('click', () => configModal.classList.remove('active'));
  cancelConfigBtn.addEventListener('click', () => configModal.classList.remove('active'));
  window.addEventListener('click', (e) => {
    if (e.target === configModal) {
      configModal.classList.remove('active');
    }
  });

  // Listen for database changes
  onProviderChanged((name, isFirebase) => {
    updateProviderUI(name, isFirebase);
    // Refresh resources to fetch from new active provider
    renderResources();
  });

  // Initialize UI state
  updateProviderUI(getActiveProviderName(), isFirebaseActive());

  function updateProviderUI(name, isFirebase) {
    if (currentProviderBadge) {
      currentProviderBadge.textContent = name;
      currentProviderBadge.className = `config-badge ${isFirebase ? 'firebase' : 'mock'}`;
    }
    if (firebaseStatusText) {
      firebaseStatusText.textContent = isFirebase 
        ? 'Connected to your Live Google Firebase project. Authentications, assets and items are synchronized with Firestore/Storage.' 
        : 'Running in mock database mode (LocalStorage). Data stays locally in your browser. Paste Firebase credentials to connect to Cloud.';
    }
    if (disconnectFirebaseBtn) {
      disconnectFirebaseBtn.style.display = isFirebase ? 'inline-block' : 'none';
    }
  }

  // Connect Firebase Submission
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = configForm.querySelector('button[type="submit"]');

    const config = {
      apiKey: document.getElementById('apiKey').value.trim(),
      authDomain: document.getElementById('authDomain').value.trim(),
      projectId: document.getElementById('projectId').value.trim(),
      storageBucket: document.getElementById('storageBucket').value.trim(),
      messagingSenderId: document.getElementById('messagingSenderId').value.trim(),
      appId: document.getElementById('appId').value.trim()
    };

    if (!config.apiKey || !config.projectId) {
      showToast('API Key and Project ID are required to connect.', 'warning');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connecting...';
      
      showToast('Connecting to Firebase and importing SDK...', 'info');
      await tryInitializeFirebase(config);
      
      showToast('Connected to Cloud Firebase successfully!', 'success');
      configModal.classList.remove('active');
    } catch (err) {
      console.error(err);
      showToast('Connection failed: ' + (err.message || 'Check credentials'), 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Connect Firebase';
    }
  });

  // Disconnect / Revert back to Mock
  disconnectFirebaseBtn.addEventListener('click', () => {
    if (confirm('Revert back to Mock database mode? Data will load locally from now on.')) {
      removeFirebaseConfig();
      showToast('Disconnected from Firebase. Reverted to Local storage DB.', 'info');
      configModal.classList.remove('active');
    }
  });

  // 4. Dark Theme Switcher
  const themeToggle = document.getElementById('themeToggle');
  
  // Set theme from saved settings
  const savedTheme = localStorage.getItem('ecoshare_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ecoshare_theme', newTheme);
      updateThemeIcon(newTheme);
      showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled.`, 'info');
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    if (theme === 'dark') {
      // Show sun icon for light mode trigger
      themeToggle.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    } else {
      // Show moon icon for dark mode trigger
      themeToggle.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      `;
    }
  }
});
