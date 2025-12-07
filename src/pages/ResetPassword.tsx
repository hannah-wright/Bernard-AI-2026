/**
 * ResetPassword Page
 * 
 * Handles password reset when user clicks the link from their email.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters');

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      // Supabase will automatically pick up the session from the URL
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        // If no session, maybe we're loading from the hash
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || session) {
            setIsValidSession(true);
          }
        });

        // Cleanup subscription
        return () => subscription.unsubscribe();
      }
      
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const validateForm = () => {
    setError('');

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        if (error.message.includes('same')) {
          setError('New password must be different from your current password');
        } else {
          setError(error.message);
        }
        toast({
          title: 'Error resetting password',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setIsSuccess(true);
        toast({
          title: 'Password updated!',
          description: 'Your password has been reset successfully.',
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to login
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        {isSuccess ? (
          // Success state
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                Password Reset Complete
              </h1>
              <p className="text-muted-foreground">
                Your password has been updated successfully.
              </p>
            </div>

            <Button onClick={() => navigate('/')} className="mt-6">
              Continue to Dashboard
            </Button>
          </div>
        ) : !isValidSession ? (
          // Invalid/expired link
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
                <KeyRound className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                Invalid or Expired Link
              </h1>
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired.
              </p>
              <p className="text-sm text-muted-foreground">
                Please request a new password reset link.
              </p>
            </div>

            <Button onClick={() => navigate('/auth')} variant="outline" className="mt-6">
              Back to Login
            </Button>
          </div>
        ) : (
          // Reset password form
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight">
                Create New Password
              </h1>
              <p className="mt-2 text-muted-foreground">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    className="bg-background pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="bg-background"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Reset Password'}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              Password must be at least 6 characters long
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;

