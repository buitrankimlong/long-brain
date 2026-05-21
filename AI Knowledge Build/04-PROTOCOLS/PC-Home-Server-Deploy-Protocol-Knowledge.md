---
tags: [home-server, windows, pm2, deploy, automation, self-hosted, 24/7]
description: PC-Home-Server-Deploy-Protocol
created: 2026-05-15
moc: "[[04 Giao Thuc MCP A2A]]"
---
# PC Home Server — Deploy Protocol (Docker + Portainer)

> PC của Long: Windows 11 | Tailscale IP: 100.87.190.39 | SSH User: buitr
> Stack: Docker Engine + Portainer + GitHub Webhooks
> Mục tiêu: Deploy bất kỳ project nào chỉ bằng 1 lệnh/tin nhắn, chạy 24/7

---

## Tại sao Docker + Portainer?

- **Docker**: mỗi project chạy trong container riêng → không conflict dependencies
- **Portainer**: UI web quản lý tất cả container tại `http://100.87.190.39:9000`
- **GitHub webhook → Portainer**: push code → tự động redeploy, không cần SSH
- Mixed stack thoải mái: Python, Node.js, bất kỳ ngôn ngữ nào
- Cộng đồng self-hosted dùng phổ biến nhất 2025

---

## Cài đặt một lần trên PC (qua SSH)

```powershell
# 1. Cài Docker Engine qua WSL2 (không dùng Docker Desktop)
wsl --install -d Ubuntu
# Trong WSL2 Ubuntu:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Hoặc cài Docker Desktop nếu muốn GUI (dễ hơn cho Windows)
winget install Docker.DockerDesktop

# 3. Cài Portainer
docker volume create portainer_data
docker run -d -p 9000:9000 -p 9443:9443 --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# 4. Tạo thư mục projects
mkdir -p C:/openclaw/projects
```

Portainer UI: http://100.87.190.39:9000

---

## Chuẩn project để deploy (mỗi project cần 2 file)

### 1. `Dockerfile`
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

### 2. `docker-compose.yml`
```yaml
version: '3.8'
services:
  app:
    build: .
    container_name: ten-project
    restart: always
    env_file: .env
    volumes:
      - ./data:/app/data
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Quy trình deploy chuẩn (Openclaw tự làm qua SSH)

Khi user nhắn **"deploy [project] lên PC"**:

```bash
# SSH vào PC
ssh buitr@100.87.190.39

# 1. Clone hoặc pull code
cd C:/openclaw/projects
git clone https://github.com/buitrankimlong/[repo] [tên]
# hoặc:
cd [tên] && git pull origin main

# 2. Tạo .env từ template (Openclaw điền giá trị từ Longbrain)
cp .env.example .env

# 3. Build và chạy
docker compose up -d --build

# 4. Verify
docker ps
docker logs [tên] --tail 20
```

Báo về Telegram: "✅ [project] đang chạy trên PC"

---

## Auto-deploy khi push GitHub (setup 1 lần qua Portainer)

1. Mở Portainer → Stack → [project] → Git polling: ON (interval 5 phút)
2. Hoặc dùng webhook: Portainer cấp webhook URL → thêm vào GitHub repo settings
3. Từ đó: `git push` → Portainer tự pull + rebuild + restart

---

## Quản lý services

```bash
docker ps                          # xem tất cả container đang chạy
docker logs [tên] -f               # xem logs realtime
docker restart [tên]               # restart
docker stop [tên]                  # dừng
docker compose down                # dừng và xóa container
docker compose up -d --build       # rebuild và chạy lại
```

Hoặc dùng Portainer UI tại http://100.87.190.39:9000

---

## Projects đang chạy trên PC (cập nhật khi deploy)

| Project | Repo | Container | Status | Port |
|---|---|---|---|---|
| Portainer | - | portainer | ✅ running | 9000 |
| OpenClaw | openclaw (npm) | openclaw | pending | 18789 |
| Tro_ly_kim | Tro_ly_kim | tro-ly-kim | pending | - |

> Cập nhật bảng này sau mỗi lần deploy.

---

## Lưu ý quan trọng

1. **Trước khi deploy**: luôn test API bằng script nhỏ trước
2. **Mỗi project** PHẢI có `Dockerfile` + `docker-compose.yml` + `.env.example`
3. **Logs**: `docker logs [tên] -f` hoặc xem trong Portainer UI
4. **Reboot**: container có `restart: always` → tự start lại khi PC bật
5. **Update code**: `git pull` + `docker compose up -d --build`
6. **Nhiều project**: mỗi cái 1 container riêng, không conflict

---

## SSH vào PC từ laptop/Claude Code

```bash
ssh buitr@100.87.190.39

# Xem logs từ xa
ssh buitr@100.87.190.39 "docker logs tro-ly-kim --tail 50"

# Restart từ xa
ssh buitr@100.87.190.39 "docker restart tro-ly-kim"

# Deploy mới từ xa
ssh buitr@100.87.190.39 "cd C:/openclaw/projects/Tro_ly_kim && git pull && docker compose up -d --build"
```

---

## Thứ tự cài đặt lần đầu

1. ✅ Enable SSH trên PC (đang làm)
2. ⬜ SSH vào PC, cài Docker
3. ⬜ Chạy Portainer container
4. ⬜ Cài Node.js + OpenClaw
5. ⬜ Config OpenClaw (Telegram + v98store)
6. ⬜ Deploy Tro_ly_kim container đầu tiên
7. ⬜ Test end-to-end
