
import {
  BrowseHouses,
  BoardingDetails,
  OwnerHouses,
} from "./pages/Houses";
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { api } from "./services/api";

function Home() {
  const [houses, setHouses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/houses")
      .then(setHouses)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <section className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">
        Welcome to BoardInG
      </h1>
      <p className="mt-2 text-slate-600">
        Find your boarding house. Connect with your community.
      </p>

      <h2 className="mt-8 text-xl font-semibold">
        Boarding Houses
      </h2>

      {error && <p className="mt-3 text-red-600">{error}</p>}

      {houses.length === 0 && !error && (
        <p className="mt-3 text-slate-500">
          No boarding houses added yet.
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {houses.map((house) => (
          <div key={house._id} className="rounded-lg bg-white p-5 shadow">
            <h3 className="font-semibold">{house.title}</h3>
            <p>{house.city}</p>
            <p>Rs. {house.monthlyRentLkr} / month</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthForm({ mode, onAuth }) {
  const navigate = useNavigate();
  const isRegister = mode === "register";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const body = isRegister
        ? form
        : { email: form.email, password: form.password };

      const result = await api(
        isRegister ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      onAuth(result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputStyle =
    "w-full rounded-lg border border-slate-300 p-3";

  return (
    <section className="mx-auto mt-10 max-w-md rounded-xl bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">
        {isRegister ? "Create an Account" : "Login to BoardInG"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <label className="block">
              Full Name
              <input
                className={inputStyle}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                minLength={2}
              />
            </label>

            <label className="block">
              Register As
              <select
                className={inputStyle}
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                <option value="STUDENT">Student</option>
                <option value="OWNER">Boarding Owner</option>
              </select>
            </label>
          </>
        )}

        <label className="block">
          Email
          <input
            type="email"
            className={inputStyle}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </label>

        <label className="block">
          Password
          <input
            type="password"
            className={inputStyle}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={8}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-700 p-3 font-medium text-white disabled:opacity-50"
        >
          {busy
            ? "Please wait..."
            : isRegister
              ? "Register"
              : "Login"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm">
        {isRegister ? "Already registered?" : "New to BoardInG?"}{" "}
        <Link
          className="text-blue-700 underline"
          to={isRegister ? "/login" : "/register"}
        >
          {isRegister ? "Login" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}

function Dashboard({ user }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <section className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">
        Welcome, {user.name}!
      </h1>

      <p className="mt-2 text-slate-600">
        Logged in as {user.role === "OWNER" ? "Boarding Owner" : "Student"}
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        {user.role === "OWNER" ? (
          <>
            <h2 className="text-xl font-semibold">
              Owner Dashboard
            </h2>
            <p className="mt-2">
              Your boarding listings and accommodation requests
              will appear here.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold">
              Student Dashboard
            </h2>
            <p className="mt-2">
              Your accommodation requests and boarding
              communities will appear here.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    api("/auth/me")
      .then((result) => setUser(result.user))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    try {
      setLogoutError("");
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      setLogoutError(error.message);
    }
  }

  if (loading) {
    return <p className="p-6">Loading BoardInG...</p>;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-blue-700 p-5 text-white">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <Link to="/" className="text-2xl font-bold">
              BoardInG
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <button onClick={logout}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Register</Link>
                </>
              )}
            </div>
          </nav>
        </header>

        {logoutError && (
          <p role="alert" className="p-4 text-red-600">
            {logoutError}
          </p>
        )}

        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthForm mode="login" onAuth={setUser} />
              )
            }
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthForm mode="register" onAuth={setUser} />
              )
            }
          />

          <Route
            path="/dashboard"
            element={<Dashboard user={user} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
