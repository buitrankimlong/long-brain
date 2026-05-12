---
tags: [learning, github-actions, auto-deploy, vps, pm2, ci-cd]
date: 2026-05-12
project: "[[AI Marketing Sales System]]"
---

# GitHub Actions auto-deploy to VPS with appleboy/ssh-action

## Boi canh
Can tu dong deploy code len Contabo VPS moi khi push len main branch. VPS chay PM2, can git pull + npm install + pm2 reload.

## Giai phap
1. Tao .github/workflows/deploy.yml dung appleboy/ssh-action@v1. 2. Them 2 secrets: VPS_HOST (IP) va VPS_SSH_KEY (private key). 3. Script: cd repo → git pull → npm install --production → pm2 reload → pm2 save. 4. SSH key tren local (~/.ssh/id_ed25519) da duoc copy len VPS authorized_keys nen GitHub Actions dung key do de SSH vao.

## Duc ket
Auto-deploy VPS: (1) appleboy/ssh-action la don gian nhat, (2) can 2 secrets: HOST + SSH_KEY (private key), (3) pm2 reload (khong downtime) thay pm2 restart, (4) pm2 save sau reload de giu process list, (5) deploy mat ~20s.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales System]]
