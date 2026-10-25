CREATE TABLE IF NOT EXISTS dish_category (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    name VARCHAR(32) NOT NULL COMMENT '分类名称',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序，小的在前',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品分类';

CREATE TABLE IF NOT EXISTS dish (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    category_id BIGINT NOT NULL COMMENT '分类主键',
    name VARCHAR(64) NOT NULL COMMENT '菜名',
    description VARCHAR(500) NOT NULL DEFAULT '' COMMENT '描述',
    image_name VARCHAR(64) DEFAULT NULL COMMENT '图片文件名',
    is_active TINYINT NOT NULL DEFAULT 1 COMMENT '是否上架：1 上架，0 下架',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序，小的在前',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_dish_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品';

CREATE TABLE IF NOT EXISTS dish_option_group (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    dish_id BIGINT NOT NULL COMMENT '菜品主键',
    name VARCHAR(32) NOT NULL COMMENT '特殊项名称',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序，小的在前',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_option_group_dish (dish_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品特殊项';

CREATE TABLE IF NOT EXISTS dish_option_value (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    group_id BIGINT NOT NULL COMMENT '特殊项主键',
    label VARCHAR(32) NOT NULL COMMENT '可选值',
    sort_order INT NOT NULL DEFAULT 0 COMMENT '排序，小的在前',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0 未删除，1 已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_option_value_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜品特殊项可选值';

INSERT INTO dish_category (id, name, sort_order)
SELECT 1, '热菜', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_category WHERE id = 1);
INSERT INTO dish_category (id, name, sort_order)
SELECT 2, '凉菜', 2 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_category WHERE id = 2);
INSERT INTO dish_category (id, name, sort_order)
SELECT 3, '汤羹', 3 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_category WHERE id = 3);
INSERT INTO dish_category (id, name, sort_order)
SELECT 4, '主食', 4 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_category WHERE id = 4);
INSERT INTO dish_category (id, name, sort_order)
SELECT 5, '甜品', 5 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_category WHERE id = 5);

INSERT INTO dish (id, category_id, name, description, is_active, sort_order)
SELECT 1, 1, '番茄牛腩', '慢炖入味，适合周末家人围坐', 1, 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish WHERE id = 1);
INSERT INTO dish (id, category_id, name, description, is_active, sort_order)
SELECT 2, 2, '清炒时蔬', '当季绿叶，清爽解腻', 1, 2 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish WHERE id = 2);
INSERT INTO dish (id, category_id, name, description, is_active, sort_order)
SELECT 3, 1, '麻婆豆腐', '川味家常，可选辣度', 1, 3 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish WHERE id = 3);
INSERT INTO dish (id, category_id, name, description, is_active, sort_order)
SELECT 4, 1, '蒜蓉蒸虾', '鲜甜蒜香，少油', 1, 4 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish WHERE id = 4);
INSERT INTO dish (id, category_id, name, description, is_active, sort_order)
SELECT 5, 5, '银耳莲子羹', '餐后甜品，温润', 1, 5 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish WHERE id = 5);

INSERT INTO dish_option_group (id, dish_id, name, sort_order)
SELECT 1, 1, '份量', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_group WHERE id = 1);
INSERT INTO dish_option_group (id, dish_id, name, sort_order)
SELECT 2, 3, '辣度', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_group WHERE id = 2);
INSERT INTO dish_option_group (id, dish_id, name, sort_order)
SELECT 3, 3, '豆腐', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_group WHERE id = 3);
INSERT INTO dish_option_group (id, dish_id, name, sort_order)
SELECT 4, 4, '熟度', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_group WHERE id = 4);

INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 1, 1, '小份', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 1);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 2, 1, '中份', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 2);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 3, 1, '大份', 2 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 3);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 4, 2, '微辣', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 4);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 5, 2, '中辣', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 5);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 6, 2, '特辣', 2 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 6);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 7, 3, '嫩豆腐', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 7);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 8, 3, '老豆腐', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 8);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 9, 4, '七分熟', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 9);
INSERT INTO dish_option_value (id, group_id, label, sort_order)
SELECT 10, 4, '全熟', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM dish_option_value WHERE id = 10);
