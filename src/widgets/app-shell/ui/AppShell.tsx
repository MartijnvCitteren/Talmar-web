import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ChartBar,
  UserRound,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import { Logo } from '../../../shared/ui';
import styles from './AppShell.module.css';

/** `section` is the path prefix that marks the item active (Vacatures links to "new" but owns all of /vacancies). */
const navItems = [
  { label: 'Dashboard', to: '/dashboard', section: '/dashboard', Icon: LayoutDashboard },
  { label: 'Vacatures', to: '/vacancies/new', section: '/vacancies', Icon: Briefcase },
  { label: 'Kandidaten', to: '/candidates', section: '/candidates', Icon: Users },
  { label: 'Statistieken', to: '/statistics', section: '/statistics', Icon: ChartBar },
];

/**
 * Design note: the account-menu items' actual destinations were never observed
 * (per open-questions.md #6) — clicking opens/closes the menu but items don't navigate.
 */
const accountMenuItems = [
  { label: 'Account', Icon: UserRound },
  { label: 'Instellingen', Icon: Settings },
  { label: 'Support', Icon: LifeBuoy },
];

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!menuOpen) return;

    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [menuOpen]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Logo variant="lockup" />
          <nav aria-label="Hoofdnavigatie" className={styles.nav}>
            {navItems.map(({ label, to, section, Icon }) => {
              const isActive = pathname === section || pathname.startsWith(`${section}/`);
              return (
                <Link
                  key={label}
                  to={to}
                  className={styles.navItem}
                  data-active={isActive}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className={styles.account} ref={containerRef} data-dd="">
            <button
              type="button"
              className={styles.avatarButton}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className={styles.avatar}>MJ</span>
            </button>
            {menuOpen && (
              <ul className={styles.accountMenu} role="menu" aria-label="Accountmenu">
                <li className={styles.accountMenuHeader}>
                  <div className={styles.accountMenuName}>Merel Janssen</div>
                  <div className={styles.accountMenuOrg}>Jobzy</div>
                </li>
                {accountMenuItems.map(({ label, Icon }) => (
                  <li key={label} role="none">
                    <button type="button" role="menuitem" className={styles.accountMenuItem}>
                      <Icon size={16} aria-hidden="true" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
