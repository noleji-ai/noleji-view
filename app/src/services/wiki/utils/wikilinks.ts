/**
 * 위키링크 [[...]] 파싱 및 관리 유틸리티
 */

const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

/**
 * 마크다운 텍스트에서 모든 [[위키링크]]를 추출합니다.
 * @returns 위키링크 대상 이름 배열 (중복 제거)
 */
export function parseWikilinks(markdown: string): string[] {
  const links: Set<string> = new Set();
  let match: RegExpExecArray | null;

  // Reset regex state
  WIKILINK_REGEX.lastIndex = 0;

  while ((match = WIKILINK_REGEX.exec(markdown)) !== null) {
    const linkTarget = match[1].trim();
    if (linkTarget) {
      links.add(linkTarget);
    }
  }

  return Array.from(links);
}

/**
 * 위키링크 대상 이름을 페이지 ID로 변환합니다.
 * ID는 소문자 + 하이픈 형태로 정규화됩니다.
 */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 페이지 ID 맵을 사용하여 위키링크를 확인하고,
 * 존재하는 링크/깨진 링크를 분류합니다.
 */
export function resolveWikilinks(
  markdown: string,
  pageIdMap: Map<string, string>,
): { resolved: string[]; broken: string[] } {
  const links = parseWikilinks(markdown);
  const resolved: string[] = [];
  const broken: string[] = [];

  for (const link of links) {
    const id = nameToId(link);
    if (pageIdMap.has(id) || pageIdMap.has(link)) {
      resolved.push(link);
    } else {
      broken.push(link);
    }
  }

  return { resolved, broken };
}

/**
 * 페이지별 인링크/아웃링크 수를 계산합니다.
 */
export function countLinks(
  pages: Array<{ id: string; title: string; content: string }>,
): Map<string, { incoming: number; outgoing: number }> {
  const stats = new Map<string, { incoming: number; outgoing: number }>();

  // Initialize
  for (const page of pages) {
    stats.set(page.title, { incoming: 0, outgoing: 0 });
  }

  const titleSet = new Set(pages.map((p) => p.title));

  // Count
  for (const page of pages) {
    const links = parseWikilinks(page.content);
    const uniqueOutgoing = links.filter((l) => titleSet.has(l));

    const stat = stats.get(page.title)!;
    stat.outgoing = uniqueOutgoing.length;

    for (const link of uniqueOutgoing) {
      const targetStat = stats.get(link);
      if (targetStat) {
        targetStat.incoming += 1;
      }
    }
  }

  return stats;
}
