'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface GuidedSelectionToastProps {
    /** Which type the user is being guided to pick. null = toast hidden. */
    type: 'block' | 'county' | 'listing' | null;
    onCancel: () => void;
}

const LABELS: Record<'block' | 'county' | 'listing', string> = {
    block: 'block',
    county: 'county',
    listing: 'listing',
};

// Stays up for the entire guided-selection window (until a second item is
// picked or the user cancels) — it does NOT auto-dismiss on a timer.
export default function GuidedSelectionToast({ type, onCancel }: GuidedSelectionToastProps) {
    return (
        <AnimatePresence>
            {type && (
                <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed left-1/2 top-6 z-1000 -translate-x-1/2"
                >
                    <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-white/80 px-6 py-4 shadow-2xl backdrop-blur-xl">
                        <p className="text-center text-sm font-medium text-gray-900">
                            Select another <span className="font-semibold">{LABELS[type]}</span>{' '}
                            to compare
                        </p>
                        <button
                            onClick={onCancel}
                            aria-label="Cancel comparison"
                            className="rounded-full p-1 text-gray-400 transition hover:text-gray-900"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
