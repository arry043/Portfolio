import { memo, useCallback, useEffect, useState } from "react";
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import { FaHackerrank, FaWhatsapp } from "react-icons/fa";
import { LuMail } from "react-icons/lu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Briefcase,
    Code,
    Globe,
    Github,
    Linkedin,
    Twitter,
    Instagram,
    ExternalLink,
    Terminal,
    BookOpen,
    MessageSquare,
} from "lucide-react";
import SectionWrapper from "../layout/SectionWrapper";
import Container from "../layout/Container";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeader from "../common/SectionHeader";
import { contactSchema } from "../../schemas/forms";
import { useContactMutation } from "../../hooks/usePortfolioApi";
import { getErrorMessage } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useTrackSectionView } from "../../hooks/useTrackEvent";

const CONTACT_COOLDOWN_MS = 20_000;

const PROFILES = [
    {
        title: "Professional",
        icon: Briefcase,
        items: [
            {
                name: "LinkedIn",
                icon: Linkedin,
                url: "https://linkedin.com/in/arryquerry",
            },
            { name: "GitHub", icon: Github, url: "https://github.com/arry043" },
            {
                name: "Portfolio",
                icon: Globe,
                url: "https://arif-ansari.onrender.com/",
            },
        ],
    },
    {
        title: "Coding Platforms",
        icon: Code,
        items: [
            {
                name: "LeetCode",
                icon: SiLeetcode,
                url: "https://leetcode.com/u/arry03/",
            },
            {
                name: "GeeksforGeeks",
                icon: SiGeeksforgeeks,
                url: "https://www.geeksforgeeks.org/profile/arifqurn60?tab=activity",
            },
            {
                name: "HackerRank",
                icon: FaHackerrank,
                url: "https://www.hackerrank.com/profile/arifquerry",
            },
        ],
    },
    {
        title: "Social & More",
        icon: MessageSquare,
        items: [
            {
                name: "X (Twitter)",
                icon: Twitter,
                url: "https://x.com/itz__arry03",
            },
            {
                name: "Instagram",
                icon: Instagram,
                url: "https://www.instagram.com/itz_arry03/",
            },
            { name: "Email", icon: LuMail, url: "mailto:arifquerry@gmail.com" },
            {
                name: "WhatsApp",
                icon: FaWhatsapp,
                url: "https://wa.me/917081168219",
            },
        ],
    },
];

const ContactSection = () => {
    const contactMutation = useContactMutation();
    const toast = useToast();
    const { trackClick } = useTrackSectionView("contact");
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    const form = useForm({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        },
    });

    useEffect(() => {
        if (cooldownSeconds <= 0) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setCooldownSeconds((value) => (value > 0 ? value - 1 : 0));
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [cooldownSeconds]);

    const submitContact = useCallback(
        async (payload) => {
            const loadingToastId = toast.loading("Sending your message...");

            try {
                await contactMutation.mutateAsync(payload);
                toast.update(loadingToastId, {
                    type: "success",
                    title: "Message Sent",
                    message:
                        "Thanks for reaching out. I will get back to you soon.",
                    persistent: false,
                    duration: 3000,
                    containerId: "main-toast",
                });
                setCooldownSeconds(Math.ceil(CONTACT_COOLDOWN_MS / 1000));
                form.reset();
            } catch (error) {
                toast.update(loadingToastId, {
                    type: "error",
                    title: "Send Failed",
                    message: getErrorMessage(error),
                    persistent: false,
                    duration: 4000,
                    containerId: "main-toast",
                });
            }
        },
        [contactMutation, form, toast],
    );

    const onSubmit = form.handleSubmit(async (values) => {
        if (cooldownSeconds > 0) {
            toast.warning(
                `Please wait ${cooldownSeconds}s before sending another message.`,
                "Cooldown Active",
            );
            return;
        }

        trackClick();
        await submitContact(values);
    });

    return (
        <SectionWrapper
            id="contact"
            bgVariant="secondary"
            className="py-10 sm:py-16"
        >
            <Container>
                <div className="space-y-12">
                    <SectionHeader
                        eyebrow="Contact"
                        title="Start A Collaboration"
                        description="Ready to build scalable products? Let's discuss your goals, architecture, and roadmap."
                    />

                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 items-start">
                        {/* Contact Form */}
                        <Card
                            className="border-zinc-800 bg-zinc-950/75 p-6 sm:p-7"
                            hoverEffect={false}
                        >
                            <form
                                onSubmit={onSubmit}
                                className="grid grid-cols-1 gap-4 sm:grid-cols-2 h-full"
                            >
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="contact-name"
                                        className="text-sm font-medium text-zinc-300"
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        placeholder="Your name"
                                        {...form.register("name")}
                                    />
                                    {form.formState.errors.name ? (
                                        <p className="text-xs text-red-500/80">
                                            {form.formState.errors.name.message}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="contact-email"
                                        className="text-sm font-medium text-zinc-300"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        placeholder="you@domain.com"
                                        {...form.register("email")}
                                    />
                                    {form.formState.errors.email ? (
                                        <p className="text-xs text-red-500/80">
                                            {
                                                form.formState.errors.email
                                                    .message
                                            }
                                        </p>
                                    ) : null}
                                </div>

                                <div className="space-y-1.5 sm:col-span-2">
                                    <label
                                        htmlFor="contact-message"
                                        className="text-sm font-medium text-zinc-300"
                                    >
                                        Message
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        rows={6}
                                        className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                                        placeholder="Tell me about your project idea"
                                        {...form.register("message")}
                                    />
                                    {form.formState.errors.message ? (
                                        <p className="text-xs text-red-500/80">
                                            {
                                                form.formState.errors.message
                                                    .message
                                            }
                                        </p>
                                    ) : null}
                                </div>

                                <div className="sm:col-span-2 pt-2 mt-auto">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full py-3.5 font-bold shadow-lg shadow-blue-500/10 transition-all hover:shadow-blue-500/20"
                                        disabled={contactMutation.isPending}
                                    >
                                        {contactMutation.isPending
                                            ? "Sending..."
                                            : "Send Message"}
                                    </Button>
                                </div>
                            </form>
                        </Card>

                        {/* Profiles Section */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-white">
                                    Find Me On
                                </h3>
                                <p className="text-sm text-zinc-400">
                                    Explore my work across professional and
                                    coding platforms.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                {PROFILES.map((category) => (
                                    <div
                                        key={category.title}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                            <category.icon size={14} />
                                            {category.title}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {category.items.map((item) => (
                                                <a
                                                    key={item.name}
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 transition-all duration-300 hover:border-blue-500/30 hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-blue-500/5"
                                                >
                                                    <item.icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-blue-400" />
                                                    <span className="text-[13px] font-medium text-zinc-300 group-hover:text-white">
                                                        {item.name}
                                                    </span>
                                                    <ExternalLink className="absolute right-2 top-2 h-3 w-3 opacity-0 transition-opacity group-hover:opacity-40" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </SectionWrapper>
    );
};

export default memo(ContactSection);
