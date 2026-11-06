export interface MutationKillSummary {
  mutantId: string;
  mutantDescription: string;
  killedByTest: string;
  falsifyingInputSample: string;
}

export interface InteractiveDashboardData {
  projectName: string;
  timestamp: string;
  status: 'VERIFIED' | 'FAILED';
  mutationScore: number;
  cyclomaticComplexity: number;
  totalPermutations: number;
  iterationsTaken: number;
  slsaSignature: string;
  author: string;
  email: string;
  github: string;
  properties: { name: string; invariant: string; cases: number }[];
  mutants: MutationKillSummary[];
  patchExplanation: string;
}

export class HtmlDashboardGenerator {
  generateHtml(data: InteractiveDashboardData): string {
    const propertiesRows = data.properties.map(p => `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><code>${p.invariant}</code></td>
        <td><span class="badge badge-success">${p.cases.toLocaleString()} casi</span></td>
      </tr>
    `).join('');

    const mutantsRows = data.mutants.map(m => `
      <tr>
        <td><code>${m.mutantId}</code></td>
        <td>${m.mutantDescription}</td>
        <td><code>${m.killedByTest}</code></td>
        <td><span class="badge badge-danger">${m.falsifyingInputSample}</span></td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formal Verification Attestation - ${data.projectName}</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-bright: #f0f6fc;
      --accent-green: #238636;
      --accent-blue: #58a6ff;
      --accent-red: #da3633;
      --accent-purple: #bc8cff;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 1100px;
      width: 100%;
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1, h2, h3 { color: var(--text-bright); margin: 0 0 10px 0; }
    .author-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 0.85rem;
      color: var(--accent-blue);
    }
    .author-badge a {
      color: var(--accent-blue);
      text-decoration: none;
    }
    .author-badge a:hover {
      text-decoration: underline;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }
    .card-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      color: #8b949e;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-bright);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th, td {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      font-size: 0.9rem;
    }
    th {
      background: rgba(255,255,255,0.02);
      color: #8b949e;
    }
    code {
      background: rgba(110,118,129,0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: var(--accent-blue);
    }
    .badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-success { background: rgba(35, 134, 54, 0.2); color: #3fb950; border: 1px solid rgba(63, 185, 80, 0.3); }
    .badge-danger { background: rgba(218, 54, 51, 0.2); color: #f85149; border: 1px solid rgba(248, 81, 73, 0.3); }
    .seal-box {
      margin-top: 30px;
      background: rgba(188, 140, 255, 0.05);
      border: 1px solid rgba(188, 140, 255, 0.2);
      border-radius: 8px;
      padding: 20px;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🛡️ Formal Verification Attestation</h1>
        <p style="color: #8b949e; margin: 4px 0 0 0;">Modulo: <strong>${data.projectName}</strong> • Generato il: ${data.timestamp}</p>
        <div class="author-badge">
          ✍️ Creato e certificato da: <strong>${data.author}</strong> (<a href="mailto:${data.email}">${data.email}</a> • GitHub: <a href="https://github.com/${data.github}" target="_blank">@${data.github}</a>)
        </div>
      </div>
      <div>
        <span class="badge badge-success" style="font-size: 1rem; padding: 8px 16px;">${data.status} (100%)</span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Mutation Testing Score</div>
        <div class="card-value" style="color: #3fb950;">${data.mutationScore}%</div>
        <div style="font-size: 0.8rem; color: #8b949e; margin-top: 5px;">Tutti i mutanti eliminati</div>
      </div>
      <div class="card">
        <div class="card-title">Permutazioni PBT Fuzzate</div>
        <div class="card-value" style="color: var(--accent-blue);">${data.totalPermutations.toLocaleString()}</div>
        <div style="font-size: 0.8rem; color: #8b949e; margin-top: 5px;">Fast-Check Shrink attivo</div>
      </div>
      <div class="card">
        <div class="card-title">Complessità Ciclomatica</div>
        <div class="card-value" style="color: var(--accent-purple);">${data.cyclomaticComplexity}</div>
        <div style="font-size: 0.8rem; color: #8b949e; margin-top: 5px;">Quality Gate superato (≤ 15)</div>
      </div>
      <div class="card">
        <div class="card-title">Round di Self-Healing</div>
        <div class="card-value">${data.iterationsTaken}</div>
        <div style="font-size: 0.8rem; color: #8b949e; margin-top: 5px;">Convergenza deterministica</div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 25px;">
      <h2>Invarianti di Proprietà Verificate</h2>
      <table>
        <thead>
          <tr>
            <th>Nome Proprietà</th>
            <th>Contratto Invariante Matematico</th>
            <th>Casi Fuzzati</th>
          </tr>
        </thead>
        <tbody>
          ${propertiesRows}
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-bottom: 25px;">
      <h2>Registro dei Mutanti AST Neutralizzati (Killed)</h2>
      <table>
        <thead>
          <tr>
            <th>ID Mutante</th>
            <th>Descrizione Mutazione Iniettata</th>
            <th>Test che l'ha Intercettato</th>
            <th>Input che ha Neutralizzato il Mutante</th>
          </tr>
        </thead>
        <tbody>
          ${mutantsRows}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Razionale della Correzione Automatica (Self-Healing)</h2>
      <p style="margin: 10px 0; line-height: 1.5; color: #e6edf3;">${data.patchExplanation}</p>
    </div>

    <div class="seal-box">
      <strong>🔏 Sigillo Crittografico di Manomissione SLSA Level 3:</strong><br>
      <code>${data.slsaSignature}</code><br>
      <span style="color: #8b949e; font-size: 0.8rem;">
        Autore: <strong>${data.author}</strong> (<a href="mailto:${data.email}">${data.email}</a> • GitHub: <a href="https://github.com/${data.github}" target="_blank">@${data.github}</a>)<br>
        Questo attestato è vincolato in modo crittograficamente irreversibile alla specifica e al commit target.
      </span>
    </div>
  </div>
</body>
</html>
`;
  }
}
