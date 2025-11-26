import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm text-slate-600">
                            © {new Date().getFullYear()} Reel Recap. All rights reserved.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Built with Next.js, Tailwind CSS, and AI.
                        </p>
                    </div>

                    <div className="flex space-x-6">
                        <Link href="/about" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                            About
                        </Link>
                        <Link href="/contact" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                            Contact
                        </Link>
                        <Link href="/privacy-policy" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
