import { app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const PROMPTED_KEY = 'file-association-prompted';

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'app-config.json');
}

function readConfig(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), 'utf-8'));
  } catch {
    return {};
  }
}

function writeConfig(config: Record<string, unknown>): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}

export async function showFileAssociationPrompt(mainWindow: BrowserWindow): Promise<void> {
  const config = readConfig();
  if (config[PROMPTED_KEY]) return;

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['기본 프로그램으로 설정', '나중에'],
    defaultId: 0,
    cancelId: 1,
    title: 'docwise 파일 연결',
    message: 'docwise를 .md, .html 파일의 기본 프로그램으로 설정하시겠습니까?',
    detail: '.md 및 .html 파일을 더블클릭하거나 우클릭 시 docwise 뷰어로 열 수 있습니다.\n이 설정은 시스템 환경설정에서 변경할 수 있습니다.',
  });

  if (result.response === 0) {
    // Register as default handler
    // On macOS, electron-builder's fileAssociations in Info.plist handles the "Open With" menu.
    // For setting as DEFAULT, we can use app.setAsDefaultProtocolClient or guide the user.
    // The fileAssociations in the build config already registers docwise in "Open With".
    // To fully set as default on macOS, user needs to: right-click file > Get Info > Open With > Change All
    // Show a helpful dialog explaining this:
    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['확인'],
      title: '기본 프로그램 설정 안내',
      message: 'docwise가 파일 연결 프로그램으로 등록되었습니다.',
      detail: '모든 .md 파일의 기본 프로그램으로 설정하려면:\n\n1. Finder에서 .md 파일을 우클릭\n2. "정보 가져오기" 선택\n3. "다음으로 열기"에서 docwise 선택\n4. "모두 변경..." 클릭\n\n.html 파일도 같은 방법으로 설정할 수 있습니다.',
    });
  }

  config[PROMPTED_KEY] = true;
  writeConfig(config);
}
