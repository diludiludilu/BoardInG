import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { WrenchIcon } from "../components/Icons";

export function Maintenance({ user }) {
  const { houseId } = useParams();
  const [issues, setIssues] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedHouseId, setLoadedHouseId] = useState(null);
  const loading = loadedHouseId !== houseId;
  const [busy, setBusy] = useState(false);
  async function refresh() { setIssues(await api(`/houses/${houseId}/issues`)); }
  useEffect(() => {
    let active = true;
    api(`/houses/${houseId}/issues`)
      .then((data) => {
        if (!active) return;
        setIssues(data);
        setError("");
      })
      .catch((error) => {
        if (!active) return;
        setIssues([]);
        setError(error.message);
      })
      .finally(() => {
        if (active) setLoadedHouseId(houseId);
      });
    return () => { active = false; };
  }, [houseId]);
  async function submit(event) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try { await api(`/houses/${houseId}/issues`, { method: "POST", body: JSON.stringify({ title, description }) }); setTitle(""); setDescription(""); await refresh(); setNotice("Maintenance issue submitted."); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function update(id, status) {
    setError(""); setNotice("");
    try { await api(`/issues/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); await refresh(); setNotice("Maintenance status updated."); }
    catch (e) { setError(e.message); }
  }
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <Link to={`/community/${houseId}`} className="inline-flex min-h-[44px] items-center rounded-md px-1 text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400">← Back to community</Link>
    <div><h1 className="flex items-center gap-2 text-3xl font-extrabold text-slate-900 dark:text-slate-100"><WrenchIcon className="size-7 text-blue-700 dark:text-blue-400" /><span>Maintenance tracker</span></h1><p className="mt-2 text-slate-500 dark:text-slate-400">{user.role === "OWNER" ? "Review maintenance requests and update their progress." : "Report a problem to your boarding-house owner and track progress."}</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700 dark:border dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800 dark:border dark:border-green-900/60 dark:bg-green-950/60 dark:text-green-300">{notice}</p>}
    {user.role === "STUDENT" && <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Report an issue</h2><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Issue title<input required minLength={4} maxLength={100} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Broken ceiling fan"/></label><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description<textarea required minLength={10} maxLength={1000} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what needs repair..."/></label><button disabled={busy} className="min-h-[44px] rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500">{busy ? "Submitting…" : "Submit issue"}</button></form>}
    <section><h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{user.role === "OWNER" ? "Reported issues" : "My reported issues"}</h2>{loading && <p className="text-slate-500 dark:text-slate-400">Loading issues…</p>}{!loading && issues.length === 0 && <p className="rounded-xl bg-white p-5 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">No maintenance issues reported yet.</p>}
      <div className="space-y-4">{issues.map((issue) => <article key={issue._id} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold text-slate-900 dark:text-slate-100">{issue.title}</h3><p className="text-sm text-slate-500 dark:text-slate-400">{user.role === "OWNER" ? `Reported by ${issue.studentId?.name || "resident"} · ` : ""}{new Date(issue.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{issue.status.replace("_", " ")}</span></div><p className="mt-4 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{issue.description}</p>{user.role === "OWNER" && <label className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-300">Update status<select className="mt-2 min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 transition focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" value={issue.status} onChange={(e) => update(issue._id, e.target.value)}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label>}</article>)}</div>
    </section>
  </main>;
}
