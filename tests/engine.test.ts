import { describe, it, expect } from 'vitest';
import { AstMutator } from '../src/mutation/mutator.js';
import { AstQualityAuditor } from '../src/reporter/ast-auditor.js';
import { CryptographicAttestor } from '../src/security/attestor.js';
import { SpecSemanticAnalyzer } from '../src/spec/linter.js';
import { RoiMetricsCalculator } from '../src/roi/calculator.js';

describe('Unit & Integration Test Suite - Spec Verification Engine Core', () => {
  it('AstMutator should generate valid inverted operator mutants', () => {
    const mutator = new AstMutator();
    const code = `function isAllowed(tokens: number, cost: number): boolean { return tokens >= cost; }`;
    const mutants = mutator.generateMutants(code);
    expect(mutants.length).toBeGreaterThan(0);
    expect(mutants[0].description).toContain("'>=' con '<'");
  });

  it('AstQualityAuditor should calculate cyclomatic complexity accurately', () => {
    const auditor = new AstQualityAuditor();
    const code = `function check(x: number) { if (x > 0) return true; else return false; }`;
    const audit = auditor.auditSource(code);
    expect(audit.cyclomaticComplexity).toBe(2);
    expect(audit.passedQualityGate).toBe(true);
  });

  it('CryptographicAttestor should generate immutable HMAC-SHA256 digital seals', () => {
    const attestor = new CryptographicAttestor();
    const att = attestor.createAttestation({
      specContent: 'My Spec',
      codeContent: 'export const a = 1;',
      testContent: 'it("works", () => {});',
      mutationScore: 100,
    });
    expect(att.signature).toBeDefined();
    expect(att.signature.length).toBe(64);
    expect(att.certificateMarkdown).toContain('franca roscilli');
  });

  it('SpecSemanticAnalyzer should detect missing error specifications', () => {
    const linter = new SpecSemanticAnalyzer();
    const res = linter.lintSpec('Una funzione che calcola la somma di due numeri positivi.');
    expect(res.issues.some(i => i.type === 'UNDER_SPECIFICATION')).toBe(true);
  });

  it('RoiMetricsCalculator should compute engineering savings accurately', () => {
    const calc = new RoiMetricsCalculator();
    const roi = calc.calculateRoi({
      fuzzPermutations: 1000,
      mutantsKilled: 4,
      counterexamplesShrunk: 1,
    });
    expect(roi.bugsPreventedCount).toBeGreaterThanOrEqual(1);
    expect(roi.directFinancialSavingsUsd).toBeGreaterThan(0);
  });
});
