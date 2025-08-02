import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Claim = Database['public']['Tables']['claims']['Row'];
type ClaimInsert = Database['public']['Tables']['claims']['Insert'];
type ClaimUpdate = Database['public']['Tables']['claims']['Update'];

type ExpenseItem = Database['public']['Tables']['expense_items']['Row'];
type ExpenseItemInsert = Database['public']['Tables']['expense_items']['Insert'];

type Attachment = Database['public']['Tables']['attachments']['Row'];
type AttachmentInsert = Database['public']['Tables']['attachments']['Insert'];

export interface ClaimWithDetails extends Claim {
  expense_items: ExpenseItem[];
  attachments: Attachment[];
  submitter_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
  approver_profile?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export class ClaimsService {
  // Get all claims with optional filters
  static async getClaims(filters?: {
    status?: string;
    submittedBy?: string;
    search?: string;
  }): Promise<ClaimWithDetails[]> {
    let query = supabase
      .from('claims')
      .select(`
        *,
        expense_items (*),
        attachments (*),
        submitter_profile:profiles!claims_submitted_by_fkey (full_name, email, role),
        approver_profile:profiles!claims_approved_by_fkey (full_name, email, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.submittedBy) {
      query = query.eq('submitted_by', filters.submittedBy);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching claims:', error);
      throw new Error('Failed to fetch claims');
    }

    return data || [];
  }

  // Get a single claim by ID
  static async getClaimById(id: string): Promise<ClaimWithDetails | null> {
    const { data, error } = await supabase
      .from('claims')
      .select(`
        *,
        expense_items (*),
        attachments (*),
        submitter_profile:profiles!claims_submitted_by_fkey (full_name, email, role),
        approver_profile:profiles!claims_approved_by_fkey (full_name, email, role)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching claim:', error);
      throw new Error('Failed to fetch claim');
    }

    return data;
  }

  // Create a new claim
  static async createClaim(claimData: ClaimInsert, expenseItems: ExpenseItemInsert[]): Promise<Claim> {
    // Start a transaction
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        ...claimData,
        submitted_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim:', claimError);
      throw new Error('Failed to create claim');
    }

    // Insert expense items
    if (expenseItems.length > 0) {
      const itemsWithClaimId = expenseItems.map(item => ({
        ...item,
        claim_id: claim.id,
        created_at: new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase
        .from('expense_items')
        .insert(itemsWithClaimId);

      if (itemsError) {
        console.error('Error creating expense items:', itemsError);
        throw new Error('Failed to create expense items');
      }
    }

    return claim;
  }

  // Update claim status (approve/reject)
  static async updateClaimStatus(
    claimId: string,
    status: 'approved' | 'rejected',
    approverId: string,
    rejectionReason?: string
  ): Promise<void> {
    const updateData: ClaimUpdate = {
      status,
      approved_by: approverId,
      approved_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', claimId);

    if (error) {
      console.error('Error updating claim status:', error);
      throw new Error('Failed to update claim status');
    }
  }

  // Upload attachment
  static async uploadAttachment(
    claimId: string,
    file: File
  ): Promise<Attachment> {
    const fileName = `${claimId}/${Date.now()}_${file.name}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('claim-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('claim-attachments')
      .getPublicUrl(fileName);

    // Create attachment record
    const attachmentData: AttachmentInsert = {
      claim_id: claimId,
      file_name: file.name,
      file_path: fileName,
      file_size: file.size,
      mime_type: file.type,
      created_at: new Date().toISOString(),
    };

    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .insert(attachmentData)
      .select()
      .single();

    if (attachmentError) {
      console.error('Error creating attachment record:', attachmentError);
      throw new Error('Failed to create attachment record');
    }

    return attachment;
  }

  // Get claims statistics
  static async getClaimsStats(userId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  }> {
    let query = supabase.from('claims').select('status, amount');

    if (userId) {
      query = query.eq('submitted_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching claims stats:', error);
      throw new Error('Failed to fetch claims statistics');
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(c => c.status === 'pending').length || 0,
      approved: data?.filter(c => c.status === 'approved').length || 0,
      rejected: data?.filter(c => c.status === 'rejected').length || 0,
      totalAmount: data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
    };

    return stats;
  }

  // Delete claim (only for admins or claim owner)
  static async deleteClaim(claimId: string): Promise<void> {
    const { error } = await supabase
      .from('claims')
      .delete()
      .eq('id', claimId);

    if (error) {
      console.error('Error deleting claim:', error);
      throw new Error('Failed to delete claim');
    }
  }
} 