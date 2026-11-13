CREATE TABLE IF NOT EXISTS trip_spot (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    name VARCHAR(64) NOT NULL COMMENT '地点名称，如 杭州西湖',
    province VARCHAR(32) DEFAULT NULL COMMENT '省份快照，如 浙江省',
    city VARCHAR(32) DEFAULT NULL COMMENT '城市快照，如 杭州市',
    district VARCHAR(32) DEFAULT NULL COMMENT '区县快照，如 西湖区',
    lng DECIMAL(10,6) NOT NULL COMMENT '经度',
    lat DECIMAL(10,6) NOT NULL COMMENT '纬度',
    photo_file_name VARCHAR(64) DEFAULT NULL COMMENT '点亮照片文件名',
    status VARCHAR(16) NOT NULL COMMENT '状态：wish 想去，lit 已点亮',
    visited_on DATE DEFAULT NULL COMMENT '旅行时间',
    note VARCHAR(255) DEFAULT NULL COMMENT '随记',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_trip_spot_status (status),
    KEY idx_trip_spot_visited (visited_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅行点亮地点';

CREATE TABLE IF NOT EXISTS trip_food (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    spot_id BIGINT NOT NULL COMMENT '旅行地点主键',
    shop_name VARCHAR(64) DEFAULT NULL COMMENT '店名',
    dish_name VARCHAR(64) NOT NULL COMMENT '吃了什么',
    photo_file_name VARCHAR(64) DEFAULT NULL COMMENT '美食照片文件名',
    note VARCHAR(255) DEFAULT NULL COMMENT '随记',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_trip_food_spot (spot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='旅行美食记录';
