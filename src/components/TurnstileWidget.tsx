'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';
import { AlertCircle, Shield } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileWidget({ 
  onVerify, 
  onError, 
  onExpire, 
  className = '' 
}: TurnstileWidgetProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSuccess = (token: string) => {
    setIsVerified(true);
    setHasError(false);
    setIsLoading(false);
    onVerify(token);
  };

  const handleError = () => {
    setIsVerified(false);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleExpire = () => {
    setIsVerified(false);
    setIsLoading(true);
    onExpire?.();
  };

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">
            CAPTCHA configuration error. Please check environment variables.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center space-x-2">
        <Shield className={`h-4 w-4 ${
          isVerified ? 'text-green-600' : 
          hasError ? 'text-red-600' : 
          'text-blue-600'
        }`} />
        <span className={`text-sm font-medium ${
          isVerified ? 'text-green-600' : 
          hasError ? 'text-red-600' : 
          'text-slate-600'
        }`}>
          {isVerified ? 'Verification complete' : 
           hasError ? 'Verification failed' : 
           isLoading ? 'Loading verification...' : 
           'Please verify you\'re human'}
        </span>
      </div>

      {/* Turnstile widget */}
      <div className="flex justify-center">
        <Turnstile
          siteKey={siteKey}
          onSuccess={handleSuccess}
          onError={handleError}
          onExpire={handleExpire}
          onLoad={() => setIsLoading(false)}
          options={{
            theme: 'light',
            size: 'normal',
            action: 'transcript-request',
            cData: 'reel-recap-app'
          }}
        />
      </div>

      {/* Error message */}
      {hasError && (
        <div className="text-center">
          <p className="text-sm text-red-600">
            Verification failed. Please try again or refresh the page.
          </p>
        </div>
      )}
    </div>
  );
}