-- 🔒 ENHANCED SECURITY SCHEMA FOR OPEN-SOURCE DEPLOYMENT
-- This file contains additional security measures beyond the base schema

-- =====================================================
-- AUDIT TRAILS
-- =====================================================

-- Create audit log table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- RATE LIMITING
-- =====================================================

-- Create rate limiting table
CREATE TABLE rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rate limiting
CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- Enable RLS on rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limits
CREATE POLICY "Users can view their own rate limits" ON rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- ENHANCED RLS POLICIES
-- =====================================================

-- Drop existing policies and recreate with enhanced security
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Enhanced profile policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (
        auth.uid() = id AND 
        auth.uid() IS NOT NULL AND
        -- Prevent role escalation
        (NEW.role = OLD.role OR 
         EXISTS (
             SELECT 1 FROM profiles 
             WHERE profiles.id = auth.uid() 
             AND profiles.role = 'admin'
         ))
    );

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id AND 
        auth.uid() IS NOT NULL
    );

-- Enhanced claims policies
DROP POLICY IF EXISTS "Users can view their own claims" ON claims;
DROP POLICY IF EXISTS "Managers and admins can view all claims" ON claims;
DROP POLICY IF EXISTS "Users can create their own claims" ON claims;
DROP POLICY IF EXISTS "Users can update their own pending claims" ON claims;
DROP POLICY IF EXISTS "Managers and admins can update claim status" ON claims;
DROP POLICY IF EXISTS "Users can delete their own pending claims" ON claims;

CREATE POLICY "Users can view their own claims" ON claims
    FOR SELECT USING (
        auth.uid() = submitted_by AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Managers and admins can view all claims" ON claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
            AND auth.uid() IS NOT NULL
        )
    );

CREATE POLICY "Users can create their own claims" ON claims
    FOR INSERT WITH CHECK (
        auth.uid() = submitted_by AND 
        auth.uid() IS NOT NULL AND
        -- Validate amount
        amount >= 0 AND amount <= 1000000
    );

CREATE POLICY "Users can update their own pending claims" ON claims
    FOR UPDATE USING (
        auth.uid() = submitted_by AND 
        status = 'pending' AND
        auth.uid() IS NOT NULL AND
        -- Prevent status changes by users
        NEW.status = OLD.status
    );

CREATE POLICY "Managers and admins can update claim status" ON claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
            AND auth.uid() IS NOT NULL
        ) AND
        -- Only allow status changes
        (NEW.status != OLD.status OR NEW.approved_by IS NOT NULL)
    );

CREATE POLICY "Users can delete their own pending claims" ON claims
    FOR DELETE USING (
        auth.uid() = submitted_by AND 
        status = 'pending' AND
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_claims_trigger
    AFTER INSERT OR UPDATE OR DELETE ON claims
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_expense_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expense_items
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_attachments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attachments
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- =====================================================
-- RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_max_attempts INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Clean up old entries
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 minute' * p_window_minutes;
    
    -- Get current count
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM rate_limits
    WHERE user_id = p_user_id 
    AND action = p_action
    AND window_start > NOW() - INTERVAL '1 minute' * p_window_minutes;
    
    -- Check if limit exceeded
    IF current_count >= p_max_attempts THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update rate limit record
    INSERT INTO rate_limits (user_id, action, count)
    VALUES (p_user_id, p_action, 1)
    ON CONFLICT (user_id, action)
    DO UPDATE SET 
        count = rate_limits.count + 1,
        window_start = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to validate file uploads
CREATE OR REPLACE FUNCTION validate_file_upload(
    p_file_name TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check file size (10MB limit)
    IF p_file_size > 10 * 1024 * 1024 THEN
        RETURN FALSE;
    END IF;
    
    -- Check file extension
    IF p_file_name !~ '\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx)$' THEN
        RETURN FALSE;
    END IF;
    
    -- Check MIME type
    IF p_mime_type NOT IN (
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENCRYPTION (if using pgcrypto extension)
-- =====================================================

-- Enable pgcrypto if available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt_iv(
        data::bytea,
        current_setting('app.encryption_key')::bytea,
        decode('000102030405060708090A0B0C0D0E0F', 'hex'),
        'aes-cbc'
    ), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt_iv(
        decode(encrypted_data, 'base64'),
        current_setting('app.encryption_key')::bytea,
        decode('000102030405060708090A0B0C0D0E0F', 'hex'),
        'aes-cbc'
    ), 'utf8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECURITY SETTINGS
-- =====================================================

-- Set security parameters
ALTER DATABASE postgres SET "app.encryption_key" = 'your-32-character-encryption-key-here';

-- Create security view for monitoring
CREATE VIEW security_monitor AS
SELECT 
    'profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT id) as unique_users
FROM profiles
UNION ALL
SELECT 
    'claims' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT submitted_by) as unique_users
FROM claims
UNION ALL
SELECT 
    'audit_logs' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_logs;

-- Grant permissions
GRANT SELECT ON security_monitor TO authenticated;

-- =====================================================
-- CLEANUP AND MAINTENANCE
-- =====================================================

-- Function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (run daily)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_old_audit_logs();'); 