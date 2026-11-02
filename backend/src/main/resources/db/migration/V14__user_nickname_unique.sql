DROP TEMPORARY TABLE IF EXISTS tmp_dup_nickname;

CREATE TEMPORARY TABLE tmp_dup_nickname (
    nickname VARCHAR(64) NOT NULL,
    keep_id BIGINT NOT NULL,
    PRIMARY KEY (nickname)
);

INSERT INTO tmp_dup_nickname (nickname, keep_id)
SELECT nickname, MIN(id)
FROM sys_user
WHERE nickname IS NOT NULL
GROUP BY nickname
HAVING COUNT(*) > 1;

UPDATE sys_user AS u
INNER JOIN tmp_dup_nickname AS dup ON u.nickname = dup.nickname AND u.id <> dup.keep_id
SET u.nickname = CONCAT(LEFT(u.nickname, 64 - CHAR_LENGTH(CAST(u.id AS CHAR))), u.id);

DROP TEMPORARY TABLE tmp_dup_nickname;

SET @nickname_idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sys_user'
      AND INDEX_NAME = 'uk_nickname'
);
SET @nickname_ddl = IF(
    @nickname_idx_exists = 0,
    'ALTER TABLE sys_user ADD UNIQUE KEY uk_nickname (nickname)',
    'SELECT 1'
);
PREPARE nickname_stmt FROM @nickname_ddl;
EXECUTE nickname_stmt;
DEALLOCATE PREPARE nickname_stmt;
