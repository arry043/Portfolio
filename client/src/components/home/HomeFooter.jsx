import { memo } from "react";
import SectionWrapper from "../layout/SectionWrapper";
import Container from "../layout/Container";
import { useResumeQuery } from "../../hooks/usePortfolioApi";
import {
    Github,
    Linkedin,
    Mail,
    Phone,
    MapPin,
    Instagram,
    Twitter,
} from "lucide-react";
import { Link } from "react-router-dom";

const HomeFooter = () => {
    return (
        <SectionWrapper
            id="footer"
            bgVariant="secondary"
            className="py-12 border-t border-zinc-800"
        >
            <Container>
                <div className="mx-auto max-w-7xl px-4">
                    {/* MAIN GRID */}
                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        {/* BRAND */}
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-white">
                                Mohd Arif Ansari
                            </h2>
                            <p className="text-sm text-zinc-400">
                                Full Stack Developer building scalable backend
                                systems & AI-powered apps.
                            </p>
                        </div>

                        {/* NAVIGATION */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-white">
                                Explore
                            </h3>
                            <ul className="space-y-2 text-sm text-zinc-400">
                                <li>
                                    <Link
                                        to="/"
                                        className="hover:text-white transition"
                                    >
                                        Home
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/projects"
                                        className="hover:text-white transition"
                                    >
                                        Projects
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/experience"
                                        className="hover:text-white transition"
                                    >
                                        Experience
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/about"
                                        className="hover:text-white transition"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/contact"
                                        className="hover:text-white transition"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* CONTACT */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-white">
                                Contact
                            </h3>

                            <div className="space-y-2 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <span>arifquerry@gmail.com</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span>+91 70811 68219</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>Uttar Pradesh, India</span>
                                </div>
                            </div>
                        </div>

                        {/* SOCIAL */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-white">
                                Connect
                            </h3>

                            <div className="flex gap-3">
                                <a
                                    href="https://github.com/arry043"
                                    target="_blank"
                                    className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition"
                                >
                                    <Github className="w-4 h-4 text-zinc-400" />
                                </a>

                                <a
                                    href="https://linkedin.com/in/arryquerry"
                                    target="_blank"
                                    className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition"
                                >
                                    <Linkedin className="w-4 h-4 text-zinc-400" />
                                </a>

                                <a
                                    href={`mailto:arifquerry@gmail.com`}
                                    target="_blank"
                                    className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition"
                                >
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                </a>

                                <a
                                    href="https://www.instagram.com/itz_arry03/"
                                    target="_blank"
                                    className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition"
                                >
                                    <Instagram className="w-4 h-4 text-zinc-400" />
                                </a>

                                <a
                                    href="https://x.com/itz__arry03"
                                    target="_blank"
                                    className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-900 transition"
                                >
                                    <Twitter className="w-4 h-4 text-zinc-400" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <div className="my-8 border-t border-zinc-800" />

                    {/* BOTTOM */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
                        <p className="text-sm text-zinc-500">
                            © {new Date().getFullYear()} {name}. All rights
                            reserved.
                        </p>

                        <p className="text-sm text-zinc-600">
                            Designed & Built with ❤️ using React & Tailwind
                        </p>
                    </div>
                </div>
            </Container>
        </SectionWrapper>
    );
};

export default memo(HomeFooter);
