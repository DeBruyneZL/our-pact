UPDATE sys_user
SET password = '$2b$10$q3fKIf12OZK/1zPXbw/6qOCn9NMkt6eDGrbsN3ExUGhuu/aFWaem.'
WHERE username = 'admin' AND password = '123456';

UPDATE sys_user
SET password = '$2b$10$33fzCg7uxtvZBTTngGa2F.8u5mNGqf8tlKP0g4mk2RqJQSBsGj8/O'
WHERE username = 'user' AND password = '123456';
