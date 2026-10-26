ALTER TABLE act_activity
    ADD COLUMN people_count INT NOT NULL DEFAULT 1 COMMENT '发起人一方人数' AFTER user_id;

ALTER TABLE act_participant
    ADD COLUMN people_count INT NOT NULL DEFAULT 1 COMMENT '该参与人一方人数' AFTER user_id;
