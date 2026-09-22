import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const FOLDER = "quasaraiseo/profile-pictures";
const URL_TTL_SECONDS = 60 * 60;

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function bucket() {
  const name = process.env.S3_BUCKET;
  if (!name || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Profile photo storage is not configured.");
  }
  return name;
}

function client() {
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

function userPrefix(userId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    throw new Error("Invalid account.");
  }
  return `${FOLDER}/${userId}/`;
}

export async function saveProfileAvatar(userId: string, body: Buffer, contentType: string) {
  const ext = TYPES[contentType];
  if (!ext) throw new Error("Use a JPG, PNG, WEBP, or GIF image.");
  if (body.length === 0 || body.length > PROFILE_AVATAR_MAX_BYTES) {
    throw new Error("Image must be under 2 MB.");
  }

  const prefix = userPrefix(userId);
  const key = `${prefix}avatar.${ext}`;
  const s3 = client();
  const Bucket = bucket();

  const existing = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix }));
  for (const item of existing.Contents ?? []) {
    if (item.Key && item.Key.startsWith(prefix) && item.Key !== key) {
      await s3.send(new DeleteObjectCommand({ Bucket, Key: item.Key }));
    }
  }

  await s3.send(new PutObjectCommand({
    Bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return signAvatar(userId);
}

export async function signAvatar(userId: string) {
  const prefix = userPrefix(userId);
  const s3 = client();
  const Bucket = bucket();
  const listed = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix, MaxKeys: 5 }));
  const key = listed.Contents?.find((item) => item.Key?.includes("/avatar."))?.Key;
  if (!key || !key.startsWith(prefix)) return null;

  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: URL_TTL_SECONDS });
  return url;
}

export async function deleteProfileAvatar(userId: string) {
  const prefix = userPrefix(userId);
  const s3 = client();
  const Bucket = bucket();
  const listed = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix }));
  for (const item of listed.Contents ?? []) {
    if (item.Key && item.Key.startsWith(prefix)) {
      await s3.send(new DeleteObjectCommand({ Bucket, Key: item.Key }));
    }
  }
}
