'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function TestDemoOTPPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOTP, setSentOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const sendOTP = async (testMode: boolean = false) => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: 'otp',
          testMode: testMode
        }),
      });

      const result = await response.json();
      
      if (result.success && result.otp) {
        setSentOTP(result.otp);
        setIsDemoMode(result.isDemoOTP || false);
        
        if (result.isDemoOTP) {
          toast({
            title: 'Demo OTP Generated',
            description: result.message || `Demo OTP: ${result.otp}`,
          });
          console.log(`🔧 Demo OTP for ${email}: ${result.otp}`);
        } else {
          toast({
            title: 'OTP Sent',
            description: `Email OTP sent to ${email}. Please check your inbox.`,
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send OTP',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = () => {
    if (otp === sentOTP) {
      toast({
        title: 'Success',
        description: 'OTP verified successfully!',
      });
      setOtp('');
      setSentOTP('');
      setIsDemoMode(false);
    } else {
      toast({
        title: 'Error',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Demo OTP Test</CardTitle>
            <CardDescription>
              Test the demo OTP functionality when Gmail daily limit is exceeded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => sendOTP(false)} 
                disabled={isLoading || !email}
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send Real OTP'}
              </Button>
              
              <Button 
                onClick={() => sendOTP(true)} 
                disabled={isLoading || !email}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Test Demo OTP'}
              </Button>
            </div>

            {sentOTP && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  {isDemoMode ? 'Demo OTP Generated' : 'OTP Sent'}
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  {isDemoMode 
                    ? 'Gmail daily limit exceeded. Use this demo OTP:'
                    : 'Check your email for the OTP:'
                  }
                </p>
                <p className="text-2xl font-mono font-bold text-blue-900 text-center">
                  {sentOTP}
                </p>
                {isDemoMode && (
                  <p className="text-xs text-blue-600 mt-2 text-center">
                    (Also check browser console)
                  </p>
                )}
              </div>
            )}

            {sentOTP && (
              <div>
                <label className="block text-sm font-medium mb-2">Enter OTP</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <Button 
                  onClick={verifyOTP} 
                  disabled={otp.length !== 6}
                  className="w-full mt-2"
                >
                  Verify OTP
                </Button>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Instructions:</strong></p>
              <p>1. Enter an email address</p>
              <p>2. Click "Send Real OTP" to test normal email sending</p>
              <p>3. Click "Test Demo OTP" to simulate Gmail daily limit error</p>
              <p>4. Use the generated OTP to verify functionality</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
