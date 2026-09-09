/**
 * STUB — NOT WIRED UP. Do not require() this from app.js or server.js.
 *
 * This documents the exact contract for fulfilling a Bux purchase, so it can
 * be turned into a real route later without re-deriving the shape from the
 * client SDK's docs again. The client (client/src/systems/bloxity.js,
 * client/src/components/BuxShop.jsx) already calls
 * `Legion.SDK.bux.requestPurchase(sku)` and shows a plain confirmation on
 * success - it never grants anything itself, because a client-reported
 * "success" cannot be trusted to fulfil a real-money purchase. Fulfillment
 * has to happen here, server-to-server, once this is actually built.
 *
 * Route (future):     POST /webhooks/bloxity/bux
 * Header:             x-legion-webhook-secret: <shared secret>
 *                     - verify with a timing-safe compare (crypto.timingSafeEqual),
 *                       never `===`, so response timing can't leak the secret.
 * Body (JSON):
 *   {
 *     "transactionId": string,   // idempotency key - see step 2 below
 *     "userId": string,          // the Bloxity user who paid
 *     "username": string,
 *     "gameSlug": string,        // must match this game's own registered slug
 *     "sku": string,             // one of client/src/data/buxSkus.js's ids
 *     "productName": string,
 *     "productPrice": number,
 *     "metadata": object,        // whatever requestPurchase()'s caller passed
 *     "timestamp": string        // ISO 8601
 *   }
 *
 * MUST return a 2xx status. Anything else (including a timeout) causes
 * Bloxity to auto-refund the Bux the player spent - so this must not return
 * 2xx until the purchase has actually been fulfilled, and must not hang.
 *
 * Once implemented, this handler needs to, in order:
 *   1. Verify `x-legion-webhook-secret` against an env-configured shared
 *      secret (e.g. `process.env.BLOXITY_WEBHOOK_SECRET` - this server
 *      already loads `.env` via `dotenv`, see server/src/server.js).
 *   2. De-dupe on `transactionId` - a retried webhook delivery must not grant
 *      the item twice. No transaction ledger/DB exists in this repo yet;
 *      this needs one (even a flat JSON file would do for a first pass).
 *   3. Apply whatever effect `sku` maps to, for `userId`'s save. This game's
 *      saves live in the *client's* localStorage today (see
 *      client/src/systems/persistence.js) with no server-side per-user
 *      record at all - granting a server-fulfilled item into a client-only
 *      save is its own design problem, not solved by this stub.
 *   4. Only then respond 2xx.
 *
 * function verifyAndFulfill(req, res) {
 *   // not implemented this pass
 * }
 *
 * module.exports = { verifyAndFulfill }
 */
