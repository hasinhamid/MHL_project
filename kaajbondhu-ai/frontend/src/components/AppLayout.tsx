import { useState, type ReactNode } from 'react';
import { NavLink, Link } from 'react-router';
import { Menu, Wrench, X } from 'lucide-react';

export default function AppLayout({ count, mode, children }: { count: number; mode: 'demo' | 'live' | null; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const links = [{ to: '/', label: 'Smart finder' }, { to: '/marketplace', label: 'Odd jobs marketplace' }, { to: '/requests', label: `My requests (${count})` }, { to: '/work-with-us', label: 'Work with us' }];
  return <div className="min-h-screen">
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">Skip to content</a>
    <header className="border-b border-[#dfece9] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2" aria-label="KaajBondhu home"><span className="grid size-9 place-items-center rounded-xl bg-primary text-white"><Wrench className="size-5" /></span><span className="text-lg font-bold tracking-tight">KaajBondhu<span className="text-[#e49b48]">.</span></span></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-medium md:flex">
          {links.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => link.to === '/work-with-us' ? 'rounded-lg bg-primary px-4 py-2 text-white hover:bg-[#086454]' : isActive ? 'font-bold text-primary' : 'text-[#5d7772] hover:text-primary'}>{link.label}</NavLink>)}
        </nav>
        <div className="flex items-center gap-2 md:hidden"><Link to="/work-with-us" onClick={() => setOpen(false)} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">Work with us</Link><button aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} className="rounded-lg p-2">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
      </div>
      {open && <nav id="mobile-menu" aria-label="Mobile navigation" className="flex flex-col border-t px-5 py-3 md:hidden">{links.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-3 text-sm ${isActive ? 'bg-muted font-bold text-primary' : ''}`}>{link.label}</NavLink>)}</nav>}
    </header>
    <main id="main" className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">{children}</main>
    <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t px-5 py-6 text-xs text-[#607a74] lg:px-8"><span>KaajBondhu · Local help, one place</span><span>{mode === 'demo' ? 'Demo AI · Simulated recommendations' : mode === 'live' ? 'Live AI · Demo marketplace' : 'Connecting to service…'} · Requests saved on this browser</span></footer>
  </div>;
}
