import React, { useEffect, useState } from "react";
import { Menu, X, User, LogOut, ChevronRight, Shield, QrCode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from '@/lib/supabase';
import { publicNavLinks, memberNavLinks } from "@/lib/navigation";
import { DonationModal } from "@/components/DonationModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SmartIsland() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>("PUBLIC");

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchUserRole(sessionUser.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchUserRole(sessionUser.id);
      } else {
        setUserRole("PUBLIC");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchUserRole(userId: string) {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (data?.role) {
        setUserRole(data.role);
      }
    } catch {
      // Keep default
    }
  }

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("nav-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const [donationModalOpen, setDonationModalOpen] = useState(false);

  useEffect(() => {
    function handleOpenDonation() {
      setDonationModalOpen(true);
    }
    window.addEventListener("open-donation-modal", handleOpenDonation);
    return () => window.removeEventListener("open-donation-modal", handleOpenDonation);
  }, []);

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
      // Clear the domain-wide session cookie used by the admin host middleware.
      document.cookie = "sb-access-token=; path=/; domain=.nagrik.party; max-age=0; Secure; SameSite=Lax";
      window.location.href = "/";
    }
  }

  const navLinks = user ? memberNavLinks : publicNavLinks;
  const isAdminOrStaff = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "VERIFIER";

  return (
    <>
      <nav className="nav-links" aria-label="Primary navigation">
        {navLinks.map((item) => (
          <a key={item.href} href={item.href} className="island-nav-link">
            <span>{item.label}</span>
          </a>
        ))}

        <div className="island-action-buttons">
          <button
            type="button"
            onClick={() => setDonationModalOpen(true)}
            className="button island-action-btn"
            style={{
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(232, 87, 26, 0.08)",
              color: "var(--saffron)",
              borderColor: "var(--saffron)",
              cursor: "pointer",
            }}
          >
            <QrCode size={14} />
            <span>Contribute</span>
          </button>
          {!user ? (
            <a href="/membership" className="button button-primary island-action-btn" style={{ fontWeight: 600 }}>
              Member Banein
            </a>
          ) : (
            <a href="/member" className="button yellow island-action-btn" style={{ fontWeight: 600 }}>
              My Nagrik
            </a>
          )}
        </div>
      </nav>

      <div className="nav-actions">
        <ThemeToggle />
        {!user ? (
          <a
            href="/login"
            className="icon-button island-icon-btn"
            aria-label="Sign In"
            title="Sign In / Member Access"
          >
            <User size={18} />
          </a>
        ) : (
          <div data-testid="user-profile-menu" className="island-dropdown-container">
            <button
              className="icon-button island-user-btn"
              aria-label="Account Menu"
              type="button"
            >
              <User size={18} />
            </button>
            <div className="island-dropdown-menu island-user-menu">
              <div style={{ padding: "8px 14px 6px", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--saffron)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  {userRole}
                </span>
              </div>
              <a href="/member">Member Dashboard</a>
              <a href="/member/induction">Digital Induction</a>
              <a href="/member/membership-card">Membership Card</a>
              {isAdminOrStaff && (
                <a href="https://administration.nagrik.party/admin" style={{ color: "var(--saffron)", fontWeight: 600 }}>
                  <Shield size={14} style={{ marginRight: 6 }} />
                  Admin Console
                </a>
              )}
              <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
              <a
                data-testid="logout-button"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
              >
                <LogOut size={14} className="island-logout-icon" />
                Sign Out
              </a>
            </div>
          </div>
        )}

        <button
          className="icon-button mobile-menu"
          onClick={() => setOpen((value) => !value)}
          type="button"
          aria-label="Open mobile navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {open && (
        <div className="mobile-drawer-overlay" onClick={() => setOpen(false)}>
          <div
            className="mobile-drawer-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: 16, fontFamily: "var(--font-serif)" }}>Nagrik Party</strong>
                <small style={{ color: "var(--saffron)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                  PHASE 1 · FORMATION PHASE
                </small>
              </div>
              <button
                className="icon-button"
                onClick={() => setOpen(false)}
                type="button"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-body">
              {user && (
                <div style={{ padding: "8px 12px 10px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 4, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--saffron)", fontFamily: "var(--font-mono)" }}>
                    ROLE: {userRole}
                  </span>
                </div>
              )}

              <div className="mobile-drawer-links">
                {navLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="mobile-drawer-link"
                    onClick={() => setOpen(false)}
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                  </a>
                ))}

                <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />

                <button
                  type="button"
                  className="mobile-drawer-link"
                  onClick={() => {
                    setOpen(false);
                    setDonationModalOpen(true);
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--saffron)",
                    fontWeight: 600,
                    padding: "10px 0",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <QrCode size={16} /> Contribute via UPI
                  </span>
                  <ChevronRight size={16} style={{ color: "var(--saffron)" }} />
                </button>

                <a href="/crime" className="mobile-drawer-link" onClick={() => setOpen(false)}>
                  <span>Verified Crime Tracker</span>
                  <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                </a>

                {user ? (
                  <>
                    <a href="/member/induction" className="mobile-drawer-link" onClick={() => setOpen(false)}>
                      <span>Digital Induction</span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </a>
                    <a href="/member/membership-card" className="mobile-drawer-link" onClick={() => setOpen(false)}>
                      <span>Membership Card</span>
                      <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                    </a>
                    {isAdminOrStaff && (
                      <a href="https://administration.nagrik.party/admin" className="mobile-drawer-link" onClick={() => setOpen(false)} style={{ color: "var(--saffron)", fontWeight: 600 }}>
                        <span>Admin Console</span>
                        <ChevronRight size={16} style={{ color: "var(--saffron)" }} />
                      </a>
                    )}
                  </>
                ) : (
                  <a href="/volunteer" className="mobile-drawer-link" onClick={() => setOpen(false)}>
                    <span>Become a Volunteer</span>
                    <ChevronRight size={16} style={{ color: "var(--muted)" }} />
                  </a>
                )}
              </div>

              <div className="mobile-drawer-footer">
                {!user ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <a
                      href="/membership"
                      className="button button-primary"
                      style={{ width: "100%", justifyContent: "center", padding: "12px", fontWeight: 700 }}
                      onClick={() => setOpen(false)}
                    >
                      Become a Member
                    </a>
                    <a
                      href="/login"
                      className="button"
                      style={{ width: "100%", justifyContent: "center", padding: "10px", fontWeight: 600 }}
                      onClick={() => setOpen(false)}
                    >
                      Sign In
                    </a>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    <a
                      href="/member"
                      className="button yellow"
                      style={{ width: "100%", justifyContent: "center", padding: "12px", fontWeight: 700 }}
                      onClick={() => setOpen(false)}
                    >
                      My Nagrik Dashboard
                    </a>
                    <button
                      type="button"
                      className="button"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <DonationModal
        isOpen={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
      />
    </>
  );
}
