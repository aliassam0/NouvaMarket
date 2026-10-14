import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucketName: string;
  tokenValue?: string;
}

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const bucketName = process.env.R2_BUCKET_NAME || "nouvamarket";
  const tokenValue = process.env.R2_TOKEN_VALUE || "";

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    endpoint,
    bucketName,
    tokenValue,
  };
}

let cachedS3Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = getR2Config();

  cachedS3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedS3Client;
}

/**
 * Ensures bucket exists or handles bucket check
 */
export async function ensureR2Bucket(): Promise<{ success: boolean; message: string }> {
  const client = getR2Client();
  const config = getR2Config();

  try {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: config.bucketName, MaxKeys: 1 })
    );
    return {
      success: true,
      message: `Cloudflare R2 Bucket '${config.bucketName}' is accessible and active. (Found ${res.KeyCount ?? 0} sample objects)`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Cloudflare R2 Bucket '${config.bucketName}' check error: ${err.message || 'Access error'}`,
    };
  }
}

/**
 * Upload buffer or string to Cloudflare R2
 */
export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{
  success: boolean;
  url: string;
  key: string;
  size: number;
  error?: string;
}> {
  const client = getR2Client();
  const config = getR2Config();

  try {
    let bodyData: Buffer;
    if (typeof params.body === "string") {
      if (params.body.startsWith("data:")) {
        // Base64 Data URL
        const base64Data = params.body.split(",")[1];
        bodyData = Buffer.from(base64Data, "base64");
      } else {
        bodyData = Buffer.from(params.body, "utf-8");
      }
    } else if (Buffer.isBuffer(params.body)) {
      bodyData = params.body;
    } else {
      bodyData = Buffer.from(params.body);
    }

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: params.key,
      Body: bodyData,
      ContentType: params.contentType,
      Metadata: params.metadata,
    });

    await client.send(command);

    // Endpoint URL for S3 client
    const fileUrl = `${config.endpoint}/${config.bucketName}/${params.key}`;

    return {
      success: true,
      url: fileUrl,
      key: params.key,
      size: bodyData.length,
    };
  } catch (error: any) {
    console.error("Cloudflare R2 upload error:", error);
    return {
      success: false,
      url: "",
      key: params.key,
      size: 0,
      error: error.message || "Failed to upload to Cloudflare R2",
    };
  }
}

/**
 * List files in Cloudflare R2
 */
export async function listR2Objects(prefix?: string, maxKeys = 100) {
  const client = getR2Client();
  const config = getR2Config();

  try {
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await client.send(command);
    return {
      success: true,
      files: (response.Contents || []).map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: `${config.endpoint}/${config.bucketName}/${item.Key}`,
      })),
      keyCount: response.KeyCount || 0,
    };
  } catch (error: any) {
    console.error("Cloudflare R2 list error:", error);
    return {
      success: false,
      files: [],
      keyCount: 0,
      error: error.message,
    };
  }
}

/**
 * Delete file from Cloudflare R2
 */
export async function deleteFromR2(key: string) {
  const client = getR2Client();
  const config = getR2Config();

  try {
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await client.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Cloudflare R2 delete error:", error);
    return { success: false, error: error.message };
  }
}
