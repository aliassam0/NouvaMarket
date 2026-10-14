/**
 * Client-side utility for interacting with Nouva Market's Cloudflare R2 Storage API
 */

export interface UploadResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  error?: string;
}

export interface R2StorageStatus {
  status: 'connected' | 'error';
  accountId: string;
  bucketName: string;
  endpoint: string;
  message?: string;
  filesCount?: number;
}

/**
 * Upload an image or file to Cloudflare R2
 * @param file File object or Base64 data URL
 * @param folder Subfolder (e.g. 'products', 'receipts', 'stores', 'avatars')
 */
export async function uploadToR2Storage(
  file: File | string,
  folder: 'products' | 'receipts' | 'stores' | 'avatars' | 'docs' = 'products'
): Promise<UploadResult> {
  try {
    let payload: {
      fileName: string;
      contentType: string;
      dataUrl?: string;
      folder: string;
    };

    if (typeof file === 'string') {
      const mimeMatch = file.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const extension = contentType.split('/')[1] || 'jpg';
      const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;

      payload = {
        fileName,
        contentType,
        dataUrl: file,
        folder,
      };
    } else {
      // Convert File to Base64
      const base64 = await fileToBase64(file);
      payload = {
        fileName: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        contentType: file.type || 'application/octet-stream',
        dataUrl: base64,
        folder,
      };
    }

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with status ${response.status}`);
    }

    const result: UploadResult = await response.json();
    return result;
  } catch (err: any) {
    console.error('Upload to Cloudflare R2 failed:', err);
    return {
      success: false,
      url: typeof file === 'string' ? file : '', // fallback to data url
      key: '',
      size: 0,
      error: err.message || 'Failed to upload to Cloudflare R2',
    };
  }
}

/**
 * Check Cloudflare R2 Storage Health & Status
 */
export async function checkR2StorageStatus(): Promise<R2StorageStatus> {
  try {
    const res = await fetch('/api/storage/status');
    if (!res.ok) {
      throw new Error(`Failed to check R2 status: ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: 'error',
      accountId: '0242295015c55a6b819f5bf22954a93e',
      bucketName: 'nouvamarket-files',
      endpoint: 'https://0242295015c55a6b819f5bf22954a93e.r2.cloudflarestorage.com',
      message: err.message,
    };
  }
}

/**
 * Helper to convert browser File to base64 data string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
