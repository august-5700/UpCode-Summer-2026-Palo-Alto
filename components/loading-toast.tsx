'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingToastProps {
    loading: boolean;
    message?: string;
}

export default function LoadingToast({
    loading,
    message = 'Fetching listings in this area',
}: LoadingToastProps) {
    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.95 }}
                    transition={{
                        duration: 0.25,
                        ease: 'easeOut',
                    }}
                    className="fixed left-1/2 top-6 z-[1000] -translate-x-1/2"
                >
                    <div className="flex items-center gap-3 rounded-full border border-white/40 bg-white/50 px-5 py-3 shadow-xl backdrop-blur-2xl backdrop-saturate-150">
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-700" />
                        <p className="text-sm font-medium text-gray-900">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
