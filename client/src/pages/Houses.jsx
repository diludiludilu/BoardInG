
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

const emptyForm = {
  title: "",
  description: "",
  city: "",
  area: "",
  monthlyRentLkr: "",
  facilities: "",
  imageUrl: "",
  availability: "AVAILABLE",
};

function HouseCard({ house }) {
  return (
    <Link
      to={`/houses/${house._id}`}
      className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      {house.imageUrl ? (
        <img
          src={house.imageUrl}
          alt={house.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-blue-100 text-blue-700">
          BoardInG Accommodation
        </div>
      )}

      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold">{house.title}</h3>
        <p className="text-sm text-slate-600">
          {house.area}, {house.city}
        </p>
        <p className="font-semibold text-blue-700">
          LKR {house.monthlyRentLkr.toLocaleString()} / month
        </p>
        <p className="text-sm">
          {house.availability === "AVAILABLE"
            ? "Available"
            : "Currently Full"}
        </p>
      </div>
    </Link>
  );
}

// Public discovery page
export function BrowseHouses() {
  const [houses, setHouses] = useState([]);
  const [city, setCity] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function searchHouses(event) {
    event?.preventDefault();
    setError("");
    setLoading(true);

    const params = new URLSearchParams();

    if (city.trim()) params.set("city", city.trim());
    if (maxRent) params.set("maxRent", maxRent);

    try {
      const suffix = params.toString();
      const result = await api(
        `/houses${suffix ? `?${suffix}` : ""}`
      );
      setHouses(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api("/houses")
      .then(setHouses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Find Your Boarding</h1>
      <p className="mt-2 text-slate-600">
        Discover student accommodation with BoardInG.
      </p>

      <form
        onSubmit={searchHouses}
        className="mt-6 flex flex-wrap gap-3 rounded-xl bg-white p-5 shadow-sm"
      >
        <input
          className="min-w-48 flex-1 rounded-lg border p-3"
          placeholder="City or area"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          maxLength={80}
        />

        <input
          type="number"
          min="1"
          className="min-w-40 flex-1 rounded-lg border p-3"
          placeholder="Maximum monthly rent"
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
        />

        <button className="rounded-lg bg-blue-700 px-6 py-3 text-white">
          Search
        </button>
      </form>

      {error && <p className="mt-5 text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6">Loading boarding houses...</p>
      ) : houses.length === 0 ? (
        <p className="mt-6 text-slate-600">
          No matching boarding houses found.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <HouseCard key={house._id} house={house} />
          ))}
        </div>
      )}
    </main>
  );
}

// Single boarding house details
export function BoardingDetails({ user }) {
  const { id } = useParams();

  const [house, setHouse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/houses/${id}`)
      .then(setHouse)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  if (!house) {
    return <p className="p-6">Loading details...</p>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6">
      <Link to="/houses" className="text-blue-700">
        ← Back to listings
      </Link>

      <h1 className="text-3xl font-bold">{house.title}</h1>

      <p className="text-slate-600">
        {house.area}, {house.city}
      </p>

      {house.imageUrl && (
        <img
          src={house.imageUrl}
          alt={house.title}
          className="max-h-96 w-full rounded-xl object-cover"
        />
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-2xl font-bold text-blue-700">
          LKR {house.monthlyRentLkr.toLocaleString()} / month
        </p>

        <p className="mt-3">
          Availability: {house.availability}
        </p>

        <h2 className="mt-6 text-xl font-semibold">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-wrap">
          {house.description}
        </p>

        <h2 className="mt-6 text-xl font-semibold">
          Facilities
        </h2>
        <p className="mt-2">
          {house.facilities.length
            ? house.facilities.join(", ")
            : "Not specified"}
        </p>

        {house.availability === "AVAILABLE" && user?.role === "STUDENT" && (
          <Link to={`/student/requests?houseId=${house._id}`} className="mt-6 inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white">Request accommodation →</Link>
        )}
        {!user && <Link to="/login" className="mt-6 inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white">Sign in to request accommodation →</Link>}
        {house.availability === "FULL" && <p className="mt-5 text-amber-700">This house is currently full.</p>}
      </div>
    </main>
  );
}

// Owner property management
export function OwnerHouses() {
  const [houses, setHouses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadHouses() {
    const result = await api("/houses/mine");
    setHouses(result);
  }

  useEffect(() => {
    loadHouses().catch((err) => setError(err.message));
  }, []);

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function editHouse(house) {
    setEditingId(house._id);
    setForm({
      title: house.title,
      description: house.description,
      city: house.city,
      area: house.area,
      monthlyRentLkr: String(house.monthlyRentLkr),
      facilities: house.facilities.join(", "),
      imageUrl: house.imageUrl || "",
      availability: house.availability,
    });
    setError("");
    setMessage("");
    window.scrollTo(0, 0);
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  async function saveHouse(event) {
    event.preventDefault();

    setBusy(true);
    setError("");
    setMessage("");

    const body = {
      ...form,
      monthlyRentLkr: Number(form.monthlyRentLkr),
      facilities: form.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      imageUrl: form.imageUrl.trim(),
    };

    try {
      await api(
        editingId ? `/houses/${editingId}` : "/houses",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(body),
        }
      );

      await loadHouses();
      resetForm();
      setMessage("Boarding house saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function archiveHouse(id) {
    const confirmed = window.confirm(
      "Archive this boarding house?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api(`/houses/${id}`, {
        method: "DELETE",
      });

      await loadHouses();

      if (editingId === id) resetForm();
      setMessage("Boarding house archived.");
    } catch (err) {
      setError(err.message);
    }
  }

  const inputClass = "w-full rounded-lg border p-3";

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-3xl font-bold">
        Manage Boarding Houses
      </h1>

      <form
        onSubmit={saveHouse}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold">
          {editingId ? "Edit Boarding House" : "Add Boarding House"}
        </h2>

        <input
          className={inputClass}
          placeholder="Boarding house name"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          minLength={5}
          maxLength={100}
          required
        />

        <textarea
          className={inputClass}
          placeholder="Description (minimum 20 characters)"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          minLength={20}
          maxLength={1500}
          rows={3}
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="City"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            maxLength={80}
            required
          />

          <input
            className={inputClass}
            placeholder="Area"
            value={form.area}
            onChange={(e) => update("area", e.target.value)}
            maxLength={80}
            required
          />
        </div>

        <input
          className={inputClass}
          type="number"
          placeholder="Monthly rent in LKR"
          min="1"
          max="1000000"
          step="1"
          value={form.monthlyRentLkr}
          onChange={(e) =>
            update("monthlyRentLkr", e.target.value)
          }
          required
        />

        <input
          className={inputClass}
          placeholder="Facilities: Wi-Fi, Kitchen, Water"
          value={form.facilities}
          onChange={(e) => update("facilities", e.target.value)}
        />

        <input
          className={inputClass}
          type="url"
          placeholder="HTTPS image URL (optional)"
          value={form.imageUrl}
          onChange={(e) => update("imageUrl", e.target.value)}
        />

        <select
          className={inputClass}
          value={form.availability}
          onChange={(e) =>
            update("availability", e.target.value)
          }
        >
          <option value="AVAILABLE">Available</option>
          <option value="FULL">Currently Full</option>
        </select>

        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-green-700">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-700 px-6 py-3 text-white disabled:opacity-50"
          >
            {busy
              ? "Saving..."
              : editingId
                ? "Update House"
                : "Add House"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-6 py-3"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          My Boarding Houses
        </h2>

        {houses.length === 0 ? (
          <p className="text-slate-600">
            You haven't created any boarding houses yet.
          </p>
        ) : (
          <div className="space-y-3">
            {houses.map((house) => (
              <div
                key={house._id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold">{house.title}</h3>

                <p className="text-sm text-slate-600">
                  {house.city} — LKR{" "}
                  {house.monthlyRentLkr.toLocaleString()}
                </p>

                <p className="mt-1 text-sm">
                  {house.status} / {house.availability}
                </p>

                {house.status === "ACTIVE" && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    <button
                      className="text-blue-700"
                      onClick={() => editHouse(house)}
                    >
                      Edit
                    </button>

                    <button
                      className="text-red-600"
                      onClick={() =>
                        archiveHouse(house._id)
                      }
                    >
                      Archive
                    </button>

                    <Link
                      to={`/houses/${house._id}`}
                      className="text-slate-600"
                    >
                      View Listing
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
