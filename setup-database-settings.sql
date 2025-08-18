-- Setup database tables for settings and requesters
-- Run this script to create the necessary tables

-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Requesters table for multiple requesters
CREATE TABLE IF NOT EXISTS requesters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value, category) VALUES
-- Company Information
('company_name', 'StockFlow Inc.', 'company'),
('company_email', 'admin@stockflow.com', 'company'),
('company_phone', '+66 123 456 789', 'company'),
('company_address', '123 Business Street, Bangkok, Thailand', 'company'),
('company_currency', 'THB', 'company'),

-- Server Connection Settings
('server_host', 'localhost', 'server'),
('server_port', '3000', 'server'),
('database_host', 'localhost', 'database'),
('database_port', '5432', 'database'),
('database_name', 'stockflow', 'database'),
('database_user', 'postgres', 'database'),

-- Email Server Settings
('email_server_host', 'localhost', 'email'),
('email_server_port', '587', 'email'),
('email_server_type', 'postfix', 'email'),
('email_username', '', 'email'),
('email_password', '', 'email'),
('email_encryption', 'tls', 'email'),
('email_auth_required', 'true', 'email'),

-- Approval Settings
('approver_name', 'ผู้อนุมัติงบประมาณ', 'approval'),
('approver_email', 'approver@stockflow.com', 'approval'),
('cc_emails', 'finance@stockflow.com,manager@stockflow.com', 'approval'),

-- Notification Settings
('low_stock_alert', 'true', 'notification'),
('email_notifications', 'true', 'notification'),

-- System Settings
('auto_backup', 'true', 'system')

ON CONFLICT (key) DO NOTHING;

-- Insert default requester
INSERT INTO requesters (name, email, department) VALUES
('ผู้ขอใช้งบประมาณ', 'requester@stockflow.com', 'ทั่วไป')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_requesters_active ON requesters(is_active);

-- Display the created tables
SELECT 'Settings table created successfully' as message;
SELECT 'Requesters table created successfully' as message;
SELECT 'Default data inserted successfully' as message;
