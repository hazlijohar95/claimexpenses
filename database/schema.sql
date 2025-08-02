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
    amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
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
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
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
    file_size INTEGER NOT NULL CHECK (file_size > 0),
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive indexes for better performance
CREATE INDEX idx_claims_submitted_by ON claims(submitted_by);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_at ON claims(created_at);
CREATE INDEX idx_claims_category ON claims(category);
CREATE INDEX idx_claims_date_range ON claims(claim_date);
CREATE INDEX idx_claims_amount ON claims(amount);
CREATE INDEX idx_expense_items_claim_id ON expense_items(claim_id);
CREATE INDEX idx_expense_items_category ON expense_items(category);
CREATE INDEX idx_expense_items_date ON expense_items(expense_date);
CREATE INDEX idx_attachments_claim_id ON attachments(claim_id);
CREATE INDEX idx_attachments_file_name ON attachments(file_name);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department);

-- Enable Row Level Security on all tables
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

CREATE POLICY "Users can update their own pending claims" ON claims
    FOR UPDATE USING (
        auth.uid() = submitted_by AND status = 'pending'
    );

CREATE POLICY "Managers and admins can update claim status" ON claims
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can delete their own pending claims" ON claims
    FOR DELETE USING (
        auth.uid() = submitted_by AND status = 'pending'
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
            AND claims.status = 'pending'
        )
    );

CREATE POLICY "Users can update expense items for their pending claims" ON expense_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = expense_items.claim_id 
            AND claims.submitted_by = auth.uid()
            AND claims.status = 'pending'
        )
    );

CREATE POLICY "Users can delete expense items for their pending claims" ON expense_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = expense_items.claim_id 
            AND claims.submitted_by = auth.uid()
            AND claims.status = 'pending'
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
            AND claims.status = 'pending'
        )
    );

CREATE POLICY "Users can delete attachments for their pending claims" ON attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM claims 
            WHERE claims.id = attachments.claim_id 
            AND claims.submitted_by = auth.uid()
            AND claims.status = 'pending'
        )
    );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, do nothing
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

-- Create function to validate claim amounts
CREATE OR REPLACE FUNCTION validate_claim_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if total expense items amount matches claim amount
    IF NEW.amount != (
        SELECT COALESCE(SUM(amount), 0)
        FROM expense_items
        WHERE claim_id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Claim amount must match sum of expense items';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for claim amount validation
CREATE TRIGGER validate_claim_amount_trigger
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION validate_claim_amount(); 