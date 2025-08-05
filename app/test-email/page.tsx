'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [emailType, setEmailType] = useState('test');
  const [caseLink, setCaseLink] = useState('http://localhost:3000/dashboard/cases/ARB-2024-001');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmail = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          type: emailType,
          caseLink: emailType === 'case-submission-all-parties' ? caseLink : undefined
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to send email' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/test');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to test connection' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Email Test Page</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test SMTP Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test SMTP Connection'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emailType">Email Type</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Simple Test Email</SelectItem>
                  <SelectItem value="otp">OTP Email</SelectItem>
                  <SelectItem value="case-submission">Case Submission Email</SelectItem>
                  <SelectItem value="case-submission-all-parties">Case Submission (All Parties)</SelectItem>
                  <SelectItem value="draft-saved">Draft Saved Email</SelectItem>
                  <SelectItem value="status-update">Status Update Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailType === 'case-submission-all-parties' && (
              <div>
                <Label htmlFor="caseLink">Case Link</Label>
                <Input
                  id="caseLink"
                  type="url"
                  value={caseLink}
                  onChange={(e) => setCaseLink(e.target.value)}
                  placeholder="Enter case link"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This link will be included in the email for recipients to view the case details.
                </p>
              </div>
            )}

            <Button 
              onClick={testEmail} 
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <p className="font-semibold">{result.success ? 'Success' : 'Error'}</p>
                <p className="mt-2">{result.message || result.error}</p>
                {result.timestamp && (
                  <p className="text-sm mt-2">Timestamp: {new Date(result.timestamp).toLocaleString()}</p>
                )}
                {result.config && (
                  <div className="mt-4 text-sm">
                    <p><strong>SMTP Configuration:</strong></p>
                    <p>Host: {result.config.host}</p>
                    <p>Port: {result.config.port}</p>
                    <p>User: {result.config.user}</p>
                    <p>From: {result.config.from}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 