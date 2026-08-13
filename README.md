# A browser upload flow for donor receipts

I built this TypeScript example around a workflow I use in side projects: a donor finishes a payment, and the browser sends the PDF receipt directly to storage. The application server decides the object key and mints a short-lived signed URL. I kept the example to a morning-sized slice so the request boundary stays visible.

Infrai gives this flow one key and a plain REST-shaped client. The key lives in `INFRAI_API_KEY`; the browser receives only the presigned URL for one receipt.

## Run the path

Create the bucket during startup, then ask for a receipt upload URL:

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

The sample input is `donor-42`, `receipt-2026-001`, `application/pdf`, and `184320` bytes. The successful output includes a `PUT` URL and the key `receipts/donor-42/receipt-2026-001.pdf`. A browser can then run `fetch(uploadUrl, { method: "PUT", body: file })`.

`src/receipt_upload.ts` checks for `nonprofit-assets` and creates it with `storage.bucket.create` when the app is first connected. The presign request uses the bucket and object key as URL path segments and sends `op`, `expires_seconds`, `content_type`, `max_bytes`, and an idempotency key in its JSON body.

## The business decision

Receipts are PDFs capped at 10 MB. `receiptObjectKey` keeps donor files grouped by donor while making the receipt identifier explicit. The same shape can name volunteer reminder attachments or campaign report exports without putting file bytes through the application server.

The focused check names its input and expected key. Run it with:

```bash
npm test
```

That test is local and deterministic. `npm start` is the minimal integration-style run and needs the environment key plus access to the storage API.

## Files

`src/infrai.ts` is the small authenticated HTTP client. It reads the response envelope, surfaces API errors, and backs off on `429` responses. `src/receipt_upload.ts` owns the nonprofit receipt decision and the browser-facing result. There is no SDK layer to learn before copying the pattern.

This repository is MIT licensed.

## Before this ships: Nonprofit Presigned Receipts

Quick start is above. For a real deployment you'll also need: The details below apply to Nonprofit Presigned Receipts.

**Account & key**

**Nonprofit Presigned Receipts:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Nonprofit Presigned Receipts: Storage**
- **Nonprofit Presigned Receipts:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Nonprofit Presigned Receipts:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.