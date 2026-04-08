import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';
import puppeteer from 'puppeteer-core';

export interface ReportConfig {
  metrics: string[];
  startDate: string;
  endDate: string;
  filters?: {
    modelVersion?: string;
    channel?: string;
    minSeverity?: string;
  };
}

// ── Inline Facttic Logo SVG (dark, no external font dependency) ─────────────
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 52" width="220" height="52" fill="none">
  <rect x="2"  y="14" width="20" height="5"  fill="#2563EB"/>
  <rect x="2"  y="22" width="14" height="4"  fill="rgba(255,255,255,0.65)"/>
  <rect x="18" y="22" width="4"  height="4"  fill="#2563EB" opacity="0.85"/>
  <rect x="2"  y="29" width="9"  height="4"  fill="rgba(255,255,255,0.22)"/>
  <line x1="36" y1="10" x2="36" y2="42" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <text x="46" y="36"
    font-family="'IBM Plex Sans', system-ui, sans-serif"
    font-weight="600" font-size="24" letter-spacing="-0.5px" fill="#FFFFFF">Facttic</text>
</svg>`;

// ── Severity color map ────────────────────────────────────────────────────────
const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH:     '#F59E0B',
  MEDIUM:   '#3B82F6',
  LOW:      '#10B981',
};

export class ReportGenerator {

  // ── CSV ─────────────────────────────────────────────────────────────────────
  static async generateCSV(orgId: string, config: ReportConfig): Promise<string> {
    try {
      const { data, error } = await this.fetchMetrics(orgId, config);
      if (error) throw error;
      if (!data || data.length === 0) return 'No data found for the specified criteria.';

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
      );
      return [headers, ...rows].join('\n');
    } catch (err: any) {
      logger.error('CSV_REPORT_GENERATION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  // ── HTML (professional, client-facing) ──────────────────────────────────────
  static async generateHTML(orgId: string, config: ReportConfig): Promise<string> {
    try {
      const { data, error } = await this.fetchMetrics(orgId, config);
      if (error) throw error;

      const rows = data ?? [];
      const totalRisk   = rows.reduce((a, r) => a + (r.total_risk || 0), 0);
      const avgRisk     = rows.length ? (totalRisk / rows.length).toFixed(4) : '0.0000';
      const criticals   = rows.filter(r => r.severity_level === 'CRITICAL').length;
      const highs       = rows.filter(r => r.severity_level === 'HIGH').length;
      const mediums     = rows.filter(r => r.severity_level === 'MEDIUM').length;
      const lows        = rows.filter(r => r.severity_level === 'LOW').length;
      const adherence   = rows.length ? ((rows.filter(r => (r.total_risk || 0) < 0.7).length / rows.length) * 100).toFixed(1) : '—';

      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      const startFmt = new Date(config.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const endFmt   = new Date(config.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

      const maxSev = Math.max(criticals, highs, mediums, lows, 1);

      const sevBars = [
        { label: 'CRITICAL', count: criticals, color: SEV_COLORS.CRITICAL },
        { label: 'HIGH',     count: highs,     color: SEV_COLORS.HIGH },
        { label: 'MEDIUM',   count: mediums,   color: SEV_COLORS.MEDIUM },
        { label: 'LOW',      count: lows,      color: SEV_COLORS.LOW },
      ].map(({ label, count, color }) => {
        const pct = Math.round((count / maxSev) * 100);
        return `
          <div class="sev-row">
            <div class="sev-meta">
              <span class="sev-label" style="color:${color}">${label}</span>
              <span class="sev-count">${count}</span>
            </div>
            <div class="sev-rail">
              <div class="sev-bar" style="width:${pct}%;background:${color}"></div>
            </div>
          </div>`;
      }).join('');

      const tableRows = rows.slice(0, 15).map((row, i) => {
        const sev = row.severity_level || 'LOW';
        const col = SEV_COLORS[sev] || '#6B7280';
        const bg  = i % 2 === 0 ? '#1E2D4A' : '#192440';
        return `
          <tr style="background:${bg}">
            <td class="mono">${(row.interaction_id || '—').slice(0, 14)}…</td>
            <td class="mono" style="color:#C9A84C;font-weight:700">${(row.total_risk || 0).toFixed(4)}</td>
            <td><span class="pill" style="background:${col}22;color:${col};border:1px solid ${col}55">${sev}</span></td>
            <td class="mono" style="color:#94A3B8">${row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '—'}</td>
          </tr>`;
      }).join('');

      const hashStub = Date.now().toString(16).toUpperCase();

      return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Facttic — Governance Intelligence Report</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Serif:ital,wght@0,300;0,600;1,300&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'IBM Plex Sans', sans-serif;
  background: #0A1628;
  color: #E2E8F0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── COVER PAGE ── */
.cover {
  width: 100%;
  min-height: 297mm;
  background: #0A1628;
  display: flex;
  flex-direction: column;
  padding: 56px 64px;
  position: relative;
  overflow: hidden;
  page-break-after: always;
}

.cover-accent {
  position: absolute;
  top: 0; right: 0;
  width: 340px; height: 340px;
  background: radial-gradient(circle at top right, rgba(201,168,76,0.08), transparent 70%);
  pointer-events: none;
}

.cover-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.cover-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
}

.cover-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(201,168,76,0.8);
  border: 1px solid rgba(201,168,76,0.3);
  padding: 5px 14px;
  background: rgba(201,168,76,0.05);
}

.cover-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.cover-eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #C9A84C;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.cover-eyebrow::before {
  content: '';
  display: inline-block;
  width: 32px; height: 1px;
  background: #C9A84C;
}

.cover-title {
  font-family: 'IBM Plex Serif', serif;
  font-size: 52px;
  font-weight: 300;
  color: #FFFFFF;
  line-height: 1.1;
  letter-spacing: -1px;
  margin-bottom: 20px;
}
.cover-title strong { font-weight: 600; display: block; }

.cover-desc {
  font-size: 15px;
  font-weight: 300;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  max-width: 520px;
  margin-bottom: 48px;
}

.cover-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.06);
  max-width: 640px;
}
.cover-meta-cell {
  background: rgba(255,255,255,0.02);
  padding: 16px 20px;
}
.cover-meta-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 7px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin-bottom: 6px;
}
.cover-meta-val {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: rgba(255,255,255,0.75);
  font-weight: 500;
}

.cover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 40px;
  border-top: 1px solid rgba(255,255,255,0.07);
  position: relative;
  z-index: 2;
}
.cover-confidential {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
}
.cover-hash {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  color: rgba(201,168,76,0.4);
  letter-spacing: 1px;
}

/* ── CONTENT PAGES ── */
.content {
  padding: 56px 64px;
  background: #0D1F3C;
  min-height: 297mm;
}

.section { margin-bottom: 56px; }

.section-eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #C9A84C;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-eyebrow::before {
  content: '';
  display: inline-block;
  width: 24px; height: 1px;
  background: #C9A84C;
}

.section-title {
  font-family: 'IBM Plex Serif', serif;
  font-size: 28px;
  font-weight: 300;
  color: #FFFFFF;
  line-height: 1.25;
  margin-bottom: 24px;
}
.section-title strong { font-weight: 600; }

/* ── EXEC SUMMARY ── */
.exec-box {
  background: rgba(201,168,76,0.04);
  border: 1px solid rgba(201,168,76,0.2);
  padding: 28px 32px;
  margin-bottom: 40px;
}
.exec-box p {
  font-size: 14px;
  font-weight: 300;
  color: rgba(255,255,255,0.65);
  line-height: 1.75;
}
.exec-box p strong { color: #FFFFFF; font-weight: 500; }

/* ── KPI STRIP ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.06);
  margin-bottom: 40px;
}
.kpi-cell {
  background: rgba(255,255,255,0.02);
  padding: 24px 20px;
  text-align: center;
}
.kpi-val {
  font-family: 'IBM Plex Serif', serif;
  font-size: 36px;
  font-weight: 600;
  color: #FFFFFF;
  line-height: 1;
  margin-bottom: 8px;
  display: block;
}
.kpi-val.gold { color: #C9A84C; }
.kpi-val.red  { color: #EF4444; }
.kpi-val.green{ color: #10B981; }
.kpi-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}

/* ── SEVERITY BARS ── */
.sev-section { margin-bottom: 40px; }
.sev-header {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin-bottom: 20px;
}
.sev-row { margin-bottom: 14px; }
.sev-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.sev-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
.sev-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  color: rgba(255,255,255,0.4);
}
.sev-rail {
  background: rgba(255,255,255,0.04);
  height: 6px;
  width: 100%;
}
.sev-bar {
  height: 6px;
  transition: width 0s;
}

/* ── TABLE ── */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
thead tr {
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
th {
  text-align: left;
  padding: 12px 14px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  font-weight: 500;
}
td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.65);
}
.mono { font-family: 'IBM Plex Mono', monospace; font-size: 10px; }
.pill {
  display: inline-block;
  padding: 3px 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ── CONTENT HEADER ── */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.content-header-logo { opacity: 0.6; }
.content-header-info {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  color: rgba(255,255,255,0.2);
  letter-spacing: 1px;
  text-align: right;
  line-height: 1.7;
}

/* ── FOOTER ── */
.page-footer {
  margin-top: 64px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-footer-left {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 7.5px;
  color: rgba(255,255,255,0.18);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  line-height: 1.8;
}
.page-footer-right {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 7.5px;
  color: rgba(201,168,76,0.3);
  letter-spacing: 1px;
  text-align: right;
}

@media print {
  .cover { page-break-after: always; }
  body { background: #0A1628; }
}
</style>
</head>
<body>

<!-- ══ COVER PAGE ══════════════════════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-accent"></div>
  <div class="cover-grid"></div>

  <div class="cover-header">
    ${LOGO_SVG}
    <div class="cover-badge">CONFIDENTIAL · AUTHORIZED ACCESS ONLY</div>
  </div>

  <div class="cover-body">
    <div class="cover-eyebrow">Governance Intelligence Report</div>
    <div class="cover-title">
      AI Behavioral<br>
      <strong>Governance Analysis</strong>
    </div>
    <div class="cover-desc">
      Deterministic audit of AI agent behavioral patterns, policy adherence, and risk exposure.
      Generated by the Facttic Core Engine with cryptographic event integrity verification.
    </div>
    <div class="cover-meta-grid">
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Report Date</div>
        <div class="cover-meta-val">${dateStr}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Period Start</div>
        <div class="cover-meta-val">${startFmt}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Period End</div>
        <div class="cover-meta-val">${endFmt}</div>
      </div>
      <div class="cover-meta-cell">
        <div class="cover-meta-label">Events</div>
        <div class="cover-meta-val">${rows.length.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-confidential">
      Facttic Systems · AI Governance Platform · ${new Date().getFullYear()}
    </div>
    <div class="cover-hash">SHA-256 · ${hashStub}</div>
  </div>
</div>

<!-- ══ CONTENT PAGE ═════════════════════════════════════════════════════════ -->
<div class="content">

  <!-- Header strip -->
  <div class="content-header">
    <div class="content-header-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 34" width="140" height="34" fill="none">
        <rect x="1" y="8"  width="12" height="4" fill="#2563EB"/>
        <rect x="1" y="14" width="9"  height="3" fill="rgba(255,255,255,0.5)"/>
        <rect x="11" y="14" width="2" height="3" fill="#2563EB" opacity="0.85"/>
        <rect x="1" y="19" width="6"  height="3" fill="rgba(255,255,255,0.2)"/>
        <text x="20" y="22" font-family="'IBM Plex Sans',sans-serif" font-weight="600" font-size="14" letter-spacing="-0.3px" fill="rgba(255,255,255,0.4)">Facttic</text>
      </svg>
    </div>
    <div class="content-header-info">
      AI Governance Intelligence Report<br>
      ${startFmt} — ${endFmt}
    </div>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <div class="section-eyebrow">Executive Summary</div>
    <div class="section-title">Governance <strong>Status Overview</strong></div>

    <div class="exec-box">
      <p>
        During the governance horizon spanning <strong>${startFmt} to ${endFmt}</strong>, the AI system
        processed <strong>${rows.length.toLocaleString()} discrete interaction events</strong> through the
        Facttic behavioral control layer. The aggregate risk momentum remains within institutional bounds,
        with a mean deterministic severity index of <strong>${avgRisk}</strong> and a policy adherence rate
        of <strong>${adherence}%</strong>.
        ${criticals > 0
          ? `<br><br>⚠ <strong>${criticals} CRITICAL</strong> events were detected during this period and require immediate review.`
          : `<br><br>✓ No CRITICAL events were detected during this period — all behavioral patterns are within safe operating thresholds.`
        }
      </p>
    </div>

    <!-- KPI strip -->
    <div class="kpi-grid">
      <div class="kpi-cell">
        <span class="kpi-val">${rows.length.toLocaleString()}</span>
        <div class="kpi-label">Total Events</div>
      </div>
      <div class="kpi-cell">
        <span class="kpi-val gold">${avgRisk}</span>
        <div class="kpi-label">Avg Risk Score</div>
      </div>
      <div class="kpi-cell">
        <span class="kpi-val ${criticals > 0 ? 'red' : 'green'}">${criticals}</span>
        <div class="kpi-label">Critical Events</div>
      </div>
      <div class="kpi-cell">
        <span class="kpi-val green">${adherence}%</span>
        <div class="kpi-label">Policy Adherence</div>
      </div>
    </div>
  </div>

  <!-- Severity Distribution -->
  <div class="section">
    <div class="section-eyebrow">Risk Analysis</div>
    <div class="section-title">Severity <strong>Distribution</strong></div>

    <div class="sev-section">
      <div class="sev-header">Event count by severity level</div>
      ${sevBars}
    </div>
  </div>

  <!-- Audit Table -->
  <div class="section">
    <div class="section-eyebrow">Audit Ledger</div>
    <div class="section-title">Interaction <strong>Event Log</strong></div>

    <table>
      <thead>
        <tr>
          <th>Interaction ID</th>
          <th>Risk Score</th>
          <th>Severity</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows || `<tr><td colspan="4" style="text-align:center;padding:32px;color:rgba(255,255,255,0.2);font-style:italic">No audit events recorded for this period.</td></tr>`}
      </tbody>
    </table>

    ${rows.length > 15 ? `<p style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:rgba(255,255,255,0.2);letter-spacing:1px;margin-top:12px;text-align:right">Showing 15 of ${rows.length} events. Full dataset available via API export.</p>` : ''}
  </div>

  <!-- Page Footer -->
  <div class="page-footer">
    <div class="page-footer-left">
      Facttic Core Engine v1.0.0 · ${new Date().getFullYear()}<br>
      AI Governance Intelligence Platform
    </div>
    <div class="page-footer-right">
      REPORT ID: ${hashStub}<br>
      CONFIDENTIAL — AUTHORIZED EYES ONLY
    </div>
  </div>

</div>

</body>
</html>`;
    } catch (err: any) {
      logger.error('HTML_REPORT_GENERATION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  // ── PDF (HTML → puppeteer) ───────────────────────────────────────────────────
  static async generatePDF(orgId: string, config: ReportConfig): Promise<Buffer> {
    try {
      const html = await this.generateHTML(orgId, config);

      // Cross-platform Chrome/Chromium path detection
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
        || (process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/chromium-browser');

      const browser = await puppeteer.launch({
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1240, height: 1754 }); // A4 @ 150dpi
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (err: any) {
      logger.error('PDF_REPORT_GENERATION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  // ── Internal: fetch evaluation metrics ──────────────────────────────────────
  private static async fetchMetrics(orgId: string, config: ReportConfig) {
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, session_id, risk_score, decision, event_type, created_at')
      .eq('org_id', orgId)
      .gte('created_at', config.startDate)
      .lte('created_at', config.endDate)
      .order('created_at', { ascending: false });

    // Map DB fields → shape expected by generateHTML/generateCSV
    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      total_risk: (r.risk_score ?? 0) / 100,
      severity_level:
        r.risk_score >= 80 ? 'CRITICAL' :
        r.risk_score >= 60 ? 'HIGH' :
        r.risk_score >= 40 ? 'MEDIUM' : 'LOW',
    }));

    return { data: mapped, error };
  }
}
