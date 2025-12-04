import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { BILLING_CONFIG, formatPrice } from '@/config/billing';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditsRemaining: number;
  monthlyCredits: number;
  currentPlan?: string;
}

export const UpgradeModal = ({ 
  open, 
  onOpenChange, 
  creditsRemaining, 
  monthlyCredits,
  currentPlan 
}: UpgradeModalProps) => {
  const navigate = useNavigate();
  const percentRemaining = monthlyCredits > 0 ? Math.round((creditsRemaining / monthlyCredits) * 100) : 0;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/billing');
  };

  const handleBuyCredits = () => {
    onOpenChange(false);
    navigate('/billing?tab=credits');
  };

  // Suggest next tier upgrade
  const getNextPlan = () => {
    if (currentPlan === 'starter') return { key: 'growth', ...BILLING_CONFIG.plans.growth };
    if (currentPlan === 'growth') return { key: 'scale', ...BILLING_CONFIG.plans.scale };
    return null;
  };

  const nextPlan = getNextPlan();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Low Credits Warning</span>
          </div>
          <DialogTitle className="text-xl">Running Low on Credits</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You have <span className="font-semibold text-foreground">{creditsRemaining} credits</span> remaining ({percentRemaining}% of your monthly allocation).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${percentRemaining}%` }}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            {nextPlan && (
              <button
                onClick={handleUpgrade}
                className="w-full p-4 rounded-lg border border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Upgrade to {nextPlan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Get {nextPlan.monthlyCredits.toLocaleString()} credits/month for {formatPrice(nextPlan.monthly.price)}/mo
                    </p>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleBuyCredits}
              className="w-full p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Buy Credit Pack</p>
                  <p className="text-sm text-muted-foreground">
                    One-time purchase starting at {formatPrice(BILLING_CONFIG.creditPacks.pack100.price)}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Remind Me Later
          </Button>
          <Button className="flex-1" onClick={handleUpgrade}>
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
