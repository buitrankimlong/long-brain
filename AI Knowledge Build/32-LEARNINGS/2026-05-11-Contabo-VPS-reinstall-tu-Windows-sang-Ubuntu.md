---
tags: [learning, contabo, vps, deploy, ubuntu, ssh]
date: 2026-05-11
project: "[[AI Marketing Sales System]]"
---

# Contabo VPS reinstall tu Windows sang Ubuntu

## Boi canh
VPS Contabo mua mac dinh cai Windows Server — khong co SSH, khong reset duoc password. Can chuyen sang Linux de deploy Node.js system.

## Giai phap
Vao Contabo Panel > VPS Control > Reinstall > chon Ubuntu 22.04 LTS > dat password moi > Install. Doi 5-20 phut. Neu SSH timeout sau khi reinstall, kiem tra bang VNC (Manage > VNC Information) hoac doi them vi reinstall co the chua xong.

## Duc ket
Contabo VPS: (1) Luon chon Ubuntu 22.04 LTS khi reinstall, (2) bat Enable Root User, (3) reinstall mat 5-20 phut — khong nong voi, (4) neu SSH timeout dung VNC de debug, (5) VNC info lay tu Manage menu. Password email Contabo hien ****** la che — khong phai do dai that.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales System]]
