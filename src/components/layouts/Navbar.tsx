import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

                {/* Brand — bold */}
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <Image
                        src="/ctk.svg"
                        alt="CTK Logo"
                        width={28}
                        height={39}
                        className="rounded-sm"
                        priority
                    />
                    <span className="text-base font-bold tracking-widest uppercase text-gray-900">
                        CTK
                    </span>
                </Link>

                {/* Nav links — medium */}
                <div className="hidden sm:flex items-center gap-7">
                    {[
                        { label: "Home",     href: "/" },
                        { label: "Products", href: "#" },
                        { label: "About",    href: "#" },
                    ].map(({ label, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="text-xs font-medium tracking-widest uppercase text-gray-500 hover:text-orange-600 transition-colors"
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Auth buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Sign In — regular + italic */}
                    <Link
                        href="/login"
                        className="px-4 py-2 rounded-lg text-xs font-normal italic tracking-wide text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
                    >
                        Sign In
                    </Link>
                    {/* Register — bold */}
                    <Link
                        href="/register"
                        className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 active:scale-[0.97] transition shadow-sm"
                        style={{ backgroundColor: "#FA4900" }}
                    >
                        Register
                    </Link>
                </div>

            </div>
        </nav>
    );
}
