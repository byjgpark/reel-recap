'use client';

import { useState } from 'react';
import { X, Star, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiHeaders } from '@/utils/auth';
import { trackEvent } from '@/utils/mixpanel';
import { useStore } from '@/store/useStore';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FeedbackForm {
  rating: number;
  category: string;
  title: string;
  message: string;
  email: string;
}

const categories = [
  { value: 'feature_request', label: 'Feature Request', description: 'Suggest new features or improvements' },
  { value: 'bug_report', label: 'Bug Report', description: 'Report issues or problems' },
  { value: 'general_feedback', label: 'General Feedback', description: 'Share your thoughts and opinions' },
  { value: 'platform_request', label: 'Platform Request', description: 'Request support for new platforms' },
  { value: 'ui_ux', label: 'UI/UX Feedback', description: 'Feedback about design and user experience' },
  { value: 'performance', label: 'Performance', description: 'Report performance issues or suggestions' }
];

export function FeedbackModal({ isOpen, onClose, onSuccess }: FeedbackModalProps) {
  const { user } = useAuth();
  const { usageLogId, setFeedbackPromptShown } = useStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FeedbackForm>({
    rating: 0,
    category: '',
    title: '',
    message: '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState<Partial<FeedbackForm>>({});

  const isValidEmail = (email: string) => {
    // Basic, robust email validation (RFC-5322 simplified)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<FeedbackForm> = {};

    if (currentStep === 1) {
      if (form.rating === 0) {
        newErrors.rating = 0;
      }
    }

    if (currentStep === 2) {
      if (!form.category) {
        newErrors.category = 'Please select a category';
      }
    }

    if (currentStep === 3) {
      if (form.email && !isValidEmail(form.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const headers = await getApiHeaders();
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating: form.rating,
          category: form.category,
          title: form.title || undefined,
          message: form.message || undefined,
          email: form.email || undefined,
          usageLogId: usageLogId || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        // Track successful feedback submission
        trackEvent('Feedback Submitted', {
          rating: form.rating,
          category: form.category,
          hasTitle: !!form.title,
          titleLength: form.title.length,
          hasMessage: !!form.message,
          messageLength: form.message.length,
          emailProvided: !!form.email,
          isAuthenticated: !!user,
          usageLogId: usageLogId || null,
        });
        onSuccess?.();
        setFeedbackPromptShown(true);
        onClose();
        // Reset form
        setForm({
          rating: 0,
          category: '',
          title: '',
          message: '',
          email: user?.email || ''
        });
        setStep(1);
      } else {
        // Track feedback submission failure
        trackEvent('Feedback Submission Failed', {
          rating: form.rating,
          category: form.category,
          error: result.error || 'Unknown error',
        });
        setErrors({ message: result.error || 'Failed to submit feedback' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Track feedback submission error
      trackEvent('Feedback Submission Error', {
        rating: form.rating,
        category: form.category,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setErrors({ message: 'Failed to submit feedback. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <div className="text-center">
      <h3 className="text-lg font-semibold text-slate-800 mb-2">How would you rate your experience?</h3>
      <p className="text-sm text-slate-600 mb-6">Your rating helps us improve our service</p>
      
      <div className="flex justify-center space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setForm({ ...form, rating: star })}
            className={`p-2 rounded-lg transition-colors ${
              star <= form.rating
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star className="w-8 h-8 fill-current" />
          </button>
        ))}
      </div>
      
      {form.rating > 0 && (
        <p className="text-sm text-slate-600 mb-4">
          {form.rating === 1 && "We're sorry to hear that. Please tell us how we can improve."}
          {form.rating === 2 && "We appreciate your feedback. How can we do better?"}
          {form.rating === 3 && "Thank you for your feedback. What can we improve?"}
          {form.rating === 4 && "Great! We'd love to hear what we can do even better."}
          {form.rating === 5 && "Awesome! We're thrilled you had a great experience."}
        </p>
      )}
      
      {errors.rating !== undefined && (
        <p className="text-sm text-red-600 mb-4">Please select a rating</p>
      )}
    </div>
  );

  const renderCategorySelection = () => (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">What type of feedback is this?</h3>
      <p className="text-sm text-slate-600 mb-6">Choose the category that best describes your feedback</p>
      
      <div className="space-y-3">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setForm({ ...form, category: category.value })}
            className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
              form.category === category.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="font-medium text-slate-800">{category.label}</div>
            <div className="text-sm text-slate-600 mt-1">{category.description}</div>
          </button>
        ))}
      </div>
      
      {errors.category && (
        <p className="text-sm text-red-600 mt-4">{errors.category}</p>
      )}
    </div>
  );

  const renderFeedbackForm = () => (
    <div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Share your feedback</h3>
      <p className="text-sm text-slate-600 mb-6">Help us understand your experience better</p>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Brief summary of your feedback"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
            maxLength={100}
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
            Message (optional)
          </label>
          <textarea
            id="message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Tell us more about your experience..."
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-gray-900 placeholder:text-gray-400"
            maxLength={1000}
          />
          <div className="text-xs text-slate-500 mt-1">{form.message.length}/1000 characters</div>
        </div>
        
        {!user && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={form.email}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, email: value });
                if (errors.email) {
                  if (!value || isValidEmail(value)) {
                    // Clear email error when input becomes valid
                    const rest = { ...errors };
                    delete rest.email;
                    setErrors(rest);
                  }
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value && !isValidEmail(value)) {
                  setErrors({ ...errors, email: 'Please enter a valid email address' });
                }
              }}
              placeholder="your@email.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-white text-gray-900 placeholder:text-gray-400 
                ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-2">{errors.email}</p>
            )}
            <div className="text-xs text-slate-500 mt-1">We&apos;ll only use this to follow up on your feedback</div>
          </div>
        )}
      </div>
      
      {errors.message && (
        <p className="text-sm text-red-600 mt-4">{errors.message}</p>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Feedback</h2>
            </div>
            <button
              onClick={() => { setFeedbackPromptShown(true); onClose(); }}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close feedback modal"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber === step
                    ? 'bg-blue-600 text-white'
                    : stepNumber < step
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="mb-8">
            {step === 1 && renderStarRating()}
            {step === 2 && renderCategorySelection()}
            {step === 3 && renderFeedbackForm()}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={step === 1 ? () => { setFeedbackPromptShown(true); onClose(); } : handleBack}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              disabled={isSubmitting}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={step === 1 && form.rating === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}