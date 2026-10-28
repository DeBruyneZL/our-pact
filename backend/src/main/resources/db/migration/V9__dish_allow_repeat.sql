ALTER TABLE dish
    ADD COLUMN allow_repeat TINYINT NOT NULL DEFAULT 0 COMMENT '活动中可否重复添加：1 可以，0 不行' AFTER is_active;
