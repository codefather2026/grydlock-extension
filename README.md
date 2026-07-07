# Gryd Lock 🔒

[![License](https://img.shields.io/badge/license-unspecified-lightgrey.svg)]()
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)]()
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178c6?logo=typescript&logoColor=white)]()
[![Status: Early Build](https://img.shields.io/badge/status-early%20build-orange)]()

**The Gryd Lock browser extension — catches a Stellar transaction before signing and warns the user if the destination looks fraudulent.**

## Overview

This is the product. It runs entirely in the user's browser. It hooks the wallet signing flow, decodes the pending transaction, requests a risk score for the destination, and renders a four-tier warning. It never blocks — it warns, and the user decides.

> **Status:** Early build. The popup renders the oracle adapter's score across all four warning tiers (stub score). Real signing interception and a live score connection are **not yet built** — see the roadmap.

## What it does

```
User initiates a transaction in a Stellar wallet
        │
        ▼
Extension intercepts the unsigned transaction (Freighter signing flow)
        │
        ▼
Decode the transaction XDR → extract destination address / asset
        │
        ▼
Request a 0–100 risk score  (via grydlock-oracle-adapter)
        │
        ▼
Map the score to a warning tier → show the warning
        │
        ▼
User proceeds or cancels — the extension never blocks
```

### Warning tiers

| Score  | Tier     | Behaviour                                |
| ------ | -------- | ----------------------------------------- |
| 0–20   | Low      | Green indicator, proceed                  |
| 21–50  | Elevated | Soft warning                              |
| 51–75  | High     | Strong warning, require explicit confirm  |
| 76–100 | Critical | Recommend abort, explain why              |

## Why Freighter First

Stellar has no universal injected wallet provider — each wallet exposes its own signing API, so interception is per-wallet, not global. Gryd Lock targets **Freighter** first (the most widely used browser wallet), proves the interception pattern, then generalises to xBull, Albedo, and Lobstr.

## Tech Stack

- **TypeScript** — extension logic
- **React** — warning UI in the popup
- **Stellar SDK (JS)** — decoding the unsigned transaction
- **Manifest V3** — Chrome / Brave / Edge extension format

The risk score itself is fetched through [`grydlock-oracle-adapter`](../grydlock-oracle-adapter); this repo holds no scoring logic.

## Project Layout (target)

```
grydlock-extension/
├── manifest.json          # MV3, popup + (later) content script
├── src/
│   ├── popup/             # React warning UI + tier logic
│   ├── intercept/         # Freighter signing proxy  (phase 2)
│   └── decode/            # XDR → destination extraction  (phase 2)
└── README.md
```

## Develop

1. Build the extension (or use the plain popup stub during early work).
2. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, select the build output.
3. Open the popup. During early work the score is hardcoded; drag the dev control to see all four tiers.

## Roadmap

- [x] Popup renders one score across the four tiers. _(stub)_
- [x] Fetch the score through the oracle adapter (stub score) — prove the query path end to end.
- [ ] Freighter interception: proxy `signTransaction`, decode the XDR, extract the destination, route it through the adapter.
- [ ] Swap the stub score for a live one from the adapter.
- [ ] Generalise interception beyond Freighter.

> **Do not build real interception until the adapter returns a real score.** Interception without a working score source is a warning with nothing to warn about.
