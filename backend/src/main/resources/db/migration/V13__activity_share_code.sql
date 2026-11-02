ALTER TABLE act_activity
    ADD COLUMN share_code VARCHAR(32) NULL COMMENT '分享码' AFTER location;

UPDATE act_activity AS activity
INNER JOIN (
    SELECT id, token
    FROM (
        SELECT id, REPLACE(UUID(), '-', '') AS token
        FROM act_activity
    ) AS generated
) AS tokens ON tokens.id = activity.id
SET activity.share_code = tokens.token
WHERE activity.share_code IS NULL OR activity.share_code = '';

ALTER TABLE act_activity
    MODIFY share_code VARCHAR(32) NOT NULL COMMENT '分享码',
    ADD UNIQUE KEY uk_act_share_code (share_code);
