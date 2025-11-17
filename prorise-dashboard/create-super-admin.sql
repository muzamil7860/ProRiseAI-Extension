-- Create Super Admin User
-- Password: admin123

INSERT INTO User (id, email, name, password, role, apiKey, apiKeyActive, planId, createdAt, updatedAt)
VALUES (
  'super-admin-001',
  'admin@prorise.ai',
  'Super Admin',
  '$2a$10$xSbMSsNCgoXqxA/WPhTf5.ngEXaManYXFUT3cL.oPo3p3xVj3DzMq',
  'SUPER_ADMIN',
  'sa_key_prorise_2024',
  TRUE,
  NULL,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT id, email, name, role FROM User WHERE email = 'admin@prorise.ai';
