'use client';

import React from 'react';
import { Header } from '@/components/Header';
import Link from 'next/link';

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="py-12 px-4 sm:px-6 lg:px-8 flex-grow">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
                    <h1 className="text-3xl font-bold text-slate-900 mb-6">Refund Policy</h1>
                    <div className="prose prose-slate max-w-none text-slate-700">
                        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">1. Satisfaction Guarantee</h2>
                        <p className="mb-4">
                            We want you to be completely satisfied with Reel Recap. If you are not happy with our service, 
                            we offer a 14-day money-back guarantee on all initial subscription purchases.
                        </p>

                        <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">2. Eligibility for Refunds</h2>
                        <p className="mb-2">
                            To be eligible for a refund, the following conditions must be met:
                        </p>
                        <ul className="list-disc pl-5 mb-4 space-y-1">
                            <li>Your refund request is submitted within 14 days of your initial purchase.</li>
                            <li>You have not used any credits included in your Pro Plan subscription to process any video transcripts.</li>
                            <li>You have not violated our Terms of Service.</li>
                        </ul>
                        <p className="mb-4">
                            We reserve the right to deny refund requests that we believe in good faith are an abuse of this policy, 
                            such as creating multiple accounts to use the refund policy repeatedly.
                        </p>

                        <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">3. Non-Refundable Items</h2>
                        <p className="mb-4">
                            Please note that <strong>once you subscribe to the Pro Plan and use any request (process a video)</strong>, 
                            you are no longer eligible for a refund. This is because the service costs (such as AI processing and transcription) 
                            are incurred immediately upon usage. Additionally, subscription renewals that have already been processed 
                            are generally non-refundable unless required by applicable law.
                        </p>

                        <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">4. How to Request a Refund</h2>
                        <p className="mb-4">
                            To request a refund, please contact our support team via our <Link href="/contact" className="text-blue-600 hover:underline">Contact page</Link> or 
                            email us directly with your order details. We will review your request and process it if it meets our eligibility criteria.
                        </p>

                        <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">5. Processing Time</h2>
                        <p className="mb-4">
                            Once your refund is approved, it will be processed immediately. Depending on your bank or credit card issuer, 
                            it may take 5-10 business days for the funds to appear in your account.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
