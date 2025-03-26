import { readFileSync, writeFileSync } from 'fs';

/**
 * テスト結果をマークダウン形式に整形する
 */
function formatTestResults() {
  const testTypes = ['crud', 'rls', 'constraints'];
  let allResults = [];
  let overallStatus = '✅ 成功';

  // 各テストの結果を読み込む
  testTypes.forEach(type => {
    try {
      const rawOutput = readFileSync(`test_results/${type}.txt`, 'utf8');
      const resultJson = JSON.parse(readFileSync(`test_results/${type}.txt.json`, 'utf8'));
      
      // 複数のエラー結果がある場合
      if (resultJson.results) {
        const status = resultJson.results.some(r => r.status === 'failure') ? '❌' : '✅';
        overallStatus = resultJson.results.some(r => r.status === 'failure') ? '❌ 失敗' : overallStatus;

        // 各エラー結果の詳細を整形
        const details = resultJson.results.map(result => {
          if (result.type === 'expected_error') {
            return `\n> ✅ 期待されたエラー ${result.error_code} を検出`;
          } else if (result.type === 'wrong_error') {
            return `\n> ❌ 期待されたエラー ${result.expected} が発生しませんでした`;
          }
          return '';
        }).join('\n');

        allResults.push({
          type: type,
          status: status,
          output: rawOutput,
          details: details
        });
      } else {
        // 単一の結果の場合（以前の形式）
        const status = resultJson.status === 'success' ? '✅' : '❌';
        overallStatus = resultJson.status === 'failure' ? '❌ 失敗' : overallStatus;

        let details = '';
        if (resultJson.type === 'expected_error') {
          details = `\n> 期待されたエラー ${resultJson.error_code} を検出`;
        } else if (resultJson.type === 'wrong_error') {
          details = `\n> ❌ 期待されたエラー ${resultJson.expected} が発生しませんでした`;
        } else if (resultJson.type === 'unexpected_error') {
          details = `\n> ❌ 予期せぬエラー: ${resultJson.message}`;
        }

        allResults.push({
          type: type,
          status: status,
          output: rawOutput,
          details: details
        });
      }
    } catch (error) {
      console.error(`Error reading test results for ${type}:`, error);
      overallStatus = '❌ 失敗';
      allResults.push({
        type: type,
        status: '❌',
        output: 'テスト結果の読み込みに失敗しました',
        details: `\n> エラー: ${error.message}`
      });
    }
  });

  // マークダウン形式でコメントを作成
  const markdown = `## データベーステスト結果 🔍

**テスト結果: ${overallStatus}**

${allResults.map(result => `
### ${result.status} ${result.type.toUpperCase()}テスト
\`\`\`sql
${result.output}
\`\`\`
${result.details}
`).join('\n')}

${overallStatus === '❌ 失敗' ? '\n⚠️ 一部のテストが失敗しました。ログを確認してください。' : ''}`;

  return markdown;
}

// テスト結果を整形してファイルに出力
const markdown = formatTestResults();
writeFileSync('test_results/formatted_results.md', markdown);

// GitHub Actionsで使用する場合は、process.envを通じて結果を渡す
if (process.env.GITHUB_ACTIONS) {
  console.log('::set-output name=formatted_results::' + markdown.replace(/\n/g, '%0A'));
} 