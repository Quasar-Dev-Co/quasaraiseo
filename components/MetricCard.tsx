"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accentBar?: boolean;
}

export default function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accentBar = false,
}: MetricCardProps) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative min-h-[118px] overflow-hidden rounded-[18px] border border-slate-200 bg-white/73 p-5 shadow-xs backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60",
        "hover:border-blue-400/32 hover:shadow-md transition-colors duration-300"
      )}
    >
      {/* Top accent bar indicator on the first metric card or hovered cards */}
      {accentBar && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-transparent" />
      )}

      <div className="flex items-center gap-2 text-[9px] font-extrabold tracking-[0.08em] text-slate-500 uppercase dark:text-slate-400">
        <Icon className="size-[18px] text-slate-800 dark:text-white" />
        <span>{label}</span>
      </div>

      <div className="mt-3.5 font-heading text-[28px] font-normal leading-none text-slate-950 dark:text-white">
        {value}
      </div>

      <div className="mt-2 text-[9px] font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </div>
    </motion.article>
  );
}
