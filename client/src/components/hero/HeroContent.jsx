import { memo } from "react";
import { motion as Motion } from "framer-motion";
import { CiLinkedin } from "react-icons/ci";
import { FaGithub } from "react-icons/fa";
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import CTAButtons from "./CTAButtons";
import ModeSwitcher from "./ModeSwitcher";
import RoleRotator from "./RoleRotator";
import { HERO_SOCIAL_LINKS } from "./hero.constants";

const containerAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut",
            staggerChildren: 0.1,
        },
    },
};

const itemAnimation = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
    },
};

const HeroContent = ({ name, mode, onModeChange }) => {
    const dynamicRoles = [
        "Full Stack Developer",
        "Backend Developer",
        "AI/ML Engineer",
    ];

    const socialIcons = {
        Linkedin: CiLinkedin,
        Github: FaGithub,
        Code: SiLeetcode,
        GFG: SiGeeksforgeeks,
    };

    return (
        <Motion.div
            variants={containerAnimation}
            initial="hidden"
            animate="visible"
            className="space-y-1 flex flex-col items-center lg:items-start text-center lg:text-left justify-center"
        >
            <Motion.div
                variants={itemAnimation}
                className="mb-4 inline-flex items-center rounded-full border border-zinc-800/90 bg-zinc-950/60 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400"
            >
                Available For Product Builds
            </Motion.div>

            <Motion.h1
                variants={itemAnimation}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight"
            >
                {name}
            </Motion.h1>

            <Motion.div
                variants={itemAnimation}
                className="mt-2 space-y-3 flex flex-col items-center lg:items-start w-full"
            >
                <RoleRotator key={mode} mode={mode} roles={dynamicRoles} />
                <ModeSwitcher mode={mode} onModeChange={onModeChange} />
            </Motion.div>

            <Motion.p
                variants={itemAnimation}
                className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed mt-3"
            >
                Full Stack Developer with hands-on internship experience at
                FlashSpace. Strong in Data Structures Algorithms (200+ LeetCode,
                250+ GFG – Rank 20). Skilled in building scalable web
                applications using REST APIs, JWT, WebSockets, and optimized
                databases. Strong foundation in OOP and adaptable to new
                technologies.
            </Motion.p>

            <Motion.div
                variants={itemAnimation}
                className="mt-6 flex flex-col items-center lg:items-start gap-4 w-full"
            >
                {/* 🔗 Social Icons (TOP) */}
                <div className="flex items-center gap-4">
                    {HERO_SOCIAL_LINKS.slice(0, 4).map((link) => {
                        const IconComponent =
                            socialIcons[link.icon] || SiLeetcode;
                        return (
                            <a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/50 border border-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all duration-300"
                                title={link.name}
                            >
                                <IconComponent
                                    size={18}
                                    className="relative z-10"
                                />
                                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-10 dark:bg-white blur-md transition-opacity duration-300" />
                            </a>
                        );
                    })}
                </div>

                {/* 🚀 CTA Buttons (BOTTOM) */}
                <CTAButtons />
            </Motion.div>
        </Motion.div>
    );
};

export default memo(HeroContent);
