import * as fs from 'fs/promises';
import * as path from 'path';

export async function deleteAttachments(input: { url: string }[] | { url: string }) {
  const attachments = Array.isArray(input) ? input : [input];
  const deletePromises = attachments.map(async (attachment) => {
    const filePath = path.join('.', attachment.url);
    try {
      await fs.unlink(filePath); // 刪除附件檔案
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error.message);
    }
  });

  await Promise.all(deletePromises); // 並行刪除所有附件
}
