import * as fs from 'node:fs/promises';

export interface SarifResultItem {
  ruleId: string;
  message: string;
  level: 'error' | 'warning' | 'note';
  filePath: string;
  startLine: number;
}

export class SarifReportExporter {
  generateSarifJson(items: SarifResultItem[]): any {
    return {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'GitNative-SpecToCode-Agent',
              version: '9.0.0',
              informationUri: 'https://github.com/francaroscillidev-gif/git-native-spec-to-code',
              rules: [
                {
                  id: 'SPEC001',
                  name: 'PropertyInvariantViolation',
                  shortDescription: { text: 'Invariante formale o proprietà violata' },
                },
                {
                  id: 'SPEC002',
                  name: 'MutationTestingWarning',
                  shortDescription: { text: 'Mutante sopravvissuto al testing' },
                },
                {
                  id: 'SPEC003',
                  name: 'CyclomaticComplexityWarning',
                  shortDescription: { text: 'Complessità ciclomatica elevata' },
                },
              ],
            },
          },
          results: items.map(item => ({
            ruleId: item.ruleId,
            level: item.level,
            message: { text: item.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: item.filePath },
                  region: { startLine: item.startLine },
                },
              },
            ],
          })),
        },
      ],
    };
  }

  async exportSarifFile(outputPath: string, items: SarifResultItem[]): Promise<void> {
    const json = this.generateSarifJson(items);
    await fs.writeFile(outputPath, JSON.stringify(json, null, 2), 'utf-8');
  }
}
