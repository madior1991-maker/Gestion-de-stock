/**
 * StockManager Pro v2 - Application Controller & View Router
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initThemeToggle();
  initGlobalSearch();
  
  // Initialize Authentication & Session Check
  checkAuthSession();

  // Set default view to dashboard
  switchView('dashboard');

  // Update Bell Notifications
  updateNotificationCenter();
});

// View Navigation Router
function switchView(viewId) {
  const views = document.querySelectorAll('.view-section');
  const navItems = document.querySelectorAll('.nav-item');

  views.forEach(v => v.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));

  const targetView = document.getElementById(`view-${viewId}`);
  const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);

  if (targetView) targetView.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  // Call component renderers dynamically
  switch (viewId) {
    case 'dashboard':
      if (window.renderDashboard) window.renderDashboard();
      break;
    case 'products':
      if (window.renderProducts) window.renderProducts();
      break;
    case 'invoices':
      if (window.renderInvoices) window.renderInvoices();
      break;
    case 'clients':
      if (window.renderClients) window.renderClients();
      break;
    case 'purchase-orders':
      if (window.renderPurchaseOrders) window.renderPurchaseOrders();
      break;
    case 'movements':
      if (window.renderMovements) window.renderMovements();
      break;
    case 'alerts':
      if (window.renderAlerts) window.renderAlerts();
      break;
    case 'categories':
      if (window.renderCategories) window.renderCategories();
      break;
    case 'reports':
      if (window.renderReports) window.renderReports();
      break;
    case 'admin-console':
      if (window.renderAdminConsole) window.renderAdminConsole();
      break;
    case 'settings':
      if (window.renderSettings) window.renderSettings();
      break;
  }
}

function toggleMobileSidebar(show) {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar) return;

  const shouldOpen = show !== undefined ? show : !sidebar.classList.contains('mobile-open');

  if (shouldOpen) {
    sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('active');
  } else {
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
  }
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view) {
        switchView(view);
        toggleMobileSidebar(false);
      }
    });
  });

  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', () => toggleMobileSidebar());
  }
}

function switchUserRole(role) {
  window.store.setUserRole(role);

  const roleNames = {
    'ADMIN': '👑 Administrateur Général',
    'MAGASINIER': '📦 Magasinier / Stock',
    'VENDEUR': '💼 Vendeur / Commercial'
  };

  showToast(`Session basculée sur : ${roleNames[role]}`, 'info');

  const activeNav = document.querySelector('.nav-item.active');
  const currentView = activeNav ? activeNav.dataset.view : 'dashboard';
  switchView(currentView);

  if (window.renderInvoices) window.renderInvoices();
  if (window.renderProducts) window.renderProducts();
  if (window.renderAdminConsole) window.renderAdminConsole();
  if (window.renderSettings) window.renderSettings();
}

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;

  const currentTheme = localStorage.getItem('stockmanager_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  btn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stockmanager_theme', theme);
    updateThemeIcon(theme);
  });
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;

  if (theme === 'dark') {
    btn.innerHTML = '<i class="fa-solid fa-sun" style="color: #f59e0b;"></i>';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-moon" style="color: #6366f1;"></i>';
  }
}

function initGlobalSearch() {
  const input = document.getElementById('global-search');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;

    const activeView = document.querySelector('.view-section.active')?.id;
    if (activeView === 'view-products' && window.filterProducts) {
      document.getElementById('search-products').value = query;
      window.filterProducts();
    } else if (activeView === 'view-movements' && window.renderMovements) {
      document.getElementById('search-movement').value = query;
      window.renderMovements();
    }
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? '#10b981' : (type === 'danger' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#0284c7'));

  toast.style.cssText = `background: ${bg}; color: #fff; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 0.88rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 10px; min-width: 280px; animation: slideIn 0.3s ease;`;

  const icon = type === 'success' ? 'circle-check' : (type === 'danger' ? 'circle-exclamation' : (type === 'warning' ? 'triangle-exclamation' : 'circle-info'));
  toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> ${escapeHtml(message)}`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function updateNotificationCenter() {
  const notifs = window.store ? window.store.getNotifications() : [];
  const badge = document.getElementById('notif-badge');
  const alertBadge = document.getElementById('nav-alert-badge');
  const list = document.getElementById('notification-list');

  const lowStockCount = notifs.filter(n => n.type === 'danger' || n.type === 'warning').length;

  if (badge) {
    badge.textContent = lowStockCount;
    badge.style.display = lowStockCount > 0 ? 'inline-block' : 'none';
  }

  if (alertBadge) {
    alertBadge.textContent = lowStockCount;
    alertBadge.style.display = lowStockCount > 0 ? 'inline-block' : 'none';
  }

  if (list) {
    if (notifs.length === 0) {
      list.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">Aucune notification.</div>`;
    } else {
      list.innerHTML = notifs.map(n => `
        <div class="notification-item">
          <div style="font-weight: 700; color: ${n.type === 'danger' ? 'var(--danger)' : (n.type === 'warning' ? 'var(--warning)' : 'var(--success)')}; font-size: 0.82rem;">
            ${escapeHtml(n.title)}
          </div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.15rem;">${escapeHtml(n.message)}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">${escapeHtml(n.time)}</div>
        </div>
      `).join('');
    }
  }
}

function toggleNotificationDrawer() {
  const drawer = document.getElementById('notification-drawer');
  if (drawer) {
    drawer.style.display = drawer.style.display === 'block' ? 'none' : 'block';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function checkAuthSession() {
  let currentUser = window.store.getCurrentUser();
  
  if (!currentUser) {
    const users = window.store.getUsers();
    currentUser = users.find(u => u.role === 'ADMIN' && u.isApproved) || users[0];
    if (currentUser) {
      window.store.setCurrentUser(currentUser, false);
    }
  }

  const loginScreen = document.getElementById('view-login');
  const appContainer = document.querySelector('.app-container');

  if (!currentUser) {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  } else {
    if (loginScreen) loginScreen.style.display = 'none';
    if (appContainer) {
      appContainer.style.display = 'flex';
      appContainer.style.filter = 'none';
    }

    updateTopBarUserWidget(currentUser);
  }
}

function updateTopBarUserWidget(user) {
  if (!user) return;

  const initialsEl = document.getElementById('user-avatar-circle');
  const nameEl = document.getElementById('user-display-name');
  const roleEl = document.getElementById('user-display-role');

  const roleNames = {
    'ADMIN': '👑 Administrateur',
    'MAGASINIER': '📦 Magasinier',
    'VENDEUR': '💼 Vendeur Commercial'
  };

  const nameParts = (user.name || 'User').split(' ');
  const initials = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();

  if (initialsEl) initialsEl.textContent = initials;
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = roleNames[user.role] || user.role;

  const roleSelect = document.getElementById('user-role-select');
  if (roleSelect) roleSelect.value = user.role;
}

function handleAuthLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const rememberCheck = document.getElementById('login-remember');
  const errorAlert = document.getElementById('auth-error-alert');

  if (errorAlert) errorAlert.style.display = 'none';

  try {
    const user = window.store.authenticateUser(emailInput.value, pwdInput.value);
    window.store.setCurrentUser(user, rememberCheck ? rememberCheck.checked : true);

    showToast(`Bienvenue, ${user.name} ! Connexion réussie.`, 'success');
    checkAuthSession();
    switchView('dashboard');
  } catch (err) {
    if (errorAlert) {
      errorAlert.style.display = 'block';
      errorAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(err.message)}`;
    }
  }
}

function handleAuthLogout() {
  if (confirm('Voulez-vous vous déconnecter de votre session ?')) {
    window.store.logout();
    showToast('Déconnexion de session réussie.', 'info');
    checkAuthSession();
  }
}

function quickFillLogin(email, password) {
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  if (emailInput) emailInput.value = email;
  if (pwdInput) pwdInput.value = password;

  const form = document.getElementById('auth-login-form');
  if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById('toggle-pwd-icon');
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fa-solid fa-eye';
  }
}

function openNewUserModal() {
  const form = document.getElementById('user-create-form');
  if (form) form.reset();
  openModal('modal-user-create');
}

function handleUserCreateSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('user-new-name').value.trim();
  const email = document.getElementById('user-new-email').value.trim();
  const password = document.getElementById('user-new-password').value.trim();
  const role = document.getElementById('user-new-role').value;
  const isApproved = document.getElementById('user-new-approved').checked;

  try {
    window.store.saveUser({ name, email, password, role, isApproved });
    showToast(`Compte pour "${name}" créé avec succès !`, 'success');
    closeModal('modal-user-create');
    if (window.renderAdminConsole) window.renderAdminConsole('users');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

window.switchView = switchView;
window.switchUserRole = switchUserRole;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.toggleNotificationDrawer = toggleNotificationDrawer;
window.escapeHtml = escapeHtml;
window.toggleMobileSidebar = toggleMobileSidebar;
window.checkAuthSession = checkAuthSession;
window.handleAuthLoginSubmit = handleAuthLoginSubmit;
window.handleAuthLogout = handleAuthLogout;
window.quickFillLogin = quickFillLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.openNewUserModal = openNewUserModal;
window.handleUserCreateSubmit = handleUserCreateSubmit;
