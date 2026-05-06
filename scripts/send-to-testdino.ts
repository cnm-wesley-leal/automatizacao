import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

/**
 * Script para enviar resultados de testes Playwright para TestDino
 * 
 * Uso: 
 *   npx ts-node scripts/send-to-testdino.ts
 * 
 * Requer variáveis de ambiente:
 *   - TESTDINO_URL: URL da plataforma TestDino
 *   - TESTDINO_API_KEY: Chave de autenticação
 *   - TESTDINO_PROJECT_ID: ID do projeto no TestDino
 */

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface ReportPayload {
  project_id: string;
  test_suite: string;
  execution_date: string;
  environment: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  browser: string;
  base_url: string;
}

async function parsePlaywrightResults(): Promise<TestResult[]> {
  const jsonReportPath = path.join(process.cwd(), 'playwright-results.json');
  const resultsDir = path.join(process.cwd(), 'test-results');
  const results: TestResult[] = [];

  // Prefer JSON reporter output when available.
  if (fs.existsSync(jsonReportPath)) {
    try {
      const rawBuffer = fs.readFileSync(jsonReportPath);
      const raw =
        rawBuffer.length >= 2 && rawBuffer[0] === 0xff && rawBuffer[1] === 0xfe
          ? rawBuffer.toString('utf16le')
          : rawBuffer.toString('utf8');
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      const normalized =
        firstBrace >= 0 && lastBrace > firstBrace ? raw.slice(firstBrace, lastBrace + 1) : raw;
      const report = JSON.parse(normalized) as any;

      const visitSuite = (suite: any, parents: string[]) => {
        const suiteTitle = suite?.title ? [...parents, String(suite.title)] : parents;

        if (Array.isArray(suite?.specs)) {
          for (const spec of suite.specs) {
            const fullTitle = [...suiteTitle, String(spec.title || '')].filter(Boolean).join(' > ');
            const tests = Array.isArray(spec.tests) ? spec.tests : [];

            for (const test of tests) {
              const testResults = Array.isArray(test.results) ? test.results : [];
              const lastResult = testResults[testResults.length - 1] || {};
              const status = String(lastResult.status || test.outcome || 'skipped');

              results.push({
                title: fullTitle || String(test.title || 'Unnamed test'),
                status:
                  status === 'passed'
                    ? 'passed'
                    : status === 'failed' || status === 'timedOut' || status === 'interrupted'
                      ? 'failed'
                      : 'skipped',
                duration: Number(lastResult.duration || 0),
                error: lastResult?.error?.message || undefined,
              });
            }
          }
        }

        if (Array.isArray(suite?.suites)) {
          for (const child of suite.suites) {
            visitSuite(child, suiteTitle);
          }
        }
      };

      if (Array.isArray(report?.suites)) {
        for (const suite of report.suites) {
          visitSuite(suite, []);
        }
      }

      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn('⚠️  Falha ao parsear playwright-results.json, tentando fallback:', error);
    }
  }

  try {
    // Ler diretório de resultados
    const files = fs.readdirSync(resultsDir);
    
    for (const file of files) {
      const filePath = path.join(resultsDir, file, 'test-finished.json');
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const testData = JSON.parse(content);
        
        results.push({
          title: testData.title || file,
          status: testData.status || 'skipped',
          duration: testData.duration || 0,
          error: testData.error?.message,
        });
      }
    }
  } catch (error) {
    console.warn('⚠️  Não foi possível ler resultados do Playwright:', error);
  }

  return results;
}

async function sendToTestDino(payload: ReportPayload): Promise<void> {
  const testdinoUrl = process.env.TESTDINO_URL || 'https://app.testdino.com';
  const apiKey = process.env.TESTDINO_API_KEY;
  const projectId = process.env.TESTDINO_PROJECT_ID;

  if (!apiKey || !projectId) {
    console.error('❌ Variáveis de ambiente não configuradas:');
    console.error('   ✅ TESTDINO_URL: ' + testdinoUrl);
    console.error('   ❌ TESTDINO_API_KEY: (não definida)');
    console.error('   ✅ TESTDINO_PROJECT_ID: ' + projectId);
    console.error('\n📋 Como configurar:');
    console.error('   1. Copiar .env.example para .env');
    console.error('   2. Adicionar API Key no .env');
    console.error('   3. Executar: npm run testdino:report\n');
    process.exit(1);
  }

  try {
    console.log('📤 Enviando relatório para TestDino...');
    console.log(`   URL: ${testdinoUrl}`);
    console.log(`   Projeto: ${projectId}`);
    console.log(`   Org: ${process.env.TESTDINO_ORG_ID || 'default'}`);
    console.log(`   Testes: ${payload.total_tests} (${payload.passed}✅ ${payload.failed}❌ ${payload.skipped}⏭️)`);

    const endpointCandidates = [
      `${testdinoUrl}/api/v1/projects/${projectId}/test-results`,
      `${testdinoUrl}/api/v1/projects/${projectId}/test-runs`,
      `${testdinoUrl}/api/projects/${projectId}/test-runs`,
    ];

    const headerCandidates: Record<string, string>[] = [
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
      },
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      {
        'Content-Type': 'application/json',
        'Authorization': `Token ${apiKey}`,
      },
    ];

    let lastError = 'No endpoint attempted';
    let result: any = null;
    let successfulEndpoint = '';

    for (const endpoint of endpointCandidates) {
      for (const headers of headerCandidates) {
        const authKind = headers.Authorization
          ? headers.Authorization.split(' ')[0]
          : headers['X-API-Key']
            ? 'X-API-Key'
            : 'unknown';

        console.log(`\n   Tentativa: ${endpoint} [auth=${authKind}]`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          successfulEndpoint = endpoint;
          result = await response.json().catch(() => ({}));
          break;
        }

        const errorText = await response.text().catch(() => '');
        lastError = `HTTP ${response.status}: ${response.statusText} ${errorText}`;
      }

      if (result) {
        break;
      }
    }

    if (!result) {
      throw new Error(lastError);
    }

    console.log('✅ Relatório enviado com sucesso!');
    console.log(`   Endpoint aceito: ${successfulEndpoint}`);
    console.log(`   ID do Relatório: ${result.id || result.report_id}`);
    const orgId = process.env.TESTDINO_ORG_ID || '';
    console.log(`   Link: ${testdinoUrl}/${orgId}/projects/${projectId}/test-runs/${result.id || result.report_id}`);
  } catch (error) {
    console.error('❌ Erro ao enviar para TestDino:', error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Conectando com TestDino...\n');

  // Parsear resultados do Playwright
  const results = await parsePlaywrightResults();

  if (results.length === 0) {
    console.error('❌ Nenhum resultado de teste encontrado');
    console.error('   Execute "npm test" primeiro');
    process.exit(1);
  }

  // Calcular estatísticas
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  // Preparar payload
  const payload: ReportPayload = {
    project_id: process.env.TESTDINO_PROJECT_ID || 'default',
    test_suite: 'Chaves na Mão - Login e Cadastro',
    execution_date: new Date().toISOString(),
    environment: 'staging',
    total_tests: total,
    passed,
    failed,
    skipped,
    duration,
    results,
    browser: 'chromium',
    base_url: process.env.BASE_URL || 'https://staging.chavesnamao.com.br',
  };

  // Enviar para TestDino
  await sendToTestDino(payload);

  console.log('\n✨ Integração com TestDino concluída!');
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
