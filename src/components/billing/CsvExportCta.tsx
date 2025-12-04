import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, Sparkles } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { toast } from 'sonner';

interface CsvExportCtaProps {
  onExport?: () => void;
  startupCount?: number;
}

export const CsvExportCta = ({ onExport, startupCount = 0 }: CsvExportCtaProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useBilling();
  const { deductCredits, checkCredits, getCost } = useCredits();
  
  // CSV export is available on Growth and Scale plans
  const hasExportAccess = subscription.plan === 'growth' || subscription.plan === 'scale';
  const exportCost = getCost('export_csv');
  const canAfford = checkCredits('export_csv');

  const handleExport = async () => {
    if (!user) {
      toast.error('Please sign in to export data');
      navigate('/auth');
      return;
    }

    if (!hasExportAccess) {
      toast.error('CSV export requires Growth plan or higher', {
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/billing'),
        },
      });
      return;
    }

    if (!canAfford) {
      toast.error('Not enough credits for export', {
        description: `CSV export costs ${exportCost} credits`,
        action: {
          label: 'Get Credits',
          onClick: () => navigate('/billing?tab=credits'),
        },
      });
      return;
    }

    const result = await deductCredits('export_csv', {
      description: `Exported ${startupCount} startups to CSV`,
    });

    if (result.success) {
      onExport?.();
      toast.success('Export started', {
        description: `${exportCost} credits deducted`,
      });
    }
  };

  // Not logged in - prompt to sign in
  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
        <Lock className="mr-2 h-4 w-4" />
        Sign in to Export
      </Button>
    );
  }

  // Doesn't have access - show upgrade CTA
  if (!hasExportAccess) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/billing')}
        className="border-primary/50 hover:border-primary hover:bg-primary/5"
      >
        <Sparkles className="mr-2 h-4 w-4 text-primary" />
        Upgrade to Export CSV
      </Button>
    );
  }

  // Has access - show export button
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport}
      disabled={!canAfford}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV ({exportCost} credits)
    </Button>
  );
};
