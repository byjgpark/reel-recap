'use client';

import React from 'react';
import { Header } from '@/components/Header';

export default function About() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />
            <div className="py-12 px-4 sm:px-6 lg:px-8 flex-grow">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">About Us</h1>
                <div className="prose prose-slate max-w-none text-slate-700">
                    <p className="mb-4 text-lg text-slate-700">
                        Reel Recap is a powerful tool designed to help you get the most out of short-form video content.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">Our Mission</h2>
                    <p className="mb-4">
                        In the age of endless scrolling, valuable information often gets lost in the noise. Our mission is to make video content more accessible and searchable by providing high-quality transcripts and AI-powered summaries for YouTube Shorts, TikToks, and Instagram Reels.
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">What We Do</h2>
                    <p className="mb-2">
                        We leverage advanced AI technology to extract speech from videos and convert it into text. This allows content creators, researchers, and casual viewers to:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1">
                        <li>Quickly read through video content without watching.</li>
                        <li>Search for specific keywords within a video.</li>
                        <li>Generate concise summaries of long or complex videos.</li>
                        <li>Repurpose video content for blogs, tweets, and other formats.</li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-6 mb-3 text-slate-900">Technology</h2>
                    <p className="mb-4">
                        Reel Recap is built using modern web technologies including Next.js and Tailwind CSS, and utilizes state-of-the-art AI models for speech recognition and natural language processing.
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
}
