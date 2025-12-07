/**
 * TeamManagement Component
 * 
 * Allows organization owners and admins to invite/remove team members.
 * Growth plan: 3 users max
 * Scale plan: Unlimited users
 * 
 * Roles:
 * - Owner (superadmin): Full control, can promote/demote admins
 * - Admin: Can invite/remove members, access billing
 * - Member: Standard access
 */

import { useState } from 'react';
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  ShieldCheck,
  Trash2,
  Mail,
  Clock,
  X,
  Loader2,
  Lock,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOrganization, OrganizationMember, OrganizationInvite } from '@/hooks/useOrganization';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '@/hooks/useBilling';
import { BILLING_CONFIG } from '@/config/billing';

export const TeamManagement = () => {
  const navigate = useNavigate();
  const { subscription } = useBilling();
  const {
    organization,
    members,
    invites,
    currentUserMembership,
    isLoading,
    isOwner,
    isAdmin,
    canManageTeam,
    canAddMembers,
    remainingSlots,
    maxMembers,
    isUnlimitedMembers,
    createOrganization,
    inviteMember,
    cancelInvite,
    removeMember,
    promoteMember,
    demoteMember,
    isCreating,
    isInviting,
    isRemoving,
    isPromoting,
    isDemoting,
  } = useOrganization();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [memberToPromote, setMemberToPromote] = useState<OrganizationMember | null>(null);
  const [memberToDemote, setMemberToDemote] = useState<OrganizationMember | null>(null);
  const [inviteToCancel, setInviteToCancel] = useState<OrganizationInvite | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [showCreateOrgDialog, setShowCreateOrgDialog] = useState(false);

  // If no org and user has a Growth+ plan, prompt to create
  const canHaveOrg = maxMembers > 1 || isUnlimitedMembers;

  // Get saved filters limit for display
  const savedFiltersLimit = subscription.plan 
    ? BILLING_CONFIG.plans[subscription.plan]?.savedFilters ?? 0 
    : 0;
  const savedFiltersDisplay = savedFiltersLimit === -1 ? 'Unlimited' : savedFiltersLimit.toString();

  const handleInvite = () => {
    if (!canAddMembers) {
      setShowUpgradeDialog(true);
      return;
    }
    setShowInviteDialog(true);
  };

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMember({ email: inviteEmail.trim(), role: inviteRole });
    setInviteEmail('');
    setInviteRole('member');
    setShowInviteDialog(false);
  };

  const handleCopyInviteLink = async (invite: OrganizationInvite) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${invite.token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(invite.id);
    setTimeout(() => setCopiedInvite(null), 2000);
  };

  const handleCreateOrg = () => {
    if (!orgName.trim()) return;
    createOrganization(orgName.trim());
    setOrgName('');
    setShowCreateOrgDialog(false);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge variant="default" className="text-xs bg-amber-500 hover:bg-amber-600">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="secondary" className="text-xs">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return null;
    }
  };

  // Feature not available for lower tiers - show prominent upgrade prompt
  if (!canHaveOrg) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Collaboration
            <Badge variant="outline" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Growth+
            </Badge>
          </CardTitle>
          <CardDescription>
            Invite your team to collaborate on deal sourcing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-muted border-2 border-background flex items-center justify-center"
                >
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-medium">Collaborate with your team</p>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Each member gets {savedFiltersDisplay === '0' ? '3' : savedFiltersDisplay} saved thesis profiles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Share deal flow insights
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Designate team admins
                </li>
              </ul>
            </div>
            <Button onClick={() => navigate('/billing')} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Growth
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No organization yet - prompt to create
  if (!organization && canHaveOrg) {
    return (
      <>
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Set Up Your Team
            </CardTitle>
            <CardDescription>
              Create an organization to start inviting colleagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Ready to collaborate?</p>
                <p className="text-sm text-muted-foreground">
                  You can invite up to {isUnlimitedMembers ? 'unlimited' : maxMembers} team members.
                  <br />Each gets their own {savedFiltersDisplay} saved thesis profiles.
                </p>
              </div>
              <Button onClick={() => setShowCreateOrgDialog(true)} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreateOrgDialog} onOpenChange={setShowCreateOrgDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Give your organization a name (e.g., your firm's name)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="e.g., Acme Ventures"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                maxLength={50}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOrgDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrg} disabled={!orgName.trim() || isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {organization?.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {members.length} member{members.length !== 1 ? 's' : ''}
                {!isUnlimitedMembers && ` of ${maxMembers}`}
                <span className="text-muted-foreground/50">•</span>
                {getRoleBadge(currentUserMembership?.role || 'member') || (
                  <span className="text-xs">Member</span>
                )}
              </CardDescription>
            </div>
            {canManageTeam && (
              <Button onClick={handleInvite} size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Members List */}
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.fullName, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {member.fullName || member.email}
                      </span>
                      {getRoleBadge(member.role)}
                    </div>
                    {member.fullName && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </div>
                
                {/* Actions dropdown for owners/admins */}
                {canManageTeam && member.role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Owner-only: promote/demote */}
                      {isOwner && member.role === 'member' && (
                        <DropdownMenuItem onClick={() => setMemberToPromote(member)}>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Promote to Admin
                        </DropdownMenuItem>
                      )}
                      {isOwner && member.role === 'admin' && (
                        <DropdownMenuItem onClick={() => setMemberToDemote(member)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Remove Admin Role
                        </DropdownMenuItem>
                      )}
                      {isOwner && <DropdownMenuSeparator />}
                      
                      {/* Remove member (owner can remove anyone, admin can only remove members) */}
                      {(isOwner || (isAdmin && member.role === 'member')) && (
                        <DropdownMenuItem 
                          onClick={() => setMemberToRemove(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Team
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          {canManageTeam && invites.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Invites ({invites.length})
              </p>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{invite.email}</p>
                        {invite.role === 'admin' && (
                          <Badge variant="outline" className="text-xs">Admin</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invite)}
                      title="Copy invite link"
                    >
                      {copiedInvite === invite.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInviteToCancel(invite)}
                      className="text-destructive hover:text-destructive"
                      title="Cancel invite"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info footer */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Each member gets {savedFiltersDisplay} saved thesis profiles
              </span>
              {canManageTeam && !isUnlimitedMembers && (
                <span>
                  {remainingSlots > 0 
                    ? `${remainingSlots} seat${remainingSlots !== 1 ? 's' : ''} available`
                    : (
                      <button
                        onClick={() => setShowUpgradeDialog(true)}
                        className="text-primary hover:underline"
                      >
                        Need more seats?
                      </button>
                    )}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join {organization?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            {isOwner && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'member' | 'admin')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Member
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteRole === 'admin' 
                    ? 'Admins can invite/remove members and access billing settings'
                    : 'Members have standard access to the platform'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={!inviteEmail.trim() || isInviting}>
              {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Need More Team Members?</DialogTitle>
            <DialogDescription>
              You've reached your limit of {maxMembers} team members
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
              <p className="font-medium mb-2">Upgrade to Scale Plan</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <strong>Unlimited</strong> team members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Unlimited saved thesis profiles per user
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  1,800 credits/month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Priority support
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Maybe Later
            </Button>
            <Button onClick={() => navigate('/billing')}>
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote to Admin Confirmation */}
      <AlertDialog open={!!memberToPromote} onOpenChange={() => setMemberToPromote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToPromote?.fullName || memberToPromote?.email} will be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Invite and remove team members</li>
                <li>Access billing and subscription settings</li>
                <li>Cancel pending invites</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToPromote) {
                  promoteMember(memberToPromote.id);
                  setMemberToPromote(null);
                }
              }}
            >
              {isPromoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Promote to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demote Admin Confirmation */}
      <AlertDialog open={!!memberToDemote} onOpenChange={() => setMemberToDemote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Role?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToDemote?.fullName || memberToDemote?.email} will no longer be able to invite/remove members or access billing settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToDemote) {
                  demoteMember(memberToDemote.id);
                  setMemberToDemote(null);
                }
              }}
            >
              {isDemoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Admin Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove?.fullName || memberToRemove?.email} will lose access to {organization?.name}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToRemove) {
                  removeMember(memberToRemove.id);
                  setMemberToRemove(null);
                }
              }}
            >
              {isRemoving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Confirmation */}
      <AlertDialog open={!!inviteToCancel} onOpenChange={() => setInviteToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invite?</AlertDialogTitle>
            <AlertDialogDescription>
              The invite to {inviteToCancel?.email} will be cancelled and the link will no longer work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (inviteToCancel) {
                  cancelInvite(inviteToCancel.id);
                  setInviteToCancel(null);
                }
              }}
            >
              Cancel Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
