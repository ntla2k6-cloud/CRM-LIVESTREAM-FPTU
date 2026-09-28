// app_expenses.js
async function renderExpensesPage() {
  const page = document.getElementById('page-expenses');
  if (!page) return;

  const now = new Date();
  const monthStr = document.getElementById('exp-month')?.value || now.toISOString().slice(0, 7);

  page.innerHTML = `
    <div class="page-header">
      <div class="page-title">Quản Lý <span>Chi Phí</span></div>
      <div class="page-sub">Theo dõi các khoản chi tiêu của trung tâm</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <input type="month" id="exp-month" value="${monthStr}" onchange="renderExpensesPage()"
          style="border:1.5px solid var(--cream2);border-radius:8px;padding:7px 12px;font-size:13px;font-family:'Be Vietnam Pro',sans-serif;">
      </div>
      <button onclick="openExpenseModal()" class="btn btn-gold">✨ Thêm Khoản Chi</button>
    </div>
    <div id="expenses-content"></div>
  `;

  recalcExpenses(monthStr);
}

function recalcExpenses(monthStr) {
  const content = document.getElementById('expenses-content');
  if (!content) return;

  const filtered = (typeof expenses !== 'undefined' ? expenses : []).filter(e => e.date && e.date.startsWith(monthStr));
  const total = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const formatMoney = (val) => Number(val).toLocaleString('vi-VN') + ' đ';

  let html = `
    <div class="card" style="margin-bottom:20px;background:var(--cream);border:1px solid var(--gold);box-shadow:none;">
      <div style="font-size:12px;color:var(--navy);font-weight:700;text-transform:uppercase;margin-bottom:5px;">Tổng Chi Tháng ${monthStr}</div>
      <div style="font-size:24px;font-weight:800;color:#D94F4F;">${formatMoney(total)}</div>
    </div>
  `;

  if (filtered.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-text">Chưa có khoản chi nào trong tháng này</div></div>`;
  } else {
    const rows = filtered.map(e => `
      <tr>
        <td>${e.date}</td>
        <td style="font-weight:600;color:var(--navy)">${e.category || '-'}</td>
        <td>${e.spender || '-'}</td>
        <td style="color:#D94F4F;font-weight:700;text-align:right">${formatMoney(e.amount)}</td>
        <td>${e.note || '-'}</td>
        <td style="text-align:right">
          <button class="btn btn-outline" style="padding:4px 8px;font-size:11px;color:#D94F4F;border-color:#D94F4F;" onclick="deleteExpense(${e.id})">Xóa</button>
        </td>
      </tr>
    `).join('');

    html += `
      <div class="card"><div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Hạng Mục</th>
              <th>Người Chi</th>
              <th style="text-align:right">Số Tiền</th>
              <th>Ghi Chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div></div>
    `;
  }

  content.innerHTML = html;
}

function openExpenseModal() {
  const modal = document.getElementById('expense-modal');
  if (!modal) return;
  document.getElementById('exp-form').reset();
  document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
  modal.style.display = 'flex';
}

function closeExpenseModal() {
  document.getElementById('expense-modal').style.display = 'none';
}

function saveExpense() {
  const date = document.getElementById('exp-date').value;
  const category = document.getElementById('exp-category').value.trim();
  const spender = document.getElementById('exp-spender').value.trim();
  const amountStr = document.getElementById('exp-amount').value.trim();
  const note = document.getElementById('exp-note').value.trim();

  if (!date || !category || !amountStr) {
    showToast('Vui lòng điền đủ Ngày, Hạng mục và Số tiền', true);
    return;
  }

  const amount = Number(amountStr.replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) {
    showToast('Số tiền không hợp lệ', true);
    return;
  }

  const newExp = {
    id: Date.now(),
    date,
    category,
    spender,
    amount,
    note
  };

  if (typeof expenses === 'undefined') window.expenses = [];
  expenses.push(newExp);
  saveAsync().then(ok => {
    if (ok) {
      showToast('Đã lưu khoản chi thành công');
      closeExpenseModal();
      renderExpensesPage();
    } else {
      expenses.pop();
    }
  });
}

function deleteExpense(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;
  const idx = expenses.findIndex(e => e.id === id);
  if (idx !== -1) {
    const deleted = expenses.splice(idx, 1)[0];
    saveAsync().then(ok => {
      if (ok) {
        showToast('Đã xóa khoản chi');
        renderExpensesPage();
      } else {
        expenses.splice(idx, 0, deleted);
      }
    });
  }
}

// Intercept showPage to handle expenses
const origShowPageExpenses = window.showPage;
window.showPage = function(pageId) {
  if (pageId === 'expenses') {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const p = document.getElementById('page-expenses');
    if (p) p.style.display = 'block';
    
    // Active nav item
    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach(n => {
      if (n.textContent.includes('Quản Lý Chi') || n.onclick?.toString().includes("'expenses'")) {
        n.classList.add('active');
      }
    });
    
    renderExpensesPage();
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
    return;
  }
  if (typeof origShowPageExpenses === 'function') {
    origShowPageExpenses(pageId);
  }
};
