-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create claims table
CREATE TABLE claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    category TEXT NOT NULL,
    claim_date DATE NOT NULL,
    submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_items table
CREATE TABLE expense_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attachments table
CREATE TABLE attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_claims_submitted_by ON claims(submitted_by);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_at ON claims(created_at);
CREATE INDEX idx_expense_items_claim_id ON expense_items(claim_id);
CREATE INDEX idx_attachments_claim_id ON attachments(claim_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Claims policies
CREATE POLICY "Users can view their own claims" ON claims
    FOR SELECT USING (auth.uid() = submitted_by);

CREATE POLICY "Managers and admins can view all claims" ON claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can create their own claims" ON claims
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Managers and admins can update claim status" ON claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
        )
    );

-- Expense items policies
CREATE POLICY "Users can view expense items for their claims" ON expense_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = expense_items.claim_id 
            AND claims.submitted_by = auth.uid()
        )
    );

CREATE POLICY "Managers and admins can view all expense items" ON expense_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can create expense items for their claims" ON expense_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = expense_items.claim_id 
            AND claims.submitted_by = auth.uid()
        )
    );

-- Attachments policies
CREATE POLICY "Users can view attachments for their claims" ON attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = attachments.claim_id 
            AND claims.submitted_by = auth.uid()
        )
    );

CREATE POLICY "Managers and admins can view all attachments" ON attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can create attachments for their claims" ON attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = attachments.claim_id 
            AND claims.submitted_by = auth.uid()
        )
    );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'employee'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO profiles (id, email, full_name, role, department) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@company.com', 'Admin User', 'admin', 'IT'),
    ('00000000-0000-0000-0000-000000000002', 'manager@company.com', 'Manager User', 'manager', 'Sales'),
    ('00000000-0000-0000-0000-000000000003', 'employee@company.com', 'Employee User', 'employee', 'Engineering');

-- Insert sample claims
INSERT INTO claims (id, title, description, amount, status, category, claim_date, submitted_by) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Business Travel - Conference', 'Conference registration and travel expenses for Tech Summit 2024', 450.00, 'approved', 'Travel', '2024-01-15', '00000000-0000-0000-0000-000000000003'),
    ('22222222-2222-2222-2222-222222222222', 'Office Supplies', 'Printer paper, pens, and other office essentials', 125.00, 'pending', 'Office Supplies', '2024-01-14', '00000000-0000-0000-0000-000000000003'),
    ('33333333-3333-3333-3333-333333333333', 'Client Dinner', 'Business dinner with potential client', 89.00, 'rejected', 'Meals & Entertainment', '2024-01-13', '00000000-0000-0000-0000-000000000003');

-- Insert sample expense items
INSERT INTO expense_items (claim_id, description, amount, category, expense_date) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Conference Registration', 250.00, 'Training & Education', '2024-01-15'),
    ('11111111-1111-1111-1111-111111111111', 'Airfare - Round Trip', 150.00, 'Travel', '2024-01-15'),
    ('11111111-1111-1111-1111-111111111111', 'Hotel Accommodation', 50.00, 'Accommodation', '2024-01-15'),
    ('22222222-2222-2222-2222-222222222222', 'Printer Paper', 45.00, 'Office Supplies', '2024-01-14'),
    ('22222222-2222-2222-2222-222222222222', 'Pens and Stationery', 80.00, 'Office Supplies', '2024-01-14'),
    ('33333333-3333-3333-3333-333333333333', 'Restaurant Bill', 89.00, 'Meals & Entertainment', '2024-01-13'); 