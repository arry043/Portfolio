import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import useUnifiedLogout from "../../hooks/useUnifiedLogout";
import useAuthStore from "../../store/useAuthStore";
import UserProfileModal from "./UserProfileModal";
import { FiUser } from "react-icons/fi";

const getPrimaryEmail = (clerkUser) =>
    String(clerkUser?.primaryEmailAddress?.emailAddress || "")
        .trim()
        .toLowerCase();

const toInitials = (value = "") =>
    String(value)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "U";

const ProfileMenu = ({ onActionComplete }) => {
    const navigate = useNavigate();
    const { user: clerkUser } = useUser();
    const authUser = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { logoutEverywhere, isLoggingOut } = useUnifiedLogout();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const mergedUser = useMemo(
        () => ({
            name: authUser?.name || clerkUser?.fullName || "Guest User",
            email: authUser?.email || getPrimaryEmail(clerkUser) || "",
            createdAt: authUser?.createdAt || null,
            role: authUser?.role || "user",
            profileImage: authUser?.profileImage || clerkUser?.imageUrl || "",
        }),
        [authUser, clerkUser],
    );

    const handleComplete = useCallback(() => {
        if (typeof onActionComplete === "function") {
            onActionComplete();
        }
    }, [onActionComplete]);

    const handleLogout = useCallback(async () => {
        try {
            await logoutEverywhere();
        } finally {
            setIsModalOpen(false);
            setIsTooltipVisible(false);
            handleComplete();
            navigate("/");
        }
    }, [logoutEverywhere, handleComplete, navigate]);

    const handleAvatarClick = useCallback(() => {
        if (!isAuthenticated) {
            handleComplete();
            navigate("/login");
            return;
        }

        if (mergedUser.role === "admin") {
            handleComplete();
            navigate("/admin/dashboard");
            return;
        }

        handleComplete();
        setIsModalOpen(true);
    }, [isAuthenticated, mergedUser.role, handleComplete, navigate]);

    return (
        <>
            <div
                className="relative"
                onMouseEnter={() => setIsTooltipVisible(true)}
                onMouseLeave={() => setIsTooltipVisible(false)}
            >
                <button
                    type="button"
                    onClick={handleAvatarClick}
                    className={`h-9 w-9 flex items-center justify-center rounded-full 
  ${
      !isAuthenticated || mergedUser.name === "Guest User"
          ? "bg-transparent border-none shadow-none"
          : "overflow-hidden border border-zinc-700/80 bg-zinc-900 shadow-sm shadow-black/30"
  } 
  text-xs font-semibold text-zinc-100 transition duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-zinc-500/50`}
                    aria-label={
                        isAuthenticated ? "Open profile actions" : "Go to login"
                    }
                >
                    {!isAuthenticated || mergedUser.name === "Guest User" ? (
                        <FiUser className="h-5 w-5 text-zinc-400" />
                    ) : mergedUser.profileImage ? (
                        <img
                            src={mergedUser.profileImage}
                            alt={mergedUser.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <span>{toInitials(mergedUser.name)}</span>
                    )}
                </button>

                <AnimatePresence>
                    {isAuthenticated && isTooltipVisible ? (
                        <Motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.98 }}
                            transition={{ duration: 0.14, ease: "easeOut" }}
                            className="absolute right-0 top-full z-[70] mt-2 w-32 rounded-lg border border-zinc-800 bg-zinc-950/95 p-1.5 shadow-xl shadow-black/45"
                        >
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                {isLoggingOut ? "Wait..." : "Logout"}
                            </button>
                        </Motion.div>
                    ) : null}
                </AnimatePresence>
            </div>

            <UserProfileModal
                open={isModalOpen}
                user={mergedUser}
                onClose={() => setIsModalOpen(false)}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
            />
        </>
    );
};

export default memo(ProfileMenu);
