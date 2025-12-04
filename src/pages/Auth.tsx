import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Ticket } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [searchParams] = useSearchParams();
  const hasInviteCode = !!searchParams.get('code');
  const [isLogin, setIsLogin] = useState(!hasInviteCode); // Default to signup if invite code present
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; inviteCode?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // If user just signed up and has an invite code, try to redeem it
      if (inviteCode && !isLogin) {
        redeemInviteCode();
      } else {
        navigate('/');
      }
    }
  }, [user]);

  const redeemInviteCode = async () => {
    if (!inviteCode || isRedeemingCode) return;
    
    setIsRedeemingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-invite', {
        body: { code: inviteCode },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Trial activated!',
          description: data.message,
        });
      } else {
        toast({
          title: 'Could not redeem invite code',
          description: data.error || 'Please contact support.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error redeeming invite code:', err);
      toast({
        title: 'Error',
        description: 'Failed to redeem invite code. You can try again from your account settings.',
        variant: 'destructive',
      });
    } finally {
      setIsRedeemingCode(false);
      navigate('/');
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; inviteCode?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    // Require invite code for signup
    if (!isLogin && !inviteCode.trim()) {
      newErrors.inviteCode = 'An invite code is required to create an account';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Login failed',
              description: 'Invalid email or password. Please try again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: 'Account exists',
              description: 'An account with this email already exists. Please log in instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: inviteCode 
              ? 'Activating your trial...' 
              : 'Please check your email to confirm your account.',
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Button>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight">BernardAI</h1>
            <p className="mt-2 text-muted-foreground">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Invite Code
                    <span className="text-xs text-destructive">*</span>
                  </Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value.toUpperCase());
                      setErrors((prev) => ({ ...prev, inviteCode: undefined }));
                    }}
                    placeholder="INVITE-CODE"
                    className={`bg-background font-mono uppercase ${errors.inviteCode ? 'border-destructive' : ''}`}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the invite code you received to create your account.
                  </p>
                  {errors.inviteCode && (
                    <p className="text-sm text-destructive">{errors.inviteCode}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com"
                className={`bg-background ${errors.email ? 'border-destructive' : ''}`}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`bg-background pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isRedeemingCode}
            >
              {isSubmitting ? 'Please wait...' : isRedeemingCode ? 'Activating trial...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
