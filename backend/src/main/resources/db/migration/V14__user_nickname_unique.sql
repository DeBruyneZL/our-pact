UPDATE sys_user AS u
INNER JOIN (
    SELECT nickname, MIN(id) AS keep_id
    FROM sys_user
    WHERE nickname IS NOT NULL AND nickname <> ''
    GROUP BY nickname
    HAVING COUNT(*) > 1
) AS dup ON u.nickname = dup.nickname AND u.id <> dup.keep_id
SET u.nickname = CONCAT(LEFT(u.nickname, 64 - CHAR_LENGTH(CAST(u.id AS CHAR))), u.id);

ALTER TABLE sys_user
    ADD UNIQUE KEY uk_nickname (nickname);
