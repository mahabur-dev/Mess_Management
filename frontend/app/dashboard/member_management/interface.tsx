// ─── Props & Types ─────────────────────────────────────────────────────────

interface MembersSectionProps {
  organizerId?: string;           // Made optional (not heavily used now)
}

type MembershipRole = 'MANAGER' | 'MEMBER';

interface Mess {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  mess_id: string;
  user_id: string;
  role: MembershipRole;
  joined_at: string;
  left_at?: string | null;
  is_active: boolean;
  created_by?: string | null;

  user: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string | null;
    phone?: string | null;
    role?: string;
  };

  mess: {
    id: string;
    name: string;
  };
}

// ─── Component Props ───────────────────────────────────────────────────────

interface MemberCardProps {
  member: Member;
  onEditRole: (member: Member, newRole: MembershipRole) => void;   // Cleaner
  onRemove: (member: Member) => void;
  removingId: string | null;
}

interface EditRoleModalProps {
  member: Member;
  onClose: () => void;
  onSave: (memberId: string, role: MembershipRole, messId: string) => Promise<void>;
}

interface AddMemberModalProps {
  onClose: () => void;
  onAdd: (data: { 
    email: string; 
    role: MembershipRole; 
    messId: string 
  }) => Promise<void>;
}

// Optional: Add this for better type safety in modals
export interface AddMemberFormData {
  email: string;
  role: MembershipRole;
  messId: string;
}