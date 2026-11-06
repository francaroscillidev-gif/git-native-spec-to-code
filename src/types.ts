export interface PropertyContract {
  name: string;
  description: string;
  invariant: string;
}

export interface SpecAnalysis {
  title: string;
  moduleName: string;
  properties: PropertyContract[];
  testFileContent?: string;
}

export interface ExecutionResult {
  success: boolean;
  rawOutput: string;
  failingProperties?: string[];
  counterexamples?: string[];
  errorDetails?: string;
  iterationsTaken: number;
}

export interface VerificationReport {
  specFile: string;
  targetFile: string;
  verified: boolean;
  totalIterations: number;
  propertiesVerified: PropertyContract[];
  healingRounds: {
    iteration: number;
    errorSummary: string;
    patchSummary: string;
  }[];
  markdownSummary: string;
}

export interface LLMProvider {
  generatePropertiesAndTests(specContent: string, targetSkeleton?: string): Promise<{
    properties: PropertyContract[];
    testCode: string;
    initialImplementation: string;
  }>;

  healImplementation(params: {
    specContent: string;
    testCode: string;
    currentImplementation: string;
    errorTrace: string;
    iteration: number;
  }): Promise<{
    fixedCode: string;
    explanation: string;
  }>;

  generateSafetyReport(params: {
    specContent: string;
    properties: PropertyContract[];
    iterations: number;
    finalCode: string;
  }): Promise<string>;
}
