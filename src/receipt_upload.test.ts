import assert from "node:assert/strict";
import { receiptObjectKey } from "./receipt_upload.ts";

const input = { donorId: "donor-42", receiptId: "receipt-2026-001" };
assert.equal(receiptObjectKey(input), "receipts/donor-42/receipt-2026-001.pdf");
console.log("receipt key decision passed");
