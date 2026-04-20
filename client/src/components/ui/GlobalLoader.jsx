import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Server, Terminal, Zap } from "lucide-react";
import { useGlobalLoading } from "../../context/LoadingContext";

const STAGES = [
    {
        id: "frontend",
        text: "Loading Frontend...",
        icon: Terminal,
        color: "text-blue-400",
    },
    {
        id: "backend",
        text: "Connecting Backend...",
        icon: Loader2,
        color: "text-zinc-400",
        spin: true,
    },
    {
        id: "server",
        text: "Waking Server...",
        icon: Server,
        color: "text-zinc-300",
    },
    {
        id: "ignition",
        text: "Igniting Engines...",
        icon: Zap,
        color: "text-orange-400",
    },
];

const GlobalLoader = () => {
    const { isAppLoading, hasInitialDataLoaded } = useGlobalLoading();
    const [currentStage, setCurrentStage] = useState(0);

    useEffect(() => {
        if (!isAppLoading) return;

        const interval = setInterval(() => {
            setCurrentStage((prev) => (prev + 1) % STAGES.length);
        }, 1200);

        return () => clearInterval(interval);
    }, [isAppLoading]);

    return (
        <AnimatePresence>
            {isAppLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl"
                >
                    {/* Main Logo / Image Placeholder or Animation */}
                    {/* Main Logo / Dynamic Stage Icon */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative mb-12 flex h-24 w-24 items-center justify-center"
                    >
                        <div className="absolute inset-0 animate-ping rounded-full bg-zinc-800/50" />

                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-md">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={STAGES[currentStage].id}
                                    initial={{
                                        rotate: -90,
                                        opacity: 0,
                                        scale: 0.8,
                                    }}
                                    animate={{
                                        rotate: 0,
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    exit={{
                                        rotate: 90,
                                        opacity: 0,
                                        scale: 0.8,
                                    }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-center justify-center"
                                >
                                    {(() => {
                                        const Icon = STAGES[currentStage].icon;

                                        return (
                                            <motion.div
                                                animate={
                                                    STAGES[currentStage].spin
                                                        ? { rotate: 360 }
                                                        : { rotate: 0 }
                                                }
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 3, // 🔥 slow spin
                                                    ease: "linear",
                                                }}
                                            >
                                                <Icon
                                                    className={`h-8 w-8 ${STAGES[currentStage].color}`}
                                                />
                                            </motion.div>
                                        );
                                    })()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Stages Animation */}
                    <div className="relative h-12 w-64 overflow-hidden text-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={STAGES[currentStage].id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="flex items-center justify-center gap-3"
                            >
                                <span className="text-sm font-medium tracking-widest text-zinc-300 uppercase">
                                    {STAGES[currentStage].text}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress Bar (Visual only) */}
                    <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-zinc-900/50 outline outline-1 outline-zinc-800/30">
                        <motion.div
                            className="h-full bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700"
                            animate={{
                                x: ["-100%", "100%"],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "linear",
                            }}
                        />
                    </div>

                    {/* Status Hint */}
                    {!hasInitialDataLoaded && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 5 }}
                            className="mt-12 text-[10px] tracking-[0.2em] text-zinc-500 uppercase"
                        >
                            First load might take up to 15s
                        </motion.p>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalLoader;
