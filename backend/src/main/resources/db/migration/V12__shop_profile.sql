CREATE TABLE IF NOT EXISTS shop_profile (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    slogan VARCHAR(64) NOT NULL DEFAULT '' COMMENT '一句话介绍',
    location VARCHAR(128) NOT NULL DEFAULT '' COMMENT '地点',
    open_hours VARCHAR(64) NOT NULL DEFAULT '' COMMENT '接待时间',
    seats_text VARCHAR(32) NOT NULL DEFAULT '' COMMENT '可接待人数说明',
    notice VARCHAR(200) NOT NULL DEFAULT '' COMMENT '今日说明',
    cover_name VARCHAR(64) DEFAULT NULL COMMENT '氛围图文件名',
    chef_name VARCHAR(32) NOT NULL DEFAULT '' COMMENT '主厨名字',
    chef_title VARCHAR(16) NOT NULL DEFAULT '' COMMENT '主厨称呼',
    chef_intro VARCHAR(300) NOT NULL DEFAULT '' COMMENT '主厨介绍',
    chef_avatar_name VARCHAR(64) DEFAULT NULL COMMENT '主厨头像文件名',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='店铺介绍';

INSERT INTO shop_profile (id, slogan, location, open_hours, seats_text, notice, chef_name, chef_title, chef_intro)
SELECT 1, '', '', '', '', '', '', '', '' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM shop_profile WHERE id = 1);
