'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ComparisonSelectorToastProps {
    item: string;
    onFinished: () => void;
}

export default function ComparisonSelectorToast({
    item,
    onFinished
}: ComparisonSelectorToastProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(onFinished, 1000);
        return () => clearTimeout(timer);
    }, [onFinished]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -24, scale: 0.95 }}
                    transition={{
                        duration: 0.25,
                        ease: 'easeOut',
                    }}
                    className="fixed left-1/2 top-6 z-1000 -translate-x-1/2"
                >
                    <div className="rounded-xl border border-white/40 bg-white/80 px-6 py-4 shadow-2xl backdrop-blur-xl">
                        <p className="text-center text-sm font-medium text-gray-900">
                            Select another <span className="font-semibold">{item}</span> to compare
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}