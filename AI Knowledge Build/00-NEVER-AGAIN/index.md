# Never Again List

> Danh sach SAI LAM KHONG BAO GIO LAP LAI.
> Tu dong inject vao dau moi Claude session qua longbrain-context.js hook.
> Them muc moi: dung `add_never_again()` MCP tool.


## [NA-001] Unicode regex khong match tieng Viet
**Sai lam**: Dung /bats*dau/ truc tiep thay vi NFD normalize
**Hau qua**: Hook khong kich hoat khi user nhan tieng Viet — mat 2 gio debug
**Phong tranh**: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match
