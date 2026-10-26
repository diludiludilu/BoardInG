import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { api } from "./services/api";
import { BrowseHouses, BoardingDetails, OwnerHouses } from "./pages/Houses";
import { StudentRequests, OwnerRequests, OwnerResidents } from "./pages/Requests";
import { Community } from "./pages/Community";
import { Maintenance } from "./pages/Maintenance";

const navStyle = ({ isActive }) => `rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-600"}`;

function Home() {
  const [houses, setHouses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api("/houses").then(setHouses).catch((e) => setError(e.message)); }, []);
  return <main>
    <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Find your place. Find your people.</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">Better boarding starts with BoardInG.</h1>
        <p className="mt-6 max-w-2xl text-lg text-blue-100">Discover student accommodation, request a place, and stay connected to your boarding community.</p>
        <Link to="/houses" className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-blue-800 shadow-lg hover:bg-blue-50">Explore boarding houses →</Link>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold">Latest listings</h2><p className="mt-1 text-slate-500">A good place to start your search.</p></div><Link className="font-semibold text-blue-700 hover:underline" to="/houses">See all houses →</Link></div>
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      {!error && houses.length === 0 && <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">No properties have been listed yet. Owners can add the first boarding house from their dashboard.</div>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{houses.slice(0, 6).map((house) => <Link key={house._id} to={`/houses/${house._id}`} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">{house.imageUrl ? <img src={house.imageUrl} alt={house.title} className="h-40 w-full object-cover"/> : <div className="flex h-40 items-center justify-center bg-blue-100 text-blue-800">BoardInG · Student housing</div>}<div className="p-5"><h3 className="font-bold">{house.title}</h3><p className="mt-1 text-sm text-slate-500">{house.area}, {house.city}</p><p className="mt-3 font-semibold text-blue-700">LKR {house.monthlyRentLkr.toLocaleString()} / month</p></div></Link>)}</div>
    </section>
  </main>;
}

function AuthForm({ mode, onAuth }) {
  const navigate = useNavigate();
  const register = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-blue-600";
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const payload = register ? form : { email: form.email, password: form.password };
      const result = await api(`/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(payload) });
      onAuth(result.user); navigate("/dashboard", { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-md px-5 py-12"><section className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
    <h1 className="text-3xl font-extrabold">{register ? "Join BoardInG" : "Welcome back"}</h1><p className="mt-2 text-sm text-slate-500">{register ? "Create your student or owner account." : "Sign in to your boarding dashboard."}</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {register && <><label className="block text-sm font-medium">Full name<input required minLength={2} maxLength={80} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label className="block text-sm font-medium">Account type<select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="STUDENT">Student</option><option value="OWNER">Boarding owner</option></select></label></>}
      <label className="block text-sm font-medium">Email<input required type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label>
      <label className="block text-sm font-medium">Password<input required type="password" minLength={8} maxLength={72} className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
    </form>
    <p className="mt-5 text-center text-sm">{register ? "Already have an account?" : "New to BoardInG?"} <Link className="font-semibold text-blue-700 hover:underline" to={register ? "/login" : "/register"}>{register ? "Sign in" : "Register"}</Link></p>
  </section></main>;
}

function Dashboard({ user }) {
  if (!user) return <Navigate to="/login" replace/>;
  const owner = user.role === "OWNER";
  return <main className="mx-auto max-w-6xl px-6 py-12"><p className="text-blue-700 font-semibold">{owner ? "Owner workspace" : "Student workspace"}</p><h1 className="mt-1 text-3xl font-extrabold">Hello, {user.name} 👋</h1><p className="mt-2 text-slate-500">{owner ? "Manage properties, review requests and connect with residents." : "Explore accommodation, check your requests and join your house community."}</p>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(owner ? [
      ["My boarding houses", "Create and manage property listings", "/owner/houses", "Manage houses →"],
      ["Accommodation requests", "Approve students after offline confirmation", "/owner/requests", "Review requests →"],
      ["Residents and communities", "Manage residents and publish announcements", "/owner/residents", "Open communities →"],
    ] : [
      ["Find a boarding house", "Search by city and budget", "/houses", "Browse houses →"],
      ["My accommodation requests", "Check pending and approved requests", "/student/requests", "View requests →"],
      ["My communities", "Visit communities after approval", "/student/requests", "View memberships →"],
    ]).map(([title, description, href, action]) => <Link to={href} key={href+title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"><h2 className="text-lg font-bold">{title}</h2><p className="mt-3 min-h-12 text-sm text-slate-500">{description}</p><span className="mt-4 inline-block font-semibold text-blue-700">{action}</span></Link>)}</div>
  </main>;
}

function AppShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api("/auth/me").then((r) => setUser(r.user)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  async function logout() { try { setError(""); await api("/auth/logout", { method: "POST" }); setUser(null); } catch (e) { setError(e.message); } }
  if (loading) return <div className="p-8">Loading BoardInG…</div>;
  return <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <header className="bg-blue-700 text-white"><nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4" aria-label="Main navigation"><Link to="/" className="text-2xl font-extrabold tracking-tight">BoardInG<span className="text-cyan-200">.</span></Link>
      <div className="flex flex-wrap items-center gap-1"><NavLink to="/" end className={navStyle}>Home</NavLink><NavLink to="/houses" className={navStyle}>Browse</NavLink>
      {user ? <><NavLink to="/dashboard" className={navStyle}>Dashboard</NavLink>{user.role === "OWNER" ? <><NavLink to="/owner/houses" className={navStyle}>Properties</NavLink><NavLink to="/owner/requests" className={navStyle}>Requests</NavLink><NavLink to="/owner/residents" className={navStyle}>Residents</NavLink></> : <NavLink to="/student/requests" className={navStyle}>My requests</NavLink> }<button onClick={logout} className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Log out</button></> : <><NavLink to="/login" className={navStyle}>Log in</NavLink><Link to="/register" className="ml-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Get started</Link></>}
      </div></nav></header>
    {error && <p role="alert" className="mx-auto mt-3 w-full max-w-6xl rounded bg-red-50 px-4 py-2 text-red-700">{error}</p>}
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
      <Route path="*" element={<div className="mx-auto max-w-3xl px-6 py-20 text-center"><h1 className="text-3xl font-bold">Page not found</h1><Link to="/" className="mt-4 inline-block text-blue-700 underline">Return home</Link></div>}/>
    </Routes></div>
    <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-500">© BoardInG · Student accommodation & community · University MVP</footer>
  </div>;
}

export default function App() { return <BrowserRouter><AppShell/></BrowserRouter>; }
