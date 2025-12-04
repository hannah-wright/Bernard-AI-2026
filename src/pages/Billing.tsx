import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';
import { BILLING_CONFIG, formatPrice, PlanKey } from '@/config/billing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Check, Loader2, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_using', label: 'Not using it enough' },
  { value: 'missing_features', label: 'Missing features I need' },
  { value: 'found_alternative', label: 'Found an alternative' },
  { value: 'temporary_pause', label: 'Just need a temporary break' },
  { value: 'other', label: 'Other reason' },
];

const Billing = () => {
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const {
    subscription,
    loading: billingLoading,
    refreshSubscription,
    createCheckout,
    openCustomerPortal,
    purchaseCredits,
    cancelSubscription,
    pauseSubscription,
    reactivateSubscription,
    upgradeSubscription,
  } = useBilling();

  const [isAnnual, setIsAnnual] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [wantsPause, setWantsPause] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Handle URL params for success/cancel
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const creditsPurchased = searchParams.get('credits_purchased');

    if (success === 'true') {
      toast.success('Subscription activated successfully!');
      refreshSubscription();
    }
    if (canceled === 'true') {
      toast.info('Checkout was cancelled');
    }
    if (creditsPurchased) {
      toast.success(`${creditsPurchased} credits added to your account!`);
      refreshSubscription();
    }
  }, [searchParams, refreshSubscription]);

  const handleSubscribe = async (planKey: PlanKey) => {
    setProcessingAction(planKey);
    const plan = BILLING_CONFIG.plans[planKey];
    const priceId = isAnnual ? plan.annual.priceId : plan.monthly.priceId;
    await createCheckout(priceId);
    setProcessingAction(null);
  };

  const handleUpgrade = async (planKey: PlanKey) => {
    setProcessingAction(planKey);
    const plan = BILLING_CONFIG.plans[planKey];
    const priceId = isAnnual ? plan.annual.priceId : plan.monthly.priceId;
    await upgradeSubscription(priceId);
    setProcessingAction(null);
  };

  const handleCancelOrPause = async () => {
    if (!cancelReason) {
      toast.error('Please select a reason');
      return;
    }

    setProcessingAction('cancel');
    if (wantsPause) {
      await pauseSubscription(cancelReason);
    } else {
      await cancelSubscription(cancelReason, cancelFeedback);
    }
    setProcessingAction(null);
    setCancelDialogOpen(false);
    setCancelReason('');
    setCancelFeedback('');
    setWantsPause(false);
  };

  const handlePurchaseCredits = async (packKey: keyof typeof BILLING_CONFIG.creditPacks) => {
    setProcessingAction(packKey);
    const pack = BILLING_CONFIG.creditPacks[packKey];
    await purchaseCredits(pack.priceId, pack.credits);
    setProcessingAction(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Please sign in to manage billing</h1>
          <p className="text-muted-foreground">You need to be logged in to view your subscription.</p>
        </div>
      </div>
    );
  }

  const currentPlanKey = subscription.plan;
  const planOrder: PlanKey[] = ['starter', 'growth', 'scale'];
  const currentPlanIndex = currentPlanKey ? planOrder.indexOf(currentPlanKey) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Billing & Subscription</h1>
              <p className="text-muted-foreground mt-1">Manage your plan and credits</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshSubscription} disabled={billingLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${billingLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Current Subscription Status */}
          {subscription.subscribed && currentPlanKey && (
            <Card className="mb-8 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Current Plan: {BILLING_CONFIG.plans[currentPlanKey].name}
                      {subscription.isAnnual && <Badge variant="secondary">Annual</Badge>}
                      {subscription.cancelAtPeriodEnd && <Badge variant="destructive">Cancelling</Badge>}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {subscription.subscriptionEnd && (
                        <>
                          {subscription.cancelAtPeriodEnd ? 'Access until: ' : 'Renews: '}
                          {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {subscription.cancelAtPeriodEnd ? (
                      <Button
                        variant="default"
                        onClick={reactivateSubscription}
                        disabled={processingAction === 'reactivate'}
                      >
                        {processingAction === 'reactivate' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Reactivate
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={openCustomerPortal}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Payment
                        </Button>
                        <Button variant="ghost" onClick={() => setCancelDialogOpen(true)}>
                          Cancel Plan
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'font-semibold' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span className={`text-sm ${isAnnual ? 'font-semibold' : 'text-muted-foreground'}`}>
              Annual <Badge variant="secondary" className="ml-1">Save 15%</Badge>
            </span>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {(Object.entries(BILLING_CONFIG.plans) as [PlanKey, typeof BILLING_CONFIG.plans[PlanKey]][]).map(
              ([key, plan], index) => {
                const isCurrentPlan = key === currentPlanKey && subscription.isAnnual === isAnnual;
                const isDowngrade = currentPlanIndex > index;
                const price = isAnnual ? plan.annual : plan.monthly;

                const displayPrice = isAnnual && 'monthlyEquivalent' in price ? price.monthlyEquivalent : price.price;

                return (
                  <Card
                    key={key}
                    className={`relative ${isCurrentPlan ? 'border-primary ring-1 ring-primary' : ''} ${
                      key === 'growth' ? 'md:scale-105' : ''
                    }`}
                  >
                    {key === 'growth' && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge variant="outline" className="absolute -top-3 right-4">
                        Current Plan
                      </Badge>
                    )}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        <span className="text-3xl font-bold text-foreground">
                          {formatPrice(isAnnual ? displayPrice : price.price)}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                        {isAnnual && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Billed {formatPrice(price.price)}/year
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isCurrentPlan ? (
                        <Button className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : subscription.subscribed ? (
                        <Button
                          className="w-full"
                          variant={isDowngrade ? 'outline' : 'default'}
                          onClick={() => handleUpgrade(key)}
                          disabled={processingAction === key}
                        >
                          {processingAction === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isDowngrade ? 'Downgrade' : 'Upgrade'}
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleSubscribe(key)}
                          disabled={processingAction === key}
                        >
                          {processingAction === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Subscribe
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              }
            )}
          </div>

          {/* Credit Packs - Only show for subscribed users */}
          {subscription.subscribed && (
            <>
              <h2 className="text-xl font-semibold mb-4">Need More Credits?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Credit packs are priced higher than plan credits. Consider upgrading your plan for better value.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {(
                  Object.entries(BILLING_CONFIG.creditPacks) as [
                    keyof typeof BILLING_CONFIG.creditPacks,
                    typeof BILLING_CONFIG.creditPacks[keyof typeof BILLING_CONFIG.creditPacks]
                  ][]
                ).map(([key, pack]) => (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{pack.name}</CardTitle>
                      <CardDescription>
                        {formatPrice(pack.price)} ({formatPrice(pack.perCredit)}/credit)
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handlePurchaseCredits(key)}
                        disabled={processingAction === key}
                      >
                        {processingAction === key ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Purchase
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Cancel/Pause Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              We're sorry to see you go. Please let us know why you're leaving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value}>{reason.label}</Label>
                </div>
              ))}
            </RadioGroup>

            {cancelReason && (
              <div className="space-y-2">
                <Label htmlFor="feedback">Additional feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us more..."
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Switch checked={wantsPause} onCheckedChange={setWantsPause} id="pause" />
              <Label htmlFor="pause" className="flex-1">
                <span className="font-medium">Pause instead of cancel</span>
                <span className="block text-sm text-muted-foreground">
                  Keep your account but stop billing temporarily
                </span>
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrPause}
              disabled={!cancelReason || processingAction === 'cancel'}
            >
              {processingAction === 'cancel' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {wantsPause ? 'Pause Subscription' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
