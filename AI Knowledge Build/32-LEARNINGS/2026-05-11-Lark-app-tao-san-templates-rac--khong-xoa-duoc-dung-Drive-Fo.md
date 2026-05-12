---
tags: [learning, lark, drive, folder, wiki, permission, cleanup, gotcha]
date: 2026-05-11
project: "[[Thuy Mac AI System]]"
---

# Lark app tao san templates rac — khong xoa duoc, dung Drive Folders thay Wiki Spaces

## Boi canh
Khi tao Lark App, Lark tu dong tao ~30 template files (Karen's Blog, Bug Tracking, OKR, Gantt...) trong app Drive. 3 brand apps = ~90 file rac. Wiki Spaces khong cho add app lam member nen khong dung API duoc.

## Giai phap
1) Dung Drive Folders thay Wiki Spaces de to chuc docs. Moi brand app tu tao folder (POST /drive/v1/files/create_folder) → move docs vao folder cung app (POST /drive/v1/files/{token}/move) → share folder cho user (POST /drive/v1/permissions/{token}/members). 2) QUAN TRONG: source va destination phai cung 1 app. Neu khac app → loi permission. 3) Template rac khong xoa duoc (app khong co quyen) nhung khong hien trong Shared With Me cua user. 4) Doc ID KHONG thay doi khi move folder → code khong can sua.

## Duc ket
Lark Wiki Spaces = chi cho user/group/department, KHONG cho app. Dung Drive Folders de to chuc docs qua API. Luon tao folder bang CUNG APP so huu docs de tranh loi permission. Templates rac la read-only, bo qua.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
