"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Top bar with the logo and the two main links.
export default function Header() {
  const pathname = usePathname(); // current URL path, used to highlight the active link

  const links = [
    { href: "/", label: "Rechercher" },
    { href: "/pharmacy", label: "Espace pharmacie" },
  ];

  return (
    <header className="border-b border-brand-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Logo Mawjoud" width={36} height={40} priority />
          <span className="text-xl font-bold text-brand-900">Mawjoud</span>
        </Link>

        <nav className="flex gap-1 text-sm font-medium">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  isActive
                    ? "bg-brand-600 text-white"
                    : "text-brand-900 hover:bg-brand-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
