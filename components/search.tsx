"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export function Search() {
    if (!open) return null;

    return (
    <Card className="absolute top-4 left-4 z-[1000]">
        {/* Header */}
        <div className="flex items-start justify-between">
            <input
            type="text"
            placeholder="Search..."
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
            />
        </div>
    </Card>
    );
}