'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RespondentAuthProps {
  mode: 'login' | 'register';
  caseId?: string;
  token?: string;
}

export default function RespondentAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP verification states
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [emailOTP, setEmailOTP] = useState('');
  const [sentEmailOTP, setSentEmailOTP] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    address: ''
  });

  // Get caseId and token from URL
  const caseId = searchParams.get('caseId');
  const token = searchParams.get('token');
  const message = searchParams.get('message');

  useEffect(() => {
    console.log('🔧 useEffect triggered with token:', token, 'caseId:', caseId);
    // If token is provided, extract email and set mode to register
    if (token && caseId) {
      try {
        let payload;
        
        // Check if it's a demo token (starts with 'demo.')
        if (token.startsWith('demo.')) {
          // Demo token format: demo.base64payload.demo
          const base64Payload = token.split('.')[1];
          payload = JSON.parse(atob(base64Payload));
          console.log('🔧 Decoded demo token payload:', payload);
        } else {
          // Real JWT token
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          payload = JSON.parse(atob(base64));
          console.log('🔧 Decoded JWT token payload:', payload);
        }
        
        if (payload.email) {
          setFormData(prev => ({ ...prev, email: payload.email }));
          setMode('register');
          console.log('🔧 Email extracted from token:', payload.email);
        } else {
          // Fallback for testing
          console.log('🔧 No email in token, using fallback');
          setFormData(prev => ({ ...prev, email: 'test10@example.com' }));
          setMode('register');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        // If token decoding fails, show error
        setError('Invalid invitation link. Please contact the case administrator.');
      }
    }
  }, [token, caseId]);

  const handleAutoLogin = async () => {
    if (!token || !caseId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/respondent/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, caseId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Auto-login successful, redirect to case
        router.push(`/respondent/case/${encodeURIComponent(caseId)}`);
      } else {
        // Token invalid, show login form
        setMode('login');
        setError('Invalid or expired access link. Please log in or register.');
      }
    } catch (error) {
      setError('Failed to verify access link. Please log in or register.');
    } finally {
      setLoading(false);
    }
  };

  // Generate OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };

  // Send email OTP verification
  const sendEmailOTP = async () => {
    const email = formData.email;
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address first',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setSendingOTP(true);
    try {
      const otp = generateOTP();
      setSentEmailOTP(otp);
      
      // Send OTP via email
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'otp-verification',
          email: email,
          otp,
          recipientType: 'respondent'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowOTPDialog(true);
        
        if (data.isDemoOTP) {
          toast({
            title: 'Demo OTP Generated',
            description: data.message || `Demo OTP for ${email}: ${otp} (Check browser console)`,
          });
          console.log(`🔧 Demo OTP for ${email}: ${otp}`);
        } else {
          toast({
            title: 'OTP Sent',
            description: `Email OTP sent to ${email}. Please check your inbox.`,
          });
        }
      } else {
        // Fallback to demo mode if email fails
        console.log(`🔧 OTP for ${email}: ${otp}`);
        setShowOTPDialog(true);
        toast({
          title: 'OTP Generated (Demo Mode)',
          description: `Demo OTP for ${email}: ${otp} (Check browser console)`,
        });
      }
    } catch (error) {
      console.error('OTP sending error:', error);
      // Fallback to demo mode
      const otp = generateOTP();
      setSentEmailOTP(otp);
      console.log(`🔧 OTP for ${email}: ${otp}`);
      setShowOTPDialog(true);
      toast({
        title: 'OTP Generated (Demo Mode)',
        description: `Demo OTP for ${email}: ${otp} (Check browser console)`,
      });
    } finally {
      setSendingOTP(false);
    }
  };

  // Verify email OTP
  const verifyEmailOTP = () => {
    if (emailOTP === sentEmailOTP) {
      setEmailVerified(true);
      setShowOTPDialog(false);
      setEmailOTP('');
      toast({
        title: 'Success',
        description: 'Email verified successfully!',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For registration, require email verification
    if (mode === 'register' && !emailVerified) {
      toast({
        title: 'Email Verification Required',
        description: 'Please verify your email address before registering.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'login' ? '/api/respondent/auth/login' : '/api/respondent/auth/register';
      
      const requestBody = {
        ...formData,
        caseId,
        token
      };
      
      console.log('Sending registration data:', requestBody);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (data.success) {
        toast({
          title: mode === 'login' ? 'Login Successful' : 'Registration Successful',
          description: 'Redirecting to case...',
        });
        
        // Store session token if provided
        if (data.sessionToken) {
          document.cookie = `respondent-session=${data.sessionToken}; path=/; max-age=86400`;
        }
        
        // After auth (register or login), redirect to case page directly
        const targetCaseId = caseId || data.caseId;
        console.log('🔧 Redirecting to case with ID:', targetCaseId);
        if (targetCaseId) {
          router.push(`/respondent/case/${encodeURIComponent(targetCaseId)}`);
        } else {
          setError('No case ID found. Please contact support.');
        }
      } else {
        console.log('Registration failed:', data);
        const message = (data && (data.error || data.message)) || 'Authentication failed';
        setError(message);
        // If user already exists, switch to login automatically
        if (mode === 'register' && /already exists/i.test(message)) {
          setMode('login');
          toast({
            title: 'Account already exists',
            description: 'Please login with your password.',
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Prevent email changes if token is provided
    if (field === 'email' && token) {
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset email verification when email changes
    if (field === 'email') {
      setEmailVerified(false);
    }
  };

  if (loading && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying access link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? 'Respondent Login' : 'Respondent Registration'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Access your case to review and respond'
              : 'Create an account to access your case'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message === 'registration_success' && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                Registration successful! Please log in with your credentials.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="flex-1"
                  readOnly={!!token} // Make email read-only if token is provided
                />
                {mode === 'register' && (
                  <Button
                    type="button"
                    onClick={sendEmailOTP}
                    disabled={sendingOTP || !formData.email || emailVerified}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    {sendingOTP ? 'Sending...' : emailVerified ? '✓ Verified' : 'Verify'}
                  </Button>
                )}
              </div>
              {token && (
                <p className="text-xs text-gray-500 mt-1">
                  Email address is pre-filled from your invitation link
                </p>
              )}
              {mode === 'register' && !token && (
                <p className="text-xs text-gray-500 mt-1">
                  {emailVerified 
                    ? 'Email verified successfully' 
                    : 'Please verify your email address before registering'
                  }
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    placeholder="Confirm your password"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your address"
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (mode === 'register' && !emailVerified)}
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm"
              >
                {mode === 'login' 
                  ? "Don't have an account? Register" 
                  : 'Already have an account? Login'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Verification</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to {formData.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={verifyEmailOTP}
                disabled={emailOTP.length !== 6}
                className="flex-1"
              >
                Verify OTP
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOTPDialog(false);
                  setEmailOTP('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 