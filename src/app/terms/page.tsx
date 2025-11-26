import React from 'react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
                <div className="prose prose-slate max-w-none text-slate-700">
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">1. Agreement to Terms</h2>
                    <p className="mb-4">
                        By accessing our website at Reel Recap, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">2. Use License</h2>
                    <p className="mb-2">
                        Permission is granted to temporarily download one copy of the materials (information or software) on Reel Recap's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li>modify or copy the materials;</li>
                        <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                        <li>attempt to decompile or reverse engineer any software contained on Reel Recap's website;</li>
                        <li>remove any copyright or other proprietary notations from the materials; or</li>
                        <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">3. Disclaimer</h2>
                    <p className="mb-4">
                        The materials on Reel Recap's website are provided on an 'as is' basis. Reel Recap makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">4. Limitations</h2>
                    <p className="mb-4">
                        In no event shall Reel Recap or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Reel Recap's website, even if Reel Recap or a Reel Recap authorized representative has been notified orally or in writing of the possibility of such damage.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">5. Accuracy of Materials</h2>
                    <p className="mb-4">
                        The materials appearing on Reel Recap's website could include technical, typographical, or photographic errors. Reel Recap does not warrant that any of the materials on its website are accurate, complete or current. Reel Recap may make changes to the materials contained on its website at any time without notice. However Reel Recap does not make any commitment to update the materials.
                    </p>
                </div>
            </div>
        </div>
    );
}
