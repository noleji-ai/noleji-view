/**
 * log.md 생성 유틸리티
 * 위키 처리 로그를 기록합니다.
 */

export interface LogEntry {
  operation: 'ingest' | 'query' | 'lint';
  folderName: string;
  filesProcessed: string[];
  entitiesFound: number;
  conceptsFound: number;
  pagesCreated: number;
  processingTime: number;
  errors?: string[];
}

/**
 * 새로운 log.md 항목을 생성합니다.
 * 형식: ## [YYYY-MM-DD] operation | Folder Name
 */
export function generateLogEntry(entry: LogEntry, today: string): string {
  const lines: string[] = [
    `## [${today}] ${entry.operation} | ${entry.folderName}`,
    '',
    `| 항목 | 값 |`,
    `|------|-----|`,
    `| 처리된 파일 | ${entry.filesProcessed.length}개 |`,
    `| 추출된 엔티티 | ${entry.entitiesFound}개 |`,
    `| 추출된 개념 | ${entry.conceptsFound}개 |`,
    `| 생성된 페이지 | ${entry.pagesCreated}개 |`,
    `| 처리 시간 | ${(entry.processingTime / 1000).toFixed(1)}초 |`,
    '',
    '### 처리된 파일',
    ...entry.filesProcessed.map((f) => `- ${f}`),
  ];

  if (entry.errors && entry.errors.length > 0) {
    lines.push('');
    lines.push('### 오류');
    lines.push(...entry.errors.map((e) => `- ${e}`));
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * 완전한 log.md 문서를 생성합니다.
 */
export function buildLogDocument(entries: LogEntry[], today: string): string {
  const header = [
    '---',
    'title: "처리 로그"',
    'type: "log"',
    'tags: ["로그", "처리기록"]',
    'sources: []',
    `created: "${today}"`,
    `updated: "${today}"`,
    'related: []',
    '---',
    '',
    '# 위키 처리 로그',
    '',
  ].join('\n');

  const body = entries.map((e) => generateLogEntry(e, today)).join('\n---\n\n');

  return header + body;
}
