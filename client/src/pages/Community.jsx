import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { TrashIcon, UsersIcon } from "../components/Icons";

export function Community({ user }) {
  const { houseId } = useParams();
  const [house, setHouse] = useState(null);
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadedHouseId, setLoadedHouseId] = useState(null);
  const loading = loadedHouseId !== houseId;
  const [busy, setBusy] = useState(false);
  async function refresh() { const data = await api(`/houses/${houseId}/posts`); setHouse(data.house); setPosts(data.posts); }
  useEffect(() => {
    let active = true;
    api(`/houses/${houseId}/posts`)
      .then((data) => {
        if (!active) return;
        setHouse(data.house);
        setPosts(data.posts);
        setError("");
      })
      .catch((error) => {
        if (!active) return;
        setHouse(null);
        setPosts([]);
        setError(error.message);
      })
      .finally(() => {
        if (active) setLoadedHouseId(houseId);
      });
    return () => { active = false; };
  }, [houseId]);
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
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <Link to="/dashboard" className="inline-flex min-h-[44px] items-center rounded-md px-1 text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400">← Dashboard</Link>
    {loading ? <p className="mt-7 text-slate-500 dark:text-slate-400">Loading community…</p> : <>
      <div className="mt-5"><p className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400"><UsersIcon className="size-4" /><span>Private boarding community</span></p><h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{house?.title || "Community"}</h1><p className="mt-2 text-slate-500 dark:text-slate-400">Accessible only to the property owner and approved residents.</p>{house && <Link to={`/issues/${houseId}`} className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-800 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:bg-blue-900/50">Maintenance tracker →</Link>}</div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-700 dark:border dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-green-700 dark:border dark:border-green-900/60 dark:bg-green-950/60 dark:text-green-300">{notice}</p>}
      {house && <><form onSubmit={submit} className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{user.role === "OWNER" ? "Publish an announcement" : "Write a community post"}</h2><textarea className="mt-4 w-full rounded-lg border border-slate-300 bg-white p-4 text-slate-900 transition placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" rows={4} maxLength={2000} required value={content} onChange={(e) => setContent(e.target.value)} placeholder={user.role === "OWNER" ? "Share a notice with your residents…" : "Share something with your housemates…"}/><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500 dark:text-slate-400">{content.length}/2000 characters</span><button disabled={busy || !content.trim()} className="min-h-[44px] rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500">{busy ? "Publishing…" : "Publish"}</button></div></form>
      <section className="mt-8 space-y-4"><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Community feed</h2>{posts.length === 0 && <p className="rounded-lg bg-white p-5 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">No posts yet. Start the conversation!</p>}
        {posts.map((post) => <article key={post._id} className={`rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900 ${post.type === "ANNOUNCEMENT" ? "ring-2 ring-blue-200 dark:ring-blue-800/80" : "ring-1 ring-slate-200 dark:ring-slate-800"}`}><div className="flex items-start justify-between gap-3"><div><span className="font-bold text-slate-900 dark:text-slate-100">{post.authorId?.name || "Unknown user"}</span> {post.type === "ANNOUNCEMENT" && <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Owner announcement</span>}<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(post.createdAt).toLocaleString()}</p></div>{String(post.authorId?._id) === String(user.id) && <button onClick={() => remove(post._id)} className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"><TrashIcon className="size-3.5" /><span>Delete</span></button>}</div><p className="mt-5 whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">{post.content}</p></article>)}
      </section></>}
    </>}
  </main>;
}
