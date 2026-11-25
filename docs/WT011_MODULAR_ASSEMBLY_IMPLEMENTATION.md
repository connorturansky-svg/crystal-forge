# WT-011 modular fabrication — active implementation

Owner dispatch 25 November 2026 supersedes the former Codex-only hold in #51. Baseline 6a81f9c55a1d8037080dacc5a66f5a69f828da3b. No automatic merge.

## First checkpoint

An isolated Manifold grid registration engine in src/printing/registered-grid-assembly.js partitions the prepared mesh in original Y-up coordinates, checks cell count, printer size, volume and connected stock, attempts two stock-enveloped matched sockets per neighbouring cell pair, subtracts real cutters and returns separate dowels. It fails the entire registered operation rather than offer incomplete joints. Tests use an actual four-cell solid, check mesh reconstruction, deterministic joints, and reject thin/disconnected stock. No UI/export path is wired yet. Results are candidates until exact-head CI passes.

## Remaining acceptance

- Validate actual cross-sections of both STL and 3MF, negative controls for existing LED, mounting, wire and internal cavities, multi-axis adjacent joints, asymmetrical beds, performance and cleanup.
- Restrict first UI integration to supported Crystal solid plinths; preserve existing plain split and manual single-cut routes. Never silently fall back to unregistered parts if registration was requested. Reuse the authoritative prepared revision and printer dimensions. Reject stale asynchronous results.
- Create individually named printable parts and dowels, matching joint IDs, placement/orientation diagram, real stock and clearance report, assembly manifest, BOM and fit coupon. Keep unregistered geometry explicitly labelled.
- Browser Print workflow: preview, opt-in, cancellation, refusal reason, regeneration, ZIP content and persisted project compatibility. Preserve all seven families; do not enable unsupported native topology by default.
- Physical coupons and Cura inspection remain manual. No strength, child-safety, overhead or printed-fit certification. See #10. If arbitrary topology, automatic connector placement or browser performance prove unreliable, document the measured limitation and hold that capability for a separate targeted task; do not weaken checks to pass.
