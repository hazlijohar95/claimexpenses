import { supabase, logger } from '../lib/supabase';
import type {
  Claim,
  ClaimInsert,
  ClaimUpdate,
  ExpenseItem,
  ExpenseItemInsert,
  Attachment,
  AttachmentInsert,
} from '../types';

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
  // Check if we're in demo mode
  private static isDemoMode(): boolean {
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !supabaseKey || supabaseKey.includes('placeholder') || supabaseKey === 'your_supabase_anon_key_here';
  }

  // Get all claims with optional filters and pagination
  static async getClaims(filters?: {
    status?: string;
    submittedBy?: string;
    search?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ClaimWithDetails[]; count: number; totalPages: number }> {
    try {
      // Return demo data in demo mode
      if (this.isDemoMode()) {
        const demoData: ClaimWithDetails[] = [];
        return {
          data: demoData,
          count: 0,
          totalPages: 0
        };
      }

      let query = supabase
        .from('claims')
        .select(`
          *,
          expense_items (*),
          attachments (*),
          submitter_profile:profiles!claims_submitted_by_fkey (full_name, email, role),
          approver_profile:profiles!claims_approved_by_fkey (full_name, email, role)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.submittedBy) {
        query = query.eq('submitted_by', filters.submittedBy);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.dateFrom) {
        query = query.gte('claim_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('claim_date', filters.dateTo);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching claims:', error);
        throw new Error('Failed to fetch claims');
      }

      const totalPages = count ? Math.ceil(count / limit) : 0;

      return {
        data: data || [],
        count: count || 0,
        totalPages,
      };
    } catch (error) {
      logger.error('Unexpected error in getClaims:', error);
      throw new Error('Failed to fetch claims');
    }
  }

  // Get claim by ID
  static async getClaimById(id: string): Promise<ClaimWithDetails | null> {
    try {
      // Return null in demo mode (no specific claim data)
      if (this.isDemoMode()) {
        return null;
      }

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
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        logger.error('Error fetching claim:', error);
        throw new Error('Failed to fetch claim');
      }

      return data;
    } catch (error) {
      logger.error('Unexpected error in getClaimById:', error);
      throw new Error('Failed to fetch claim');
    }
  }

  // Create new claim with expense items
  static async createClaim(claimData: ClaimInsert, expenseItems: ExpenseItemInsert[]): Promise<Claim> {
    try {
      // Start transaction by creating claim first
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .insert(claimData)
        .select()
        .single();

      if (claimError) {
        logger.error('Error creating claim:', claimError);
        throw new Error('Failed to create claim');
      }

      // Create expense items if provided
      if (expenseItems.length > 0) {
        const expenseItemsWithClaimId = expenseItems.map(item => ({
          ...item,
          claim_id: claim.id,
        }));

        const { error: itemsError } = await supabase
          .from('expense_items')
          .insert(expenseItemsWithClaimId);

        if (itemsError) {
          logger.error('Error creating expense items:', itemsError);
          // Rollback claim creation
          await supabase.from('claims').delete().eq('id', claim.id);
          throw new Error('Failed to create expense items');
        }
      }

      return claim;
    } catch (error) {
      logger.error('Unexpected error in createClaim:', error);
      throw new Error('Failed to create claim');
    }
  }

  // Update claim status (approve/reject)
  static async updateClaimStatus(
    claimId: string,
    status: 'approved' | 'rejected',
    approverId: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      const updateData: ClaimUpdate = {
        status,
        approved_by: approverId,
        approved_date: new Date().toISOString(),
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('claims')
        .update(updateData)
        .eq('id', claimId);

      if (error) {
        logger.error('Error updating claim status:', error);
        throw new Error('Failed to update claim status');
      }
    } catch (error) {
      logger.error('Unexpected error in updateClaimStatus:', error);
      throw new Error('Failed to update claim status');
    }
  }

  // Update claim details
  static async updateClaim(claimId: string, updates: ClaimUpdate): Promise<Claim> {
    try {
      const { data: claim, error } = await supabase
        .from('claims')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating claim:', error);
        throw new Error('Failed to update claim');
      }

      return claim;
    } catch (error) {
      logger.error('Unexpected error in updateClaim:', error);
      throw new Error('Failed to update claim');
    }
  }

  // Upload attachment with proper file validation
  static async uploadAttachment(
    claimId: string,
    file: File
  ): Promise<Attachment> {
    try {
      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not allowed');
      }

      const fileName = `${claimId}/${Date.now()}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('claim-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        logger.error('Error uploading file:', uploadError);
        throw new Error('Failed to upload file');
      }

      // Create attachment record
      const attachmentData: AttachmentInsert = {
        claim_id: claimId,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
      };

      const { data: attachment, error: attachmentError } = await supabase
        .from('attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (attachmentError) {
        logger.error('Error creating attachment record:', attachmentError);
        // Clean up uploaded file
        await supabase.storage.from('claim-attachments').remove([fileName]);
        throw new Error('Failed to create attachment record');
      }

      return attachment;
    } catch (error) {
      logger.error('Unexpected error in uploadAttachment:', error);
      throw new Error('Failed to upload attachment');
    }
  }

  // Delete attachment
  static async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      // Get attachment details first
      const { data: attachment, error: fetchError } = await supabase
        .from('attachments')
        .select('file_path')
        .eq('id', attachmentId)
        .single();

      if (fetchError) {
        logger.error('Error fetching attachment:', fetchError);
        throw new Error('Failed to fetch attachment');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('claim-attachments')
        .remove([attachment.file_path]);

      if (storageError) {
        logger.error('Error deleting file from storage:', storageError);
        throw new Error('Failed to delete file from storage');
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (dbError) {
        logger.error('Error deleting attachment record:', dbError);
        throw new Error('Failed to delete attachment record');
      }
    } catch (error) {
      logger.error('Unexpected error in deleteAttachment:', error);
      throw new Error('Failed to delete attachment');
    }
  }

  // Get claims statistics
  static async getClaimsStats(userId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
    averageAmount: number;
  }> {
    try {
      // Return demo data in demo mode
      if (this.isDemoMode()) {
        return {
          total: 12,
          pending: 3,
          approved: 8,
          rejected: 1,
          totalAmount: 2450.75,
          averageAmount: 204.23,
        };
      }

      let query = supabase.from('claims').select('status, amount');

      if (userId) {
        query = query.eq('submitted_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching claims stats:', error);
        throw new Error('Failed to fetch claims statistics');
      }

      const claims = data || [];
      const total = claims.length;
      const pending = claims.filter(c => c.status === 'pending').length;
      const approved = claims.filter(c => c.status === 'approved').length;
      const rejected = claims.filter(c => c.status === 'rejected').length;
      const totalAmount = claims.reduce((sum, c) => sum + (c.amount || 0), 0);
      const averageAmount = total > 0 ? totalAmount / total : 0;

      return {
        total,
        pending,
        approved,
        rejected,
        totalAmount,
        averageAmount,
      };
    } catch (error) {
      logger.error('Unexpected error in getClaimsStats:', error);
      throw new Error('Failed to fetch claims statistics');
    }
  }

  // Delete claim (only for admins or claim owner)
  static async deleteClaim(claimId: string): Promise<void> {
    try {
      // Get claim details first to check permissions
      const { data: claim, error: fetchError } = await supabase
        .from('claims')
        .select('submitted_by, status')
        .eq('id', claimId)
        .single();

      if (fetchError) {
        logger.error('Error fetching claim for deletion:', fetchError);
        throw new Error('Failed to fetch claim');
      }

      // Check if claim can be deleted (only pending claims)
      if (claim.status !== 'pending') {
        throw new Error('Only pending claims can be deleted');
      }

      // Delete associated attachments from storage
      const { data: attachments } = await supabase
        .from('attachments')
        .select('file_path')
        .eq('claim_id', claimId);

      if (attachments && attachments.length > 0) {
        const filePaths = attachments.map(a => a.file_path);
        await supabase.storage.from('claim-attachments').remove(filePaths);
      }

      // Delete claim (this will cascade delete expense items and attachments)
      const { error } = await supabase
        .from('claims')
        .delete()
        .eq('id', claimId);

      if (error) {
        logger.error('Error deleting claim:', error);
        throw new Error('Failed to delete claim');
      }
    } catch (error) {
      logger.error('Unexpected error in deleteClaim:', error);
      throw new Error('Failed to delete claim');
    }
  }

  // Subscribe to realtime changes
  static subscribeToClaims(
    userId: string,
    callback: (payload: { eventType: string; new: any; old: any }) => void
  ) {
    return supabase
      .channel('claims-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
          filter: `submitted_by=eq.${userId}`,
        },
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();
  }

  // Subscribe to all claims (for managers/admins)
  static subscribeToAllClaims(
    callback: (payload: { eventType: string; new: any; old: any }) => void
  ) {
    return supabase
      .channel('all-claims-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        (payload) => {
          callback({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
        }
      )
      .subscribe();
  }
} 