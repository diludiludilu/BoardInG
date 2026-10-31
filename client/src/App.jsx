import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import { BrowseHouses, BoardingDetails, OwnerHouses } from "./pages/Houses";
import { StudentRequests, OwnerRequests, OwnerResidents } from "./pages/Requests";
import { Community } from "./pages/Community";
import { Maintenance } from "./pages/Maintenance";
import { MenuIcon, CloseIcon } from "./components/Icons";

const navStyle = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? "bg-blue-800 text-white dark:bg-slate-800 dark:text-blue-300" : "text-blue-100 hover:bg-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"}`;
const mobileNavStyle = ({ isActive }) => `flex min-h-[44px] items-center rounded-lg px-4 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${isActive ? "bg-blue-800 text-white dark:bg-slate-800 dark:text-blue-300" : "text-blue-100 hover:bg-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"}`;

function Home() {
  const [houses, setHouses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api("/houses").then(setHouses).catch((e) => setError(e.message)); }, []);
  return <main>
    <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 dark:from-blue-950 dark:via-slate-900 dark:to-cyan-950">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100 dark:text-blue-200">Find your place. Find your people.</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl text-white">Better boarding starts with BoardInG.</h1>
        <p className="mt-6 max-w-2xl text-lg text-blue-100 dark:text-slate-300">Discover student accommodation, request a place, and stay connected to your boarding community.</p>
        <Link to="/houses" className="mt-8 inline-flex min-h-[44px] items-center rounded-xl bg-white px-6 py-3 font-bold text-blue-800 shadow-lg hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500">Explore boarding houses →</Link>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Latest listings</h2><p className="mt-1 text-slate-500 dark:text-slate-400">A good place to start your search.</p></div><Link className="inline-flex min-h-[44px] items-center font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400 dark:focus-visible:ring-blue-400 rounded-md px-1" to="/houses">See all houses →</Link></div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950/60 dark:border dark:border-red-900/60 dark:text-red-300">{error}</p>}
      {!error && houses.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">No properties have been listed yet. Owners can add the first boarding house from their dashboard.</div>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{houses.slice(0, 6).map((house) => <Link key={house._id} to={`/houses/${house._id}`} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-slate-900 dark:ring-slate-800 dark:focus-visible:ring-blue-400">{house.imageUrl ? <img src={house.imageUrl} alt={house.title} className="h-44 w-full object-cover"/> : <div className="flex h-44 items-center justify-center bg-blue-100 text-blue-800 dark:bg-slate-800 dark:text-blue-300">BoardInG · Student housing</div>}<div className="p-5"><h3 className="font-bold text-slate-900 dark:text-slate-100">{house.title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{house.area}, {house.city}</p><p className="mt-3 font-semibold text-blue-700 dark:text-blue-400">LKR {house.monthlyRentLkr.toLocaleString()} / month</p></div></Link>)}</div>
    </section>
  </main>;
}

function AuthForm({ mode, onAuth }) {
  const navigate = useNavigate();
  const register = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus-visible:ring-blue-400";
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const payload = register ? form : { email: form.email, password: form.password };
      const result = await api(`/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(payload) });
      onAuth(result.user); navigate("/dashboard", { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-12"><section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{register ? "Join BoardInG" : "Welcome back"}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{register ? "Create your student or owner account." : "Sign in to your boarding dashboard."}</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {register && <><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full name<input required minLength={2} maxLength={80} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Account type<select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="STUDENT">Student</option><option value="OWNER">Boarding owner</option></select></label></>}
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email<input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password<input required type="password" minLength={8} maxLength={72} className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/60 dark:border dark:border-red-900/60 dark:text-red-300">{error}</p>}
      <button disabled={busy} className="w-full min-h-[44px] rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus-visible:ring-blue-400 disabled:opacity-50">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
    </form>
    <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">{register ? "Already have an account?" : "New to BoardInG?"} <Link className="font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400 dark:focus-visible:ring-blue-400 rounded" to={register ? "/login" : "/register"}>{register ? "Sign in" : "Register"}</Link></p>
  </section></main>;
}

function Dashboard({ user }) {
  if (!user) return <Navigate to="/login" replace/>;
  const owner = user.role === "OWNER";
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8"><p className="text-blue-700 dark:text-blue-400 font-semibold">{owner ? "Owner workspace" : "Student workspace"}</p><h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">Hello, {user.name} 👋</h1><p className="mt-2 text-slate-500 dark:text-slate-400">{owner ? "Manage properties, review requests and connect with residents." : "Explore accommodation, check your requests and join your house community."}</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(owner ? [
      ["My boarding houses", "Create and manage property listings", "/owner/houses", "Manage houses →"],
      ["Accommodation requests", "Approve students after offline confirmation", "/owner/requests", "Review requests →"],
      ["Residents and communities", "Manage residents and publish announcements", "/owner/residents", "Open communities →"],
    ] : [
      ["Find a boarding house", "Search by city and budget", "/houses", "Browse houses →"],
      ["My accommodation requests", "Check pending and approved requests", "/student/requests", "View requests →"],
      ["My communities", "Visit communities after approval", "/student/requests", "View memberships →"],
    ]).map(([title, description, href, action]) => <Link to={href} key={href+title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-slate-900 dark:ring-slate-800 dark:focus-visible:ring-blue-400"><h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2><p className="mt-3 min-h-12 text-sm text-slate-500 dark:text-slate-400">{description}</p><span className="mt-4 inline-block font-semibold text-blue-700 dark:text-blue-400">{action}</span></Link>)}</div>
  </main>;
}

function AppShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    api("/auth/me").then((r) => setUser(r.user)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [menuOpen]);

  async function logout() {
    setMenuOpen(false);
    try {
      setError("");
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="p-8 text-slate-600 dark:text-slate-400">Loading BoardInG…</div>;

  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 scheme-light dark:scheme-dark transition-colors duration-150">
    <header className="bg-blue-700 text-white dark:bg-slate-900 dark:border-b dark:border-slate-800"><nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8" aria-label="Main navigation"><Link to="/" className="text-2xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:focus-visible:ring-offset-slate-900 rounded-md">BoardInG<span className="text-cyan-200 dark:text-cyan-400">.</span></Link>
      <div className="hidden items-center gap-1 lg:flex"><NavLink to="/" end className={navStyle}>Home</NavLink><NavLink to="/houses" className={navStyle}>Browse</NavLink>
      {user ? <><NavLink to="/dashboard" className={navStyle}>Dashboard</NavLink>{user.role === "OWNER" ? <><NavLink to="/owner/houses" className={navStyle}>Properties</NavLink><NavLink to="/owner/requests" className={navStyle}>Requests</NavLink><NavLink to="/owner/residents" className={navStyle}>Residents</NavLink></> : <NavLink to="/student/requests" className={navStyle}>My requests</NavLink> }<button type="button" onClick={logout} className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border dark:border-slate-700 dark:focus-visible:ring-offset-slate-900">Log out</button></> : <><NavLink to="/login" className={navStyle}>Log in</NavLink><Link to="/register" className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border dark:border-slate-700 dark:focus-visible:ring-offset-slate-900">Get started</Link></>}
      </div>
      <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-blue-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900 lg:hidden">
        {menuOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
        <span>{menuOpen ? "Close" : "Menu"}</span>
      </button>
    </nav>
    {menuOpen && (
      <div id="mobile-navigation" className="border-t border-blue-600/60 bg-blue-700 px-4 pt-2 pb-4 space-y-1 sm:px-6 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <NavLink to="/" end className={mobileNavStyle}>Home</NavLink>
        <NavLink to="/houses" className={mobileNavStyle}>Browse</NavLink>
        {user ? <>
          <NavLink to="/dashboard" className={mobileNavStyle}>Dashboard</NavLink>
          {user.role === "OWNER" ? <>
            <NavLink to="/owner/houses" className={mobileNavStyle}>Properties</NavLink>
            <NavLink to="/owner/requests" className={mobileNavStyle}>Requests</NavLink>
            <NavLink to="/owner/residents" className={mobileNavStyle}>Residents</NavLink>
          </> : <NavLink to="/student/requests" className={mobileNavStyle}>My requests</NavLink>}
          <div className="pt-2"><button type="button" onClick={logout} className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-white px-4 py-3 text-base font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border dark:border-slate-700 dark:focus-visible:ring-offset-slate-900">Log out</button></div>
        </> : <>
          <NavLink to="/login" className={mobileNavStyle}>Log in</NavLink>
          <div className="pt-2"><Link to="/register" className="flex w-full min-h-[44px] items-center justify-center rounded-lg bg-white px-4 py-3 text-base font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:border dark:border-slate-700 dark:focus-visible:ring-offset-slate-900">Get started</Link></div>
        </>}
      </div>
    )}
    </header>
    {error && <p role="alert" className="mx-auto mt-3 w-full max-w-6xl rounded bg-red-50 px-4 py-2 text-red-700 dark:bg-red-950/60 dark:border dark:border-red-900/60 dark:text-red-300">{error}</p>}
    <div className="flex-1"><Routes>
      <Route path="/" element={<Home/>}/><Route path="/houses" element={<BrowseHouses/>}/><Route path="/houses/:id" element={<BoardingDetails user={user}/>}/>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace/> : <AuthForm mode="login" onAuth={setUser}/>}/>
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace/> : <AuthForm mode="register" onAuth={setUser}/>}/>
      <Route path="/dashboard" element={<Dashboard user={user}/>}/>
      <Route path="/owner/houses" element={user?.role === "OWNER" ? <OwnerHouses/> : <Navigate to={user ? "/dashboard" : "/login"} replace/>}/>
      <Route path="/owner/requests" element={user?.role === "OWNER" ? <OwnerRequests/> : <Navigate to={user ? "/dashboard" : "/login"} replace/>}/>
      <Route path="/owner/residents" element={user?.role === "OWNER" ? <OwnerResidents/> : <Navigate to={user ? "/dashboard" : "/login"} replace/>}/>
      <Route path="/student/requests" element={user?.role === "STUDENT" ? <StudentRequests/> : <Navigate to={user ? "/dashboard" : "/login"} replace/>}/>
      <Route path="/community/:houseId" element={user ? <Community user={user}/> : <Navigate to="/login" replace/>}/>
      <Route path="/issues/:houseId" element={user ? <Maintenance user={user}/> : <Navigate to="/login" replace/>}/>
      <Route path="*" element={<div className="mx-auto max-w-3xl px-6 py-20 text-center"><h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1><Link to="/" className="mt-4 inline-block text-blue-700 hover:underline dark:text-blue-400">Return home</Link></div>}/>
    </Routes></div>
    <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">© BoardInG · Student accommodation & community · University MVP</footer>
  </div>;
}

export default function App() { return <BrowserRouter><AppShell/></BrowserRouter>; }
