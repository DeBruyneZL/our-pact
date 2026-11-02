SET @share_col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'act_activity'
      AND COLUMN_NAME = 'share_code'
);
SET @share_ddl = IF(
    @share_col_exists = 0,
    'ALTER TABLE act_activity ADD COLUMN share_code VARCHAR(32) NULL COMMENT ''分享码'' AFTER location',
    'SELECT 1'
);
PREPARE share_stmt FROM @share_ddl;
EXECUTE share_stmt;
DEALLOCATE PREPARE share_stmt;

DROP TEMPORARY TABLE IF EXISTS tmp_share_dup;

CREATE TEMPORARY TABLE tmp_share_dup (
    share_code VARCHAR(32) NOT NULL,
    PRIMARY KEY (share_code)
);

INSERT INTO tmp_share_dup (share_code)
SELECT share_code
FROM act_activity
WHERE share_code IS NOT NULL AND share_code <> ''
GROUP BY share_code
HAVING COUNT(*) > 1;

UPDATE act_activity AS activity
INNER JOIN tmp_share_dup AS dup ON activity.share_code = dup.share_code
SET activity.share_code = NULL;

DROP TEMPORARY TABLE tmp_share_dup;

UPDATE act_activity
SET share_code = SUBSTRING(SHA2(CONCAT('our-pact-share-', id, '-', IFNULL(DATE_FORMAT(create_time, '%Y%m%d%H%i%s'), '0'), '-', user_id), 256), 1, 32)
WHERE share_code IS NULL OR share_code = '';

SET @share_idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'act_activity'
      AND INDEX_NAME = 'uk_act_share_code'
);
SET @share_idx_ddl = IF(
    @share_idx_exists = 0,
    'ALTER TABLE act_activity MODIFY share_code VARCHAR(32) NOT NULL COMMENT ''分享码'', ADD UNIQUE KEY uk_act_share_code (share_code)',
    'SELECT 1'
);
PREPARE share_idx_stmt FROM @share_idx_ddl;
EXECUTE share_idx_stmt;
DEALLOCATE PREPARE share_idx_stmt;
