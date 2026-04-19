import { ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

export function registerFileHandlers(): void {
  ipcMain.handle('file:read', async (_event, filePath: string): Promise<string> => {
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle('file:write', async (_event, filePath: string, content: string): Promise<string> => {
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  });

  ipcMain.handle('file:save', async (_event, fileName: string, content: string): Promise<string | null> => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: path.basename(fileName),
      filters: [
        { name: 'HTML Documents', extensions: ['html', 'htm'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (canceled || !filePath) return null;
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  });
}
