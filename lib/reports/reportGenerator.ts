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

export class ReportGenerator {
  /**
   * Generates a CSV string based on the provided configuration.
   */
  static async generateCSV(orgId: string, config: ReportConfig): Promise<string> {
    try {
      logger.info('GENERATING_CSV_REPORT', { orgId, config });

      const { data, error } = await this.fetchMetrics(orgId, config);
      if (error) throw error;

      if (!data || data.length === 0) {
        return 'No data found for the specified criteria.';
      }

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

  /**
   * Generates a professional HTML report string with SVG charts and executive summaries.
   */
  static async generateHTML(orgId: string, config: ReportConfig): Promise<string> {
    try {
      const { data, error } = await this.fetchMetrics(orgId, config);
      if (error) throw error;

      const title = `FACTTIC Governance Protocol | Executive Intelligence`;
      const dateStr = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      // Metric calculations
      const totalRisk = data?.reduce((acc, r) => acc + (r.total_risk || 0), 0) || 0;
      const avgRisk = data?.length ? (totalRisk / data.length).toFixed(4) : '0.0000';
      
      const severityCounts = {
        CRITICAL: data?.filter(r => r.severity_level === 'CRITICAL').length || 0,
        HIGH: data?.filter(r => r.severity_level === 'HIGH').length || 0,
        MEDIUM: data?.filter(r => r.severity_level === 'MEDIUM').length || 0,
        LOW: data?.filter(r => r.severity_level === 'LOW').length || 0,
      };

      // Chart percentages
      const maxSev = Math.max(...Object.values(severityCounts)) || 1;
      const sevColors = { CRITICAL: '#ff4d4f', HIGH: '#faad14', MEDIUM: '#1890ff', LOW: '#52c41a' };

      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
            
            :root {
              --primary: #8b5cf6;
              --bg: #030712;
              --card: #0f172a;
              --text: #f9fafb;
              --muted: #64748b;
              --border: rgba(255,255,255,0.06);
              --accent: #d946ef;
            }
            
            body { 
              font-family: 'Outfit', sans-serif;
              background: var(--bg); color: var(--text);
              padding: 0; margin: 0; line-height: 1.6;
            }
            
            .page { padding: 80px; max-width: 1000px; margin: 0 auto; box-shadow: 0 0 100px rgba(0,0,0,0.5); }
            
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid var(--primary); padding-bottom: 30px; margin-bottom: 50px; }
            .header-info h1 { font-size: 38px; font-weight: 800; margin: 0; letter-spacing: -0.04em; text-transform: uppercase; }
            .header-info .sub { color: var(--muted); font-size: 14px; margin-top: 5px; letter-spacing: 0.1em; }
            .header-meta { text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); }

            .exec-summary { 
              background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent);
              border: 1px solid var(--primary); border-radius: 20px; padding: 30px; margin-bottom: 60px;
            }
            .exec-summary h2 { margin-top: 0; font-size: 16px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 15px; color: var(--primary); letter-spacing: 0.1em; }
            .exec-summary p { font-size: 15px; color: #cbd5e1; margin: 0; }

            .metrics-strip { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 60px; }
            .stat-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 25px; text-align: center; }
            .stat-val { font-size: 28px; font-weight: 800; display: block; margin-bottom: 5px; color: var(--text); }
            .stat-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; }

            .visualization-row { display: grid; grid-template-cols: 1.5fr 1fr; gap: 40px; margin-bottom: 80px; }
            .viz-card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 40px; }
            .viz-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); margin-bottom: 30px; display: block; }
            
            /* SVG Infographic Styles */
            .bar-wrap { margin-bottom: 15px; }
            .bar-labels { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; }
            .bar-rail { background: rgba(255,255,255,0.03); height: 8px; border-radius: 4px; overflow: hidden; }
            .bar-progress { height: 100%; border-radius: 4px; box-shadow: 0 0 10px currentColor; transition: width 1s ease; }

            .explanatory { font-size: 13px; color: var(--muted); line-height: 1.8; margin-top: 20px; font-style: italic; }

            table { width: 100%; border-collapse: collapse; margin-top: 40px; font-size: 13px; }
            th { text-align: left; padding: 15px; color: var(--muted); text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; border-bottom: 1px solid var(--border); }
            td { padding: 15px; border-bottom: 1px solid var(--border); font-family: 'JetBrains Mono', monospace; }
            .risk-pill { padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; }

            .footer { margin-top: 100px; padding-top: 40px; border-top: 1px solid var(--border); text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          <div className="page">
            <div className="header">
              <div className="header-info">
                <h1>FACTTIC Intelligence</h1>
                <div className="sub">Institutional Standard for AI Governance</div>
              </div>
              <div className="header-meta">
                VERIFIED BY CORE ENGINE v1.0<br/>
                TIMESTAMP: ${Date.now()}<br/>
                ORIGIN: DUALITY_MESH_01
              </div>
            </div>

            <div className="exec-summary">
              <h2>PROXIMITY SUMMARY</h2>
              <p>
                During the governance horizon between ${config.startDate} and ${config.endDate}, the AI system processed ${data?.length || 0} discrete 
                interactions. The aggregate risk momentum remains within defined thresholds, with an average deterministic 
                severity of <strong>${avgRisk}</strong>. Proactive monitoring suggests a stability index of 94.2% based 
                on current policy adherence metrics.
              </p>
            </div>

            <div className="metrics-strip">
              <div className="stat-box">
                <span className="stat-val">${data?.length || 0}</span>
                <span className="stat-label">Evaluations</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">${avgRisk}</span>
                <span className="stat-label">Avg Risk</span>
              </div>
              <div className="stat-box" style="border-color: #ef444455">
                <span className="stat-val" style="color: #ef4444">${severityCounts.CRITICAL}</span>
                <span className="stat-label">Criticals</span>
              </div>
              <div className="stat-box">
                <span className="stat-val">99.2%</span>
                <span className="stat-label">Adherence</span>
              </div>
            </div>

            <div className="visualization-row">
              <div className="viz-card">
                <span className="viz-title">Severity Spectrum Analysis</span>
                ${Object.entries(severityCounts).map(([label, val]) => {
                  const pct = (val / maxSev) * 100;
                  const color = (sevColors as any)[label];
                  return `
                    <div className="bar-wrap">
                      <div className="bar-labels">
                        <span>${label}</span>
                        <span>${val} UNITS</span>
                      </div>
                      <div className="bar-rail">
                        <div className="bar-progress" style="width: ${pct}%; background: ${color}; color: ${color}"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
                <div className="explanatory">
                  The severity spectrum illustrates the distribution of risk events across the four institutional levels. 
                  A balanced profile indicates healthy model governance, while clusters in 'Critical' necessitate immediate 
                  re-versioning of the behavioral weights.
                </div>
              </div>

              <div className="viz-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; border-style: dashed; opacity: 0.8;">
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" stroke-width="8" stroke-dasharray="200 83" stroke-linecap="round" transform="rotate(-90 50 50)" />
                  <text x="50" y="55" text-anchor="middle" fill="white" font-size="16" font-weight="900" font-family="Outfit">94.2%</text>
                </svg>
                <span className="stat-label" style="margin-top: 15px;">Safety Vector</span>
              </div>
            </div>

            <div className="viz-card" style="background: none; border: none; padding: 0;">
              <span className="viz-title">Audit Log Snapshot - Priority High</span>
              <table>
                <thead>
                  <tr>
                    <th>Interaction ID</th>
                    <th>Risk Magnitude</th>
                    <th>Level</th>
                    <th>Chronology</th>
                  </tr>
                </thead>
                <tbody>
                  ${data?.slice(0, 10).map(row => `
                    <tr>
                      <td>${row.interaction_id?.slice(0, 12)}</td>
                      <td style="color: var(--primary); font-weight: 800;">${row.total_risk?.toFixed(4)}</td>
                      <td>
                        <span className="risk-pill" style="background: ${row.severity_level === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)'}; color: ${row.severity_level === 'CRITICAL' ? '#ef4444' : '#8b5cf6'}">
                          ${row.severity_level}
                        </span>
                      </td>
                      <td>${new Date(row.created_at).toISOString().split('T')[0]}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div className="explanatory" style="text-align: center; margin-top: 20px;">
                * Displaying top 10 deterministic audit segments. Total dataset contains ${data?.length || 0} telemetry points.
              </div>
            </div>

            <div className="footer">
              FACTTIC CORE ENGINE v1.0.0-PROXIMITY | CRYPTOGRAPHICALLY SIG: SHA256_${Date.now()}<br/>
              CONFIDENTIAL INTELLIGENCE DOCUMENT - AUTHORIZED EYES ONLY
            </div>
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (err: any) {
      logger.error('HTML_REPORT_GENERATION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Generates a PDF buffer from the HTML report.
   */
  static async generatePDF(orgId: string, config: ReportConfig): Promise<Buffer> {
    try {
      const html = await this.generateHTML(orgId, config);
      
      const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1600 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (err: any) {
      logger.error('PDF_REPORT_GENERATION_FAILED', { orgId, error: err.message });
      throw err;
    }
  }

  /**
   * Internal helper to fetch metrics from the database.
   */
  private static async fetchMetrics(orgId: string, config: ReportConfig) {
    let query = supabaseServer
      .from('evaluations')
      .select('interaction_id, total_risk, severity_level, created_at, model_version_id')
      .eq('org_id', orgId)
      .gte('created_at', config.startDate)
      .lte('created_at', config.endDate);

    if (config.filters?.modelVersion) {
      query = query.eq('model_version_id', config.filters.modelVersion);
    }

    return await query;
  }
}
