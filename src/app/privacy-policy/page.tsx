'use client';

import React from 'react';
import { Header } from '@/components/Header';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="py-12 px-4 sm:px-6 lg:px-8 flex-grow">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
                <div className="prose prose-slate max-w-none text-slate-700">
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to Reel Recap. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you visit our website
                        and tell you about your privacy rights and how the law protects you.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">2. Data We Collect</h2>
                    <p className="mb-2">
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li>Identity Data: includes username or similar identifier.</li>
                        <li>Contact Data: includes email address.</li>
                        <li>Technical Data: includes internet protocol (IP) address, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                        <li>Usage Data: includes information about how you use our website, products and services.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">3. How We Use Your Data</h2>
                    <p className="mb-2">
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li>To provide the service you requested (video transcript extraction).</li>
                        <li>To improve our website and services.</li>
                        <li>To comply with a legal or regulatory obligation.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">4. Cookies</h2>
                    <p className="mb-4">
                        We use cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">5. Contact Us</h2>
                    <p className="mb-4">
                        If you have any questions about this privacy policy or our privacy practices, please contact us at our contact page.
                    </p>
                </div>
            </div>
        </div>
        </div>
    );
}
