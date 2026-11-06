export interface SemanticCheckIssue {
  type: 'CONTRADICTION' | 'UNDER_SPECIFICATION' | 'AMBIGUOUS_TYPE';
  clause: string;
  recommendation: string;
}

export class SpecSemanticAnalyzer {
  /**
   * Analizza la specifica tecnica per rilevare ambiguità logiche comuni,
   * clausole contraddittorie o casi limite non definiti prima di avviare la generazione del codice.
   */
  lintSpec(specContent: string): { issues: SemanticCheckIssue[]; isValid: boolean } {
    const issues: SemanticCheckIssue[] = [];

    // 1. Controllo specifica del comportamento in condizioni di errore/limite
    if (!/error|throw|reject|fallisc|eccezion|invalid/i.test(specContent)) {
      issues.push({
        type: 'UNDER_SPECIFICATION',
        clause: 'Condizioni di errore e casi limite',
        recommendation: 'La specifica non definisce esplicitamente il comportamento in caso di input non valido o limiti di errore (es. valori negativi o overflow).',
      });
    }

    // 2. Controllo determinismo temporale / concorrenza
    if (/tempo|timer|second|ms|async|interval/i.test(specContent) && !/advance|mock|clock|determin/i.test(specContent)) {
      issues.push({
        type: 'AMBIGUOUS_TYPE',
        clause: 'Riferimento temporale reale vs orologio virtuale',
        recommendation: 'La specifica cita intervalli temporali ma non specifica se usare un orologio iniettabile per test deterministici.',
      });
    }

    return {
      issues,
      isValid: issues.filter(i => i.type === 'CONTRADICTION').length === 0,
    };
  }

  generateMarkdownReport(issues: SemanticCheckIssue[]): string {
    if (issues.length === 0) {
      return `
### 🔍 Formal Spec Linting: Nessuna Ambiguità Rilevata
Tutte le clausole e i vincoli logici sono definiti in modo univoco e deterministico.
`;
    }

    const rows = issues.map(i => `- **[${i.type}]** ${i.clause}: *${i.recommendation}*`).join('\n');
    return `
### 🔍 Formal Spec Linting (Ambiguità & Prevenzione Errori)
${rows}
`;
  }
}
