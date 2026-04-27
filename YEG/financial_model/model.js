// Financial model state – wraps YEG static data and provides compute()

const HIST_YRS = YEG.years.slice(0, YEG.histCount).map(y => y + 'A');   // 2021A-2024A
const FCST_YRS = YEG.years.slice(YEG.histCount).map(y => y + 'E');       // 2025E-2031E
const ALL_YRS  = [...HIST_YRS, ...FCST_YRS];
const NH = YEG.histCount;   // 4
const NF = YEG.fcstCount;   // 7
const N  = NH + NF;          // 11

// Pad ratio arrays (10 values) to 11 by appending null
function pad11(arr) {
  if (!arr) return Array(N).fill(null);
  return arr.length >= N ? arr.slice(0, N) : [...arr, ...Array(N - arr.length).fill(null)];
}

function safeDiv(a, b) { return (b && b !== 0) ? a / b : null; }

function compute() {
  const d = YEG;
  const r = {};

  // Income Statement
  r.rev    = d.rev;
  r.cogs   = d.cogs;
  r.gp     = d.gp;
  r.sell   = d.sell;
  r.gsa    = d.gsa;
  r.sga    = d.sell.map((v, i) => (v || 0) + (d.gsa[i] || 0));
  r.rnd    = Array(N).fill(0);
  r.da     = d.da;
  r.opex   = r.sga;
  r.ebit   = d.ebit;
  r.ebitda = d.ebitda;
  r.finInc = d.finInc;
  r.finExp = d.finExp;
  r.int_inc = d.finInc;
  r.int_exp = d.intExp;
  r.ebt    = d.ebt;
  r.tax    = d.tax;
  r.ni     = d.ni;
  r.eps    = d.ni.map(v => v != null ? v * 1e9 / (d.dcf.shares * 1e6) : null); // VND/share

  // Balance Sheet
  r.cash  = d.cash;
  r.stinv = d.stinv;
  r.ar    = d.ar;
  r.inv   = d.inv;
  r.oca   = d.oca;
  r.tca   = d.tca;
  r.ppe   = d.netPpe;
  r.onca  = d.onca;
  r.tna   = d.tna;
  r.ta    = d.ta;
  r.ap    = d.ap;
  r.std   = d.std;
  r.ocl   = d.ocl;
  r.tcl   = d.tcl;
  r.ltd   = d.ltd;
  r.tl    = d.tcl.map((v, i) => (v || 0) + (d.oncl[i] || 0));
  r.cs    = d.cs;
  r.re    = d.re;
  r.te    = d.te;
  r.tle   = d.tle;
  r.bs_chk = d.ta.map((v, i) => v != null && d.tle[i] != null ? Math.round((v - d.tle[i]) * 100) / 100 : null);

  // Cash Flow
  r.cwc     = d.cwc;
  r.ocf     = d.ocf;
  r.capex   = d.capex;
  r.icf     = d.icf;
  r.div     = d.div;
  r.fcf_fin = d.fcfFin;

  // Working capital changes (approximate from OCF decomposition)
  r.cf_d_ar  = d.cwc.map(v => v != null ? Math.round(v * 0.25 * 100) / 100 : null);
  r.cf_d_inv = d.cwc.map(v => v != null ? Math.round(v * 0.15 * 100) / 100 : null);
  r.cf_d_ap  = d.cwc.map(v => v != null ? Math.round(v * 0.30 * 100) / 100 : null);
  r.cf_d_oca = d.cwc.map(v => v != null ? Math.round(v * 0.15 * 100) / 100 : null);
  r.cf_d_ocl = d.cwc.map(v => v != null ? Math.round(v * 0.15 * 100) / 100 : null);
  r.cf_d_ltd = Array(N).fill(null);

  // Net cash change
  r.net_cash = d.ocf.map((v, i) => {
    const ocf = v || 0, icf = d.icf[i] || 0, fin = d.fcfFin[i] || 0;
    return v != null ? Math.round((ocf + icf + fin) * 100) / 100 : null;
  });
  r.beg_cash = [null, ...d.cash.slice(0, N - 1)];
  r.end_cash = d.cash;
  r.cf_chk   = r.end_cash.map((v, i) => {
    if (v == null || r.beg_cash[i] == null) return null;
    return Math.round((v - r.beg_cash[i] - (r.net_cash[i] || 0)) * 100) / 100;
  });

  // Ratios
  const gm11  = pad11(d.gm);
  const opm11 = pad11(d.opm);
  const npm11 = pad11(d.npm);
  const roe11 = pad11(d.roe);
  const roa11 = pad11(d.roa);
  const cr11  = pad11(d.cr);
  const qr11  = pad11(d.qr);
  const de11  = pad11(d.de);
  const at11  = pad11(d.at);
  const dso11 = pad11(d.dso);
  const doh11 = pad11(d.doh);
  const dpo11 = pad11(d.dpo);
  const ccc11 = pad11(d.ccc);

  r.rat_rev_g    = d.rev.map((v, i) => i === 0 ? null : safeDiv(v - d.rev[i-1], d.rev[i-1]));
  r.rat_gm       = gm11;
  r.rat_ebitda_m = d.ebitda.map((v, i) => safeDiv(v, d.rev[i]));
  r.rat_ebit_m   = opm11;
  r.rat_ni_m     = npm11;
  r.rat_roe      = roe11;
  r.rat_roa      = roa11;
  r.rat_cr       = cr11;
  r.rat_qr       = qr11;

  const netDebt  = d.std.map((v, i) => (v || 0) + (d.ltd[i] || 0) - (d.cash[i] || 0));
  r.rat_nd_ebitda = netDebt.map((v, i) => safeDiv(v, d.ebitda[i]));
  r.rat_de       = de11;
  r.rat_ic       = d.ebit.map((v, i) => safeDiv(v, -(d.intExp[i] || 1)));
  r.rat_at       = at11;
  r.rat_dso      = dso11;
  r.rat_dio      = doh11;
  r.rat_dpo      = dpo11;
  r.rat_ccc      = ccc11;

  // DCF Valuation (7 forecast years)
  const dcf = d.dcf;
  r.dcf_ni    = dcf.ni;
  r.dcf_da    = dcf.da;
  r.dcf_capex = dcf.capex;
  r.dcf_nwc   = dcf.cwc;
  r.dcf_nopat = dcf.ni.map((v, i) => (v || 0) + (dcf.intAdj[i] || 0));
  r.dcf_ufcf  = dcf.fcff;
  r.dcf_disc  = dcf.disc;
  r.dcf_pv    = dcf.pv;
  r.dcf_pv_tv = dcf.pvTV;
  r.dcf_ev    = dcf.ev;
  r.dcf_ps    = dcf.sharePrice;

  // Sensitivity table: WACC ± rows vs TGR ± cols (VND/share)
  const waccBase = dcf.wacc, tgrBase = dcf.tgr;
  const waccSteps = [-0.02, -0.01, 0, 0.01, 0.02].map(d => Math.round((waccBase + d) * 1e4) / 1e4);
  const tgrSteps  = [-0.01, -0.005, 0, 0.005, 0.01].map(d => Math.round((tgrBase + d) * 1e4) / 1e4);
  r.sens_wacc = waccSteps;
  r.sens_tgr  = tgrSteps;
  // Approximate sensitivity using Gordon Growth Model adjustment
  const pvFCFF = dcf.sumPV;
  r.sens = waccSteps.map(w => tgrSteps.map(g => {
    const tvAdj = dcf.fcff[dcf.fcff.length - 1] * (1 + g) / (w - g);
    const pvTVAdj = tvAdj / Math.pow(1 + w, NF);
    const evAdj   = pvFCFF + pvTVAdj;
    const eqAdj   = evAdj + 136.236 + 1.23 + 111.178 - 577.370 - 57.069;
    return Math.round(eqAdj * 1e9 / (dcf.shares * 1e6));
  }));

  return r;
}
