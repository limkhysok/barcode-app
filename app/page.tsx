import Image from "next/image";
import Navbar from "@/src/components/layouts/Navbar";

const products = [
  { name: "Engine Oil Filter",    category: "Engine",      price: "$12.99" },
  { name: "Brake Pad Set",        category: "Brakes",      price: "$34.50" },
  { name: "Air Filter",           category: "Engine",      price: "$9.99"  },
  { name: "Spark Plug (x4)",      category: "Ignition",    price: "$18.00" },
  { name: "Timing Belt Kit",      category: "Engine",      price: "$55.00" },
  { name: "Alternator",           category: "Electrical",  price: "$89.99" },
];

const team = [
  { name: "Sovann Keo",   role: "Founder & CEO"       },
  { name: "Dara Pich",    role: "Head of Operations"  },
  { name: "Lina Sok",     role: "Customer Relations"  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main className="bg-white">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center justify-between gap-14">

          <div className="flex-1 space-y-6 text-center md:text-left">
            <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
              — Quality · Reliable · Fast
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
              The Smarter Way to{" "}
              <span className="italic" style={{ color: "#FA4900" }}>Buy</span>{" "}
              Spare Parts
            </h1>
            <p className="text-base font-normal text-gray-500 max-w-md leading-relaxed mx-auto md:mx-0">
              CTK is your one-stop shop for quality spare parts — browse our
              catalog, place orders, and get the right part delivered to your door.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-8 justify-center md:justify-start pt-2">
              {[
                { value: "10K+", label: "Parts Listed"  },
                { value: "500+", label: "Orders / Day"  },
                { value: "99%",  label: "Accuracy"      },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <div className="absolute w-64 h-64 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: "#FA4900" }} />
              <div className="absolute w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "#FA4900" }} />
              <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                <Image src="/ctk.svg" alt="CTK Logo" width={120} height={168} className="rounded-xl" priority />
              </div>
            </div>
          </div>

        </section>

        {/* ── PRODUCTS ─────────────────────────────────── */}
        <section id="products" className="border-t border-gray-100 bg-gray-50 px-6 py-20">
          <div className="max-w-6xl mx-auto space-y-10">

            <div className="text-center space-y-2">
              <p className="text-xs font-medium tracking-[0.25em] uppercase italic text-gray-400">Our Catalog</p>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-sm font-normal text-gray-500 max-w-md mx-auto">
                Browse our most popular spare parts — all verified, in stock, and ready to ship.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(({ name, category, price }) => (
                <div key={name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                  {/* placeholder image area */}
                  <div className="w-full h-32 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFF3EE" }}>
                    <svg className="w-10 h-10 opacity-40" fill="none" stroke="#FA4900" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#FA4900" }}>{category}</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-0.5">{name}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-base font-bold text-gray-900">{price}</span>
                    <button
                      className="text-xs font-bold tracking-widest uppercase text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                      style={{ backgroundColor: "#FA4900" }}
                    >
                      Order
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── ABOUT US ─────────────────────────────────── */}
        <section id="about" className="px-6 py-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-14">

            {/* Text */}
            <div className="flex-1 space-y-5 text-center md:text-left">
              <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Who we are</p>
              <h2 className="text-3xl font-bold text-gray-900">About CTK Spare Parts</h2>
              <p className="text-sm font-normal text-gray-500 leading-relaxed max-w-lg">
                Founded with a passion for keeping vehicles running, CTK Spare Parts has been supplying
                customers with high-quality, certified components since 2010. We work directly with
                manufacturers to ensure every part meets strict quality standards before it reaches you.
              </p>
              <p className="text-sm font-normal italic text-gray-400 leading-relaxed max-w-lg">
                "Our mission is simple — get you the right part, at the right price, delivered fast."
              </p>

              {/* Team */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                {team.map(({ name, role }) => (
                  <div key={name} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: "#FA4900" }}>
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{name}</p>
                      <p className="text-[10px] font-normal italic text-gray-400">{role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="shrink-0 w-72 h-72 rounded-3xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FA4900 0%, #b91c1c 100%)" }}>
              <div className="text-center text-white space-y-1 px-8">
                <p className="text-5xl font-bold">14+</p>
                <p className="text-xs font-medium tracking-widest uppercase opacity-80">Years of Experience</p>
                <div className="w-10 h-0.5 bg-white/40 mx-auto my-3" />
                <p className="text-4xl font-bold">50K+</p>
                <p className="text-xs font-medium tracking-widest uppercase opacity-80">Happy Customers</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── CONTACT US ───────────────────────────────── */}
        <section id="contact" className="border-t border-gray-100 bg-gray-50 px-6 py-20">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="text-center space-y-2">
              <p className="text-xs font-medium tracking-[0.25em] uppercase italic text-gray-400">Get in touch</p>
              <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
              <p className="text-sm font-normal text-gray-500">
                Have a question or need help finding a part? Reach us through any of the channels below.
              </p>
            </div>

            {/* Contact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  ),
                  label: "Address",
                  value: "Phnom Penh, Cambodia",
                  sub: "Toul Kork District",
                  href: "https://maps.google.com",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  ),
                  label: "Phone",
                  value: "+855 12 345 678",
                  sub: "Mon – Sat, 8am – 6pm",
                  href: "tel:+85512345678",
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  ),
                  label: "Email",
                  value: "info@ctk-parts.com",
                  sub: "We reply within 24 hours",
                  href: "mailto:info@ctk-parts.com",
                },
              ].map(({ icon, label, value, sub, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-3 group"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: "#FA4900" }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                    <p className="text-xs font-normal italic text-gray-400 mt-0.5">{sub}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Social media */}
            <div className="text-center space-y-4">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Follow Us</p>
              <div className="flex items-center justify-center gap-4">

                {/* Facebook */}
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-[#1877F2] hover:text-white hover:border-transparent">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-[#E1306C] hover:text-white hover:border-transparent">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>

                {/* Telegram */}
                <a href="https://t.me" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-[#229ED9] hover:text-white hover:border-transparent">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.237l-2.95-.924c-.641-.2-.654-.641.136-.953l11.57-4.461c.537-.194 1.006.131.326.349z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a href="https://wa.me" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-[#25D366] hover:text-white hover:border-transparent">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>

              </div>
            </div>

          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer className="border-t bg-white px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs font-medium text-gray-400">
            © {new Date().getFullYear()} <span className="font-bold text-gray-600">CTK</span> Spare Parts. All rights reserved.
          </p>
          <p className="text-[10px] font-normal italic text-gray-300">Quality · Reliable · Fast</p>
        </footer>

      </main>
    </>
  );
}
