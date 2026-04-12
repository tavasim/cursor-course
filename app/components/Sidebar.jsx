"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

const navItems = [
  { href: "/dashboards", label: "Overview", icon: "home", external: false },
  { href: "/playground", label: "API Playground", icon: "code", external: false },
  { href: "/dashboards/billing", label: "Billing", icon: "document", external: false },
];

const externalItems = [
  { href: "https://docs.example.com", label: "Documentation", icon: "document" },
];

function Icon({ name, active }) {
  const className = `w-5 h-5 shrink-0 ${active ? "text-blue-600" : "text-gray-500"}`;
  switch (name) {
    case "home":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case "code":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 4.5 4.5 4.5" />
        </svg>
      );
    case "document":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
        </svg>
      );
    default:
      return null;
  }
}

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-500 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function userInitials(name, email) {
  const fromName = typeof name === "string" ? name.trim() : "";
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fromName.slice(0, 2).toUpperCase();
  }
  const e = typeof email === "string" ? email.trim() : "";
  if (e) return e.slice(0, 2).toUpperCase();
  return "?";
}

function SidebarUserSection() {
  const { data: session, status } = useSession();
  const [imageLoadError, setImageLoadError] = useState(false);

  const rawImage = session?.user?.image;
  const photo =
    typeof rawImage === "string" && /^https?:\/\//i.test(rawImage.trim())
      ? rawImage.trim()
      : "";

  useEffect(() => {
    setImageLoadError(false);
  }, [photo]);

  if (status === "loading") {
    return (
      <div className="shrink-0 border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200/80 animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-24 rounded bg-gray-200/80 animate-pulse" />
            <div className="h-3 w-full max-w-[180px] rounded bg-gray-200/80 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const { name, email } = session.user;
  const displayName = name?.trim() || email?.split("@")[0] || "Signed in";
  const initials = userInitials(name, email);

  const avatarSrc = photo && !imageLoadError ? photo : undefined;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-[#EEEEE9]/80 px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar
          key={photo || "no-photo"}
          className="relative z-20 h-11 w-11 shrink-0 border border-gray-200 bg-white"
        >
          <AvatarImage
            src={avatarSrc}
            alt=""
            className="object-cover"
            referrerPolicy="no-referrer"
            onLoadingStatusChange={(status) => {
              if (status === "error") setImageLoadError(true);
            }}
          />
          <AvatarFallback className="rounded-full bg-gray-200 text-xs font-semibold text-gray-800">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
          {email ? (
            <p className="mt-0.5 truncate text-xs text-gray-600" title={email}>
              {email}
            </p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-3 w-full rounded-xl border border-[#c53030] bg-[#e53e3e] px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#d63636] active:bg-[#c53030]"
      >
        Logout
      </button>
    </div>
  );
}

export default function Sidebar({ onClose }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 w-full flex-col rounded-tr-2xl bg-[#F5F5F4] shadow-sm">
      {/* Logo + close button */}
      <div className="flex items-center justify-between gap-2 px-6 pt-8 pb-6">
        <span className="text-lg font-bold tracking-tight text-gray-900">Dandi</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200/60 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-[#E8EDF7] text-gray-900" : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900"
              }`}
            >
              <Icon name={item.icon} active={active} />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}

        <div className="my-2 border-t border-gray-200" />

        {externalItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200/60 hover:text-gray-900"
          >
            <Icon name={item.icon} active={false} />
            <span className="flex-1">{item.label}</span>
            <ExternalIcon />
          </a>
        ))}
      </nav>

      <SidebarUserSection />
    </aside>
  );
}
