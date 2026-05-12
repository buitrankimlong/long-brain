---
tags: [vps, deploy, ubuntu, nodejs, pm2, redis, ngrok, contabo, github-actions]
description: VPS-Deploy-Ubuntu-Setup
created: 2026-05-12
moc: "[[07 Marketing Tu Dong]]"
---

# VPS Deploy Guide — Ubuntu Setup tu zero den production

## 1. Mua VPS
- Contabo Cloud VPS 10 NVMe: 4 vCPU, 8GB RAM, 80GB NVMe, Singapore
- Chon Ubuntu 22.04 LTS khi reinstall
- Doi 15-30 phut sau khi reinstall moi SSH duoc

## 2. SSH Key Setup
```bash
# Tao key tren local (1 lan)
ssh-keygen -t ed25519 -C "deploy@myproject" -f ~/.ssh/id_ed25519 -N ""

# Copy len VPS
cat ~/.ssh/id_ed25519.pub | ssh root@<IP> "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

## 3. Cai packages (chay qua SSH)
```bash
# Update
apt update -y && apt upgrade -y

# Tools
apt install -y curl git build-essential

# Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && apt install -y nodejs

# PM2
npm install -g pm2
pm2 startup systemd -u root --hp /root

# Redis
apt install -y redis-server && systemctl enable redis-server && systemctl start redis-server

# ngrok
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | tee /etc/apt/sources.list.d/ngrok.list
apt update -qq && apt install -y ngrok
ngrok config add-authtoken <TOKEN>
```

## 4. Clone code
```bash
# Tao SSH key tren VPS cho GitHub
ssh-keygen -t ed25519 -C "vps-deploy" -f /root/.ssh/id_ed25519 -N ""
cat /root/.ssh/id_ed25519.pub
# → Add key nay vao GitHub Settings > SSH keys

# Clone
git clone git@github.com:<USER>/<REPO>.git

# Copy .env tu local
cat local/.env | ssh root@<IP> "cat > /root/<REPO>/.env"

# Install
cd /root/<REPO> && npm install
```

## 5. Start PM2
```bash
pm2 start ecosystem.config.js
pm2 save  # luu de auto-restore khi reboot
```

## 6. GitHub Actions Auto-deploy
```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /root/Abuss
            git pull origin main
            npm install --production
            pm2 reload ecosystem.config.js
```

## 7. Luu y quan trong
- Contabo email che password bang ****** — khong phai do dai that
- VNC password go KHONG HIEN ky tu — Linux binh thuong
- Standard Installation: user = root
- Sau reinstall doi 15-30 phut moi SSH duoc
- Luon copy SSH key ngay de khong can password
- PM2 startup + pm2 save = auto-restore khi VPS reboot

## 8. Lenh thuong dung
- `pm2 ls` — xem processes
- `pm2 logs <name>` — xem log
- `pm2 reload ecosystem.config.js` — reload
- `redis-cli ping` — test Redis
- `htop` — monitor CPU/RAM
- `df -h` — disk usage



## Update 2026-05-12: Deploy thanh cong

### Thong tin VPS thuc te
- IP: 46.250.225.12 (Contabo Singapore)
- OS: Ubuntu 22.04.5 LTS, 8GB RAM, 73GB disk
- Node.js 24.15.0, PM2 7.0.1, Redis 6.0.16, ngrok 3.39.1
- Repo: /root/Abuss (GitHub: tom-bdm/Abuss)
- ngrok tunnel: https://registry-pyramid-cornflake.ngrok-free.dev → :3000

### PM2 Processes Online
- ngrok, webhook-server, thuymac-sales, menhly-sales, thaivangoc-sales, thuymac-bg-watcher
- Marketing/followup/analytics/report = cron jobs (stopped la binh thuong)

### GitHub Actions Auto-deploy
- File: .github/workflows/deploy.yml
- appleboy/ssh-action@v1
- Secrets: VPS_HOST, VPS_SSH_KEY
- Push main → deploy 21 giay
