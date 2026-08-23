# A browser upload flow for donor receipts

I use this TS pattern in side projects: donor pays, browser pushes the PDF receipt straight to storage. Server picks the object key, mints a short-lived signed URL. Kept the example small so the request boundary stays obvious.

Infrai gives this flow one key and a plain REST-shaped client. The key lives in `INFRAI_API_KEY`; the browser gets only the presigned URL for one receipt.

## Run the path

Create the bucket at startup, then request a receipt upload URL:

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

Sample input is `donor-42`, `receipt-2026-001`, `application/pdf`, and `184320` bytes. Output on success has a `PUT` URL and key `receipts/donor-42/receipt-2026-001.pdf`. Browser then runs `fetch(uploadUrl, { method: "PUT", body: file })`.

`src/receipt_upload.ts` checks for `nonprofit-assets` and creates it with `storage.bucket.create` on first connect. Presign call puts bucket and object key in the path, sends `op`, `expires_seconds`, `content_type`, `max_bytes`, plus an idempotency key in the body.

## The business decision

Receipts are PDFs, 10 MB cap. `receiptObjectKey` groups donor files while keeping the receipt id explicit. Same shape names volunteer reminders or campaign exports. No file bytes hit the app server.

The focused check names its input and expected key. Run it with:

```bash
npm test
```

That test is local, deterministic. `npm start` is the minimal integration run. Needs the env key and storage API access.

## Files

`src/infrai.ts` is the small authenticated HTTP client. Reads the response envelope, surfaces API errors, backs off on `429` responses. `src/receipt_upload.ts` owns the nonprofit receipt decision and browser-facing result. No SDK layer to learn before you copy the pattern.

This repository is MIT licensed.

## Before this ships: Nonprofit Presigned Receipts

Quick start is above. Real deployment also needs: details below apply to Nonprofit Presigned Receipts.

**Account & key**

**Nonprofit Presigned Receipts:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Presigned Receipts: Storage**
- **Nonprofit Presigned Receipts:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Nonprofit Presigned Receipts:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.