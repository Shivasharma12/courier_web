'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={cn("w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse", className)} />;
    }

    return (
        <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
                className
            )}
            aria-label="Toggle theme"
        >
            {resolvedTheme === 'dark' ? (
                <Moon className="h-[1.2rem] w-[1.2rem] animate-in zoom-in duration-300" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 animate-in zoom-in duration-300" />
            )}
        </button>
    );
}
