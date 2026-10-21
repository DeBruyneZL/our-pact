INSERT INTO sys_user (username, phone, password, nickname, super_admin)
SELECT 'user', '13900000000', '123456', '普通用户', 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_user WHERE username = 'user');
