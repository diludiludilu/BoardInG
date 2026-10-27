import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

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
  return <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
    <Link to={`/community/${houseId}`} className="text-sm font-semibold text-blue-700">← Back to community</Link>
    <div><h1 className="text-3xl font-extrabold">Maintenance tracker</h1><p className="mt-2 text-slate-500">{user.role === "OWNER" ? "Review maintenance requests and update their progress." : "Report a problem to your boarding-house owner and track progress."}</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{notice}</p>}
    {user.role === "STUDENT" && <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Report an issue</h2><label className="block text-sm font-medium">Issue title<input required minLength={4} maxLength={100} className="mt-2 w-full rounded-lg border p-3" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Broken ceiling fan"/></label><label className="block text-sm font-medium">Description<textarea required minLength={10} maxLength={1000} rows={3} className="mt-2 w-full rounded-lg border p-3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what needs repair..."/></label><button disabled={busy} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit issue"}</button></form>}
    <section><h2 className="mb-4 text-xl font-bold">{user.role === "OWNER" ? "Reported issues" : "My reported issues"}</h2>{loading && <p>Loading issues…</p>}{!loading && issues.length === 0 && <p className="rounded-xl bg-white p-5 text-slate-500">No maintenance issues reported yet.</p>}
      <div className="space-y-4">{issues.map((issue) => <article key={issue._id} className="rounded-xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{issue.title}</h3><p className="text-sm text-slate-500">{user.role === "OWNER" ? `Reported by ${issue.studentId?.name || "resident"} · ` : ""}{new Date(issue.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{issue.status.replace("_", " ")}</span></div><p className="mt-4 whitespace-pre-wrap text-slate-700">{issue.description}</p>{user.role === "OWNER" && <label className="mt-4 block text-sm font-semibold">Update status<select className="mt-2 rounded-lg border p-2" value={issue.status} onChange={(e) => update(issue._id, e.target.value)}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select></label>}</article>)}</div>
    </section>
  </main>;
}
