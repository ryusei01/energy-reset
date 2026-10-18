import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportSnapshot, replaceFromBackup } from '../db/database';
import { parseBackup, type BackupPayload } from './backup';

export async function shareBackup() {
  const payload = await exportSnapshot();
  const file = new File(Paths.cache, 'energy-reset-backup.json');
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload));
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'バックアップを共有' });
}

export async function pickBackup(): Promise<BackupPayload | null | 'invalid'> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return 'invalid';
  const text = await new File(asset.uri).text();
  const payload = parseBackup(text);
  return payload ?? 'invalid';
}

export async function restoreBackup(payload: BackupPayload) {
  await replaceFromBackup(payload);
}
