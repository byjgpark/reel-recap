import React from 'react';

export default function Contact() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>
                <div className="prose prose-slate max-w-none text-slate-700">
                    <p className="mb-6 text-lg text-slate-700">
                        We'd love to hear from you! Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.
                    </p>

                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-blue-900">Get in Touch</h2>
                        <p className="mb-2 text-blue-800">
                            <strong>Email:</strong> reelrecap.help@gmail.com
                        </p>
                        <p className="text-blue-800">
                            <strong>Response Time:</strong> We aim to respond to all inquiries within 24-48 hours.
                        </p>
                    </div>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">Feedback</h2>
                    <p className="mb-4">
                        You can also use the feedback button located at the bottom right of every page to report bugs or suggest new features directly.
                    </p>
                </div>
            </div>
        </div>
    );
}
