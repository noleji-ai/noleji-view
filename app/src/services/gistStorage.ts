/**
 * GitHub Gist storage for docwise permanent links
 * Uses secret gists (not listed publicly, but accessible via URL)
 */

const GITHUB_API = 'https://api.github.com';

export function getGithubToken(): string | null {
  return localStorage.getItem('docwise-github-token');
}

export function setGithubToken(token: string): void {
  localStorage.setItem('docwise-github-token', token);
}

export function removeGithubToken(): void {
  localStorage.removeItem('docwise-github-token');
}

export async function publishToGist(
  html: string,
  title: string,
  token: string,
): Promise<string> {
  const response = await fetch(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description: `docwise — ${title}`,
      public: false,
      files: {
        [`docwise-${Date.now().toString(36)}.html`]: {
          content: html,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gist 생성 실패: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.id as string;
}

export async function loadFromGist(gistId: string): Promise<string> {
  const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: {
      'Accept': 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Gist 로드 실패: ${response.status}`);
  }

  const data = await response.json();
  const files = data.files as Record<string, { content: string }>;
  const firstFile = Object.values(files)[0];
  if (!firstFile) {
    throw new Error('Gist에 파일이 없습니다.');
  }
  return firstFile.content;
}
