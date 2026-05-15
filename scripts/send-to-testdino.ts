import { execSync } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Script para enviar resultados de testes Playwright para TestDino
 *
 * Uso:
 *   npx ts-node scripts/send-to-testdino.ts
 *
 * Requer variáveis de ambiente (via .env):
 *   - TESTDINO_API_KEY: Chave de autenticação
 */

function main(): void {
  const apiKey = process.env.TESTDINO_API_KEY;
  const environment = process.env.TESTDINO_TARGET_ENV || 'staging';
  const tags = process.env.TESTDINO_RUN_TAGS || 'e2e,staging';

  if (!apiKey) {
    console.error('❌ TESTDINO_API_KEY não definida no .env');
    process.exit(1);
  }

  const reportDir = path.join(process.cwd(), 'playwright-report');
  const jsonReport = path.join(process.cwd(), 'playwright-results.json');

  const cmd = [
    'npx tdpw upload',
    `"${reportDir}"`,
    `--token="${apiKey}"`,
    `--json-report="${jsonReport}"`,
    `--environment="${environment}"`,
    `--tag="${tags}"`,
  ].join(' ');

  console.log('🚀 Enviando relatório para TestDino...\n');

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err: any) {
    // 3221226505 (0xC0000409) é o código do bug de cleanup do libuv no Windows — o upload foi bem-sucedido.
    if (err?.status !== 3221226505) {
      console.error('\n❌ Falha no envio para TestDino');
      process.exit(1);
    }
  }
}

main();
