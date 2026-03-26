import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Button from "../ui/Button";
import useAuthStore from "../../store/useAuthStore";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";

const BASE_NAV_ITEMS = [
    { id: "experience", label: "Experience", path: "/experience" },
    { id: "projects", label: "Projects", path: "/projects" },
    { id: "certificates", label: "Certificates", path: "/certificates" },
    { id: "games", label: "Games", path: "/games" },
    { id: "about", label: "About", path: "/about" },
    { id: "contact", label: "Contact", path: "/contact" },
];

const SCROLL_COMPACT_THRESHOLD = 50;
const SCROLL_DEBOUNCE_MS = 24;

const normalizePathname = (value) => {
    const sanitized = String(value || "/").replace(/\/+$/, "");
    return sanitized || "/";
};

const isPathActive = (currentPathname, targetPath) => {
    if (targetPath === "/") {
        return currentPathname === "/";
    }

    return (
        currentPathname === targetPath ||
        currentPathname.startsWith(`${targetPath}/`)
    );
};

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const menuRef = useRef(null);
    const location = useLocation();
    const normalizedPath = useMemo(
        () => normalizePathname(location.pathname),
        [location.pathname],
    );
    const { user } = useAuthStore();

    const navItems = useMemo(() => {
        const items = [...BASE_NAV_ITEMS];

        if (user?.role === "admin") {
            items.push({
                id: "admin",
                label: "Admin",
                path: "/admin/dashboard",
            });
        }

        return items;
    }, [user?.role]);

    const closeMenu = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggleMenu = useCallback(() => {
        setIsOpen((value) => !value);
    }, []);

    const isNavItemActive = useCallback(
        (path) => isPathActive(normalizedPath, path),
        [normalizedPath],
    );

    useEffect(() => {
        let debounceTimer = null;
        let frameId = 0;

        const scheduleCompactSync = () => {
            if (debounceTimer) {
                window.clearTimeout(debounceTimer);
            }

            debounceTimer = window.setTimeout(() => {
                if (frameId) {
                    window.cancelAnimationFrame(frameId);
                }

                frameId = window.requestAnimationFrame(() => {
                    const shouldCompact =
                        (window.scrollY || 0) > SCROLL_COMPACT_THRESHOLD;
                    setIsCompact((previous) =>
                        previous === shouldCompact ? previous : shouldCompact,
                    );
                });
            }, SCROLL_DEBOUNCE_MS);
        };

        scheduleCompactSync();
        window.addEventListener("scroll", scheduleCompactSync, {
            passive: true,
        });
        window.addEventListener("resize", scheduleCompactSync);

        return () => {
            if (debounceTimer) {
                window.clearTimeout(debounceTimer);
            }
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }
            window.removeEventListener("scroll", scheduleCompactSync);
            window.removeEventListener("resize", scheduleCompactSync);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                !event.target.closest("[data-menu-toggle]")
            ) {
                closeMenu();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, closeMenu]);

    useEffect(() => {
        closeMenu();
    }, [closeMenu, location.pathname]);

    const desktopLinkClass = useCallback(
        (path) =>
            `rounded-md border px-2.5 py-1 text-sm font-medium transition-all duration-300 ${
                isNavItemActive(path)
                    ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                    : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100"
            }`,
        [isNavItemActive],
    );

    return (
        <header className="fixed top-0 left-0 w-full z-50 lg:left-1/2 lg:w-fit lg:-translate-x-1/2 lg:top-3 px-3 sm:px-4 lg:px-5">
            <Motion.div
                layout
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className={`relative flex w-full items-center transition-all duration-500 ${
                    isCompact
                        ? "lg:w-fit px-3 py-2 rounded-xl border border-zinc-700/60 bg-zinc-900/70 backdrop-blur-md shadow-lg scale-95"
                        : "w-full lg:w-[min(90vw,72rem)] px-4 py-2.5 rounded-none lg:rounded-2xl bg-zinc-950/70 lg:bg-transparent border-b border-zinc-800 lg:border-transparent"
                }`}
            >
                <div className="flex items-center justify-between w-full px-4 h-14 md:hidden">
                    <Link
                        to="/"
                        onClick={closeMenu}
                        className="text-sm font-semibold tracking-[0.12em] text-zinc-100"
                    >
                        Arif Ansari
                    </Link>
                    <button
                        type="button"
                        data-menu-toggle
                        onClick={toggleMenu}
                        className="rounded-md border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-300 hover:bg-zinc-800"
                    >
                        {isOpen ? (
                            <X className="h-4 w-4" />
                        ) : (
                            <Menu className="h-4 w-4" />
                        )}
                    </button>
                </div>

                <div
                    className={`hidden md:flex w-full items-center transition-all duration-300 ease-in-out ${
                        isCompact
                            ? "justify-center gap-3 px-3 py-2"
                            : "justify-between gap-7 px-4 py-2.5"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Link
                            to="/"
                            className="whitespace-nowrap text-sm font-semibold tracking-[0.13em] text-zinc-100"
                        >
                            Arif Ansari
                        </Link>
                        {isCompact ? (
                            <span aria-hidden className="text-sm text-zinc-500">
                                |
                            </span>
                        ) : null}
                    </div>

                    <div
                        className={`flex items-center ${
                            isCompact ? "gap-2" : "gap-3"
                        } ${isCompact ? "" : "ml-auto"}`}
                    >
                        <nav
                            className={`flex max-w-[65vw] items-center overflow-x-auto ${
                                isCompact ? "gap-1.5" : "gap-2.5"
                            }`}
                        >
                            {navItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    className={desktopLinkClass(item.path)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div
                            className={`hidden items-center gap-2 lg:flex ${
                                isCompact ? "" : "border-l border-zinc-800 pl-3"
                            }`}
                        >
                            <Show when="signed-out">
                                <SignInButton mode="modal">
                                    <Button
                                        variant="secondary"
                                        className="h-8 px-3 py-1 text-sm"
                                    >
                                        Login
                                    </Button>
                                </SignInButton>
                                {!isCompact ? (
                                    <SignUpButton mode="modal">
                                        <Button
                                            variant="primary"
                                            className="h-8 px-3 py-1 text-sm"
                                        >
                                            Sign Up
                                        </Button>
                                    </SignUpButton>
                                ) : null}
                            </Show>
                            <Show when="signed-in">
                                <UserButton />
                            </Show>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen ? (
                        <Motion.div
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            transition={{ duration: 0.24, ease: "easeOut" }}
                            className="absolute left-1/2 top-full mt-2 w-[min(92vw,24rem)] -translate-x-1/2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/45 backdrop-blur md:hidden"
                            ref={menuRef}
                        >
                            <div className="space-y-1 px-3 py-3">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={item.path}
                                        onClick={closeMenu}
                                        className={`block rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                                            isNavItemActive(item.path)
                                                ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                                                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}

                                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
                                    <Show when="signed-out">
                                        <SignInButton mode="modal">
                                            <Button
                                                variant="secondary"
                                                className="h-8 px-3 py-1 text-sm"
                                            >
                                                Login
                                            </Button>
                                        </SignInButton>
                                        <SignUpButton mode="modal">
                                            <Button
                                                variant="primary"
                                                className="h-8 px-3 py-1 text-sm"
                                            >
                                                Sign Up
                                            </Button>
                                        </SignUpButton>
                                    </Show>
                                    <Show when="signed-in">
                                        <UserButton />
                                    </Show>
                                </div>
                            </div>
                        </Motion.div>
                    ) : null}
                </AnimatePresence>
            </Motion.div>
        </header>
    );
};

export default Navbar;
