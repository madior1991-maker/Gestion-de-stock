/**
 * StockManager Pro v2 - Executive Dashboard & Financial Reporting Component
 * (Chiffre d'Affaires, Bénéfice Net, TVA Perçue, Top 5 Meilleures Ventes & Notifications)
 */

let movementChartInstance = null;

function renderDashboard() {
  const metrics = window.store.getMetrics();

  // Update KPI Cards
  const kpiValuation = document.getElementById('kpi-valuation');
  const kpiTotalItems = document.getElementById('kpi-total-items');
  const kpiAlertsCount = document.getElementById('kpi-alerts-count');
  const kpiMovementsMonth = document.getElementById('kpi-movements-month');
  const kpiPotentialProfit = document.getElementById('kpi-potential-profit');

  if (kpiValuation) kpiValuation.textContent = window.formatFCFA(metrics.totalValuationBuy);
  if (kpiTotalItems) kpiTotalItems.textContent = metrics.totalProducts;
  if (kpiAlertsCount) kpiAlertsCount.textContent = metrics.totalAlerts;
  if (kpiPotentialProfit) kpiPotentialProfit.textContent = window.formatFCFA(metrics.totalPotentialProfit || 0);

  const movements = window.store.getMovements();
  if (kpiMovementsMonth) kpiMovementsMonth.textContent = movements.length;

  // Render Charts, Top Sellers & Priority Alert Table
  renderMovementChart();
  renderTopSellersWidget();
  renderDashboardAlertsTable();
}

function renderMovementChart() {
  const canvas = document.getElementById('movementChart');
  if (!canvas) return;

  const movements = window.store.getMovements();

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const inData = new Array(7).fill(0);
  const outData = new Array(7).fill(0);

  movements.forEach(m => {
    const mDate = m.date.split('T')[0];
    const idx = last7Days.indexOf(mDate);
    if (idx !== -1) {
      if (m.type === 'IN') inData[idx] += m.quantity;
      if (m.type === 'OUT') outData[idx] += m.quantity;
    }
  });

  const labels = last7Days.map(d => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  if (movementChartInstance) {
    movementChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  movementChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Entrées (+)',
          data: inData,
          backgroundColor: '#10b981',
          borderRadius: 6
        },
        {
          label: 'Sorties (-)',
          data: outData,
          backgroundColor: '#ef4444',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        }
      }
    }
  });
}

function renderTopSellersWidget() {
  const container = document.getElementById('top-sellers-list');
  if (!container) return;

  const topSellers = window.store.getTopSellingProducts(5);
  const maxQty = topSellers.length > 0 && topSellers[0].totalQty > 0 ? topSellers[0].totalQty : 1;

  if (topSellers.length === 0 || topSellers.every(s => s.totalQty === 0)) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">
        <i class="fa-solid fa-trophy" style="font-size: 1.8rem; margin-bottom: 0.35rem; opacity: 0.4;"></i>
        <p style="font-size: 0.85rem;">Aucune vente enregistrée pour établir le classement.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = topSellers.map((item, idx) => {
    const p = item.product;
    const percentage = Math.round((item.totalQty / maxQty) * 100);
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    return `
      <div class="top-seller-item">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
            <span><strong>${medals[idx] || ''} ${escapeHtml(p.name)}</strong></span>
            <strong style="color: var(--accent-primary);">${item.totalQty} vendu(s)</strong>
          </div>
          <div style="background: var(--bg-tertiary); height: 6px; border-radius: 4px; overflow: hidden; margin-top: 4px;">
            <div class="top-seller-progress" style="width: ${percentage}%;"></div>
          </div>
          <span style="font-size: 0.72rem; color: var(--text-muted);">CA généré: ${window.formatFCFA(item.totalRevenue)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderDashboardAlertsTable() {
  const alertsList = document.getElementById('dashboard-alerts-list');
  if (!alertsList) return;

  const lowProducts = window.store.getLowStockProducts();

  if (lowProducts.length === 0) {
    alertsList.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--success); padding: 1.5rem;">
          <i class="fa-solid fa-circle-check" style="font-size: 1.5rem; margin-bottom: 0.35rem; display: block;"></i>
          Aucune alerte de stock. Tous les produits sont en quantité suffisante !
        </td>
      </tr>
    `;
    return;
  }

  alertsList.innerHTML = lowProducts.slice(0, 5).map(p => {
    const isOut = p.quantity <= 0;
    const badge = isOut ?
      '<span class="badge badge-danger"><span class="badge-dot"></span>Rupture de Stock</span>' :
      '<span class="badge badge-warning"><span class="badge-dot"></span>Stock Critique</span>';

    const thumbHtml = p.image ?
      `<img src="${p.image}" alt="${escapeHtml(p.name)}" class="product-thumb">` :
      `<div class="product-thumb-placeholder"><i class="fa-solid fa-box"></i></div>`;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${thumbHtml}
            <div>
              <strong style="color: var(--text-primary); display: block;">${escapeHtml(p.name)}</strong>
              <span style="font-family: monospace; font-size: 0.75rem; color: var(--accent-primary);">${escapeHtml(p.sku)}</span>
            </div>
          </div>
        </td>
        <td>
          <strong style="color: ${isOut ? 'var(--danger)' : 'var(--warning)'};">${p.quantity}</strong> / ${p.minStock} min.
        </td>
        <td>${badge}</td>
        <td>
          <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="openRestockModal('${p.id}')">
            <i class="fa-solid fa-truck-ramp-box"></i> Réappro.
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openExecutiveDashboardReport() {
  const metrics = window.store.getMetrics();
  const finMetrics = window.store.getFinancialMetrics();
  const settings = window.store.getSettings();

  const reportContainer = document.getElementById('printable-dashboard-report');
  if (!reportContainer) return;

  const todayDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const logoImgHtml = settings.companyLogo ?
    `<img src="${settings.companyLogo}" alt="2M GLOBAL SERVICES" style="max-height: 65px; max-width: 200px; object-fit: contain; margin-bottom: 0.35rem;">` :
    `<h2 style="font-size: 1.4rem; color: #0284c7; font-weight: 800;">${escapeHtml(settings.companyName)}</h2>`;

  reportContainer.innerHTML = `
    <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border-color); font-size: 0.88rem; max-width: 820px; margin: 0 auto;">
      
      <!-- Company Header with Logo -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0284c7; padding-bottom: 1rem; margin-bottom: 1.25rem;">
        <div>
          ${logoImgHtml}
          <h2 style="font-size: 1.15rem; color: #0284c7; font-weight: 800;">${escapeHtml(settings.companyName)}</h2>
          <p style="color: var(--text-secondary); font-size: 0.82rem;">${escapeHtml(settings.companyAddress)} | Tél: ${escapeHtml(settings.companyPhone)}</p>
          <p style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">${escapeHtml(settings.companyTaxId)}</p>
        </div>
        <div style="text-align: right;">
          <h1 style="font-size: 1.5rem; color: #0284c7; text-transform: uppercase; font-family: 'Outfit', sans-serif;">
            RAPPORT FINANCIER & D'EXPLOITATION
          </h1>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Généré le: <strong>${todayDate}</strong></p>
          <span class="badge badge-info" style="margin-top: 0.35rem;"><i class="fa-solid fa-chart-line"></i> Bilan d'Activité Officiel</span>
        </div>
      </div>

      <!-- Financial Metrics Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.25rem;">
        
        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--accent-primary);">
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">CHIFFRE D'AFFAIRES TTC</span>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-primary); margin-top: 0.2rem;">${window.formatFCFA(finMetrics.caTtc)}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Net HT : <strong>${window.formatFCFA(finMetrics.caHt)}</strong></div>
        </div>

        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--success);">
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">BÉNÉFICE NET D'EXPLOITATION</span>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--success); margin-top: 0.2rem;">${window.formatFCFA(finMetrics.netProfit)}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Marge d'Exploitation : <strong style="color: var(--success);">${finMetrics.profitMargin}%</strong></div>
        </div>

        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--info);">
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">TAXES PERÇUES (TVA 18%)</span>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--info); margin-top: 0.2rem;">${window.formatFCFA(finMetrics.totalTva)}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Collecté pour la DGI</div>
        </div>

        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--warning);">
          <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">COÛT D'ACHAT DES MARCHANDISES VENDUES</span>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--warning); margin-top: 0.2rem;">${window.formatFCFA(finMetrics.cogs)}</div>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">Coût de revient d'inventaire</div>
        </div>

      </div>

      <!-- Additional Useful Metrics Table Breakdown -->
      <div style="margin-bottom: 1.25rem;">
        <h3 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.6rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.35rem;">
          <i class="fa-solid fa-list-check" style="color: var(--accent-primary);"></i> Indicateurs Clés de Performance (KPIs & Inventaire)
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; color: var(--text-secondary);">Valeur d'Achat Totale du Stock en Réserve :</td>
              <td style="padding: 0.5rem; text-align: right;"><strong>${window.formatFCFA(metrics.totalValuationBuy)}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; color: var(--text-secondary);">Valeur de Vente Potentielle du Stock :</td>
              <td style="padding: 0.5rem; text-align: right;"><strong>${window.formatFCFA(metrics.totalValuationSell)}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; color: var(--text-secondary);">Nombre de Factures Validées & Payées :</td>
              <td style="padding: 0.5rem; text-align: right;"><strong>${finMetrics.paidInvoicesCount} vente(s)</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; color: var(--text-secondary);">Panier Moyen par Vente (TTC) :</td>
              <td style="padding: 0.5rem; text-align: right;"><strong>${window.formatFCFA(finMetrics.avgOrderValue)}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; color: var(--text-secondary);">Remises & Réductions Commerciales Accordées :</td>
              <td style="padding: 0.5rem; text-align: right; color: var(--warning);"><strong>-${window.formatFCFA(finMetrics.totalDiscount)}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 0.5rem; color: var(--text-secondary);">Factures Proforma (Devis en Attente) :</td>
              <td style="padding: 0.5rem; text-align: right;"><strong>${finMetrics.pendingProformaCount} devis (${window.formatFCFA(finMetrics.pendingProformaAmount)})</strong></td>
            </tr>
            <tr>
              <td style="padding: 0.5rem; color: var(--text-secondary);">Nombre de Références en Alerte de Stock :</td>
              <td style="padding: 0.5rem; text-align: right; color: ${metrics.totalAlerts > 0 ? 'var(--danger)' : 'var(--success)'};">
                <strong>${metrics.totalAlerts} produit(s)</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Stamp & Signature Area -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">StockManager Pro - 2M GLOBAL SERVICES</span>
        <div style="text-align: right;">
          <p style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary);">Visa Administrateur Général</p>
        </div>
      </div>

    </div>
  `;

  openModal('modal-dashboard-report');
}

function printDashboardReport() {
  window.print();
}

window.renderDashboard = renderDashboard;
window.renderTopSellersWidget = renderTopSellersWidget;
window.openExecutiveDashboardReport = openExecutiveDashboardReport;
window.printDashboardReport = printDashboardReport;
