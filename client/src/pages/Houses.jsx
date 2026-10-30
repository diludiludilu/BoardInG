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
      className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-5 shadow-sm"
      >
        <div className="min-w-48 flex-1">
          <label
            htmlFor="search-city"
            className="block text-sm font-medium text-slate-700"
          >
            City or area
          </label>
          <input
            id="search-city"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 transition focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            placeholder="City or area"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="min-w-40 flex-1">
          <label
            htmlFor="search-maxRent"
            className="block text-sm font-medium text-slate-700"
          >
            Maximum monthly rent (LKR)
          </label>
          <input
            id="search-maxRent"
            type="number"
            min="1"
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 transition focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            placeholder="Maximum monthly rent"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Search
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-6 text-slate-500"
        >
          Loading boarding houses...
        </p>
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

  const [state, setState] = useState({
    houseId: null,
    key: 0,
    house: null,
    error: "",
    loading: true,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const isCurrent = state.houseId === id && state.key === reloadKey;
  const house = isCurrent ? state.house : null;
  const error = isCurrent ? state.error : "";
  const loading = !isCurrent || state.loading;

  useEffect(() => {
    let ignore = false;

    api(`/houses/${id}`)
      .then((data) => {
        if (!ignore) {
          setState({
            houseId: id,
            key: reloadKey,
            house: data,
            error: "",
            loading: false,
          });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setState({
            houseId: id,
            key: reloadKey,
            house: null,
            error: err.message,
            loading: false,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  return (
    <main className="mx-auto max-w-4xl space-y-5 p-6">
      <Link
        to="/houses"
        className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
      >
        ← Back to listings
      </Link>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
        >
          <h1 className="text-xl font-bold">Unable to display boarding house</h1>
          <p className="mt-2 text-sm">{error}</p>
          <p className="mt-3 text-sm text-red-600">
            The property may have been archived, removed, or the link is invalid.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
            >
              Try again
            </button>
            <Link
              to="/houses"
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
            >
              Browse all houses
            </Link>
          </div>
        </div>
      )}

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm"
        >
          <p className="text-base font-medium">Loading details...</p>
        </div>
      )}

      {!loading && !error && house && (
        <>
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
              <Link
                to={`/student/requests?houseId=${house._id}`}
                className="mt-6 inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Request accommodation →
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="mt-6 inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Sign in to request accommodation →
              </Link>
            )}
            {house.availability === "FULL" && (
              <p className="mt-5 text-amber-700">This house is currently full.</p>
            )}
          </div>
        </>
      )}
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
    api("/houses/mine")
      .then(setHouses)
      .catch((error) => setError(error.message));
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

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

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

        <div>
          <label
            htmlFor="house-title"
            className="block text-sm font-medium text-slate-700"
          >
            Boarding house name
          </label>
          <input
            id="house-title"
            className={inputClass}
            placeholder="Boarding house name"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            minLength={5}
            maxLength={100}
            required
          />
        </div>

        <div>
          <label
            htmlFor="house-description"
            className="block text-sm font-medium text-slate-700"
          >
            Description (minimum 20 characters)
          </label>
          <textarea
            id="house-description"
            className={inputClass}
            placeholder="Description (minimum 20 characters)"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            minLength={20}
            maxLength={1500}
            rows={3}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="house-city"
              className="block text-sm font-medium text-slate-700"
            >
              City
            </label>
            <input
              id="house-city"
              className={inputClass}
              placeholder="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              maxLength={80}
              required
            />
          </div>

          <div>
            <label
              htmlFor="house-area"
              className="block text-sm font-medium text-slate-700"
            >
              Area
            </label>
            <input
              id="house-area"
              className={inputClass}
              placeholder="Area"
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
              maxLength={80}
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="house-rent"
            className="block text-sm font-medium text-slate-700"
          >
            Monthly rent (LKR)
          </label>
          <input
            id="house-rent"
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
        </div>

        <div>
          <label
            htmlFor="house-facilities"
            className="block text-sm font-medium text-slate-700"
          >
            Facilities (comma-separated: Wi-Fi, Kitchen, Water)
          </label>
          <input
            id="house-facilities"
            className={inputClass}
            placeholder="Facilities: Wi-Fi, Kitchen, Water"
            value={form.facilities}
            onChange={(e) => update("facilities", e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="house-image"
            className="block text-sm font-medium text-slate-700"
          >
            Property image URL (optional, HTTPS)
          </label>
          <input
            id="house-image"
            className={inputClass}
            type="url"
            placeholder="HTTPS image URL (optional)"
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="house-availability"
            className="block text-sm font-medium text-slate-700"
          >
            Availability
          </label>
          <select
            id="house-availability"
            className={inputClass}
            value={form.availability}
            onChange={(e) =>
              update("availability", e.target.value)
            }
          >
            <option value="AVAILABLE">Available</option>
            <option value="FULL">Currently Full</option>
          </select>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800"
          >
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50"
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
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
                      className="font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
                      onClick={() => editHouse(house)}
                    >
                      Edit
                    </button>

                    <button
                      className="font-medium text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded px-1"
                      onClick={() =>
                        archiveHouse(house._id)
                      }
                    >
                      Archive
                    </button>

                    <Link
                      to={`/houses/${house._id}`}
                      className="font-medium text-slate-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-1"
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
