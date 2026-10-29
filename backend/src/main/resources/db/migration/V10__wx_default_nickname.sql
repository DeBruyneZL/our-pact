UPDATE sys_user AS u
SET u.nickname = CONCAT('微信用户', u.id)
WHERE u.deleted = 0
  AND u.nickname = '微信用户'
  AND NOT EXISTS (
      SELECT 1
      FROM (
          SELECT nickname
          FROM sys_user
          WHERE deleted = 0
      ) AS taken
      WHERE taken.nickname = CONCAT('微信用户', u.id)
  );
