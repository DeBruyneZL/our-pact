CREATE TABLE IF NOT EXISTS act_activity (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    name VARCHAR(64) NOT NULL COMMENT '活动名称',
    scheduled_at DATETIME NOT NULL COMMENT '活动时间',
    location VARCHAR(128) NOT NULL COMMENT '活动地点',
    share_code VARCHAR(8) NOT NULL COMMENT '分享码',
    user_id BIGINT NOT NULL COMMENT '发起人',
    status VARCHAR(16) NOT NULL COMMENT '状态：open 待答复，replied 已答复，withdrawn 已撤回，completed 已完成',
    reply_note VARCHAR(255) DEFAULT NULL COMMENT '管理员答复',
    replied_at DATETIME DEFAULT NULL COMMENT '答复时间',
    withdrawn_at DATETIME DEFAULT NULL COMMENT '撤回时间',
    completed_at DATETIME DEFAULT NULL COMMENT '完成时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_act_share_code (share_code),
    KEY idx_act_user (user_id),
    KEY idx_act_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动';

CREATE TABLE IF NOT EXISTS act_participant (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    activity_id BIGINT NOT NULL COMMENT '活动主键',
    user_id BIGINT NOT NULL COMMENT '参与人',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_act_participant (activity_id, user_id),
    KEY idx_act_participant_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动参与人';

CREATE TABLE IF NOT EXISTS act_item (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    activity_id BIGINT NOT NULL COMMENT '活动主键',
    dish_id BIGINT DEFAULT NULL COMMENT '菜品主键，菜品删除后仍保留名称快照',
    dish_name VARCHAR(64) NOT NULL COMMENT '菜名快照',
    note VARCHAR(100) DEFAULT NULL COMMENT '备注',
    added_by_user_id BIGINT NOT NULL COMMENT '加菜的人',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_act_item_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动菜品';

CREATE TABLE IF NOT EXISTS act_item_option (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    item_id BIGINT NOT NULL COMMENT '活动菜品主键',
    group_name VARCHAR(32) NOT NULL COMMENT '特殊项名称快照',
    option_label VARCHAR(32) NOT NULL COMMENT '选项名称快照',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_act_item_option_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动菜品特殊项';

CREATE TABLE IF NOT EXISTS act_photo (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    activity_id BIGINT NOT NULL COMMENT '活动主键',
    user_id BIGINT NOT NULL COMMENT '上传人',
    file_name VARCHAR(64) NOT NULL COMMENT '照片文件名',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_act_photo_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动照片';

CREATE TABLE IF NOT EXISTS act_notice (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    activity_id BIGINT NOT NULL COMMENT '活动主键',
    type VARCHAR(16) NOT NULL COMMENT '通知类型：withdrawn 撤回',
    message VARCHAR(255) NOT NULL COMMENT '通知内容',
    read_flag TINYINT NOT NULL DEFAULT 0 COMMENT '是否已读：0 未读，1 已读',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_act_notice_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='活动通知';
