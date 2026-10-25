ALTER TABLE sys_user
    ADD COLUMN wx_openid VARCHAR(64) DEFAULT NULL COMMENT '微信小程序 openid，静默登录用' AFTER avatar;

ALTER TABLE sys_user
    ADD UNIQUE KEY uk_wx_openid (wx_openid);
