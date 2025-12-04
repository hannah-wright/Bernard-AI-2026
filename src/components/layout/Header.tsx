import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useBilling } from '@/hooks/useBilling';
import { BILLING_CONFIG } from '@/config/billing';
import { Search, Bell, User, LogOut, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { subscription } = useBilling();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const planName = subscription.plan 
    ? BILLING_CONFIG.plans[subscription.plan].name 
    : 'Free';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-sm font-bold text-background">BA</span>
              </div>
              <span className="font-semibold text-lg">BernardAI</span>
            </a>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-sm font-medium text-foreground">
                Dashboard
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Alerts
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Saved
              </a>
              <a href="/billing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-success" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {planName} Plan
                      {subscription.isAnnual && ' (Annual)'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/billing')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing & Plans
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
            
            {user && !subscription.subscribed && (
              <Button size="sm" className="hidden sm:flex" onClick={() => navigate('/billing')}>
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
