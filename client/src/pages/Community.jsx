import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

export function Community({ user }) {
  const { houseId } = useParams();
  const [house, setHouse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  async function refresh() { const data = await api(`/houses/${houseId}/posts`); setHouse(data.house); setPosts(data.posts); }
  useEffect(() => { setLoading(true); setError(""); refresh().catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [houseId]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { await api(`/houses/${houseId}/posts`, { method: "POST", body: JSON.stringify({ content }) }); setContent(""); await refresh(); setNotice(user.role === "OWNER" ? "Announcement published." : "Post published."); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function remove(postId) {
    if (!window.confirm("Delete this post?")) return;
    setError(""); setNotice("");
    try { await api(`/posts/${postId}`, { method: "DELETE" }); await refresh(); setNotice("Post deleted."); }
    catch (e) { setError(e.message); }
  }
  return <main className="mx-auto max-w-4xl px-6 py-10">
    <Link to="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← Dashboard</Link>
    {loading ? <p className="mt-7">Loading community…</p> : <>
      <div className="mt-5"><p className="font-semibold text-blue-700">Private boarding community</p><h1 className="mt-1 text-3xl font-extrabold">{house?.title || "Community"}</h1><p className="mt-2 text-slate-500">Accessible only to the property owner and approved residents.</p>{house && <Link to={`/issues/${houseId}`} className="mt-4 inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-800">Maintenance tracker →</Link>}</div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-green-700">{notice}</p>}
      {house && <><form onSubmit={submit} className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-xl font-bold">{user.role === "OWNER" ? "Publish an announcement" : "Write a community post"}</h2><textarea className="mt-4 w-full rounded-lg border p-4 outline-blue-600" rows={4} maxLength={2000} required value={content} onChange={(e) => setContent(e.target.value)} placeholder={user.role === "OWNER" ? "Share a notice with your residents…" : "Share something with your housemates…"}/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{content.length}/2000 characters</span><button disabled={busy || !content.trim()} className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Publishing…" : "Publish"}</button></div></form>
      <section className="mt-8 space-y-4"><h2 className="text-xl font-bold">Community feed</h2>{posts.length === 0 && <p className="rounded-lg bg-white p-5 text-slate-500">No posts yet. Start the conversation!</p>}
        {posts.map((post) => <article key={post._id} className={`rounded-xl bg-white p-6 shadow-sm ${post.type === "ANNOUNCEMENT" ? "ring-2 ring-blue-200" : "ring-1 ring-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><span className="font-bold">{post.authorId?.name || "Unknown user"}</span> {post.type === "ANNOUNCEMENT" && <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">Owner announcement</span>}<p className="mt-1 text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p></div>{String(post.authorId?._id) === String(user.id) && <button onClick={() => remove(post._id)} className="text-sm font-medium text-red-700 hover:underline">Delete</button>}</div><p className="mt-5 whitespace-pre-wrap break-words text-slate-700">{post.content}</p></article>)}
      </section></>}
    </>}
  </main>;
}
