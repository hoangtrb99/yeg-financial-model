// ============================================================
//  RENDER FUNCTIONS  –  YEG Financial Model
// ============================================================

const fmt  = (v, d=0) => v == null ? '–' : isNaN(v) ? v : v.toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d});
const pct  = v => v == null ? '–' : (v * 100).toFixed(1) + '%';
const vnd  = v => v == null ? '–' : fmt(Math.round(v), 0);           // VNDbn
const vndx = v => v == null ? '–' : fmt(Math.round(v * 10) / 10, 1); // 1dp
const vndSh = v => v == null ? '–' : Math.round(v).toLocaleString('en-US') + ' ₫';  // VND/share

let charts = {};
function destroyChart(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }

// ---- Colours ----
const BG_HIST = 'rgba(68,114,196,0.75)';
const BG_FCST = 'rgba(237,125,49,0.75)';
const bgs = i => i < NH ? BG_HIST : BG_FCST;

// ---- Table helpers ----
function tableWrap(html) { return `<div class="table-wrap">${html}</div>`; }

function hdrRow() {
  return `<tr>
    <th class="th-main">Chỉ tiêu</th>
    ${HIST_YRS.map(y => `<th class="th-hist">${y}</th>`).join('')}
    ${FCST_YRS.map(y => `<th class="th-fcst">${y}</th>`).join('')}
  </tr>`;
}

function sectRow(label, cols) { return `<tr><td class="sect" colspan="${cols || 1 + N}">${label}</td></tr>`; }

function totRow(label, vals, fmt_ = vnd, cls = 'tot') {
  return `<tr><td class="${cls} ind1">${label}</td>${vals.map(v => `<td class="${cls}">${fmt_(v)}</td>`).join('')}</tr>`;
}

function lblRow(label, vals, fmt_ = vnd, cls = '', indent = 'ind1') {
  return `<tr><td class="lbl ${indent}">${label}</td>${vals.map((v, i) => `<td class="${i < NH ? '' : 'fcst'} ${cls}">${fmt_(v)}</td>`).join('')}</tr>`;
}

function lblRow2(label, vals, fmt_) { return lblRow(label, vals, fmt_, 'lbl2', 'ind2'); }

function legend() {
  return `<div class="legend" style="margin-bottom:12px">
    <div class="legend-item"><div class="legend-dot" style="background:#4472C4"></div>Thực tế</div>
    <div class="legend-item"><div class="legend-dot" style="background:#ED7D31"></div>Dự báo</div>
  </div>`;
}

// ---- COVER ----
function renderCover(r) {
  const H = NH - 1;  // index of last historical year (2024A)
  const F = N - 1;   // index of last forecast year (2031E)
  const ev = r.dcf_ev, ps = r.dcf_ps;
  const dcf = YEG.dcf;

  // helpers
  const deltaStr = (cur, prev) => {
    if (cur == null || prev == null || prev === 0) return '';
    const d = (cur - prev) / Math.abs(prev);
    return `<span class="${d >= 0 ? 'kpi-up' : 'kpi-dn'}">${d >= 0 ? '▲' : '▼'} ${pct(Math.abs(d))} vs năm trước</span>`;
  };
  const kpi = (icon, label, value, sub, subCls) =>
    `<div class="kpi-tile">
       <div class="kpi-icon">${icon}</div>
       <div class="kpi-body">
         <div class="kpi-label">${label}</div>
         <div class="kpi-value">${value}</div>
         <div class="kpi-sub ${subCls || ''}">${sub}</div>
       </div>
     </div>`;

  // Net debt 2024A
  const netDebt24 = (r.std[H] || 0) + (r.ltd[H] || 0) - (r.cash[H] || 0);
  const ndEbitda24 = r.ebitda[H] ? netDebt24 / r.ebitda[H] : null;

  // Key metrics summary rows: [label, ...11 values]
  const summaryRows = [
    { label: 'Doanh thu (tỷ)',  vals: r.rev,          fmt_: v => v != null ? fmt(Math.round(v)) : '–' },
    { label: 'Tăng trưởng',     vals: r.rat_rev_g,    fmt_: (v, i) => i === 0 ? '–' : pct(v) },
    { label: 'EBITDA (tỷ)',     vals: r.ebitda,        fmt_: v => v != null ? fmt(Math.round(v)) : '–' },
    { label: 'Biên EBITDA',     vals: r.rat_ebitda_m, fmt_: v => pct(v) },
    { label: 'LNST (tỷ)',       vals: r.ni,            fmt_: v => v != null ? fmt(Math.round(v)) : '–' },
    { label: 'Biên LNST',       vals: r.rat_ni_m,     fmt_: v => pct(v) },
    { label: 'ROE',             vals: r.rat_roe,       fmt_: v => pct(v) },
    { label: 'ROA',             vals: r.rat_roa,       fmt_: v => pct(v) },
    { label: 'Nợ ròng/EBITDA',  vals: r.rat_nd_ebitda, fmt_: v => v != null ? fmt(v, 1) + 'x' : '–' },
    { label: 'Current Ratio',   vals: r.rat_cr,        fmt_: v => v != null ? fmt(v, 2) + 'x' : '–' },
    { label: 'OCF (tỷ)',        vals: r.ocf,           fmt_: v => v != null ? fmt(Math.round(v)) : '–' },
  ];

  const summaryTable = `
    <div class="summary-table-wrap">
      <div class="summary-table-title">📋 Tóm tắt Chỉ số Tài chính – Tất cả các năm</div>
      <div class="summary-scroll">
        <table class="summary-table">
          <thead>
            <tr>
              <th class="st-label">Chỉ tiêu</th>
              ${HIST_YRS.map(y => `<th class="st-hist">${y}</th>`).join('')}
              ${FCST_YRS.map(y => `<th class="st-fcst">${y}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${summaryRows.map(row => `
              <tr>
                <td class="st-label">${row.label}</td>
                ${row.vals.map((v, i) => `<td class="${i < NH ? 'st-h' : 'st-f'}">${row.fmt_(v, i)}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  document.getElementById('tab-cover').innerHTML = `
  <div class="page-header">
    <div class="page-title">📊 YEG – Mô hình Tài chính</div>
    <div class="page-sub">4 năm thực tế (2021A–2024A)  ·  7 năm dự báo (2025E–2031E)  ·  Đơn vị: tỷ VND</div>
  </div>

  <!-- SNAPSHOT 2024A -->
  <div class="section-label">Hiệu quả 2024A <span class="section-badge hist">Thực tế</span></div>
  <div class="kpi-grid">
    ${kpi('💰', 'Doanh thu', fmt(Math.round(r.rev[H])) + ' tỷ', deltaStr(r.rev[H], r.rev[H-1]))}
    ${kpi('📊', 'EBITDA', fmt(Math.round(r.ebitda[H])) + ' tỷ', 'Biên: ' + pct(r.rat_ebitda_m[H]))}
    ${kpi('✅', 'Lợi nhuận sau thuế', fmt(Math.round(r.ni[H])) + ' tỷ', deltaStr(r.ni[H], r.ni[H-1]))}
    ${kpi('💵', 'Dòng tiền KD (OCF)', fmt(Math.round(r.ocf[H])) + ' tỷ', 'OCF margin: ' + pct(r.ocf[H] / r.rev[H]))}
    ${kpi('📈', 'Biên LN gộp', pct(r.rat_gm[H]), 'Biên EBIT: ' + pct(r.rat_ebit_m[H]))}
    ${kpi('🔄', 'ROE / ROA', pct(r.rat_roe[H]) + ' / ' + pct(r.rat_roa[H]), 'Sinh lời vốn chủ & tài sản')}
    ${kpi('⚖️', 'Nợ ròng / EBITDA', ndEbitda24 != null ? fmt(ndEbitda24, 2) + 'x' : '–', 'Nợ ròng: ' + fmt(Math.round(netDebt24)) + ' tỷ')}
    ${kpi('🏦', 'Current / Quick Ratio', fmt(r.rat_cr[H], 2) + 'x / ' + fmt(r.rat_qr[H], 2) + 'x', 'Thanh khoản ngắn hạn')}
  </div>

  <!-- VALUATION CARDS -->
  <div class="section-label">Định giá &amp; Triển vọng <span class="section-badge fcst">DCF – Bear case</span></div>
  <div class="cards">
    <div class="card">
      <div class="card-icon">💎</div>
      <div class="card-label">Enterprise Value</div>
      <div class="card-value">${fmt(Math.round(ev))} tỷ</div>
      <div class="card-delta">Phương pháp DCF – FCFF</div>
    </div>
    <div class="card">
      <div class="card-icon">🏷️</div>
      <div class="card-label">Giá mục tiêu / cp</div>
      <div class="card-value">${vndSh(ps)}</div>
      <div class="card-delta ${dcf.upside > 0 ? 'up' : 'dn'}">${dcf.upside > 0 ? '↑' : '↓'} ${pct(dcf.upside)} vs giá TT ${dcf.marketPrice.toLocaleString()} ₫</div>
    </div>
    <div class="card">
      <div class="card-icon">📈</div>
      <div class="card-label">Doanh thu 2031E</div>
      <div class="card-value">${fmt(Math.round(r.rev[F]))} tỷ</div>
      <div class="card-delta up">↑ ${pct((r.rev[F] - r.rev[H]) / r.rev[H])} vs 2024A</div>
    </div>
    <div class="card">
      <div class="card-icon">💰</div>
      <div class="card-label">EBITDA 2031E</div>
      <div class="card-value">${fmt(Math.round(r.ebitda[F]))} tỷ</div>
      <div class="card-delta up">${pct(r.rat_ebitda_m[F])} margin</div>
    </div>
  </div>

  <!-- SUMMARY TABLE -->
  ${summaryTable}

  <!-- CHARTS -->
  <div class="section-label">Biểu đồ</div>
  <div class="charts-grid charts-grid-3">
    <div class="chart-box"><h3>Doanh thu &amp; LNST (tỷ VND)</h3><canvas id="chRevNI"></canvas></div>
    <div class="chart-box"><h3>Biên EBITDA &amp; Biên LNST (%)</h3><canvas id="chMargins"></canvas></div>
    <div class="chart-box"><h3>ROE &amp; ROA (%)</h3><canvas id="chROE"></canvas></div>
    <div class="chart-box"><h3>Dòng tiền từ HĐKD (tỷ VND)</h3><canvas id="chOCF"></canvas></div>
    <div class="chart-box"><h3>Nợ ròng / EBITDA (lần)</h3><canvas id="chLev"></canvas></div>
    <div class="chart-box"><h3>Hệ số thanh toán hiện hành</h3><canvas id="chCR"></canvas></div>
  </div>`;

  ['revni','margins','roe','ocf','lev','cr'].forEach(id => destroyChart(id));

  const chartOpts = (yCallback) => ({
    responsive: true,
    plugins: { legend: { labels: { font: { size: 11 } } } },
    scales: { y: { ticks: { font: { size: 10 }, callback: yCallback } } }
  });
  const noLegend = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } } } };

  charts['revni'] = new Chart(document.getElementById('chRevNI'), {
    type: 'bar',
    data: { labels: ALL_YRS, datasets: [
      { label: 'Doanh thu', data: r.rev, backgroundColor: ALL_YRS.map((_, i) => bgs(i)) },
      { label: 'LNST', data: r.ni, type: 'line', borderColor: '#16a34a', backgroundColor: 'transparent', tension: 0.3, pointRadius: 3, yAxisID: 'y' }
    ]},
    options: chartOpts()
  });

  charts['margins'] = new Chart(document.getElementById('chMargins'), {
    type: 'line',
    data: { labels: ALL_YRS, datasets: [
      { label: 'EBITDA Margin', data: r.rat_ebitda_m.map(v => v != null ? +(v*100).toFixed(2) : null), borderColor: '#2E75B6', tension: 0.3, fill: false, pointRadius: 3 },
      { label: 'Net Margin',    data: r.rat_ni_m.map(v => v != null ? +(v*100).toFixed(2) : null),     borderColor: '#ED7D31', tension: 0.3, fill: false, pointRadius: 3 }
    ]},
    options: chartOpts(v => v + '%')
  });

  charts['roe'] = new Chart(document.getElementById('chROE'), {
    type: 'line',
    data: { labels: ALL_YRS, datasets: [
      { label: 'ROE', data: r.rat_roe.map(v => v != null ? +(v*100).toFixed(2) : null), borderColor: '#7c3aed', tension: 0.3, fill: false, pointRadius: 3 },
      { label: 'ROA', data: r.rat_roa.map(v => v != null ? +(v*100).toFixed(2) : null), borderColor: '#0891b2', tension: 0.3, fill: false, pointRadius: 3, borderDash: [4,3] }
    ]},
    options: chartOpts(v => v + '%')
  });

  charts['ocf'] = new Chart(document.getElementById('chOCF'), {
    type: 'bar',
    data: { labels: ALL_YRS, datasets: [{ label: 'OCF', data: r.ocf, backgroundColor: ALL_YRS.map((_, i) => bgs(i)) }] },
    options: noLegend
  });

  charts['lev'] = new Chart(document.getElementById('chLev'), {
    type: 'bar',
    data: { labels: ALL_YRS, datasets: [{
      label: 'Nợ ròng/EBITDA',
      data: r.rat_nd_ebitda.map(v => v != null ? +v.toFixed(2) : null),
      backgroundColor: ALL_YRS.map((_, i) => bgs(i))
    }]},
    options: { ...noLegend, scales: { y: { ticks: { font: { size: 10 }, callback: v => v + 'x' } } } }
  });

  charts['cr'] = new Chart(document.getElementById('chCR'), {
    type: 'line',
    data: { labels: ALL_YRS, datasets: [
      { label: 'Current Ratio', data: r.rat_cr.map(v => v != null ? +v.toFixed(2) : null), borderColor: '#0891b2', tension: 0.3, fill: false, pointRadius: 3 },
      { label: 'Quick Ratio',   data: r.rat_qr.map(v => v != null ? +v.toFixed(2) : null), borderColor: '#f59e0b', tension: 0.3, fill: false, pointRadius: 3, borderDash: [4,3] }
    ]},
    options: chartOpts(v => v + 'x')
  });
}

// ---- INCOME STATEMENT ----
function renderIS(r) {
  const html = `<table>${hdrRow()}
    ${sectRow('DOANH THU')}
    ${totRow('Doanh thu thuần', r.rev)}
    ${lblRow2('Tăng trưởng YoY', r.rat_rev_g.map((v, i) => i === 0 ? null : v), pct)}
    ${sectRow('GIÁ VỐN & LỢI NHUẬN GỘP')}
    ${lblRow('Giá vốn hàng bán', r.cogs)}
    ${totRow('Lợi nhuận gộp', r.gp)}
    ${lblRow2('Biên lợi nhuận gộp', r.rat_gm, pct)}
    ${sectRow('CHI PHÍ HOẠT ĐỘNG')}
    ${lblRow('Chi phí bán hàng', r.sell)}
    ${lblRow('Chi phí QLDN', r.gsa)}
    ${sectRow('KẾT QUẢ KINH DOANH')}
    ${totRow('EBIT (LN từ HĐKD)', r.ebit)}
    ${lblRow2('Biên EBIT', r.rat_ebit_m, pct)}
    ${totRow('EBITDA', r.ebitda)}
    ${lblRow2('Biên EBITDA', r.rat_ebitda_m, pct)}
    ${sectRow('THU NHẬP / CHI PHÍ TÀI CHÍNH')}
    ${lblRow('Thu nhập tài chính', r.finInc)}
    ${lblRow('Chi phí tài chính', r.finExp)}
    ${lblRow2('   Lãi vay', r.int_exp)}
    ${totRow('LN trước thuế (EBT)', r.ebt)}
    ${lblRow('Chi phí thuế TNDN', r.tax)}
    ${totRow('Lợi nhuận sau thuế', r.ni)}
    ${lblRow2('Biên LNST', r.rat_ni_m, pct)}
    ${lblRow('EPS (VND/cp)', r.eps, vndSh)}
  </table>`;
  document.getElementById('tab-is').innerHTML = `
    <div class="page-header"><div class="page-title">📋 Kết quả Kinh doanh</div><div class="page-sub">Đơn vị: tỷ VND</div></div>
    ${legend()}${tableWrap(html)}`;
}

// ---- BALANCE SHEET ----
function renderBS(r) {
  const html = `<table>${hdrRow()}
    ${sectRow('TÀI SẢN NGẮN HẠN')}
    ${lblRow('Tiền & tương đương tiền', r.cash)}
    ${lblRow('Đầu tư TC ngắn hạn', r.stinv || Array(N).fill(null))}
    ${lblRow('Phải thu khách hàng', r.ar)}
    ${lblRow('Hàng tồn kho', r.inv)}
    ${lblRow('TSNH khác', r.oca)}
    ${totRow('Tổng TSNH', r.tca)}
    ${sectRow('TÀI SẢN DÀI HẠN')}
    ${lblRow('TSCĐ hữu hình (ròng)', r.ppe)}
    ${lblRow('Đầu tư TC dài hạn', r.onca)}
    ${totRow('Tổng TSDH', r.tna)}
    ${totRow('TỔNG TÀI SẢN', r.ta, vnd, 'big-total')}
    ${sectRow('NỢ NGẮN HẠN')}
    ${lblRow('Phải trả người bán', r.ap)}
    ${lblRow('Vay ngắn hạn', r.std)}
    ${lblRow('Nợ NH khác', r.ocl)}
    ${totRow('Tổng nợ ngắn hạn', r.tcl)}
    ${sectRow('NỢ DÀI HẠN')}
    ${lblRow('Vay dài hạn', r.ltd)}
    ${totRow('TỔNG NỢ PHẢI TRẢ', r.tl, vnd, 'big-total')}
    ${sectRow('VỐN CHỦ SỞ HỮU')}
    ${lblRow('Thặng dư vốn cổ phần', r.cs)}
    ${lblRow('Lợi nhuận chưa phân phối', r.re)}
    ${totRow('Tổng VCSH', r.te)}
    ${totRow('TỔNG NỢ & VCSH', r.tle, vnd, 'big-total')}
    <tr><td class="lbl ind1" style="color:#dc2626;font-weight:700">Kiểm tra cân bằng [= 0]</td>
      ${r.bs_chk.map(v => `<td class="check">${v != null ? fmt(v, 2) : '–'}</td>`).join('')}</tr>
  </table>`;
  document.getElementById('tab-bs').innerHTML = `
    <div class="page-header"><div class="page-title">⚖️ Bảng Cân đối Kế toán</div><div class="page-sub">Đơn vị: tỷ VND</div></div>
    ${legend()}${tableWrap(html)}`;
}

// ---- CASH FLOW ----
function renderCF(r) {
  const html = `<table>${hdrRow()}
    ${sectRow('HOẠT ĐỘNG KINH DOANH')}
    ${lblRow('Lợi nhuận sau thuế', r.ni)}
    ${lblRow('Khấu hao (D&A)', r.da)}
    ${lblRow('Thay đổi vốn lưu động', r.cwc)}
    ${totRow('Dòng tiền từ HĐKD (OCF)', r.ocf)}
    ${sectRow('HOẠT ĐỘNG ĐẦU TƯ')}
    ${lblRow('Chi ĐTSCĐ (CAPEX)', r.capex)}
    ${totRow('Dòng tiền từ HĐĐT (ICF)', r.icf)}
    ${sectRow('HOẠT ĐỘNG TÀI CHÍNH')}
    ${lblRow('Cổ tức đã trả', r.div)}
    ${totRow('Dòng tiền từ HĐTC', r.fcf_fin)}
    ${sectRow('TIỀN MẶT')}
    ${totRow('Thay đổi tiền thuần', r.net_cash)}
    ${lblRow('Tiền đầu kỳ', r.beg_cash)}
    ${totRow('Tiền cuối kỳ', r.end_cash)}
  </table>`;
  document.getElementById('tab-cf').innerHTML = `
    <div class="page-header"><div class="page-title">💧 Báo cáo Lưu chuyển Tiền tệ</div><div class="page-sub">Đơn vị: tỷ VND</div></div>
    ${legend()}${tableWrap(html)}`;
}

// ---- KEY RATIOS ----
function renderRatios(r) {
  const html = `<table>${hdrRow()}
    ${sectRow('KHẢ NĂNG SINH LỜI')}
    ${lblRow('Tăng trưởng doanh thu', r.rat_rev_g.map((v, i) => i === 0 ? null : v), pct)}
    ${lblRow('Biên lợi nhuận gộp', r.rat_gm, pct)}
    ${lblRow('Biên EBITDA', r.rat_ebitda_m, pct)}
    ${lblRow('Biên EBIT', r.rat_ebit_m, pct)}
    ${lblRow('Biên LNST', r.rat_ni_m, pct)}
    ${lblRow('ROE', r.rat_roe, pct)}
    ${lblRow('ROA', r.rat_roa, pct)}
    ${sectRow('THANH KHOẢN')}
    ${lblRow('Hệ số thanh toán hiện hành', r.rat_cr, v => fmt(v, 2))}
    ${lblRow('Hệ số thanh toán nhanh', r.rat_qr, v => fmt(v, 2))}
    ${sectRow('ĐÒN BẨY TÀI CHÍNH')}
    ${lblRow('Nợ ròng / EBITDA', r.rat_nd_ebitda, v => fmt(v, 1))}
    ${lblRow('Nợ / Vốn CSH', r.rat_de, v => fmt(v, 2))}
    ${lblRow('Hệ số bảo lãi (EBIT/Lãi vay)', r.rat_ic, v => fmt(v, 1))}
    ${sectRow('HIỆU QUẢ HOẠT ĐỘNG')}
    ${lblRow('Vòng quay tổng tài sản', r.rat_at, v => fmt(v, 2))}
    ${lblRow('DSO – Ngày thu tiền', r.rat_dso, v => fmt(v, 1))}
    ${lblRow('DIO – Ngày tồn kho', r.rat_dio, v => fmt(v, 1))}
    ${lblRow('DPO – Ngày trả tiền', r.rat_dpo, v => fmt(v, 1))}
    ${lblRow('Chu kỳ chuyển đổi tiền mặt (CCC)', r.rat_ccc, v => fmt(v, 1))}
  </table>`;
  document.getElementById('tab-ratios').innerHTML = `
    <div class="page-header"><div class="page-title">📐 Chỉ số Tài chính</div><div class="page-sub">Tỷ lệ tính từ số liệu thực tế và dự báo</div></div>
    ${legend()}${tableWrap(html)}`;
}

// ---- DCF CALCULATION ENGINE ----
function calcDCF(rf, beta, erp, kdPretax, taxRate, dde, g, fcffMult) {
  const ke   = rf + beta * erp;
  const kdAt = kdPretax * (1 - taxRate);
  const wacc = kdAt * dde + ke * (1 - dde);
  const baseFCFF = YEG.dcf.fcff;
  const t        = YEG.dcf.timeFractions;
  let sumPV = 0;
  for (let i = 0; i < baseFCFF.length; i++) {
    sumPV += (baseFCFF[i] * (1 + fcffMult)) / Math.pow(1 + wacc, t[i]);
  }
  const lastF = baseFCFF[baseFCFF.length - 1] * (1 + fcffMult);
  const tv    = (wacc > g + 0.001) ? lastF * (1 + g) / (wacc - g) : lastF * 50;
  const pvTV  = tv / Math.pow(1 + wacc, t[t.length - 1]);
  const ev    = sumPV + pvTV;
  const equity = ev + YEG.dcf.netNonOp;
  const sharePrice = equity * 1000 / YEG.dcf.shares;
  const upside = sharePrice / YEG.dcf.marketPrice - 1;
  return { ke, kdAt, wacc, sumPV, pvTV, ev, equity, sharePrice, upside };
}

function updateCalc() {
  const get = id => parseFloat(document.getElementById(id).value);
  const p = {
    rf:     get('inp-rf')   / 100,
    beta:   get('inp-beta'),
    erp:    get('inp-erp')  / 100,
    kd:     get('inp-kd')   / 100,
    tax:    get('inp-tax')  / 100,
    dde:    get('inp-dde')  / 100,
    g:      get('inp-g')    / 100,
    fcffm:  get('inp-fcffm')/ 100,
  };
  // update displayed value labels
  ['rf','beta','erp','kd','tax','dde','g','fcffm'].forEach(k => {
    const el = document.getElementById('lbl-' + k);
    if (el) el.textContent = k === 'beta' ? p[k].toFixed(2) :
                             (p[k] * 100).toFixed(1) + '%';
  });
  const c = calcDCF(p.rf, p.beta, p.erp, p.kd, p.tax, p.dde, p.g, p.fcffm);
  const upCls = c.upside >= 0 ? 'up' : 'dn';
  document.getElementById('calc-wacc').textContent   = (c.wacc * 100).toFixed(2) + '%';
  document.getElementById('calc-ke').textContent     = (c.ke   * 100).toFixed(2) + '%';
  document.getElementById('calc-ev').textContent     = Math.round(c.ev).toLocaleString() + ' tỷ';
  document.getElementById('calc-price').textContent  = Math.round(c.sharePrice).toLocaleString() + ' ₫';
  document.getElementById('calc-upside').textContent = (c.upside * 100).toFixed(1) + '%';
  document.getElementById('calc-upside').className   = 'calc-result-val big ' + upCls;
}

function loadScenario(idx) {
  const sc = YEG.scenarios;
  const a  = sc.assumptions;
  // update slider values
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('inp-rf',    (a.rf[idx]   * 100).toFixed(2));
  set('inp-beta',   a.beta[idx].toFixed(4));
  set('inp-erp',   (a.erp[idx]  * 100).toFixed(2));
  set('inp-kd',    (a.kd[idx]   * 100).toFixed(2));
  set('inp-tax',   (a.taxRate[idx] * 100).toFixed(2));
  set('inp-dde',   (a.dde[idx]  * 100).toFixed(2));
  set('inp-g',     (a.tgr[idx]  * 100).toFixed(2));
  set('inp-fcffm', (a.fcffAdj[idx] * 100).toFixed(2));
  // highlight active button
  [0,1,2].forEach(i => {
    const btn = document.getElementById('sc-btn-' + i);
    if (btn) btn.classList.toggle('sc-active', i === idx);
  });
  updateCalc();
}

// ---- DCF VALUATION ----
function renderDCF(r) {
  const dcf = YEG.dcf;
  const sc  = YEG.scenarios;
  const mp  = dcf.marketPrice;

  // ---- Scenario cards ----
  const scColors = ['#64748b','#2E75B6','#16a34a'];
  const scLabels = ['🐻 Bear','📊 Base','🚀 Bull'];
  const scCards = sc.names.map((name, i) => {
    const up = sc.outputs.upside[i];
    return `
    <button id="sc-btn-${i}" class="sc-card ${i===0?'sc-active':''}" onclick="loadScenario(${i})">
      <div class="sc-name" style="color:${scColors[i]}">${scLabels[i]}</div>
      <div class="sc-row"><span>WACC</span><strong>${(sc.outputs.wacc[i]*100).toFixed(2)}%</strong></div>
      <div class="sc-row"><span>g cuối kỳ</span><strong>${(sc.assumptions.tgr[i]*100).toFixed(1)}%</strong></div>
      <div class="sc-row"><span>Beta</span><strong>${sc.assumptions.beta[i].toFixed(3)}</strong></div>
      <div class="sc-divider"></div>
      <div class="sc-row"><span>EV</span><strong>${Math.round(sc.outputs.ev[i]).toLocaleString()} tỷ</strong></div>
      <div class="sc-price">${Math.round(sc.outputs.sharePrice[i]).toLocaleString()} ₫/cp</div>
      <div class="sc-upside ${up>=0?'up':'dn'}">${up>=0?'▲':'▼'} ${(Math.abs(up)*100).toFixed(1)}% upside</div>
    </button>`;
  }).join('');

  // ---- Slider helper ----
  function slider(id, label, min, max, step, val, unit) {
    return `
    <div class="slider-row">
      <div class="slider-label">${label}</div>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="updateCalc()" class="slider-input">
      <div class="slider-val" id="lbl-${id.replace('inp-','')}">${val}${unit}</div>
    </div>`;
  }

  const a0 = sc.assumptions; // Bear defaults
  const calcSection = `
  <div class="calc-wrap">
    <div class="calc-inputs">
      <div class="calc-inputs-title">⚙️ Thay đổi thông số — tính lại tức thời</div>
      ${slider('inp-rf',    'Lãi suất phi rủi ro (Rf)',  1, 10, 0.05, (a0.rf[0]*100).toFixed(2), '%')}
      ${slider('inp-beta',  'Beta',                      0.4, 2.5, 0.01, a0.beta[0].toFixed(2), '')}
      ${slider('inp-erp',   'Phần bù rủi ro (ERP)',      4,  16,  0.05, (a0.erp[0]*100).toFixed(2), '%')}
      ${slider('inp-kd',    'Lãi vay trước thuế (Kd)',   4,  18,  0.05, (a0.kd[0]*100).toFixed(2), '%')}
      ${slider('inp-tax',   'Thuế suất TNDN',            10, 30,  0.5,  (a0.taxRate[0]*100).toFixed(1), '%')}
      ${slider('inp-dde',   'D/(D+E)',                   5,  70,  0.5,  (a0.dde[0]*100).toFixed(2), '%')}
      ${slider('inp-g',     'Tăng trưởng cuối kỳ (g)',   0,   8,  0.05, (a0.tgr[0]*100).toFixed(1), '%')}
      ${slider('inp-fcffm', 'Điều chỉnh FCFF (±%)',     -30,  30, 0.5,  (a0.fcffAdj[0]*100).toFixed(1), '%')}
    </div>
    <div class="calc-results">
      <div class="calc-results-title">📈 Kết quả tính toán</div>
      <div class="calc-result-row"><span>Ke (Chi phí vốn CSH)</span><span id="calc-ke" class="calc-result-val"></span></div>
      <div class="calc-result-row"><span>WACC</span><span id="calc-wacc" class="calc-result-val"></span></div>
      <div class="calc-result-row"><span>Enterprise Value</span><span id="calc-ev" class="calc-result-val"></span></div>
      <div class="calc-result-divider"></div>
      <div class="calc-result-label">Giá mục tiêu / cp</div>
      <div id="calc-price" class="calc-result-price"></div>
      <div class="calc-result-label" style="margin-top:8px">Tiềm năng tăng giá</div>
      <div id="calc-upside" class="calc-result-val big up"></div>
      <div class="calc-market">Giá thị trường: ${mp.toLocaleString()} ₫</div>
    </div>
  </div>`;

  // ---- Sensitivity heatmaps ----
  function heatCell(upside) {
    const prc = Math.round(mp * (1 + upside)).toLocaleString();
    const up  = (upside * 100).toFixed(0);
    let bg = '#f1f5f9';
    if (upside > 4)    bg = '#14532d';
    else if (upside > 2) bg = '#15803d';
    else if (upside > 1) bg = '#16a34a';
    else if (upside > 0.5) bg = '#4ade80';
    else if (upside > 0) bg = '#bbf7d0';
    else if (upside > -0.3) bg = '#fca5a5';
    else bg = '#dc2626';
    const txtColor = upside > 1 ? 'white' : (upside < -0.1 ? 'white' : '#1a1a2e');
    return `<td style="background:${bg};color:${txtColor};text-align:center;padding:6px 10px;font-size:11px;white-space:nowrap">
      <div style="font-weight:700">${prc} ₫</div>
      <div style="opacity:0.85">${up > 0 ? '+' : ''}${up}%</div>
    </td>`;
  }

  const s5a = YEG.sens5a;
  const hm1 = `<div class="hm-wrap">
    <div class="hm-title">📊 WACC × Tăng trưởng cuối kỳ (g) → Giá mục tiêu (₫/cp)</div>
    <div style="overflow-x:auto"><table class="hm-table">
      <tr><td class="s-head">WACC \\ g</td>${s5a.gCols.map(g=>`<td class="s-head">${(g*100).toFixed(1)}%</td>`).join('')}</tr>
      ${s5a.rows.map(row => {
        const isBase = Math.abs(row.wacc - 0.12222575) < 0.0001;
        return `<tr>${isBase?'<td class="s-head" style="background:#FFF59D;color:#1a1a2e">':'<td class="s-head">'
          }${(row.wacc*100).toFixed(2)}%</td>${row.vals.map(v => heatCell(v)).join('')}</tr>`;
      }).join('')}
    </table></div>
  </div>`;

  const s5b = YEG.sens5b;
  const hm2 = `<div class="hm-wrap">
    <div class="hm-title">📊 Beta × ERP → Giá mục tiêu (₫/cp)</div>
    <div style="overflow-x:auto"><table class="hm-table">
      <tr><td class="s-head">Beta \\ ERP</td>${s5b.erpCols.map(e=>`<td class="s-head">${(e*100).toFixed(1)}%</td>`).join('')}</tr>
      ${s5b.rows.map(row => {
        const isBase = Math.abs(row.beta - 1.05) < 0.01;
        return `<tr>${isBase?'<td class="s-head" style="background:#FFF59D;color:#1a1a2e">':'<td class="s-head">'
          }${row.beta.toFixed(2)}</td>${row.vals.map(v => heatCell(v)).join('')}</tr>`;
      }).join('')}
    </table></div>
  </div>`;

  // ---- FCFF build table ----
  const fcstHdr = `<tr><th class="th-main">Chỉ tiêu</th>${FCST_YRS.map(y => `<th class="th-fcst">${y}</th>`).join('')}</tr>`;
  const fcffTable = `<table>${fcstHdr}
    ${sectRow('XÂY DỰNG FCFF (tỷ VND)', 1 + NF)}
    <tr><td class="lbl ind1">Lợi nhuận sau thuế</td>${r.dcf_ni.map(v=>`<td class="fcst">${vnd(v)}</td>`).join('')}</tr>
    <tr><td class="lbl ind1">(+) Khấu hao D&amp;A</td>${r.dcf_da.map(v=>`<td class="fcst">${vnd(v)}</td>`).join('')}</tr>
    <tr><td class="lbl ind1">(–) CAPEX ròng</td>${r.dcf_capex.map(v=>`<td class="fcst">${vnd(v)}</td>`).join('')}</tr>
    <tr><td class="lbl ind1">(±) Δ Vốn lưu động</td>${r.dcf_nwc.map(v=>`<td class="fcst">${vnd(v)}</td>`).join('')}</tr>
    <tr><td class="lbl ind1">(+) Lãi vay × (1–T)</td>${r.dcf_nopat.map((v,i)=>`<td class="fcst">${vnd(v-(r.dcf_ni[i]||0))}</td>`).join('')}</tr>
    <tr><td class="tot ind1">FCFF</td>${r.dcf_ufcf.map(v=>`<td class="tot">${vnd(v)}</td>`).join('')}</tr>
    ${sectRow('GIÁ TRỊ HIỆN TẠI', 1 + NF)}
    <tr><td class="lbl ind1">Hệ số chiết khấu</td>${r.dcf_disc.map(v=>`<td class="fcst">${v!=null?v.toFixed(4):'–'}</td>`).join('')}</tr>
    <tr><td class="tot ind1">PV của FCFF</td>${r.dcf_pv.map(v=>`<td class="tot">${vnd(v)}</td>`).join('')}</tr>
  </table>`;

  document.getElementById('tab-dcf').innerHTML = `
    <div class="page-header">
      <div class="page-title">💎 Định giá DCF – FCFF</div>
      <div class="page-sub">Kịch bản gốc: Bear  ·  Đơn vị: tỷ VND</div>
    </div>

    <div class="section-label">Scenario Analysis <span class="section-badge fcst">Chọn kịch bản để tải vào calculator</span></div>
    <div class="sc-grid">${scCards}</div>

    <div class="section-label">Interactive Calculator <span class="section-badge hist">Điều chỉnh bất kỳ thông số nào</span></div>
    ${calcSection}

    <div class="section-label">Sensitivity Heatmaps</div>
    <div class="hm-grid">${hm1}${hm2}</div>

    <div class="section-label">FCFF Build & PV</div>
    ${tableWrap(fcffTable)}`;

  // Init calculator with Bear defaults
  setTimeout(() => updateCalc(), 0);

  // Tornado chart
  setTimeout(() => {
    const el = document.createElement('div');
    el.className = 'hm-wrap';
    el.innerHTML = `<div class="hm-title">🌪️ Phân tích độ nhạy – Tác động ±10% mỗi thông số lên Giá cp</div>
      <canvas id="chTornado" style="max-height:280px"></canvas>`;
    document.querySelector('.section-label:last-of-type').insertAdjacentElement('beforebegin', el);

    destroyChart('tornado');
    const el2 = YEG.elasticity;
    const sorted = [...el2].sort((a,b) => Math.abs(b.pctMinus) + Math.abs(b.pctPlus) - Math.abs(a.pctMinus) - Math.abs(a.pctPlus));
    charts['tornado'] = new Chart(document.getElementById('chTornado'), {
      type: 'bar',
      data: {
        labels: sorted.map(e => e.label),
        datasets: [
          { label: 'Sốc -10%', data: sorted.map(e => +((e.pctMinus)*100).toFixed(2)), backgroundColor: '#f87171' },
          { label: 'Sốc +10%', data: sorted.map(e => +((e.pctPlus)*100).toFixed(2)),  backgroundColor: '#4ade80' },
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { labels: { font: { size: 11 } } } },
        scales: {
          x: { ticks: { font: { size: 10 }, callback: v => v + '%' }, title: { display: true, text: '% thay đổi giá cp' } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });
  }, 50);
}

// ---- OVERVIEW ----
function renderAssumptions(r) {
  const dcf = YEG.dcf;
  document.getElementById('tab-assumptions').innerHTML = `
    <div class="page-header">
      <div class="page-title">🏢 Tổng quan Công ty – YEG</div>
      <div class="page-sub">Dữ liệu trích xuất từ file YEG.xlsx  ·  Đơn vị: tỷ VND</div>
    </div>
    <div class="overview-grid">
      <div class="ov-section">
        <div class="ov-hdr">📊 Hiệu quả Doanh thu</div>
        <table class="ov-table">
          <tr><th>Năm</th><th>Doanh thu</th><th>Tăng trưởng</th><th>Biên gộp</th><th>Biên LNST</th></tr>
          ${ALL_YRS.map((y, i) => `
            <tr class="${i < NH ? '' : 'fcst-row'}">
              <td>${y}</td>
              <td>${vnd(r.rev[i])} tỷ</td>
              <td>${i === 0 ? '–' : pct(r.rat_rev_g[i])}</td>
              <td>${pct(r.rat_gm[i])}</td>
              <td>${pct(r.rat_ni_m[i])}</td>
            </tr>`).join('')}
        </table>
      </div>
      <div class="ov-section">
        <div class="ov-hdr">💎 Thông số Định giá</div>
        <table class="ov-table">
          <tr><td>WACC</td><td><strong>${pct(dcf.wacc)}</strong></td></tr>
          <tr><td>Chi phí vốn CSH (Ke)</td><td><strong>${pct(dcf.ke)}</strong></td></tr>
          <tr><td>Chi phí nợ sau thuế (Kd)</td><td><strong>${pct(dcf.kd)}</strong></td></tr>
          <tr><td>Beta</td><td><strong>${dcf.beta}</strong></td></tr>
          <tr><td>Lãi suất phi rủi ro (Rf)</td><td><strong>${pct(dcf.rf)}</strong></td></tr>
          <tr><td>Phần bù rủi ro (ERP)</td><td><strong>${pct(dcf.erp)}</strong></td></tr>
          <tr><td>Tăng trưởng cuối kỳ (g)</td><td><strong>${pct(dcf.tgr)}</strong></td></tr>
          <tr><td>Số cp lưu hành</td><td><strong>${dcf.shares.toFixed(3)} triệu cp</strong></td></tr>
          <tr><td>Giá thị trường</td><td><strong>${dcf.marketPrice.toLocaleString()} ₫/cp</strong></td></tr>
          <tr><td>Enterprise Value</td><td><strong>${fmt(Math.round(dcf.ev))} tỷ VND</strong></td></tr>
          <tr><td>Equity Value</td><td><strong>${fmt(Math.round(dcf.equityValue))} tỷ VND</strong></td></tr>
          <tr><td>Giá mục tiêu</td><td><strong style="color:#16a34a">${vndSh(dcf.sharePrice)}</strong></td></tr>
          <tr><td>Tiềm năng tăng giá</td><td><strong style="color:#16a34a">${pct(dcf.upside)}</strong></td></tr>
        </table>
      </div>
    </div>`;
}
