/**
 * @file Public SDK Entrypoint for Autonomous AI Frameworks & Developer Tools
 * Authors: Franca Roscilli <francaroscillidev@gmail.com> (@francaroscillidev-gif)
 */

export { SpecVerificationAgent, VerifyAndHealOptions } from './healer/agent.js';
export { SmartLLMProvider } from './llm/provider.js';
export { LocalSandboxRunner } from './sandbox/runner.js';
export { MutationEngine } from './mutation/engine.js';
export { AstQualityAuditor } from './reporter/ast-auditor.js';
export { FuzzingTelemetryTracker } from './reporter/telemetry.js';
export { CryptographicAttestor } from './security/attestor.js';
export { SpecSemanticAnalyzer } from './spec/linter.js';
export { RegressionCorpusVault } from './corpus/vault.js';
export { SmartPatchExplainer } from './reporter/patch-explainer.js';
export { HtmlDashboardGenerator } from './reporter/html-generator.js';
export { ConcurrencyStressHarness } from './concurrency/harness.js';
export { CodeCoverageEngine } from './coverage/engine.js';
export { DependencySecurityScanner } from './security/dependency-scanner.js';
export { SymbolicZ3Verifier } from './symbolic/solver.js';
export { OpenApiContractAdapter } from './openapi/adapter.js';
export { FlakyTestStressEngine } from './flaky/detector.js';
export { TimeTravelDebuggerReplayer } from './replay/debugger.js';
export { TlaSpecSynthesizer } from './tla/synthesizer.js';
export { SarifReportExporter } from './sarif/exporter.js';
export { RoiMetricsCalculator } from './roi/calculator.js';
export { AutoBranchPrGenerator } from './git-pr/generator.js';
export * from './types.js';
