import Image from "next/image";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
                <Image
                    src="/ctk.svg"
                    alt="CTK Logo"
                    width={36}
                    height={50}
                    className="rounded"
                    priority
                />
                <span className="text-base font-bold text-gray-900 tracking-tight">CTK</span>
            </div>
        </nav>
    );
}
