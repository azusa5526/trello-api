import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'node:path';
import * as sharp from 'sharp';

const MAX_SIZE = 1024 * 1024;
const MAX_WIDTH = 2160;
const MIN_QUALITY = 10;
const MAX_QUALITY = 80;

@Injectable()
export class SharpPipe
  implements
    PipeTransform<
      Express.Multer.File | Express.Multer.File[],
      Promise<Express.Multer.File | Express.Multer.File[]>
    >
{
  async transform(
    fileOrFiles: Express.Multer.File | Express.Multer.File[],
  ): Promise<Express.Multer.File | Express.Multer.File[]> {
    if (Array.isArray(fileOrFiles)) {
      return Promise.all(fileOrFiles.map((file) => this.processFile(file)));
    } else {
      return this.processFile(fileOrFiles);
    }
  }

  private async processFile(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (file.mimetype.startsWith('image/')) {
      return await compressImage(file);
    }
    return file;
  }
}

// 定義遞迴壓縮圖片的處理函數
async function compressImage(file: Express.Multer.File, quality = MAX_QUALITY) {
  const image = sharp(file.buffer);
  const metadata = await image.metadata();

  if (metadata.width && metadata.width <= MAX_WIDTH && file.size <= MAX_SIZE) {
    // 如果寬度小於等於 2160px 且檔案大小小於等於 1MB，直接回傳圖片
    return file;
  }

  // 如果圖片需要壓縮和尺寸調整，使用遞迴來處理
  const buffer = await recursiveCompress(image, quality);
  // 重建 Multer 檔案物件
  const compressedFile: Express.Multer.File = {
    ...file, // 繼承原檔案的其他屬性
    buffer, // 使用壓縮後的 buffer
    size: buffer.length, // 更新檔案大小
    mimetype: 'image/jpeg', // 強制使用 jpeg 類型
    filename: path.basename(file.originalname) + path.extname(file.originalname),
  };
  return compressedFile;
}

// 遞迴壓縮函數，使用 Buffer 計算大小
async function recursiveCompress(image: sharp.Sharp, quality: number): Promise<Buffer> {
  try {
    // 壓縮圖片並轉換成 buffer
    const buffer = await image
      .resize({
        width: MAX_WIDTH,
      })
      .jpeg({
        quality: quality,
        progressive: true,
        chromaSubsampling: '4:4:4',
      })
      .toBuffer();

    const bufferSize = Buffer.byteLength(buffer);

    // 如果檔案大小仍然超過 1MB，並且品質還可以降低，則遞迴
    if (bufferSize > MAX_SIZE && quality > MIN_QUALITY) {
      console.log(`File is too large (${bufferSize} bytes), reducing quality to ${quality - 10}`);
      return await recursiveCompress(image, quality - 10); // 遞迴降低品質
    } else {
      // 如果符合條件或已經到達最低品質，將壓縮後的 buffer 寫入到最終路徑
      console.log(`Compressed to ${bufferSize} bytes with quality ${quality}`);
      return buffer;
    }
  } catch (error) {
    console.error(`Error in recursive compress`, error);
    throw new BadRequestException('Validation failed');
  }
}
