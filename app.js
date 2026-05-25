/**
 * Billing & Inventory Management System - Core Application Logic
 * Manages states, localStorage persistence, UI events, dynamic SVG charting, and PDF invoice generation.
 */

// Application Constants
const STORAGE_KEY = 'billing_inventory_app_state';
const THEME_KEY = 'billing_inventory_app_theme';

// Default empty data (no sample / mock data)
const DEFAULT_PRODUCTS = [];

// Helper to generate past dates relative to today
const getDateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const DEFAULT_TRANSACTIONS = [];

// Application State
let state = {
  products: [],
  transactions: [],
  cart: [],
  heldCarts: [],
  posSelectedCategory: '',
  selectedProductId: null,
  activeTab: 'dashboard',
  paymentMethod: 'Cash',
  settings: {
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    shopGSTIN: '',
    shopOwner: '',
    invoicePrefix: 'INV-',
    invoiceStartNumber: 1000,
    defaultCurrency: '₹',
    footerNote: 'Thank you for your business!',
    logoutEnabled: true,
    taxEnabledByDefault: true
  }
};

// Initialize Application State
function initStore() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state = JSON.parse(stored);
      state.cart = []; // Reset cart on fresh load
      if (!state.heldCarts) state.heldCarts = [];
      state.posSelectedCategory = '';
      state.activeTab = 'dashboard';
      if (state.activeTab === 'transactions') state.activeTab = 'reports'; // migration
      state.selectedProductId = null;
      state.paymentMethod = 'Cash';
      if (!state.inventorySelected) state.inventorySelected = [];
      if (!state.inventorySortKey) { state.inventorySortKey = 'name'; state.inventorySortDir = 1; }

      // Remove any remaining legacy sample data (original demo products p1-p8)
      const legacySampleIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
      if (Array.isArray(state.products)) {
        const hadSamples = state.products.some(p => legacySampleIds.includes(p.id));
        state.products = state.products.filter(p => !legacySampleIds.includes(p.id));

        // Clean up any transactions that referenced the removed sample products
        if (hadSamples && Array.isArray(state.transactions)) {
          state.transactions = state.transactions.filter(tx =>
            !tx.items || !tx.items.some(item => legacySampleIds.includes(item.productId))
          );
        }
      }

      // Data migration for upgraded inventory product schema
      if (Array.isArray(state.products)) {
        state.products.forEach(p => {
          if (p.supplier === undefined) p.supplier = '';
          if (p.barcode === undefined) p.barcode = '';
          if (p.unit === undefined) p.unit = 'Piece';
          if (p.description === undefined) p.description = '';
          if (p.expiryDate === undefined) p.expiryDate = '';
          if (p.taxRate === undefined) p.taxRate = 18;
          if (p.mrp === undefined) p.mrp = p.sellingPrice || 0;
         });
       }
 
       if (Array.isArray(state.transactions)) {
         state.transactions.forEach(t => { if (!t.type) t.type = 'sale'; });
       }
 
       // Settings migration - ensure all settings exist with defaults
      if (!state.settings) {
        state.settings = {
          shopName: '',
          shopAddress: '',
          shopPhone: '',
          shopEmail: '',
          shopGSTIN: '',
          shopOwner: '',
          invoicePrefix: 'INV-',
          invoiceStartNumber: 1000,
          defaultCurrency: '₹',
           footerNote: 'Thank you for your business!',
           logoutEnabled: true,
           taxEnabledByDefault: true
         };
       } else {
         if (state.settings.shopName === undefined) state.settings.shopName = '';
         if (state.settings.shopAddress === undefined) state.settings.shopAddress = '';
         if (state.settings.shopPhone === undefined) state.settings.shopPhone = '';
         if (state.settings.shopEmail === undefined) state.settings.shopEmail = '';
         if (state.settings.shopGSTIN === undefined) state.settings.shopGSTIN = '';
         if (state.settings.shopOwner === undefined) state.settings.shopOwner = '';
         if (state.settings.invoicePrefix === undefined) state.settings.invoicePrefix = 'INV-';
         if (state.settings.invoiceStartNumber === undefined) state.settings.invoiceStartNumber = 1000;
         if (state.settings.defaultCurrency === undefined) state.settings.defaultCurrency = '₹';
         if (state.settings.footerNote === undefined) state.settings.footerNote = 'Thank you for your business!';
         if (state.settings.logoutEnabled === undefined) state.settings.logoutEnabled = true;
         if (state.settings.taxEnabledByDefault === undefined) state.settings.taxEnabledByDefault = true;
       }
 
       // Settings migration - ensure all settings exist with defaults
       if (!state.settings) {
         state.settings = {
           shopName: '',
           shopAddress: '',
           shopPhone: '',
           shopEmail: '',
           shopGSTIN: '',
           shopOwner: '',
           invoicePrefix: 'INV-',
           invoiceStartNumber: 1000,
           defaultCurrency: '₹',
           footerNote: 'Thank you for your business!',
           logoutEnabled: true,
           taxEnabledByDefault: true
         };
       } else {
         if (state.settings.shopName === undefined) state.settings.shopName = '';
         if (state.settings.shopAddress === undefined) state.settings.shopAddress = '';
         if (state.settings.shopPhone === undefined) state.settings.shopPhone = '';
         if (state.settings.shopEmail === undefined) state.settings.shopEmail = '';
         if (state.settings.shopGSTIN === undefined) state.settings.shopGSTIN = '';
         if (state.settings.shopOwner === undefined) state.settings.shopOwner = '';
         if (state.settings.invoicePrefix === undefined) state.settings.invoicePrefix = 'INV-';
         if (state.settings.invoiceStartNumber === undefined) state.settings.invoiceStartNumber = 1000;
         if (state.settings.defaultCurrency === undefined) state.settings.defaultCurrency = '₹';
         if (state.settings.footerNote === undefined) state.settings.footerNote = 'Thank you for your business!';
         if (state.settings.logoutEnabled === undefined) state.settings.logoutEnabled = true;
         if (state.settings.taxEnabledByDefault === undefined) state.settings.taxEnabledByDefault = true;
       }
    } catch (e) {
      console.error("Failed to parse stored state, using defaults.", e);
      loadDefaults();
    }
  } else {
    loadDefaults();
  }

  // Persist any migrations or initial structure
  saveStore();
}

function loadDefaults() {
  state.products = [];
  state.transactions = [];
  state.cart = [];
  state.heldCarts = [];
  state.posSelectedCategory = '';
  state.activeTab = 'dashboard';
  state.selectedProductId = null;
  state.paymentMethod = 'Cash';
  if (!state.inventorySelected) state.inventorySelected = [];
  if (!state.inventorySortKey) { state.inventorySortKey = 'name'; state.inventorySortDir = 1; }
  saveStore();
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Global Theme Management
function initTheme() {
  const currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
  if (currentTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const isLight = document.body.classList.contains('light-theme');
  btn.innerHTML = isLight 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>` 
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
}

// Router System
function initNavigation() {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  const pages = document.querySelectorAll('.page-view');
  const headerTitle = document.getElementById('headerTitle');

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = item.getAttribute('data-tab');
      
      // Update UI active classes
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');

      pages.forEach(p => p.classList.remove('active'));
      const targetPage = document.getElementById(`${tabName}Page`);
      if (targetPage) targetPage.classList.add('active');

      // Update header text
      const name = item.querySelector('.menu-item-text').innerText;
      if (headerTitle) headerTitle.innerText = name;

      // Close mobile sidebar if open
      document.getElementById('sidebar').classList.remove('active');

      state.activeTab = tabName;
      renderActiveTab();
    });
  });

  // Mobile Toggle button
  const mobileToggle = document.getElementById('mobileMenuToggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('active');
    });
  }
}

function loadShopSettings() {
  const settings = state.settings || {};
  if (document.getElementById('shopName')) document.getElementById('shopName').value = settings.shopName || '';
  if (document.getElementById('shopAddress')) document.getElementById('shopAddress').value = settings.shopAddress || '';
  if (document.getElementById('shopPhone')) document.getElementById('shopPhone').value = settings.shopPhone || '';
  if (document.getElementById('shopEmail')) document.getElementById('shopEmail').value = settings.shopEmail || '';
  if (document.getElementById('shopGSTIN')) document.getElementById('shopGSTIN').value = settings.shopGSTIN || '';
  if (document.getElementById('shopOwner')) document.getElementById('shopOwner').value = settings.shopOwner || '';
  if (document.getElementById('invoicePrefix')) document.getElementById('invoicePrefix').value = settings.invoicePrefix || 'INV-';
  if (document.getElementById('invoiceStartNumber')) document.getElementById('invoiceStartNumber').value = settings.invoiceStartNumber || 1000;
  if (document.getElementById('defaultCurrency')) document.getElementById('defaultCurrency').value = settings.defaultCurrency || '₹';
  if (document.getElementById('footerNote')) document.getElementById('footerNote').value = settings.footerNote || 'Thank you for your business!';
  if (document.getElementById('logoutEnabled')) document.getElementById('logoutEnabled').checked = settings.logoutEnabled !== false;
  if (document.getElementById('taxEnabledByDefault')) document.getElementById('taxEnabledByDefault').checked = settings.taxEnabledByDefault !== false;
}

function saveShopSettings() {
  const settings = state.settings || {};
  settings.shopName = document.getElementById('shopName')?.value || '';
  settings.shopAddress = document.getElementById('shopAddress')?.value || '';
  settings.shopPhone = document.getElementById('shopPhone')?.value || '';
  settings.shopEmail = document.getElementById('shopEmail')?.value || '';
  settings.shopGSTIN = document.getElementById('shopGSTIN')?.value || '';
  settings.shopOwner = document.getElementById('shopOwner')?.value || '';
  settings.invoicePrefix = document.getElementById('invoicePrefix')?.value || 'INV-';
  settings.invoiceStartNumber = parseInt(document.getElementById('invoiceStartNumber')?.value) || 1000;
  settings.defaultCurrency = document.getElementById('defaultCurrency')?.value || '₹';
  settings.footerNote = document.getElementById('footerNote')?.value || 'Thank you for your business!';
  settings.logoutEnabled = document.getElementById('logoutEnabled')?.checked || false;
  settings.taxEnabledByDefault = document.getElementById('taxEnabledByDefault')?.checked !== false;
  state.settings = settings;
  saveStore();
  const statusEl = document.getElementById('settingsSaveStatus');
  if (statusEl) {
    statusEl.innerText = 'Saved ✅';
    statusEl.style.color = 'var(--success)';
    setTimeout(() => { statusEl.innerText = ''; }, 2000);
  }
  showToast('Settings saved successfully!', 'success');
}

function renderActiveTab() {
  switch (state.activeTab) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'settings':
      loadShopSettings();
      break;
    case 'pos':
      renderPOS();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'reports':
      renderReports();
      break;
  }
}

// DASHBOARD MODULE
function renderDashboard() {
  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const totalRevenue = state.transactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const totalSalesCount = state.transactions.length;
  const avgSalesValue = totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0;
  
  const lowStockCount = state.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = state.products.filter(p => p.stock === 0).length;
  
// Set UI stats
   const currency = state.settings?.defaultCurrency || '₹';
   document.getElementById('dashRevenue').innerText = `${currency}${totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('dashSalesCount').innerText = totalSalesCount.toLocaleString();
  document.getElementById('dashProductsCount').innerText = state.products.length.toLocaleString();
  document.getElementById('dashLowStock').innerText = (lowStockCount + outOfStockCount).toLocaleString();

  // Populate Low Stock list
  const lowStockContainer = document.getElementById('dashLowStockList');
  if (lowStockContainer) {
    const lowStockProducts = state.products.filter(p => p.stock <= p.minStock);
    if (lowStockProducts.length === 0) {
      lowStockContainer.innerHTML = `<div class="cart-empty-state"><p style="font-size: 13px;">✓ All products are sufficiently stocked.</p></div>`;
    } else {
      lowStockContainer.innerHTML = lowStockProducts.map(p => {
        const isOut = p.stock === 0;
        const statusText = isOut ? 'Out of stock' : `${p.stock} units left`;
        const badgeClass = isOut ? 'badge-danger' : 'badge-warning';
        return `
          <div class="list-item">
            <div class="list-item-details">
              <span class="list-item-name">${escapeHTML(p.name)}</span>
              <span class="list-item-sub">SKU: ${escapeHTML(p.sku)} • Category: ${escapeHTML(p.category)}</span>
            </div>
            <span class="badge ${badgeClass}">${statusText}</span>
          </div>
        `;
      }).join('');
    }
  }

  // Populate Recent Transactions List
  const recentTxContainer = document.getElementById('dashRecentTransactionsList');
  if (recentTxContainer) {
    const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    if (sortedTx.length === 0) {
      recentTxContainer.innerHTML = `<div class="cart-empty-state"><p style="font-size: 13px;">No transactions recorded yet.</p></div>`;
    } else {
recentTxContainer.innerHTML = sortedTx.map(tx => `
         <div class="list-item" style="cursor: pointer;" onclick="viewInvoiceDetails('${tx.id}')">
           <div class="list-item-details">
             <span class="list-item-name">${escapeHTML(tx.customer.name || 'Walk-in Customer')}</span>
             <span class="list-item-sub">${tx.id} • ${tx.date} • ${tx.paymentMethod}</span>
           </div>
           <span class="table-primary-text" style="color: var(--accent-indigo); font-weight: 700;">${currency}${tx.total.toFixed(2)}</span>
         </div>
       `).join('');
    }
  }

  // Render sales chart
  drawSalesChart();
}

function drawSalesChart() {
  const chartWrapper = document.getElementById('dashboardChartWrapper');
  if (!chartWrapper) return;

  // Let's get transactions aggregated by day for the last 7 days
  const labels = [];
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const dateStr = getDateDaysAgo(i);
    const dayLabel = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });
    labels.push(dayLabel);
    
    const dailyTotal = state.transactions
      .filter(tx => tx.date === dateStr)
      .reduce((sum, tx) => sum + tx.total, 0);
    data.push(dailyTotal);
  }

  const maxVal = Math.max(...data, 100) * 1.1; // adding buffer

  // Build high fidelity responsive SVG
  const width = 600;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const points = data.map((val, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
    return { x, y, val };
  });

  // Build SVG Path
  let dPath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    // Bezier curve calculations for smooth trend lines
    const cpX1 = points[i-1].x + chartWidth / (data.length - 1) / 2;
    const cpY1 = points[i-1].y;
    const cpX2 = points[i].x - chartWidth / (data.length - 1) / 2;
    const cpY2 = points[i].y;
    dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
  }

  // Path for gradient fill
  const dArea = `${dPath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

// Ensure currency is available
   const currency = state.settings?.defaultCurrency || '₹';
   
   // Draw Gridlines
   let gridLines = '';
   const linesCount = 4;
   for (let i = 0; i <= linesCount; i++) {
     const yVal = paddingTop + (i / linesCount) * chartHeight;
     const gridAmt = maxVal - (i / linesCount) * maxVal;
     gridLines += `
       <line x1="${paddingLeft}" y1="${yVal}" x2="${width - paddingRight}" y2="${yVal}" stroke="var(--border-color)" stroke-dasharray="4,4" />
       <text x="${paddingLeft - 8}" y="${yVal + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end">${currency}${Math.round(gridAmt)}</text>
     `;
   }

// Draw Horizontal Axis label points
   let labelsSvg = '';
   points.forEach((pt, idx) => {
     labelsSvg += `
       <text x="${pt.x}" y="${height - 10}" fill="var(--text-muted)" font-size="10" text-anchor="middle">${labels[idx]}</text>
       <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="var(--accent-indigo)" stroke="var(--bg-secondary)" stroke-width="2" />
       <text x="${pt.x}" y="${pt.y - 8}" fill="var(--text-primary)" font-size="9" font-weight="600" text-anchor="middle">${currency}${pt.val.toFixed(0)}</text>
     `;
   });

  chartWrapper.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="sales-chart-svg" style="overflow: visible;">
      <defs>
        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-indigo)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--accent-indigo)" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${dArea}" fill="url(#chartGlow)" />
      <path d="${dPath}" fill="none" stroke="var(--accent-indigo)" stroke-width="3" stroke-linecap="round" />
      ${labelsSvg}
    </svg>
  `;
}

// POS BILLING TERMINAL MODULE
function renderPOS() {
  const searchInput = document.getElementById('posSearch');
  const catFilter = document.getElementById('posCategoryFilter');
  const catalogGrid = document.getElementById('posCatalogGrid');
  const categoryChips = document.getElementById('posCategoryChips');

  const query = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedCat = state.posSelectedCategory;

  // Get categories dynamically
  const categories = [...new Set(state.products.map(p => p.category))];

  // Render Category Chips
  if (categoryChips) {
    categoryChips.innerHTML = `
      <div class="category-chip ${selectedCat === '' ? 'active' : ''}" onclick="selectPOSCategory('')">All Items</div>
    ` + categories.map(c => `
      <div class="category-chip ${selectedCat === c ? 'active' : ''}" onclick="selectPOSCategory('${escapeHTML(c)}')">${escapeHTML(c)}</div>
    `).join('');
  }

  // Synchronize dropdown filter
  if (catFilter) {
    if (catFilter.options.length <= 1) {
      catFilter.innerHTML = `<option value="">All Categories</option>` + 
        categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    }
    catFilter.value = selectedCat;
    
    // Attach listener to capture changes from dropdown
    if (!catFilter.onchangeAttached) {
      catFilter.addEventListener('change', (e) => {
        selectPOSCategory(e.target.value);
      });
      catFilter.onchangeAttached = true;
    }
  }

  // Filter Catalog
  const filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    const matchesCat = selectedCat === '' || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    catalogGrid.innerHTML = `
      <div class="cart-empty-state" style="grid-column: 1 / -1; height: 200px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p>No products found matching query.</p>
      </div>
    `;
  } else {
    catalogGrid.innerHTML = filtered.map(p => {
      const isOut = p.stock === 0;
      const isLow = p.stock > 0 && p.stock <= p.minStock;
      
      let stockDisplay = `<span class="pos-item-stock">Stock: ${p.stock}</span>`;
      if (isOut) stockDisplay = `<span class="pos-item-stock out-badge">Out of Stock</span>`;
      else if (isLow) stockDisplay = `<span class="pos-item-stock low-badge">Low Stock: ${p.stock}</span>`;

const currency = state.settings?.defaultCurrency || '₹';
        return `
         <div class="pos-item-card" onclick="${isOut ? '' : `addToCart('${p.id}')`}" style="${isOut ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
           <span class="pos-item-category">${escapeHTML(p.category)}</span>
           <span class="pos-item-name">${escapeHTML(p.name)}</span>
           <div class="pos-item-footer">
             <span class="pos-item-price">${currency}${p.sellingPrice.toFixed(2)}</span>
             ${stockDisplay}
           </div>
         </div>
       `;
    }).join('');
  }

  // Update Suspended Recall Badge
  const recallBadge = document.getElementById('recallCartCount');
  if (recallBadge) {
    const count = state.heldCarts ? state.heldCarts.length : 0;
    if (count > 0) {
      recallBadge.innerText = count;
      recallBadge.style.display = 'flex';
    } else {
      recallBadge.style.display = 'none';
    }
  }

  renderCart();
}

function selectPOSCategory(cat) {
  state.posSelectedCategory = cat;
  renderActiveTab();
}

function addToCart(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod || prod.stock === 0) return;

  const existing = state.cart.find(item => item.productId === productId);
  if (existing) {
    if (existing.qty < prod.stock) {
      existing.qty++;
    } else {
      showToast(`Cannot exceed current stock limit of ${prod.stock} for ${prod.name}`, 'warning');
    }
  } else {
    state.cart.push({
      productId: productId,
      name: prod.name,
      price: prod.sellingPrice,
      qty: 1
    });
  }
  renderActiveTab();
}

function updateCartQty(productId, delta) {
  const item = state.cart.find(c => c.productId === productId);
  if (!item) return;

  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  if (delta > 0) {
    if (item.qty < prod.stock) {
      item.qty++;
    } else {
      showToast(`Cannot exceed stock limit of ${prod.stock}`, 'warning');
    }
  } else {
    item.qty--;
    if (item.qty <= 0) {
      state.cart = state.cart.filter(c => c.productId !== productId);
    }
  }
  renderActiveTab();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(c => c.productId !== productId);
  renderActiveTab();
}

function updateCartItemNote(productId, note) {
  const item = state.cart.find(c => c.productId === productId);
  if (item) {
    item.note = note.trim();
    // We don't re-render on every keystroke to avoid cursor jump
  }
}

function renderCart() {
  const cartWrapper = document.getElementById('posCartItemsList');
  const emptyState = document.getElementById('posCartEmptyState');
  const cartCheckoutPanel = document.getElementById('posCheckoutDetails');

  // Always control visibility first based on cart length (robust)
  if (state.cart.length === 0) {
    if (cartWrapper) cartWrapper.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    if (cartCheckoutPanel) cartCheckoutPanel.style.display = 'none';
    const svc = document.getElementById('checkoutService');
    if (svc) svc.remove();
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (cartCheckoutPanel) cartCheckoutPanel.style.display = 'block';

// Ensure currency variable
   const currency = state.settings?.defaultCurrency || '₹';
   
   // Render items list
   cartWrapper.innerHTML = state.cart.map(item => `
     <div class="cart-item" style="flex-direction: column; align-items: flex-start; gap: 8px;">
       <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
         <div class="cart-item-info">
           <div class="cart-item-title">${escapeHTML(item.name)}</div>
           <div class="cart-item-price">${currency}${(item.price * item.qty).toFixed(2)} <span style="font-size: 11px; color: var(--text-muted);">(${currency}${item.price.toFixed(2)} ea)</span></div>
         </div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="updateCartQty('${item.productId}', -1)">-</button>
          <span class="cart-item-qty">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.productId}', 1)">+</button>
          <button class="cart-item-remove" onclick="removeCartItem('${item.productId}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <!-- Cart Item Notes -->
      <div class="cart-item-notes-group">
        <input type="text" class="cart-item-note-input" placeholder="Add custom item notes..." value="${escapeHTML(item.note || '')}" oninput="updateCartItemNote('${item.productId}', this.value)">
      </div>
    </div>
  `).join('');

  // Calculations
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const discountRateInput = document.getElementById('cartDiscountRate');
  const discountRate = discountRateInput ? parseFloat(discountRateInput.value) || 0 : 0;
  const discountAmount = subtotal * (discountRate / 100);
  
  const taxRateInput = document.getElementById('cartTaxRate');
  const taxChk = document.getElementById('applyTax');
  const taxRate = (taxChk && !taxChk.checked) ? 0 : (taxRateInput ? parseFloat(taxRateInput.value) || 0 : 0);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);

  const serviceRateInput = document.getElementById('serviceFeeRate');
  const serviceRate = serviceRateInput ? parseFloat(serviceRateInput.value) || 0 : 0;
  const serviceAmount = (subtotal - discountAmount) * (serviceRate / 100);

  let grandTotal = subtotal - discountAmount + taxAmount + serviceAmount;

const subtotalEl = document.getElementById('checkoutSubtotal');
   const discountEl = document.getElementById('checkoutDiscount');
   const taxEl = document.getElementById('checkoutTax');
   const grandEl = document.getElementById('checkoutGrandTotal');

   if (subtotalEl) subtotalEl.innerText = `${currency}${subtotal.toFixed(2)}`;
   if (discountEl) discountEl.innerText = `-${currency}${discountAmount.toFixed(2)}`;
   if (taxEl) taxEl.innerText = `+${currency}${taxAmount.toFixed(2)}`;
   // Optionally show service row if present
  const existingServiceRow = document.getElementById('checkoutService');
if (serviceAmount > 0 && taxEl && taxEl.parentElement) {
     if (!existingServiceRow) {
       const taxRow = taxEl.parentElement;
       const svcRow = document.createElement('div');
       svcRow.className = 'checkout-row';
       svcRow.id = 'checkoutService';
       svcRow.style.color = 'var(--warning)';
       svcRow.innerHTML = `<span>Service Fee</span><span id="checkoutServiceVal">+${currency}${serviceAmount.toFixed(2)}</span>`;
       taxRow.parentNode.insertBefore(svcRow, taxRow.nextSibling);
     } else {
      const valEl = document.getElementById('checkoutServiceVal');
      if (valEl) valEl.innerText = `+₹${serviceAmount.toFixed(2)}`;
    }
  } else if (existingServiceRow) {
    existingServiceRow.remove();
  }
if (grandEl) grandEl.innerText = `${currency}${grandTotal.toFixed(2)}`;

   // Advanced: Cash tender section toggle + calc
  const cashSection = document.getElementById('cashTenderSection');
  const isCash = state.paymentMethod === 'Cash';
  if (cashSection) cashSection.style.display = isCash ? 'block' : 'none';
  if (isCash && typeof calculateCashChange === 'function') {
    setTimeout(calculateCashChange, 0);
  }

  // Payment Method Active Class Toggle
  const paymentButtons = document.querySelectorAll('.payment-method-selector .payment-btn');
  paymentButtons.forEach(btn => {
    const payMethod = btn.getAttribute('data-method');
    if (payMethod === state.paymentMethod) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function selectPaymentMethod(method) {
  state.paymentMethod = method;
  renderCart();
}

function setDiscountPreset(val) {
  const inp = document.getElementById('cartDiscountRate');
  if (inp) { inp.value = val; renderCart(); }
}

function setTaxPreset(val) {
  const inp = document.getElementById('cartTaxRate');
  if (inp) { inp.value = val; }
  const chk = document.getElementById('applyTax');
  if (chk && val > 0) chk.checked = true;
  renderCart();
}

function quickAddBySku() {
  const input = document.getElementById('quickSkuInput');
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  const prod = state.products.find(p => p.sku.toLowerCase() === val || p.name.toLowerCase().includes(val));
  if (prod) {
    if (prod.stock > 0) {
      addToCart(prod.id);
      input.value = '';
      showToast('Added via SKU', 'success');
    } else {
      showToast('Out of stock', 'warning');
    }
  } else {
    showToast('Product/SKU not found', 'danger');
  }
}

function applyServicePreset(val) {
  const inp = document.getElementById('serviceFeeRate');
  if (inp) { inp.value = val; renderCart(); }
}

function calculateCashChange() {
  const tenderInput = document.getElementById('cashTendered');
  const changeSpan = document.getElementById('cashChangeDue');
  if (!tenderInput || !changeSpan) return;

  const currency = state.settings?.defaultCurrency || '₹';
  const tender = parseFloat(tenderInput.value) || 0;

  // grand total from display (strip currency symbol + commas)
  const totalText = document.getElementById('checkoutGrandTotal')?.innerText || '0';
  const total = parseFloat(totalText.replace(new RegExp('[^0-9.]', 'g'), '')) || 0;

  const change = Math.max(0, tender - total);
  changeSpan.innerText = currency + change.toFixed(2);
}

function processCheckout() {
  if (state.cart.length === 0) {
    showToast("Cart is empty!", "warning");
    return;
  }

  const custNameInput = document.getElementById('custName');
  const custContactInput = document.getElementById('custContact');

  const customerName = custNameInput ? custNameInput.value.trim() : 'Walk-in Customer';
  const customerContact = custContactInput ? custContactInput.value.trim() : 'None';

  // Deduct Inventory Stock
  for (const cartItem of state.cart) {
    const prod = state.products.find(p => p.id === cartItem.productId);
    if (prod) {
      if (prod.stock < cartItem.qty) {
        showToast(`Insufficient stock for ${prod.name}! Only ${prod.stock} left.`, 'danger');
        return;
      }
      prod.stock -= cartItem.qty;
    }
  }

  // Create Transaction (with advanced billing options)
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountRate = parseFloat(document.getElementById('cartDiscountRate').value) || 0;
  const discountAmount = subtotal * (discountRate / 100);
  const taxRateInput = document.getElementById('cartTaxRate');
  const taxChk = document.getElementById('applyTax');
  const taxRate = (taxChk && !taxChk.checked) ? 0 : (taxRateInput ? parseFloat(taxRateInput.value) || 0 : 0);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const serviceRate = parseFloat(document.getElementById('serviceFeeRate')?.value) || 0;
  const serviceAmount = (subtotal - discountAmount) * (serviceRate / 100);
  const grandTotal = subtotal - discountAmount + taxAmount + serviceAmount;

  const prefix = state.settings?.invoicePrefix || 'INV-';
  let nextNumber = state.settings?.invoiceStartNumber || 1000;
  const transactionId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
  if (!state.settings) state.settings = {};
  state.settings.invoiceStartNumber = nextNumber + 1;

  const isCash = state.paymentMethod === 'Cash';
  const tendered = isCash ? (parseFloat(document.getElementById('cashTendered')?.value) || 0) : 0;
  const changeDue = isCash ? Math.max(0, tendered - grandTotal) : 0;

  const newTx = {
    id: transactionId,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    customer: { name: customerName || 'Walk-in Customer', contact: customerContact },
    items: [...state.cart],
    subtotal: subtotal,
    taxRate: taxRate,
    taxAmount: taxAmount,
    discountRate: discountRate,
    discountAmount: discountAmount,
    serviceRate: serviceRate,
    serviceAmount: serviceAmount,
    total: grandTotal,
    paymentMethod: state.paymentMethod,
    tendered: tendered || undefined,
    change: changeDue || undefined,
    status: 'Paid', type: 'sale'
  };

  state.transactions.push(newTx);
  state.cart = []; // empty cart
  state.paymentMethod = 'Cash'; // reset method

  // Clear inputs (incl advanced)
  if (custNameInput) custNameInput.value = '';
  if (custContactInput) custContactInput.value = '';
  if (document.getElementById('cartDiscountRate')) document.getElementById('cartDiscountRate').value = 0;
  if (document.getElementById('cartTaxRate')) document.getElementById('cartTaxRate').value = 18;
  if (document.getElementById('serviceFeeRate')) document.getElementById('serviceFeeRate').value = 0;
  if (document.getElementById('cashTendered')) document.getElementById('cashTendered').value = '';
  const postChk = document.getElementById('applyTax');
  const taxDefPost = state.settings ? (state.settings.taxEnabledByDefault !== false) : true;
  if (postChk) postChk.checked = taxDefPost;

  saveStore();
  showToast(`Checkout successful! Invoice ${transactionId} generated.`, 'success');

  // Trigger modal showing print layout invoice!
  viewInvoiceDetails(transactionId);
  
  // Refresh view
  renderActiveTab();
}

// INVENTORY MODULE
function renderInventory() {
  const searchInput = document.getElementById('inventorySearch');
  const catFilter = document.getElementById('inventoryCategoryFilter');
  const statusFilter = document.getElementById('inventoryStatusFilter');
  const tableBody = document.getElementById('inventoryTableBody');

  const query = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedCat = catFilter ? catFilter.value : '';
  const selectedStatus = statusFilter ? statusFilter.value : '';

  // Get categories for dropdowns dynamically
  const categories = [...new Set(state.products.map(p => p.category))];
  
  if (catFilter && catFilter.options.length <= 1) {
    catFilter.innerHTML = `<option value="">All Categories</option>` + 
      categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    if (selectedCat) catFilter.value = selectedCat;
  }

  // Populate Add Modal categories as well
  const addCatSelect = document.getElementById('prodCategory');
  if (addCatSelect && addCatSelect.options.length <= 1) {
    addCatSelect.innerHTML = `<option value="">Select Category</option>` +
      categories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('') +
      `<option value="NEW_CAT">+ Create Custom Category</option>`;
  }

  // Filter + sort Products (advanced inventory)
  let filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    const matchesCat = selectedCat === '' || p.category === selectedCat;
    
    let matchesStatus = true;
    if (selectedStatus === 'in') {
      matchesStatus = p.stock > p.minStock;
    } else if (selectedStatus === 'low') {
      matchesStatus = p.stock > 0 && p.stock <= p.minStock;
    } else if (selectedStatus === 'out') {
      matchesStatus = p.stock === 0;
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Apply current sort
  const sortKey = state.inventorySortKey || 'name';
  const sortDir = state.inventorySortDir || 1;
  filtered.sort((a, b) => {
    let va = a[sortKey] ?? '', vb = b[sortKey] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return -1 * sortDir;
    if (va > vb) return 1 * sortDir;
    return 0;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px;">
          No products matched the active filters.
        </td>
      </tr>
    `;
    renderInventorySummary();
    updateBulkBar();
    return;
  }

  tableBody.innerHTML = filtered.map(p => {
    const isOut = p.stock === 0;
    const isLow = p.stock > 0 && p.stock <= p.minStock;
    const isSelected = (state.inventorySelected || []).includes(p.id);
    const valueCost = (p.stock * p.costPrice).toFixed(2);
    
const currency = state.settings?.defaultCurrency || '₹';
     let statusBadge = `<span class="badge badge-success">In Stock</span>`;
     if (isOut) statusBadge = `<span class="badge badge-danger">Out Of Stock</span>`;
     else if (isLow) statusBadge = `<span class="badge badge-warning">Low Stock</span>`;

     return `
       <tr>
         <td><input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleInventorySelect('${p.id}', this.checked)"></td>
         <td>
           <div class="table-avatar-title">
             <div class="table-icon-box">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
             </div>
             <div>
               <div class="table-primary-text">${escapeHTML(p.name)}</div>
               <div class="table-secondary-text">Category: ${escapeHTML(p.category)}</div>
               ${p.description ? `<div style="font-size:10px;color:var(--text-muted);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHTML(p.description)}</div>` : ''}
             </div>
           </div>
         </td>
         <td><code style="color: var(--text-secondary);">${escapeHTML(p.sku)}</code>${p.barcode ? `<div style="font-size:9px;opacity:0.6">${p.barcode}</div>` : ''}</td>
         <td>${currency}${p.costPrice.toFixed(2)}</td>
         <td><strong>${currency}${p.sellingPrice.toFixed(2)}</strong>${p.mrp && p.mrp > p.sellingPrice ? `<div style="font-size:9px;opacity:0.6">MRP: ${currency}${p.mrp.toFixed(2)}</div>` : ''}</td>
         <td>
           <span style="font-weight: 600; ${isOut ? 'color: var(--danger);' : isLow ? 'color: var(--warning);' : ''}">${p.stock}</span>
           <span style="font-size: 11px; color: var(--text-muted);"> (Min: ${p.minStock})</span>
           <span style="margin-left:4px;">
             <button class="qty-btn" style="padding:0 4px;font-size:10px;" onclick="event.stopImmediatePropagation();adjustProductStock('${p.id}',1);return false;">+</button>
             <button class="qty-btn" style="padding:0 4px;font-size:10px;" onclick="event.stopImmediatePropagation();adjustProductStock('${p.id}',-1);return false;">−</button>
           </span>
         </td>
         <td>${currency}${valueCost}</td>
         <td>${statusBadge}${p.unit ? `<div style="font-size:10px;color:var(--text-muted)">${p.unit}</div>` : ''}</td>
        <td>
          <div class="actions-cell">
            <button class="action-btn edit-btn" onclick="openEditProductModal('${p.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-btn delete-btn" onclick="deleteProductConfirm('${p.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Wire select-all state
  const selectAll = document.getElementById('invSelectAll');
  if (selectAll) {
    const allSelected = filtered.length > 0 && filtered.every(p => (state.inventorySelected || []).includes(p.id));
    selectAll.checked = allSelected;
    selectAll.indeterminate = !allSelected && (state.inventorySelected || []).length > 0;
  }

  renderInventorySummary();
  updateBulkBar();
}

function adjustProductStock(id, delta) {
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;
  prod.stock = Math.max(0, prod.stock + delta);
  saveStore();
  renderInventory();
}

// Product Management (CRUD Methods)
function toggleAddCategoryInput() {
  const select = document.getElementById('prodCategory');
  const customDiv = document.getElementById('customCategoryGroup');
  if (select.value === 'NEW_CAT') {
    customDiv.style.display = 'block';
  } else {
    customDiv.style.display = 'none';
  }
}

function suggestMarginPrice(marginPercent) {
  const costInput = document.getElementById('prodCostPrice');
  const sellInput = document.getElementById('prodSellingPrice');
  if (!costInput || !sellInput) return;
  const cost = parseFloat(costInput.value) || 0;
  if (cost > 0) {
    const suggested = (cost * (1 + marginPercent / 100)).toFixed(2);
    sellInput.value = suggested;
    showToast(`Suggested retail at +${marginPercent}% margin`, 'success');
  } else {
    showToast('Enter cost price first', 'warning');
  }
}

function openAddProductModal() {
  state.selectedProductId = null;
  document.getElementById('productModalTitle').innerText = 'Add New Product';
  
  // reset form
  document.getElementById('prodForm').reset();
  document.getElementById('customCategoryGroup').style.display = 'none';
  
  openModal('productModal');
}

function openEditProductModal(id) {
  state.selectedProductId = id;
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById('productModalTitle').innerText = 'Edit Product';

  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodSku').value = prod.sku;
  
  const catSelect = document.getElementById('prodCategory');
  catSelect.value = prod.category;
  document.getElementById('customCategoryGroup').style.display = 'none';

  document.getElementById('prodCostPrice').value = prod.costPrice;
  document.getElementById('prodMRP').value = prod.mrp || prod.sellingPrice || '';
  document.getElementById('prodSellingPrice').value = prod.sellingPrice;
  document.getElementById('prodStock').value = prod.stock;
  document.getElementById('prodMinStock').value = prod.minStock;

  // New upgraded fields (with safe defaults for legacy data)
  document.getElementById('prodSupplier').value = prod.supplier || '';
  document.getElementById('prodBarcode').value = prod.barcode || '';
  document.getElementById('prodUnit').value = prod.unit || 'Piece';
  document.getElementById('prodDescription').value = prod.description || '';
  document.getElementById('prodExpiry').value = prod.expiryDate || '';
  document.getElementById('prodTaxRate').value = prod.taxRate !== undefined ? prod.taxRate : 18;

  openModal('productModal');
}

function saveProduct(e) {
  e.preventDefault();

  const name = document.getElementById('prodName').value.trim();
  const sku = document.getElementById('prodSku').value.trim();
  
  let category = document.getElementById('prodCategory').value;
  if (category === 'NEW_CAT') {
    category = document.getElementById('prodCustomCategory').value.trim();
    if (!category) {
      showToast("Custom category cannot be empty!", "warning");
      return;
    }
  }

  const costPrice = parseFloat(document.getElementById('prodCostPrice').value) || 0;
  const mrp = parseFloat(document.getElementById('prodMRP').value) || 0;
  const sellingPrice = parseFloat(document.getElementById('prodSellingPrice').value) || 0;
  const stock = parseInt(document.getElementById('prodStock').value) || 0;
  const minStock = parseInt(document.getElementById('prodMinStock').value) || 0;

  // Extract new advanced fields
  const supplier = document.getElementById('prodSupplier').value.trim();
  const barcode = document.getElementById('prodBarcode').value.trim();
  const unit = document.getElementById('prodUnit').value;
  const description = document.getElementById('prodDescription').value.trim();
  const expiryDate = document.getElementById('prodExpiry').value;
  const taxRate = parseFloat(document.getElementById('prodTaxRate').value) || 18;

  if (!name || !sku || !category) {
    showToast("Please fill all required values.", "warning");
    return;
  }

  // Duplicate SKU validation
  const skuDuplicate = state.products.find(p => p.sku === sku && p.id !== state.selectedProductId);
  if (skuDuplicate) {
    showToast(`SKU '${sku}' already exists on another item (${skuDuplicate.name})`, 'warning');
    return;
  }

  if (state.selectedProductId) {
    // Editing existing product
    const idx = state.products.findIndex(p => p.id === state.selectedProductId);
    if (idx !== -1) {
      state.products[idx] = {
        ...state.products[idx],
        name, sku, category, costPrice, mrp, sellingPrice, stock, minStock,
        supplier, barcode, unit, description, expiryDate, taxRate
      };
      showToast("Product updated successfully", "success");
    }
  } else {
    // Add New
    const newProd = {
      id: `p${Math.floor(1000 + Math.random() * 9000)}`,
      name, sku, category, costPrice, mrp, sellingPrice, stock, minStock,
      supplier, barcode, unit, description, expiryDate, taxRate
    };
    state.products.push(newProd);
    showToast("New product added to inventory", "success");
  }

  saveStore();
  closeModal('productModal');
  
  // Refresh active tab rendering
  renderActiveTab();
}

function deleteProductConfirm(id) {
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Are you sure you want to delete ${prod.name}? This will remove it from catalog.`)) {
    state.products = state.products.filter(p => p.id !== id);
    saveStore();
    showToast("Product deleted successfully", "success");
    renderActiveTab();
  }
}

// Advanced inventory helpers
function toggleAllInventorySelect(checkbox) {
  const checked = checkbox.checked;
  state.inventorySelected = checked ? state.products.map(p => p.id) : [];
  renderInventory();
}

function toggleInventorySelect(id, checked) {
  if (checked) {
    if (!state.inventorySelected.includes(id)) state.inventorySelected.push(id);
  } else {
    state.inventorySelected = state.inventorySelected.filter(x => x !== id);
  }
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('inventoryBulkBar');
  const countEl = document.getElementById('bulkCount');
  if (!bar || !countEl) return;
  const count = state.inventorySelected ? state.inventorySelected.length : 0;
  if (count > 0) {
    bar.style.display = 'flex';
    countEl.innerText = `${count} selected`;
  } else {
    bar.style.display = 'none';
  }
}

function clearInventorySelection() {
  state.inventorySelected = [];
  renderInventory();
}

function bulkAdjustStock(delta) {
  if (!state.inventorySelected || state.inventorySelected.length === 0) return;
  state.inventorySelected.forEach(id => {
    const p = state.products.find(x => x.id === id);
    if (p) {
      p.stock = Math.max(0, p.stock + delta);
    }
  });
  saveStore();
  renderInventory();
  showToast(`Stock adjusted for ${state.inventorySelected.length} items`, 'success');
}

function bulkDeleteSelected() {
  if (!state.inventorySelected || state.inventorySelected.length === 0) return;
  if (!confirm(`Delete ${state.inventorySelected.length} selected products?`)) return;
  state.products = state.products.filter(p => !state.inventorySelected.includes(p.id));
  state.inventorySelected = [];
  saveStore();
  renderInventory();
  showToast('Selected products deleted', 'success');
}

// Bulk load stock (add quantity to all selected products) - for receiving shipments etc.
function bulkLoadStock() {
  if (!state.inventorySelected || state.inventorySelected.length === 0) return;

  const input = document.getElementById('bulkLoadAmount');
  const qty = parseInt(input ? input.value : '10', 10) || 10;

  if (qty <= 0) {
    showToast('Enter a positive quantity to load', 'warning');
    return;
  }

  state.inventorySelected.forEach(id => {
    const p = state.products.find(x => x.id === id);
    if (p) {
      p.stock = (p.stock || 0) + qty;
    }
  });

  saveStore();
  renderInventory();
  showToast(`Loaded +${qty} stock for ${state.inventorySelected.length} items`, 'success');
}

function sortInventory(key) {
  if (state.inventorySortKey === key) {
    state.inventorySortDir *= -1;
  } else {
    state.inventorySortKey = key;
    state.inventorySortDir = 1;
  }
  renderInventory();
}

function exportInventoryCSV() {
  const rows = [['ID','Name','SKU','Category','Cost','MRP','Selling','Stock','Unit','ValueCost','Supplier','Barcode','Expiry','Tax%']];
  const filtered = getFilteredProductsForInv(); // reuse logic or duplicate
  filtered.forEach(p => {
    const val = (p.stock * p.costPrice).toFixed(2);
    rows.push([p.id, p.name, p.sku, p.category, p.costPrice, p.mrp||'', p.sellingPrice, p.stock, p.unit||'', val, p.supplier||'', p.barcode||'', p.expiryDate||'', p.taxRate||'']);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'inventory_export.csv';
  a.click();
  showToast('Inventory exported', 'success');
}

// CSV Import for inventory (upsert by SKU)
function importInventoryCSV() {
  const fileInput = document.getElementById('inventoryImportFile');
  if (fileInput) fileInput.click();
}

function handleInventoryImport(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const rows = parseCSV(text);
      if (!rows || rows.length === 0) {
        showToast('No valid data rows found in the CSV', 'warning');
        return;
      }
      processImportedProducts(rows);
    } catch (err) {
      console.error(err);
      showToast('Failed to read or parse the CSV file', 'danger');
    }
  };
  reader.onerror = () => showToast('Could not read the selected file', 'danger');
  reader.readAsText(file);
  // Reset input so same file can be selected again
  input.value = '';
}

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] !== undefined ? values[index].trim() : '';
    });
    result.push(obj);
  }
  return result;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' ) {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function processImportedProducts(rows) {
  let added = 0;
  let updated = 0;

  const skuMap = new Map(state.products.map(p => [p.sku.toLowerCase().trim(), p]));

  rows.forEach(row => {
    // Support common header variations from the export
    const sku = (row.sku || row['sku code'] || row['sku'] || '').trim();
    const name = (row.name || row['product name'] || row['product'] || '').trim();
    if (!sku || !name) return; // require at minimum SKU + Name

    const cost = parseFloat(row.cost || row['cost price'] || row.costprice || '0') || 0;
    const selling = parseFloat(row.selling || row['selling price'] || row.sellingprice || '0') || 0;

    const prodData = {
      name: name,
      sku: sku,
      category: row.category || 'General',
      costPrice: cost,
      mrp: parseFloat(row.mrp || row['mrp'] || '') || undefined,
      sellingPrice: selling,
      stock: Math.max(0, parseInt(row.stock || row['stock qty'] || '0') || 0),
      minStock: Math.max(0, parseInt(row['min stock'] || row.minstock || row['minstock'] || '0') || 0),
      unit: row.unit || 'Piece',
      supplier: row.supplier || '',
      barcode: row.barcode || '',
      expiryDate: row.expiry || row['expiry date'] || row.expirydate || '',
      taxRate: parseFloat(row['tax%'] || row.taxrate || row['tax rate'] || '18') || 18,
      description: row.description || row.desc || ''
    };

    const existing = skuMap.get(sku.toLowerCase());

    if (existing) {
      // Update existing product
      Object.keys(prodData).forEach(key => {
        if (prodData[key] !== undefined && prodData[key] !== '') {
          existing[key] = prodData[key];
        }
      });
      updated++;
    } else {
      // Add new product
      const newProduct = {
        id: 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
        ...prodData,
        createdAt: new Date().toISOString()
      };
      state.products.push(newProduct);
      skuMap.set(sku.toLowerCase(), newProduct);
      added++;
    }
  });

  if (added === 0 && updated === 0) {
    showToast('No products were imported (check headers and data)', 'warning');
    return;
  }

  saveStore();
  renderInventory();

  showToast(`Import finished: ${added} new, ${updated} updated`, 'success');
}

function getFilteredProductsForInv() {
  // lightweight copy of filter logic for export
  const searchInput = document.getElementById('inventorySearch');
  const catFilter = document.getElementById('inventoryCategoryFilter');
  const statusFilter = document.getElementById('inventoryStatusFilter');
  const query = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedCat = catFilter ? catFilter.value : '';
  const selectedStatus = statusFilter ? statusFilter.value : '';
  let filtered = state.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    const matchesCat = !selectedCat || p.category === selectedCat;
    let matchesStatus = true;
    if (selectedStatus === 'in') matchesStatus = p.stock > p.minStock;
    else if (selectedStatus === 'low') matchesStatus = p.stock > 0 && p.stock <= p.minStock;
    else if (selectedStatus === 'out') matchesStatus = p.stock === 0;
    return matchesSearch && matchesCat && matchesStatus;
  });
  // apply sort
  const key = state.inventorySortKey || 'name';
  const dir = state.inventorySortDir || 1;
  filtered.sort((a,b) => {
    let va = a[key], vb = b[key];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });
  return filtered;
}

function renderInventorySummary() {
   const container = document.getElementById('inventorySummary');
   if (!container) return;
   const currency = state.settings?.defaultCurrency || '₹';
   const totalItems = state.products.length;
   const totalUnits = state.products.reduce((s,p)=> s + p.stock, 0);
   const totalValue = state.products.reduce((s,p)=> s + (p.stock * p.costPrice), 0);
   const lowCount = state.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
   container.innerHTML = `
     <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:6px 12px; font-size:12px;">
       <strong>${totalItems}</strong> SKUs
     </div>
     <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:6px 12px; font-size:12px;">
       <strong>${totalUnits}</strong> units in stock
     </div>
     <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:6px 12px; font-size:12px;">
       Value: <strong>${currency}${totalValue.toFixed(0)}</strong>
     </div>
     <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:6px; padding:6px 12px; font-size:12px; color:${lowCount>0?'var(--warning)':''}">
       Low stock: <strong>${lowCount}</strong>
     </div>
   `;
 }

 // INVOICES & TRANSACTIONS HISTORY MODULE
function renderTransactions() {
  const searchInput = document.getElementById('txSearch');
  const methodFilter = document.getElementById('txMethodFilter');
  const tableBody = document.getElementById('txTableBody');

  const query = searchInput ? searchInput.value.toLowerCase() : '';
  const selectedMethod = methodFilter ? methodFilter.value : '';

  // Sort descending by date
  const filtered = state.transactions
    .filter(tx => {
      const matchesSearch = tx.id.toLowerCase().includes(query) || 
                            tx.customer.name.toLowerCase().includes(query) || 
                            tx.customer.contact.toLowerCase().includes(query);
      const matchesMethod = selectedMethod === '' || tx.paymentMethod === selectedMethod;
      return matchesSearch && matchesMethod;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
          No transactions found.
        </td>
      </tr>
    `;
    return;
  }

const currency = state.settings?.defaultCurrency || '₹';
  tableBody.innerHTML = filtered.map(tx => `
     <tr>
       <td><strong>${tx.id}</strong></td>
       <td>${tx.date}</td>
       <td>
         <div class="table-primary-text">${escapeHTML(tx.customer.name)}</div>
         <div class="table-secondary-text">${escapeHTML(tx.customer.contact)}</div>
       </td>
       <td><span style="font-weight: 700;">${currency}${tx.total.toFixed(2)}</span></td>
       <td>
         <span class="badge ${tx.paymentMethod === 'Cash' ? 'badge-success' : tx.paymentMethod === 'Card' ? 'badge-success' : 'badge-warning'}">
           ${tx.paymentMethod}
         </span>
       </td>
       <td>
         <div class="actions-cell">
           <button class="action-btn view-btn" onclick="viewInvoiceDetails('${tx.id}')">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
           </button>
         </div>
       </td>
     </tr>
   `).join('');
}

// ============================================================
// DETAILED REPORTS MODULE (replaces old Sales History)
// ============================================================

function getReportFilteredTransactions() {
  const from = document.getElementById('reportDateFrom')?.value;
  const to = document.getElementById('reportDateTo')?.value;
  const search = (document.getElementById('reportSearch')?.value || '').toLowerCase();
  const method = document.getElementById('reportMethodFilter')?.value || '';
  const typeFilter = document.getElementById('reportTypeFilter')?.value || '';

  return state.transactions.filter(tx => {
    const txDate = tx.date;
    const matchesDate = (!from || txDate >= from) && (!to || txDate <= to);
    const matchesSearch = !search || 
      tx.id.toLowerCase().includes(search) || 
      tx.customer.name.toLowerCase().includes(search) ||
      tx.customer.contact.toLowerCase().includes(search);
    const matchesMethod = !method || tx.paymentMethod === method;
    const txType = tx.type || 'sale';
    const matchesType = !typeFilter || txType === typeFilter;
    return matchesDate && matchesSearch && matchesMethod && matchesType;
  });
}

function setReportQuickRange(days) {
  const fromEl = document.getElementById('reportDateFrom');
  const toEl = document.getElementById('reportDateTo');
  if (!fromEl || !toEl) return;

  const today = new Date();
  toEl.value = today.toISOString().split('T')[0];

  if (days === 0) {
    fromEl.value = '2024-01-01'; // safe default for mock data
  } else {
    const past = new Date(today);
    past.setDate(past.getDate() - days);
    fromEl.value = past.toISOString().split('T')[0];
  }
  renderReports();
}

function resetReportFilters() {
  const fromEl = document.getElementById('reportDateFrom');
  const toEl = document.getElementById('reportDateTo');
   const searchEl = document.getElementById('reportSearch');
   const methodEl = document.getElementById('reportMethodFilter');
   const typeEl = document.getElementById('reportTypeFilter');
 
   if (fromEl) fromEl.value = '';
   if (toEl) toEl.value = '';
   if (searchEl) searchEl.value = '';
   if (methodEl) methodEl.value = '';
   if (typeEl) typeEl.value = '';
 
   renderReports();
}

function exportReportCSV() {
  const filtered = getReportFilteredTransactions();
  if (filtered.length === 0) {
    showToast('No data to export', 'warning');
    return;
  }

  const rows = [['Invoice ID', 'Type', 'Date', 'Customer', 'Contact', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment Method']];
  filtered.forEach(tx => {
    rows.push([
      tx.id,
      tx.type === 'return' ? 'RETURN' : 'SALE',
      tx.date,
      tx.customer.name,
      tx.customer.contact,
      (tx.subtotal || 0).toFixed(2),
      (tx.discountAmount || 0).toFixed(2),
      (tx.taxAmount || 0).toFixed(2),
      tx.total.toFixed(2),
      tx.paymentMethod
    ]);
  });

  const csvContent = rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `nexus_reports_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  showToast('Report exported successfully', 'success');
}

function renderReports() {
  // Ensure default dates on first render
  const fromEl = document.getElementById('reportDateFrom');
  const toEl = document.getElementById('reportDateTo');
  if (fromEl && !fromEl.value) {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 30);
    fromEl.value = past.toISOString().split('T')[0];
    toEl.value = today.toISOString().split('T')[0];
  }

  const filtered = getReportFilteredTransactions();
 
   // === KPIs ===
   const salesTotal = filtered.filter(t => (t.type || 'sale') !== 'return').reduce((s, t) => s + (t.total || 0), 0);
   const returnsTotal = filtered.filter(t => t.type === 'return').reduce((s, t) => s + (t.total || 0), 0);
   const netRevenue = salesTotal + returnsTotal;
   const txCount = filtered.length;
   const avgOrder = txCount > 0 ? netRevenue / txCount : 0;
   const totalTax = filtered.reduce((sum, tx) => sum + (tx.taxAmount || 0), 0);

const currency = state.settings?.defaultCurrency || '₹';
   const kpiContainer = document.getElementById('reportKpiGrid');
   if (kpiContainer) {
     kpiContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Net Revenue</span>
          </div>
          <div class="stat-value" style="font-size:22px;">${currency}${netRevenue.toLocaleString('en-IN')}</div>
          <div class="stat-trend neutral"><span>Sales ${currency}${salesTotal.toFixed(0)} • Returns ${currency}${Math.abs(returnsTotal).toFixed(0)}</span></div>
        </div>
       <div class="stat-card">
         <div class="stat-header">
           <span class="stat-title">Transactions</span>
         </div>
         <div class="stat-value" style="font-size:22px;">${txCount}</div>
         <div class="stat-trend neutral"><span>In selected period</span></div>
       </div>
       <div class="stat-card">
         <div class="stat-header">
           <span class="stat-title">Average Order</span>
         </div>
         <div class="stat-value" style="font-size:22px;">${currency}${avgOrder.toFixed(0)}</div>
         <div class="stat-trend neutral"><span>Per invoice</span></div>
       </div>
       <div class="stat-card">
         <div class="stat-header">
           <span class="stat-title">Tax Collected</span>
         </div>
         <div class="stat-value" style="font-size:22px;">${currency}${totalTax.toFixed(0)}</div>
         <div class="stat-trend neutral"><span>GST / VAT</span></div>
       </div>
      `;
   }

   // === Returns Summary ===
   const returnsContainer = document.getElementById('returnsSummaryContent');
   if (returnsContainer) {
     const returnsInFilter = filtered.filter(t => (t.type || 'sale') === 'return');
     const returnCount = returnsInFilter.length;
     const totalRefunded = returnsInFilter.reduce((s, t) => s + Math.abs(t.total || 0), 0);
     const avgRefund = returnCount > 0 ? totalRefunded / returnCount : 0;
     const withReason = returnsInFilter.filter(t => t.reason).length;

     returnsContainer.innerHTML = `
       <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:6px;">
         <div style="font-size:11px;color:var(--text-secondary);">Returns in Period</div>
         <div style="font-size:20px;font-weight:600;">${returnCount}</div>
       </div>
       <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:6px;">
         <div style="font-size:11px;color:var(--text-secondary);">Total Refunded</div>
         <div style="font-size:20px;font-weight:600;color:var(--danger);">-${currency}${totalRefunded.toFixed(0)}</div>
       </div>
       <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:6px;">
         <div style="font-size:11px;color:var(--text-secondary);">Avg Refund</div>
         <div style="font-size:20px;font-weight:600;">-${currency}${avgRefund.toFixed(0)}</div>
       </div>
       <div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:6px;">
         <div style="font-size:11px;color:var(--text-secondary);">With Reason</div>
         <div style="font-size:20px;font-weight:600;">${withReason} / ${returnCount}</div>
       </div>
     `;
   }

   // === Payment Breakdown ===
  const paymentTotals = {};
  filtered.forEach(tx => {
    paymentTotals[tx.paymentMethod] = (paymentTotals[tx.paymentMethod] || 0) + tx.total;
  });

  const paymentHtml = Object.entries(paymentTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([method, amount]) => {
      const pct = netRevenue > 0 ? ((amount / netRevenue) * 100).toFixed(0) : 0;
      return `
        <div style="margin-bottom: 8px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;">
            <span>${method}</span>
            <span>₹${amount.toFixed(0)} <span style="color:var(--text-muted);">(${pct}%)</span></span>
          </div>
          <div style="background: var(--bg-tertiary); height: 6px; border-radius: 3px; overflow:hidden;">
            <div style="width: ${pct}%; height:100%; background: var(--accent-indigo);"></div>
          </div>
        </div>
      `;
    }).join('');

  const payContainer = document.getElementById('reportPaymentBreakdown');
  if (payContainer) {
    payContainer.innerHTML = paymentHtml || '<div style="color:var(--text-muted); font-size:12px;">No data</div>';
  }

  // === Top Products ===
  const productMap = {};
  filtered.forEach(tx => {
    (tx.items || []).forEach(item => {
      const name = item.name;
      if (!productMap[name]) productMap[name] = { revenue: 0, qty: 0 };
      productMap[name].revenue += item.price * (item.qty || 1);
      productMap[name].qty += (item.qty || 1);
    });
  });

  const topProducts = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  let topHtml = '';
  if (topProducts.length > 0) {
topHtml = topProducts.map(([name, data], idx) => `
         <div style="display:flex; justify-content:space-between; padding: 4px 0; border-bottom: 1px solid var(--border-color);">
           <div><strong>#${idx+1}</strong> ${escapeHTML(name)}</div>
           <div style="text-align:right; font-size:12px;">
             <div>${currency}${data.revenue.toFixed(0)}</div>
             <div style="color:var(--text-muted);">x${data.qty}</div>
           </div>
         </div>
     `).join('');
  } else {
    topHtml = '<div style="color:var(--text-muted); font-size:12px; padding:8px 0;">No sales data</div>';
  }
  const topContainer = document.getElementById('reportTopProducts');
  if (topContainer) topContainer.innerHTML = topHtml;

  // === Category-wise Sales Report ===
  const categoryMap = {};
  filtered.forEach(tx => {
    (tx.items || []).forEach(item => {
      const prod = state.products.find(p => p.id === item.productId);
      const cat = prod ? prod.category : 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { revenue: 0, qty: 0, txSet: new Set() };
      }
      const lineTotal = item.price * (item.qty || 1);
      categoryMap[cat].revenue += lineTotal;
      categoryMap[cat].qty += (item.qty || 1);
      categoryMap[cat].txSet.add(tx.id);
    });
  });

  const categoryData = Object.entries(categoryMap)
    .map(([cat, data]) => ({
      category: cat,
      revenue: data.revenue,
      qty: data.qty,
      txCount: data.txSet.size
    }))
    .sort((a, b) => b.revenue - a.revenue);

  let catHtml = '';
  if (categoryData.length > 0) {
    const totalCatRevenue = categoryData.reduce((s, c) => s + c.revenue, 0);
catHtml = categoryData.map(c => {
       const pct = totalCatRevenue > 0 ? ((c.revenue / totalCatRevenue) * 100).toFixed(1) : 0;
       return `
         <div style="margin-bottom: 6px;">
           <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
             <span>${escapeHTML(c.category)}</span>
             <span>${currency}${c.revenue.toFixed(0)} <span style="color:var(--text-muted);">(${pct}%)</span></span>
           </div>
           <div style="background: var(--bg-tertiary); height: 5px; border-radius: 3px; overflow: hidden;">
             <div style="width: ${pct}%; height: 100%; background: var(--accent-indigo);"></div>
           </div>
           <div style="font-size: 10px; color: var(--text-muted); margin-top: 1px;">
             ${c.qty} units • ${c.txCount} invoices
           </div>
         </div>
       `;
     }).join('');
  } else {
    catHtml = '<div style="color:var(--text-muted); font-size:12px; padding:8px 0;">No category sales data in current filters.</div>';
  }

  const catContainer = document.getElementById('reportCategoryBreakdown');
  if (catContainer) catContainer.innerHTML = catHtml;

  // === Detailed Transactions Table ===
  const tableBody = document.getElementById('reportTxTableBody');
  const summaryLine = document.getElementById('reportSummaryLine');

 if (summaryLine) {
      summaryLine.innerHTML = `${filtered.length} tx • Net ${currency}${netRevenue.toFixed(0)} (Sales ${currency}${salesTotal.toFixed(0)})`;
    }

  if (filtered.length === 0) {
    if (tableBody) {
      tableBody.innerHTML = `
         <tr>
            <td colspan="11" style="text-align:center; color:var(--text-muted); padding:40px;">
              No transactions match the current filters.
            </td>
         </tr>`;
    }
    return;
  }

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

if (tableBody) {
     tableBody.innerHTML = sorted.map(tx => `
       <tr>
         <td><strong>${tx.id}</strong></td>
         <td>${tx.date}</td>
         <td>
           <div class="table-primary-text">${escapeHTML(tx.customer.name)}</div>
           <div class="table-secondary-text" style="font-size:10px;">${escapeHTML(tx.customer.contact)}</div>
         </td>
         <td>${currency}${(tx.subtotal || 0).toFixed(2)}</td>
         <td style="color:var(--danger);">-${currency}${(tx.discountAmount || 0).toFixed(2)}</td>
         <td>+${currency}${(tx.taxAmount || 0).toFixed(2)}</td>
         <td><strong>${currency}${tx.total.toFixed(2)}</strong></td>
         <td>
           <span class="badge ${tx.paymentMethod === 'Cash' ? 'badge-success' : 'badge-warning'}">
             ${tx.paymentMethod}
            </span>
          </td>
          <td style="font-size:11px; color:var(--text-secondary);">
            ${tx.type === 'return' ? (tx.reason ? escapeHTML(tx.reason) : '<em>—</em>') : '—'}
          </td>
           <td>
             <button class="action-btn view-btn" onclick="viewInvoiceDetails('${tx.id}')" title="View Invoice">
               <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
             </button>
           </td>
           <td>
             ${tx.type === 'return' ? '<span style="font-size:10px;color:var(--text-muted);">Credit Note</span>' : `<button class="action-btn" onclick="openReturnModal('${tx.id}')" title="Process Return" style="background:var(--danger);color:white;border-color:var(--danger);">↩</button>`}
           </td>
        </tr>
      `).join('');
    }
 }

let currentReturnTx = null;
const currencySym = () => state.settings?.defaultCurrency || '₹';

function openReturnModal(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx || tx.type === 'return') return;
  currentReturnTx = tx;
  document.getElementById('returnModalTitle').textContent = `Return for ${tx.id}`;
  const infoEl = document.getElementById('returnInvoiceInfo');
  infoEl.innerHTML = `Invoice <strong>${tx.id}</strong> • ${tx.date} • ${escapeHTML(tx.customer.name)} • Original: ${currencySym()}${(tx.total||0).toFixed(2)}`;
  const itemsContainer = document.getElementById('returnItemsList');
  itemsContainer.innerHTML = tx.items.map((item, idx) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--border-color);font-size:13px;">
      <div style="flex:1;">${escapeHTML(item.name)} <span style="color:var(--text-muted);font-size:11px;">(max ${item.qty})</span></div>
      <div style="display:flex;align-items:center;gap:6px;">
        <input type="number" id="returnQty_${idx}" value="0" min="0" max="${item.qty}" style="width:58px;padding:2px 4px;" oninput="updateReturnTotal()">
        <span style="min-width:68px;text-align:right;">${currencySym()}${(item.price * item.qty).toFixed(2)}</span>
      </div>
    </div>`).join('');
  document.getElementById('returnReason').value = '';
  document.getElementById('returnRefundMethod').value = 'Cash';
  updateReturnTotal();
  openModal('returnModal');
}

function updateReturnTotal() {
  if (!currentReturnTx) return;
  let refund = 0;
  currentReturnTx.items.forEach((item, idx) => {
    const inp = document.getElementById(`returnQty_${idx}`);
    if (inp) {
      const q = Math.min(parseInt(inp.value)||0, item.qty||0);
      refund += q * (item.price||0);
    }
  });
  const el = document.getElementById('returnRefundAmount');
  if (el) el.textContent = `-${currencySym()}${refund.toFixed(2)}`;
}

function confirmReturn() {
  if (!currentReturnTx) { closeModal('returnModal'); return; }
  const original = currentReturnTx;
  const reason = document.getElementById('returnReason').value.trim();
  const method = document.getElementById('returnRefundMethod').value;
  let returnedItems = [];
  let refundTotal = 0;
  let returnedSubtotal = 0;
  original.items.forEach((item, idx) => {
    const inp = document.getElementById(`returnQty_${idx}`);
    if (!inp) return;
    let q = parseInt(inp.value) || 0;
    q = Math.max(0, Math.min(q, item.qty || 0));
    if (q > 0) {
      returnedItems.push({ productId: item.productId, name: item.name, price: item.price, qty: q, note: item.note || '' });
      refundTotal += q * item.price;
      returnedSubtotal += q * item.price;
    }
  });
  if (returnedItems.length === 0) {
    showToast('Select at least one item quantity to return.', 'warning');
    return;
  }
  returnedItems.forEach(ri => {
    const prod = state.products.find(p => p.id === ri.productId);
    if (prod) prod.stock = (prod.stock || 0) + ri.qty;
  });
  const prefix = state.settings?.invoicePrefix || 'INV-';
  let nextNumber = state.settings?.invoiceStartNumber || 1000;
  const cnId = `${prefix}${String(nextNumber).padStart(4,'0')}`;
  if (!state.settings) state.settings = {};
  state.settings.invoiceStartNumber = nextNumber + 1;
  const returnTx = {
    id: cnId, date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
    customer: {...original.customer}, items: returnedItems, subtotal: returnedSubtotal, taxRate:0, taxAmount:0, discountRate:0, discountAmount:0,
    serviceRate:0, serviceAmount:0, total: -refundTotal, paymentMethod: `Refund - ${method}`, status: 'Refunded',
    type: 'return', returnOf: original.id, reason: reason || undefined
  };
  state.transactions.push(returnTx);
  saveStore();
  closeModal('returnModal');
  currentReturnTx = null;
  showToast(`Return processed. Credit Note ${cnId} issued. Stock restocked.`, 'success');
  renderReports();
  renderActiveTab();
  setTimeout(() => viewInvoiceDetails(cnId), 350);
}

 // ============================================================
 // END REPORTS MODULE
 // ============================================================

// INVOICE PREVIEW & RENDER LOGIC (REWRITTEN for clean receipt print)
function viewInvoiceDetails(txId) {
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) return;

  const invoiceArea = document.getElementById('invoicePreviewArea');
  if (!invoiceArea) return;

  const currency = state.settings?.defaultCurrency || '₹';
  const s = state.settings || {};
  const shopName = escapeHTML(s.shopName || 'NEXUS RETAIL');
  const shopAddress = s.shopAddress ? escapeHTML(s.shopAddress) : '';
  const shopPhone = s.shopPhone ? 'Ph: ' + escapeHTML(s.shopPhone) : '';
  const shopGST = s.shopGSTIN ? 'GSTIN: ' + escapeHTML(s.shopGSTIN) : '';
  const footerNote = escapeHTML(s.footerNote || 'Thank you for your business!');

  const dateTime = tx.date + (tx.time ? ' • ' + tx.time : '');

  // Items rows
  const itemsHTML = tx.items.map(i => {
    const lineTot = ((i.price || 0) * (i.qty || 0)).toFixed(2);
    const noteHTML = i.note ? `<div style="font-size:9.5px;color:#6b7280;margin-top:1px;">Note: ${escapeHTML(i.note)}</div>` : '';
    return `
      <tr>
        <td>${escapeHTML(i.name || '')}${noteHTML}</td>
        <td>${i.qty || 0}</td>
        <td>${currency}${(i.price || 0).toFixed(2)}</td>
        <td>${currency}${lineTot}</td>
      </tr>`;
  }).join('');

  const sub = tx.subtotal || tx.total || 0;
  const disc = tx.discountAmount || 0;
  const tax = tx.taxAmount || 0;
  const svc = tx.serviceAmount || 0;
  const hasDetails = (sub !== (tx.total || 0)) || disc > 0 || tax > 0 || svc > 0;

  let totalsHTML = `<div class="receipt-total-row grand"><span>TOTAL</span><span>${currency}${(tx.total || 0).toFixed(2)}</span></div>`;
  if (hasDetails) {
    totalsHTML = `
      ${sub !== (tx.total || 0) ? `<div class="receipt-total-row"><span>Subtotal</span><span>${currency}${sub.toFixed(2)}</span></div>` : ''}
      ${disc > 0 ? `<div class="receipt-total-row discount"><span>Discount${tx.discountRate ? ' (' + tx.discountRate + '%)' : ''}</span><span>-${currency}${disc.toFixed(2)}</span></div>` : ''}
      ${tax > 0 ? `<div class="receipt-total-row"><span>Tax${tx.taxRate ? ' (' + tx.taxRate + '%)' : ''}</span><span>+${currency}${tax.toFixed(2)}</span></div>` : ''}
      ${svc > 0 ? `<div class="receipt-total-row"><span>Service${tx.serviceRate ? ' (' + tx.serviceRate + '%)' : ''}</span><span>+${currency}${svc.toFixed(2)}</span></div>` : ''}
      <div class="receipt-total-row grand"><span>TOTAL</span><span>${currency}${(tx.total || 0).toFixed(2)}</span></div>
    `;
  }

  let payHTML = escapeHTML(tx.paymentMethod || 'Cash');
  if (tx.tendered) payHTML += ` • Tendered ${currency}${tx.tendered.toFixed(2)}`;
  if (tx.change) payHTML += ` • Change ${currency}${tx.change.toFixed(2)}`;

  let custHTML = '';
  if (tx.customer) {
    const cname = tx.customer.name || '';
    const ccont = tx.customer.contact || '';
    if (cname && cname !== 'Walk-in Customer') {
      custHTML = `<div style="font-size:11px;margin:4px 0 2px;">Customer: ${escapeHTML(cname)}${ccont && ccont !== 'None' ? ' • ' + escapeHTML(ccont) : ''}</div>`;
    }
  }

  const receiptHTML = `
    <div class="receipt">
      <div class="receipt-header">
        <div class="receipt-shop">${shopName}</div>
        ${shopAddress ? `<div class="receipt-sub">${shopAddress}</div>` : ''}
        ${(shopPhone || shopGST) ? `<div class="receipt-sub">${[shopPhone, shopGST].filter(Boolean).join(' • ')}</div>` : ''}
      </div>

       <div class="receipt-meta">
         <div><strong>${escapeHTML(tx.id)}</strong> ${tx.type === 'return' ? '<span style="color:#dc2626;font-size:11px;font-weight:600;">(CREDIT NOTE)</span>' : ''}</div>
         <div>${dateTime}</div>
       </div>

      <div class="receipt-divider"></div>

      <table class="receipt-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amt</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>

      <div class="receipt-divider"></div>

      <div class="receipt-totals">
        ${tx.type === 'return' ? `<div class="receipt-total-row grand" style="color:#dc2626;"><span>CREDIT NOTE TOTAL</span><span>${currency}${(tx.total || 0).toFixed(2)}</span></div>` : totalsHTML}
      </div>

      <div class="receipt-payment">${payHTML}</div>

      ${custHTML}

      <div class="receipt-footer">${footerNote}</div>
    </div>
  `;

  invoiceArea.innerHTML = receiptHTML;

  const printBtn = document.getElementById('printInvoiceBtn');
  if (printBtn) {
    printBtn.onclick = () => printReceipt(receiptHTML, currency);
  }

  // Show linked returns / credit notes for sales
  if ((tx.type || 'sale') !== 'return') {
    const linked = state.transactions.filter(r => r.returnOf === tx.id && r.type === 'return');
    if (linked.length > 0) {
      const linkDiv = document.createElement('div');
      linkDiv.style.cssText = 'margin-top:16px; padding:12px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:13px;';
      linkDiv.innerHTML = `<strong style="color:#b91c1c;">Linked Returns (${linked.length})</strong><br>` +
        linked.map(r => {
          const amt = Math.abs(r.total || 0).toFixed(2);
          const reason = r.reason ? ` — ${escapeHTML(r.reason)}` : '';
          return `• <strong>${r.id}</strong> (${r.date}) — ${currency}${amt}${reason}`;
        }).join('<br>');
      invoiceArea.appendChild(linkDiv);
    }
  }

  openModal('invoiceModal');
}

// Dedicated clean receipt printer (opens minimal popup for perfect thermal/A4 receipt output)
function printReceipt(receiptHTMLContent, currencySymbol = '₹') {
  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (!printWindow) {
    // Fallback if popup blocked
    window.print();
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    body { margin:0; padding:8px 10px; font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif; font-size:11.5pt; color:#000; background:#fff; }
    .receipt { max-width:100%; width:100%; font-size:10.8pt; line-height:1.28; }
    .receipt-header { text-align:center; margin-bottom:6px; }
    .receipt-shop { font-size:15pt; font-weight:800; }
    .receipt-sub { font-size:9pt; color:#444; }
    .receipt-meta { display:flex; justify-content:space-between; font-size:10pt; margin:4px 0; }
    .receipt-divider { border-top:1px dashed #666; margin:4px 0; }
    .receipt-items { width:100%; border-collapse:collapse; font-size:10pt; }
    .receipt-items th { font-size:8.5pt; font-weight:700; color:#444; text-transform:uppercase; border-bottom:1px solid #555; padding:2px 0; }
    .receipt-items td { padding:1px 0; vertical-align:top; border-bottom:1px dotted #aaa; }
    .receipt-totals { margin:5px 0 3px; font-size:10.5pt; }
    .receipt-total-row { display:flex; justify-content:space-between; padding:1px 0; }
    .receipt-total-row.discount { color:#9f1239; }
    .receipt-total-row.grand { font-weight:800; font-size:12pt; border-top:1.5px solid #000; padding-top:3px; }
    .receipt-payment { font-weight:600; margin:3px 0; font-size:10.5pt; }
    .receipt-footer { text-align:center; font-size:9.5pt; color:#555; margin-top:6px; padding-top:5px; border-top:1px dashed #666; }
    @media print {
      body { padding:0; font-size:10pt; }
    }
  </style>
</head>
<body>
  ${receiptHTMLContent}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        setTimeout(function() { window.close(); }, 200);
      }, 150);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

// GENERAL UI MODAL UTILITIES
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// TOAST NOTIFICATIONS SYSTEM
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `list-item`;
  toast.style.cssText = `
    background-color: var(--bg-secondary);
    border-left: 4px solid ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : type === 'danger' ? 'var(--danger)' : 'var(--accent-indigo)'};
    padding: 12px 18px;
    box-shadow: var(--shadow-md);
    animation: slideIn 0.25s forwards;
    pointer-events: auto;
    font-size: 13px;
    font-weight: 500;
  `;
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="color: ${type === 'success' ? 'var(--success)' : type === 'warning' ? 'var(--warning)' : type === 'danger' ? 'var(--danger)' : 'var(--accent-indigo)'}">●</span>
      <span>${escapeHTML(message)}</span>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Trigger slide-in animation
  const styleSheet = document.createElement('style');
  styleSheet.innerText = `
    @keyframes slideIn {
      from { transform: translateX(110%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.25s forwards';
    // wait for fadeout
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3500);
}

// XSS Sanitizer Helper
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Basic Hold / Recall Cart functionality (supports keyboard shortcuts)
function holdCurrentCart() {
  if (!state.cart || state.cart.length === 0) {
    showToast('Cart is empty — nothing to hold', 'warning');
    return;
  }

  if (!state.heldCarts) state.heldCarts = [];

  const snapshot = {
    id: 'hold_' + Date.now(),
    timestamp: new Date().toISOString(),
    items: JSON.parse(JSON.stringify(state.cart)),
    customer: {
      name: document.getElementById('custName')?.value || '',
      contact: document.getElementById('custContact')?.value || ''
    },
    discountRate: parseFloat(document.getElementById('cartDiscountRate')?.value) || 0,
    taxRate: parseFloat(document.getElementById('cartTaxRate')?.value) || 18,
    applyTax: document.getElementById('applyTax') ? document.getElementById('applyTax').checked : true,
    serviceRate: parseFloat(document.getElementById('serviceFeeRate')?.value) || 0,
    paymentMethod: state.paymentMethod || 'Cash'
  };

  state.heldCarts.push(snapshot);
  state.cart = [];
  state.paymentMethod = 'Cash';

  // Clear form fields
  ['custName', 'custContact', 'cartDiscountRate', 'cartTaxRate', 'serviceFeeRate', 'cashTendered'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = (id.includes('Rate') ? (id === 'cartTaxRate' ? '18' : '0') : '');
  });
  const taxChk = document.getElementById('applyTax');
  const taxDefHold = state.settings ? (state.settings.taxEnabledByDefault !== false) : true;
  if (taxChk) taxChk.checked = taxDefHold;

  saveStore();
  renderActiveTab();
  showToast('Cart held successfully', 'success');
}

function openRecallCartsModal() {
  const modal = document.getElementById('recallCartsModal');
  const list = document.getElementById('recallCartsList');
  if (!modal || !list) return;

  if (!state.heldCarts || state.heldCarts.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-secondary);">No suspended carts.</div>`;
  } else {
    list.innerHTML = state.heldCarts.map((cart, index) => `
      <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:12px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
          <strong>${cart.id}</strong>
          <span style="color:var(--text-muted);">${new Date(cart.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style="font-size:13px; margin-bottom:8px;">
          ${cart.items.length} items • Total approx ₹${cart.items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" style="flex:1; padding:6px;" onclick="recallHeldCart(${index})">Recall</button>
          <button class="btn btn-secondary" style="flex:1; padding:6px; color:var(--danger);" onclick="deleteHeldCart(${index})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  openModal('recallCartsModal');
}

function recallHeldCart(index) {
  if (!state.heldCarts || !state.heldCarts[index]) return;

  const held = state.heldCarts[index];
  state.cart = JSON.parse(JSON.stringify(held.items));

  // Restore form values if elements exist
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('custName', held.customer?.name || '');
  setVal('custContact', held.customer?.contact || '');
  setVal('cartDiscountRate', held.discountRate || 0);
  setVal('cartTaxRate', held.taxRate || 18);
  setVal('serviceFeeRate', held.serviceRate || 0);
  const taxChk = document.getElementById('applyTax');
  if (taxChk) taxChk.checked = held.applyTax !== false;

  state.paymentMethod = held.paymentMethod || 'Cash';

  // Remove from held
  state.heldCarts.splice(index, 1);

  closeModal('recallCartsModal');
  saveStore();
  renderActiveTab();
  showToast('Cart recalled', 'success');
}

function deleteHeldCart(index) {
  if (!state.heldCarts) return;
  state.heldCarts.splice(index, 1);
  saveStore();
  openRecallCartsModal(); // refresh the list
}

// ============================================================
// KEYBOARD SHORTCUTS SYSTEM
// ============================================================

function switchToTab(tabName) {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  const pages = document.querySelectorAll('.page-view');
  const headerTitle = document.getElementById('headerTitle');

  let found = false;
  menuItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
      found = true;
    }
  });

  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`${tabName}Page`);
  if (target) target.classList.add('active');

  const activeMenu = document.querySelector(`.sidebar-menu .menu-item[data-tab="${tabName}"]`);
  if (activeMenu && headerTitle) {
    const name = activeMenu.querySelector('.menu-item-text').innerText;
    headerTitle.innerText = name;
  }

  state.activeTab = tabName;
  renderActiveTab();
}

function showKeyboardShortcuts() {
  openModal('shortcutsModal');
}

function isInputFocused() {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
}

// Setup Event Listeners on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  initStore();
  initTheme();
  initNavigation();
  const taxDef = state.settings ? (state.settings.taxEnabledByDefault !== false) : true;
  const taxChkInit = document.getElementById('applyTax');
  if (taxChkInit) taxChkInit.checked = taxDef;
  renderDashboard();

  // Attach global click event to dismiss modals on overlay click
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) {
        closeModal(m.id);
      }
    });
  });

  // Hotkey triggers
  window.addEventListener('keydown', (e) => {
    // Always allow Escape to close modals
    if (e.key === 'Escape') {
      modals.forEach(m => closeModal(m.id));
      return;
    }

    // Don't trigger shortcuts while typing in inputs (except help and escape)
    if (isInputFocused()) {
      if (e.key === '?' || (ctrl && e.key === '/')) {
        e.preventDefault();
        showKeyboardShortcuts();
        return;
      }
      // Allow Ctrl+Enter even in some inputs
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const posPage = document.getElementById('posPage');
        if (posPage && posPage.classList.contains('active')) {
          e.preventDefault();
          processCheckout();
        }
      }
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;
    const alt = e.altKey;

    // === NAVIGATION (Alt + 1-5) ===
    if (alt && !ctrl) {
      switch (e.key) {
        case '1': e.preventDefault(); switchToTab('dashboard'); return;
        case '2': e.preventDefault(); switchToTab('pos'); return;
        case '3': e.preventDefault(); switchToTab('inventory'); return;
        case '4': e.preventDefault(); switchToTab('reports'); return;
        case '5': e.preventDefault(); switchToTab('settings'); return;
      }
    }

    // === GENERAL ===
    if (e.key === '?' || (ctrl && e.key === '/')) {
      e.preventDefault();
      showKeyboardShortcuts();
      return;
    }

    // === BILLING TERMINAL ===
    if (ctrl) {
      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          switchToTab('pos');
          setTimeout(() => {
            const quickInput = document.getElementById('quickSkuInput');
            if (quickInput) quickInput.focus();
          }, 80);
          return;

        case 'enter':
          e.preventDefault();
          processCheckout();
          return;

        case 'd':
          e.preventDefault();
          state.cart = [];
          renderActiveTab();
          showToast('Cart cleared', 'info');
          return;

        case 'h':
          e.preventDefault();
          switchToTab('pos');
          setTimeout(() => holdCurrentCart(), 50);
          return;

        case 'r':
          e.preventDefault();
          switchToTab('pos');
          setTimeout(() => openRecallCartsModal(), 50);
          return;

        case 'e':
          e.preventDefault();
          switchToTab('inventory');
          setTimeout(() => exportInventoryCSV(), 80);
          return;

        case 'i':
          e.preventDefault();
          switchToTab('inventory');
          setTimeout(() => importInventoryCSV(), 80);
          return;
      }
    }

    // Inventory specific
    if (ctrl && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      switchToTab('inventory');
      setTimeout(() => openAddProductModal(), 80);
      return;
    }

    if (ctrl && e.key.toLowerCase() === 'f') {
      const invPage = document.getElementById('inventoryPage');
      if (invPage && invPage.classList.contains('active')) {
        e.preventDefault();
        const search = document.getElementById('inventorySearch');
        if (search) search.focus();
      }
      return;
    }
  });

  // Attach theme button listener
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
});
