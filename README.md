# NeoBrutalism Foundry — Permanent Showcase Archive

This repository is the permanent public GitHub Pages home for the NeoBrutalism design-system family.

## Live archive

- Foundry home: https://neobrutalism-shop.github.io/
- NeoBrutal Soft: https://neobrutalism-shop.github.io/soft/
- Soft components: https://neobrutalism-shop.github.io/soft/components.html
- Soft NeoLicenser lab: https://neobrutalism-shop.github.io/soft/demo/v07.html
- NeoBrutal Commerce v1.0: https://neobrutalism-shop.github.io/commerce/
- Commerce components + blocks: https://neobrutalism-shop.github.io/commerce/components.html
- Commerce application lab: https://neobrutalism-shop.github.io/commerce/demo/v10.html

## Source of truth

Design-system source lives in dedicated repositories. This repo stores public showcase snapshots and foundry-level pages.

- Family specification: https://github.com/NeoBrutalism-shop/spec
- NeoBrutal Soft: https://github.com/NeoBrutalism-shop/NeoBrutal-Soft
- NeoBrutal Commerce: https://github.com/NeoBrutalism-shop/NeoBrutal-Commerce
- Foundry archive: https://github.com/NeoBrutalism-shop/neobrutalism-shop.github.io

Soft snapshots are published by `.github/workflows/publish-soft.yml` from an explicit approved source commit and record that commit in `/soft/.source-commit`.

Commerce snapshots are published by `.github/workflows/publish-commerce.yml` from an explicit approved source commit and record that commit in `/commerce/.source-commit`. The v1.0 archive includes the flagship, all production storefront routes, the 47-component explorer, 18 reusable blocks, and the v1.0 application lab.

## Principle

> Compress, never float.

GitHub Pages is the permanent archive. Custom domains may point at production copies later, but the work remains available here independently of DNS or external hosting.
