ALTER TABLE sys_user
    ADD COLUMN phone VARCHAR(20) DEFAULT NULL COMMENT '手机号' AFTER username,
    ADD COLUMN avatar VARCHAR(128) DEFAULT NULL COMMENT '头像文件名' AFTER nickname,
    ADD COLUMN super_admin TINYINT NOT NULL DEFAULT 0 COMMENT '是否超级管理员：0 否，1 是' AFTER avatar;

ALTER TABLE sys_user
    ADD UNIQUE KEY uk_phone (phone);

UPDATE sys_user
SET phone = '13800000000', super_admin = 1
WHERE username = 'admin' AND (phone IS NULL OR phone = '');
