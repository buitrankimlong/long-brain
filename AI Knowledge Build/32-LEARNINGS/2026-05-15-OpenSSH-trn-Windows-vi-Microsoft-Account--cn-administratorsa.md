---
tags: [learning, windows, ssh, microsoft-account, authorized_keys, openssh, admin]
date: 2026-05-15
project: "[[AI Aissistant Agent]]"
---

# OpenSSH trên Windows với Microsoft Account — cần administrators_authorized_keys

## Boi canh
SSH vào Windows 11 với user là Microsoft Account (admin). Thêm key vào ~/.ssh/authorized_keys không work. Permission denied.

## Giai phap
Admin users trên Windows SSH dùng file khác: C:\ProgramData\ssh\administrators_authorized_keys. Phải set đúng ACL: icacls /inheritance:r /grant "Administrators:F" /grant "SYSTEM:F"

## Duc ket
Windows SSH + Microsoft Account admin → luôn dùng administrators_authorized_keys, không phải ~/.ssh/authorized_keys. Nếu dùng regular user thì mới dùng ~/.ssh/authorized_keys.

## Code mau
```
$adminKeyPath = "C:\ProgramData\ssh\administrators_authorized_keys"
Set-Content $adminKeyPath "ssh-ed25519 AAAA..."
icacls $adminKeyPath /inheritance:r /grant "Administrators:F" /grant "SYSTEM:F"
Restart-Service sshd
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Aissistant Agent]]
