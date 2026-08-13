import { infrai } from "./infrai.ts";

const BUCKET = "nonprofit-assets";

export type ReceiptUpload = { donorId: string; receiptId: string; contentType: string; size: number };

export function receiptObjectKey(input: Pick<ReceiptUpload, "donorId" | "receiptId">): string {
  return `receipts/${input.donorId}/${input.receiptId}.pdf`;
}

async function ensureBucket(): Promise<void> {
  try {
    await infrai.storage.bucket.get(BUCKET);
  } catch {
    await infrai.storage.bucket.create({ name: BUCKET });
  }
}

export async function createReceiptUpload(input: ReceiptUpload): Promise<{ key: string; uploadUrl: string; method: "PUT" }> {
  if (input.contentType !== "application/pdf") throw new Error("Receipts must be PDF files.");
  if (input.size <= 0 || input.size > 10_000_000) throw new Error("Receipt size must be between 1 byte and 10 MB.");
  await ensureBucket();
  const key = receiptObjectKey(input);
  const { url } = await infrai.storage.object.presign(BUCKET, key, {
    op: "put",
    expires_seconds: 600,
    content_type: input.contentType,
    max_bytes: input.size,
    idempotency_key: `receipt-${input.receiptId}`
  });
  return { key, uploadUrl: url, method: "PUT" };
}

if (process.argv[1]?.endsWith("receipt_upload.ts")) {
  const result = await createReceiptUpload({ donorId: "donor-42", receiptId: "receipt-2026-001", contentType: "application/pdf", size: 184_320 });
  console.log(JSON.stringify({ ...result, next: "PUT the browser File to uploadUrl" }, null, 2));
}
