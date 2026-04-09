import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import Container from "../layout/Container";
import SectionWrapper from "../layout/SectionWrapper";
import HeroContent from "./HeroContent";
import { DEFAULT_MODE, HERO_CONTENT, getValidatedMode } from "./hero.constants";
import HomeAchievements from "../home/HomeAchievements";
import {
    useCertificatesQuery,
    useProjectsQuery,
    useResumeQuery,
} from "../../hooks/usePortfolioApi";

const MODE_SWITCH_DEBOUNCE_MS = 130;

const HeroSection = ({ profile }) => {
    const [mode, setMode] = useState(DEFAULT_MODE);
    const modeSwitchTimerRef = useRef(null);

    const heroIdentity = useMemo(
        () => ({
            name: profile?.name || HERO_CONTENT.name,
        }),
        [profile?.name],
    );

    const activeMode = useMemo(() => getValidatedMode(mode), [mode]);

    const handleModeChange = useCallback((nextMode) => {
        const safeMode = getValidatedMode(nextMode);

        if (modeSwitchTimerRef.current) {
            window.clearTimeout(modeSwitchTimerRef.current);
        }

        modeSwitchTimerRef.current = window.setTimeout(() => {
            setMode((previousMode) =>
                previousMode === safeMode ? previousMode : safeMode,
            );
        }, MODE_SWITCH_DEBOUNCE_MS);
    }, []);

    useEffect(() => {
        return () => {
            if (modeSwitchTimerRef.current) {
                window.clearTimeout(modeSwitchTimerRef.current);
            }
        };
    }, []);

    const resumeQuery = useResumeQuery();
    const projectsQuery = useProjectsQuery();
    const certificatesQuery = useCertificatesQuery();

    const resume = resumeQuery.data?.item || {};
    const projects = projectsQuery.data?.items || [];
    const certificates = certificatesQuery.data?.items || [];

    return (
        <SectionWrapper
            id="home"
            className="flex flex-col justify-center bg-gradient-to-b from-[#020617] to-black pt-32 sm:pt-36 lg:pt-48 sm:pb-2"
        >
            <Container>
                <div className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                    {/* IMAGE FIRST ON MOBILE */}
                    <Motion.div
                        className="order-1 lg:order-2 relative mx-auto w-full max-w-[260px] sm:max-w-[340px] lg:max-w-[480px] xl:max-w-[520px] lg:translate-x-4"
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <Motion.div
                            aria-hidden
                            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[#020617]/50 opacity-70 blur-[80px] rounded-full"
                        />

                        <Motion.img
                            src="/hero/arif.png"
                            alt="Developer"
                            loading="lazy"
                            animate={{ y: [0, -12, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="relative z-10 w-full h-auto object-contain"
                        />
                    </Motion.div>

                    {/* CONTENT SECOND ON MOBILE */}
                    <div className="order-2 lg:order-1">
                        <HeroContent
                            name={heroIdentity.name}
                            mode={activeMode}
                            onModeChange={handleModeChange}
                        />
                    </div>
                </div>
                <HomeAchievements
                    achievements={resume.achievements || []}
                    projectCount={projects.length}
                    certificateCount={certificates.length}
                    experienceCount={(resume.experience || []).length}
                />
            </Container>
        </SectionWrapper>
    );
};

export default HeroSection;
