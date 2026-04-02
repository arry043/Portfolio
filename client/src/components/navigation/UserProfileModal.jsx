import { memo, useMemo } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { X } from "lucide-react";
import Button from "../ui/Button";
import { createPortal } from "react-dom";

const toDisplayValue = (value, fallback = "Not available") => {
    const normalized = String(value || "").trim();
    return normalized || fallback;
};

const formatJoinedDate = (value) => {
    if (!value) {
        return "Not available";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
};

const UserProfileModal = ({
    open,
    user,
    onClose,
    onLogout,
    isLoggingOut = false,
}) => {
    const joinedDate = useMemo(
        () => formatJoinedDate(user?.createdAt),
        [user?.createdAt],
    );

    if (!open) return null;

    return createPortal(
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 px-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <Motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl shadow-black/50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-zinc-100">
                        Profile
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-zinc-800 bg-zinc-900 p-1 text-zinc-400 transition-colors hover:text-zinc-100"
                        aria-label="Close profile modal"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-sm">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                            Name
                        </p>
                        <p className="mt-1 text-zinc-100">
                            {toDisplayValue(user?.name)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                            Email
                        </p>
                        <p className="mt-1 text-zinc-100">
                            {toDisplayValue(user?.email)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">
                            Joined
                        </p>
                        <p className="mt-1 text-zinc-100">{joinedDate}</p>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    className="mt-4 w-full border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                    onClick={onLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </Button>
            </Motion.div>
        </Motion.div>,
        document.body,
    );
};

export default memo(UserProfileModal);
