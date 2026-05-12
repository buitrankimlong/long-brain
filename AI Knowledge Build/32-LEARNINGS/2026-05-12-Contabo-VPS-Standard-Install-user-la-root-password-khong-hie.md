---
tags: [learning, contabo, vps, ssh, vnc, ubuntu]
date: 2026-05-12
project: "[[AI Marketing Sales System]]"
---

# Contabo VPS Standard Install user la root, password khong hien tren VNC

## Boi canh
Sau reinstall Ubuntu 22.04 tren Contabo, SSH timeout 30+ phut. Ping cung timeout. VNC login yeu cau root/password nhung user tuong la ko go duoc vi khong hien ky tu.

## Giai phap
1. SSH timeout do VPS can thoi gian boot (co the 20-30 phut voi Contabo). 2. VNC password khong hien ky tu khi go — day la Linux binh thuong. 3. Standard Install dung root + password da nhap. 4. Sau khi SSH duoc, copy SSH key ngay de khong can password nua.

## Duc ket
Contabo VPS: (1) Sau reinstall doi 15-30 phut moi SSH duoc, (2) VNC password go mu — Linux khong hien ky tu, (3) Standard Install user = root, (4) Cai xong Node/PM2/Redis chi mat 5 phut qua SSH.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales System]]
