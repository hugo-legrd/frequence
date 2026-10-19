import { supabase } from './supabase';

export type ReportReason = 'spam' | 'harassment' | 'fake' | 'inappropriate' | 'other';

export const REPORT_REASONS : { key: ReportReason; label: string }[] = [
  { key: 'spam', label: 'Spam' },
  { key: 'harassment', label: 'Harcèlement ou intimidation' },
  { key: 'fake', label: 'Faux compte ou usurpation' },
  { key: 'inappropriate', label: 'Contenu inapproprié' },
  { key: 'other', label: 'Autre' },
];

// BLoque un utilisateur (supprime aussi les abonnements et demandes, côté serveur)
export async function blockUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('block_user', { target: userId });
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

export async function unblockUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('unblock_user', { target: userId });
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

export async function reportUser(
  reportedId: string,
  reason: ReportReason,
  details?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    reason,
    details: details?.trim() || null,
  });

  if (error) {
    console.error(error);
    return false;
  }
  return true;
}