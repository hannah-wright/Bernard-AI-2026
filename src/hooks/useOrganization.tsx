/**
 * useOrganization Hook
 * 
 * Manages organization/team functionality.
 * Growth plan: 3 users max
 * Scale plan: Unlimited users
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';
import { BILLING_CONFIG } from '@/config/billing';
import { toast } from 'sonner';

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  subscriptionTier?: string;
  maxMembers: number;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy?: string;
  joinedAt: string;
  // Joined from profiles
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export function useOrganization() {
  const { user } = useAuth();
  const { subscription } = useBilling();
  const queryClient = useQueryClient();

  // Get max members based on plan
  // Free/Trial users can invite up to 3 team members (total 4 users)
  const getMaxMembers = (): number => {
    if (!subscription.plan || subscription.plan === 'trial' || subscription.plan === 'free') {
      return 4; // Owner + 3 invited team members
    }
    const plan = BILLING_CONFIG.plans[subscription.plan];
    return plan?.users ?? 4;
  };

  const maxMembers = getMaxMembers();
  const isUnlimitedMembers = maxMembers === -1;

  // Fetch user's organization
  const {
    data: organization,
    isLoading: orgLoading,
  } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: async (): Promise<Organization | null> => {
      if (!user) return null;

      // First check if user is an owner
      const { data: ownedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedOrg) {
        return {
          id: ownedOrg.id,
          name: ownedOrg.name,
          ownerId: ownedOrg.owner_id,
          subscriptionTier: ownedOrg.subscription_tier,
          maxMembers: ownedOrg.max_members,
          createdAt: ownedOrg.created_at,
        };
      }

      // Check if user is a member of an org
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .single();

        if (org) {
          return {
            id: org.id,
            name: org.name,
            ownerId: org.owner_id,
            subscriptionTier: org.subscription_tier,
            maxMembers: org.max_members,
            createdAt: org.created_at,
          };
        }
      }

      return null;
    },
    enabled: !!user,
  });

  // Get current user's membership
  const currentUserMembership = members.find(m => m.userId === user?.id);
  
  // Check if current user is the owner (superadmin)
  const isOwner = organization?.ownerId === user?.id;
  
  // Check if current user is an admin (or owner - owners have all admin powers)
  const isAdmin = isOwner || currentUserMembership?.role === 'admin';
  
  // Can manage team (owner or admin)
  const canManageTeam = isAdmin;

  // Fetch organization members
  const {
    data: members = [],
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ['organization-members', organization?.id],
    queryFn: async (): Promise<OrganizationMember[]> => {
      if (!organization) return [];

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          profiles:user_id (email, full_name, avatar_url)
        `)
        .eq('organization_id', organization.id);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        organizationId: m.organization_id,
        userId: m.user_id,
        role: m.role,
        invitedBy: m.invited_by,
        joinedAt: m.joined_at,
        email: m.profiles?.email,
        fullName: m.profiles?.full_name,
        avatarUrl: m.profiles?.avatar_url,
      }));
    },
    enabled: !!organization,
  });

  // Fetch pending invites (owners and admins can see)
  const {
    data: invites = [],
    isLoading: invitesLoading,
  } = useQuery({
    queryKey: ['organization-invites', organization?.id, isAdmin],
    queryFn: async (): Promise<OrganizationInvite[]> => {
      if (!organization || !isAdmin) return [];

      const { data, error } = await supabase
        .from('organization_invites')
        .select('*')
        .eq('organization_id', organization.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      return (data || []).map((i: any) => ({
        id: i.id,
        organizationId: i.organization_id,
        email: i.email,
        role: i.role,
        invitedBy: i.invited_by,
        token: i.token,
        expiresAt: i.expires_at,
        acceptedAt: i.accepted_at,
        createdAt: i.created_at,
      }));
    },
    enabled: !!organization && isAdmin,
  });

  // Can add more members?
  const canAddMembers = isUnlimitedMembers || (members.length + invites.length) < maxMembers;
  const remainingSlots = isUnlimitedMembers ? Infinity : Math.max(0, maxMembers - members.length - invites.length);

  // Create organization (for new subscribers)
  const createOrganization = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name,
          owner_id: user.id,
          subscription_tier: subscription.plan,
          max_members: maxMembers,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as a member
      await supabase
        .from('organization_members')
        .insert({
          organization_id: data.id,
          user_id: user.id,
          role: 'owner',
        });

      // Update profile with org
      await supabase
        .from('profiles')
        .update({ organization_id: data.id })
        .eq('id', user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Organization created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Invite member (owners and admins can invite)
  const inviteMember = useMutation({
    mutationFn: async ({ email, role = 'member' }: { email: string; role?: string }) => {
      if (!user || !organization) throw new Error('No organization');
      if (!isAdmin) throw new Error('Only owners and admins can invite members');
      if (!canAddMembers) throw new Error(`You've reached the maximum of ${maxMembers} team members. Upgrade to Scale for unlimited.`);
      
      // Admins cannot invite other admins - only owners can
      if (role === 'admin' && !isOwner) {
        throw new Error('Only the owner can invite admins');
      }

      // Check if already a member
      const existingMember = members.find(m => m.email?.toLowerCase() === email.toLowerCase());
      if (existingMember) throw new Error('This user is already a member');

      // Check if already invited
      const existingInvite = invites.find(i => i.email.toLowerCase() === email.toLowerCase());
      if (existingInvite) throw new Error('This user already has a pending invite');

      const { data, error } = await supabase
        .from('organization_invites')
        .insert({
          organization_id: organization.id,
          email: email.toLowerCase(),
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('This email has already been invited');
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      toast.success(`Invite sent to ${data.email}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Cancel invite (owners and admins can cancel)
  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      if (!isAdmin) throw new Error('Only owners and admins can cancel invites');

      const { error } = await supabase
        .from('organization_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-invites'] });
      toast.success('Invite cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Remove member (owners and admins can remove members, but admins cannot remove other admins)
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isAdmin) throw new Error('Only owners and admins can remove members');

      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');
      if (member.role === 'owner') throw new Error('Cannot remove the owner');
      
      // Admins cannot remove other admins - only owner can
      if (member.role === 'admin' && !isOwner) {
        throw new Error('Only the owner can remove admins');
      }

      // Remove from organization_members
      const { error: memberError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (memberError) throw memberError;

      // Clear organization from their profile
      await supabase
        .from('profiles')
        .update({ organization_id: null })
        .eq('id', member.userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Member removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Promote member to admin (owner only)
  const promoteMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isOwner) throw new Error('Only the owner can promote members to admin');

      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');
      if (member.role === 'owner') throw new Error('Cannot change owner role');
      if (member.role === 'admin') throw new Error('Member is already an admin');

      const { error } = await supabase
        .from('organization_members')
        .update({ role: 'admin' })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Member promoted to admin');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Demote admin to member (owner only)
  const demoteMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isOwner) throw new Error('Only the owner can demote admins');

      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');
      if (member.role === 'owner') throw new Error('Cannot change owner role');
      if (member.role === 'member') throw new Error('Member is not an admin');

      const { error } = await supabase
        .from('organization_members')
        .update({ role: 'member' })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members'] });
      toast.success('Admin demoted to member');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Accept invite (for invited users)
  const acceptInvite = useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error('Must be logged in');

      // Find the invite
      const { data: invite, error: findError } = await supabase
        .from('organization_invites')
        .select('*, organizations(*)')
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (findError || !invite) throw new Error('Invalid or expired invite');

      // Check if invite is for this user's email
      if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
        throw new Error('This invite is for a different email address');
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: invite.organization_id,
          user_id: user.id,
          role: invite.role,
          invited_by: invite.invited_by,
        });

      if (memberError) {
        if (memberError.code === '23505') throw new Error('You are already a member of this organization');
        throw memberError;
      }

      // Mark invite as accepted
      await supabase
        .from('organization_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id);

      // Update profile
      await supabase
        .from('profiles')
        .update({ organization_id: invite.organization_id })
        .eq('id', user.id);

      return invite;
    },
    onSuccess: (invite: any) => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success(`You've joined ${invite.organizations?.name || 'the organization'}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    organization,
    members,
    invites,
    currentUserMembership,
    isLoading: orgLoading || membersLoading || invitesLoading,
    
    // Permissions
    isOwner,
    isAdmin,
    canManageTeam,
    canAddMembers,
    remainingSlots,
    maxMembers,
    isUnlimitedMembers,
    
    // Actions
    createOrganization: createOrganization.mutate,
    inviteMember: inviteMember.mutate,
    cancelInvite: cancelInvite.mutate,
    removeMember: removeMember.mutate,
    promoteMember: promoteMember.mutate,
    demoteMember: demoteMember.mutate,
    acceptInvite: acceptInvite.mutate,
    
    // Loading states
    isCreating: createOrganization.isPending,
    isInviting: inviteMember.isPending,
    isRemoving: removeMember.isPending,
    isPromoting: promoteMember.isPending,
    isDemoting: demoteMember.isPending,
  };
}

