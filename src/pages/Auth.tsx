import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Ticket, Mail } from 'lucide-react';
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
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; inviteCode?: string }>({});
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

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

  const getLoginErrorMessage = (error: Error): { title: string; description: string } => {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid login credentials')) {
      return {
        title: 'Invalid credentials',
        description: 'The email or password you entered is incorrect. Please try again.',
      };
    }
    if (message.includes('email not confirmed')) {
      return {
        title: 'Email not verified',
        description: 'Please check your inbox and click the confirmation link before signing in.',
      };
    }
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return {
        title: 'Too many attempts',
        description: 'Please wait a few minutes before trying again.',
      };
    }
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection error',
        description: 'Unable to connect. Please check your internet connection and try again.',
      };
    }
    return {
      title: 'Login failed',
      description: error.message || 'An unexpected error occurred. Please try again.',
    };
  };

  const getSignupErrorMessage = (error: Error): { title: string; description: string } => {
    const message = error.message.toLowerCase();
    
    if (message.includes('user already registered') || message.includes('already been registered')) {
      return {
        title: 'Account already exists',
        description: 'An account with this email already exists. Please sign in instead.',
      };
    }
    if (message.includes('password') && message.includes('weak')) {
      return {
        title: 'Weak password',
        description: 'Please choose a stronger password with at least 6 characters.',
      };
    }
    if (message.includes('invalid email') || message.includes('email') && message.includes('invalid')) {
      return {
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
      };
    }
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return {
        title: 'Too many attempts',
        description: 'Please wait a few minutes before trying again.',
      };
    }
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection error',
        description: 'Unable to connect. Please check your internet connection and try again.',
      };
    }
    return {
      title: 'Sign up failed',
      description: error.message || 'An unexpected error occurred. Please try again.',
    };
  };

  const getInviteErrorMessage = (errorMessage: string): { title: string; description: string } => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('invalid invite code')) {
      return {
        title: 'Invalid invite code',
        description: 'The invite code you entered is not valid. Please check and try again.',
      };
    }
    if (message.includes('expired')) {
      return {
        title: 'Invite code expired',
        description: 'This invite code has expired. Please contact us for a new code.',
      };
    }
    if (message.includes('maximum uses')) {
      return {
        title: 'Invite code limit reached',
        description: 'This invite code has already been used the maximum number of times.',
      };
    }
    if (message.includes('already redeemed')) {
      return {
        title: 'Code already used',
        description: 'You have already redeemed an invite code on this account.',
      };
    }
    if (message.includes('active subscription')) {
      return {
        title: 'Already subscribed',
        description: 'You already have an active subscription and cannot use an invite code.',
      };
    }
    return {
      title: 'Could not redeem code',
      description: errorMessage || 'Please try again or contact support.',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const { title, description } = getLoginErrorMessage(error);
          toast({ title, description, variant: 'destructive' });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName, inviteCode);
        if (error) {
          const { title, description } = getSignupErrorMessage(error);
          toast({ title, description, variant: 'destructive' });
        } else {
          setShowEmailConfirmation(true);
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
        {showEmailConfirmation ? (
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">1</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">Almost there!</h1>
              <p className="text-muted-foreground">
                Please check your inbox to confirm your email address.
              </p>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="pt-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="default"
                  onClick={async () => {
                    setIsResendingEmail(true);
                    try {
                      const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                      });
                      if (error) {
                        toast({
                          title: 'Could not resend email',
                          description: error.message.includes('rate') 
                            ? 'Please wait a few minutes before requesting another email.' 
                            : error.message,
                          variant: 'destructive',
                        });
                      } else {
                        toast({
                          title: 'Email sent!',
                          description: 'Please check your inbox for the confirmation link.',
                        });
                      }
                    } catch (err) {
                      toast({
                        title: 'Error',
                        description: 'Unable to resend email. Please try again.',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsResendingEmail(false);
                    }
                  }}
                  disabled={isResendingEmail}
                  className="text-sm"
                >
                  {isResendingEmail ? 'Sending...' : 'Resend confirmation email'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEmailConfirmation(false)}
                  className="text-sm"
                >
                  Back to sign up
                </Button>
              </div>
            </div>
          </div>
        ) : (
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
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
        )}
      </div>
    </div>
  );
};

export default Auth;
