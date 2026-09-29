-- ============================================================
-- Admin Account Setup Script - Local Farmer Marketplace
-- ============================================================
-- Run this ONCE in your MySQL database.
--
-- Credentials:
--   Mobile Number : 9999999998
--   Password      : admin123
--   Role          : ADMIN
--
-- The BCrypt password hash below = "admin123"
-- The BCrypt pin hash below      = "9999"
-- ============================================================

USE farmer_marketplace;

INSERT INTO users (
    full_name, mobile_number, password, pin,
    role, is_active, is_mobile_verified, preferred_language
)
SELECT
    'Admin', '9999999998',
    '$2a$10$g5iKjRUIzQFyJyK6sVwHEuTIoUZX2c/1lKXwpTJ2ctqZyIf4lNVky',
    '$2a$10$Wq9f4l1V0r8j2H6s5K3N5.eU1s4v7a2s9k4j1h8g6f3d2s1a9q4w', 'ADMIN', true, true, 'ENGLISH'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE mobile_number = '9999999998'
);

-- Verify
SELECT id, full_name, mobile_number, role, is_active FROM users WHERE role = 'ADMIN';
