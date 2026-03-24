import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
            {/* Brand accent line */}
            <div className="h-0.5 w-full" style={{ background: "linear-gradient(to right, #FA4900, #b91c1c)" }} />

            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Brand */}
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <Image
                        src="/ctk.svg"
                        alt="CTK Logo"
                        width={26}
                        height={36}
                        className="rounded-sm"
                        priority
                    />
                    <div>
                        <p className="text-sm font-bold tracking-[0.2em] uppercase text-gray-900 leading-none">CTK</p>
                        <p className="text-[9px] font-medium tracking-[0.15em] uppercase leading-none mt-0.5" style={{ color: "#FA4900" }}>Spare Parts</p>
                    </div>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-8">
                    {[
                        { label: "Home",     href: "/"         },
                        { label: "Products", href: "#products" },
                        { label: "About",    href: "#about"    },
                        { label: "Contact",  href: "#contact"  },
                    ].map(({ label, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="relative text-xs font-medium tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors group"
                        >
                            {label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ backgroundColor: "#FA4900" }} />
                        </Link>
                    ))}
                </div>

                {/* Auth */}
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/login"
                        className="text-xs font-bold tracking-widest uppercase text-gray-600 hover:text-gray-900 transition px-3 py-1.5"
                    >
                        Login
                    </Link>
                    <Link
                        href="/register"
                        className="text-xs font-bold tracking-widest uppercase text-white px-5 py-2 rounded-lg hover:opacity-90 active:scale-[0.97] transition shadow-sm"
                        style={{ backgroundColor: "#FA4900" }}
                    >
                        Register
                    </Link>
                </div>

            </div>
        </nav>
    );
}
