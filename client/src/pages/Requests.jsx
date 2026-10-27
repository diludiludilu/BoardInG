import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

function Banner({ error, notice }) {
  return <>{error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-4 text-green-800">{notice}</p>}</>;
}

export function StudentRequests() {
  const [params] = useSearchParams();
  const [houses, setHouses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [houseId, setHouseId] = useState(params.get("houseId") || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    const [houseData, requestData, memberData] = await Promise.all([api("/houses"), api("/requests/mine"), api("/memberships/mine")]);
    setHouses(houseData); setRequests(requestData); setMemberships(memberData);
  }
  useEffect(() => {
    let active = true;
    Promise.all([api("/houses"), api("/requests/mine"), api("/memberships/mine")])
      .then(([houseData, requestData, memberData]) => {
        if (!active) return;
        setHouses(houseData);
        setRequests(requestData);
        setMemberships(memberData);
      })
      .catch((error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await api(`/houses/${houseId}/requests`, { method: "POST", body: JSON.stringify({ message }) });
      await refresh(); setMessage(""); setHouseId(""); setNotice("Your accommodation request was submitted.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
    <div><p className="font-semibold text-blue-700">Student dashboard</p><h1 className="mt-1 text-3xl font-extrabold">Accommodation requests</h1><p className="mt-2 text-slate-500">Request a place, follow its status and access your boarding communities.</p></div>
    <Banner error={error} notice={notice}/>
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">Request accommodation</h2>
      <p className="mt-1 text-sm text-slate-500">An accepted request confirms your residency after arrangements with the owner offline. No payments are processed here.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block font-medium">Boarding house<select value={houseId} required onChange={(e) => setHouseId(e.target.value)} className="mt-2 w-full rounded-lg border p-3"><option value="">Select a property</option>{houses.filter((h) => h.availability === "AVAILABLE" && !requests.some((r) => r.boardingHouseId?._id === h._id)).map((h) => <option key={h._id} value={h._id}>{h.title} — {h.city}</option>)}{houseId && !houses.some((h) => h._id === houseId && h.availability === "AVAILABLE") && <option value={houseId}>Selected house (unavailable)</option>}</select></label>
        <label className="block font-medium">Message to owner (optional)<textarea value={message} maxLength={300} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="I would like to ask about availability..." className="mt-2 w-full rounded-lg border p-3"/></label>
        <button disabled={!houseId || busy} className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit request"}</button>
      </form>
    </section>
    <section><h2 className="mb-4 text-xl font-bold">My request history</h2>{loading && <p>Loading…</p>}{!loading && requests.length === 0 && <p className="rounded-lg bg-white p-5 text-slate-500">No requests yet. <Link to="/houses" className="text-blue-700 underline">Browse boarding houses</Link>.</p>}
      <div className="grid gap-3">{requests.map((request) => <article key={request._id} className="rounded-xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{request.boardingHouseId?.title || "Property unavailable"}</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ${request.status === "APPROVED" ? "bg-green-100 text-green-700" : request.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{request.status}</span></div>{request.message && <p className="mt-2 text-sm text-slate-600">{request.message}</p>}</article>)}</div>
    </section>
    <section><h2 className="mb-4 text-xl font-bold">My boarding communities</h2>{memberships.length === 0 && <p className="rounded-lg bg-white p-5 text-slate-500">Approved residents can join their house community here.</p>}
      <div className="grid gap-3 sm:grid-cols-2">{memberships.map((m) => <Link key={m._id} to={`/community/${m.boardingHouseId._id}`} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-green-100 hover:shadow-md"><p className="font-bold">{m.boardingHouseId.title}</p><p className="mt-1 text-sm text-green-700">Active resident</p><p className="mt-4 font-semibold text-blue-700">Enter community →</p></Link>)}</div>
    </section>
  </main>;
}

export function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  async function refresh() { setRequests(await api("/owner/requests")); }
  useEffect(() => {
    let active = true;
    api("/owner/requests")
      .then((data) => { if (active) setRequests(data); })
      .catch((error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function decide(id, action) {
    setBusyId(id); setError(""); setNotice("");
    try { const response = await api(`/requests/${id}/${action}`, { method: "POST" }); await refresh(); setNotice(response.message); }
    catch (e) { setError(e.message); try { await refresh(); } catch { /* original error retained */ } }
    finally { setBusyId(null); }
  }
  return <main className="mx-auto max-w-5xl space-y-6 px-6 py-10"><div><p className="font-semibold text-blue-700">Owner workspace</p><h1 className="mt-1 text-3xl font-extrabold">Accommodation requests</h1><p className="mt-2 text-slate-500">Confirm residents only after completing arrangements offline.</p></div><Banner error={error} notice={notice}/>
    {loading && <p>Loading requests…</p>}{!loading && requests.length === 0 && <p className="rounded-xl bg-white p-6 text-slate-500">No accommodation requests yet.</p>}
    <div className="space-y-4">{requests.map((r) => <article key={r._id} className="rounded-xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{r.boardingHouseId?.title || "Property unavailable"}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{r.status}</span></div><p className="mt-2">{r.studentId?.name || "Student account unavailable"}</p><p className="text-sm text-slate-500">{r.studentId?.email}</p>{r.message && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">{r.message}</p>}
      {r.boardingHouseId?.status === "ACTIVE" && <div className="mt-4 flex flex-wrap gap-3">{["PENDING", "APPROVED"].includes(r.status) && <button disabled={busyId === r._id} onClick={() => decide(r._id, "approve")} className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white disabled:opacity-50">{r.status === "APPROVED" ? "Confirm membership" : "Approve residency"}</button>}{r.status === "PENDING" && <button disabled={busyId === r._id} onClick={() => decide(r._id, "reject")} className="rounded-lg bg-red-700 px-5 py-2 font-semibold text-white disabled:opacity-50">Reject</button>}</div>}
    </article>)}</div>
  </main>;
}

export function OwnerResidents() {
  const [houses, setHouses] = useState([]);
  const [members, setMembers] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  async function refresh() {
    const ownHouses = await api("/houses/mine");
    setHouses(ownHouses);
    const memberLists = await Promise.all(ownHouses.map(async (h) => [h._id, await api(`/houses/${h._id}/members`)]));
    setMembers(Object.fromEntries(memberLists));
  }
  useEffect(() => {
    let active = true;
    api("/houses/mine")
      .then(async (ownHouses) => {
        const lists = await Promise.all(
          ownHouses.map(async (house) => [house._id, await api(`/houses/${house._id}/members`)])
        );
        if (!active) return;
        setHouses(ownHouses);
        setMembers(Object.fromEntries(lists));
      })
      .catch((error) => { if (active) setError(error.message); });
    return () => { active = false; };
  }, []);
  async function revoke(houseId, studentId) {
    if (!window.confirm("Remove this resident's community access?")) return;
    setBusy(studentId); setError(""); setNotice("");
    try { await api(`/houses/${houseId}/members/${studentId}`, { method: "DELETE" }); await refresh(); setNotice("Resident access revoked."); }
    catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  return <main className="mx-auto max-w-5xl space-y-6 px-6 py-10"><h1 className="text-3xl font-extrabold">Residents & communities</h1><p className="text-slate-500">Manage approved residents and publish announcements for your house.</p><Banner error={error} notice={notice}/>
    {houses.length === 0 && <p className="rounded-lg bg-white p-5 text-slate-500">No boarding houses yet.</p>}
    {houses.map((h) => <section key={h._id} className="rounded-xl bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{h.title}</h2><p className="text-sm text-slate-500">{h.status} · {(members[h._id] || []).length} active resident(s)</p></div>{h.status === "ACTIVE" && <Link to={`/community/${h._id}`} className="self-start rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Open community →</Link>}</div>
      <div className="mt-5 divide-y">{(members[h._id] || []).map((member) => <div key={member._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{member.studentId?.name}</p><p className="text-sm text-slate-500">{member.studentId?.email}</p></div><button disabled={busy === member.studentId?._id} onClick={() => revoke(h._id, member.studentId._id)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50">Revoke access</button></div>)}{(members[h._id] || []).length === 0 && <p className="py-3 text-sm text-slate-500">No confirmed residents yet.</p>}</div>
    </section>)}
  </main>;
}
