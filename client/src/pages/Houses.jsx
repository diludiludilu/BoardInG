import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { SearchIcon, PencilIcon, ArchiveIcon, ExternalLinkIcon } from "../components/Icons";

const emptyForm = {
  title: "",
  description: "",
  city: "",
  area: "",
  monthlyRentLkr: "",
  facilities: "",
  imageUrl: "",
  imageUrls: "",
  availability: "AVAILABLE",
};

function HouseCard({ house }) {
  const displayImage =
    Array.isArray(house.imageUrls) && house.imageUrls.length > 0
      ? house.imageUrls[0]
      : house.imageUrl;

  return (
    <Link
      to={`/houses/${house._id}`}
      className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-slate-900 dark:ring-slate-800"
    >
      {displayImage ? (
        <img
          src={displayImage}
          alt={house.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
          BoardInG Accommodation
        </div>
      )}

      <div className="space-y-2 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{house.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {house.area}, {house.city}
        </p>
        <p className="font-semibold text-blue-700 dark:text-blue-400">
          LKR {house.monthlyRentLkr.toLocaleString()} / month
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {house.availability === "AVAILABLE"
            ? "Available"
            : "Currently Full"}
        </p>
      </div>
    </Link>
  );
}

// Interactive multi-photo gallery with keyboard navigation and thumbnail strip
function PropertyGallery({ house }) {
  const images =
    Array.isArray(house.imageUrls) && house.imageUrls.length > 0
      ? house.imageUrls
      : house.imageUrl
        ? [house.imageUrl]
        : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[activeIndex] || images[0];

  function handleSelect(idx) {
    setActiveIndex(idx);
    setLoadError(false);
  }

  function handleKeyDown(event) {
    if (images.length <= 1) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      handleSelect(activeIndex > 0 ? activeIndex - 1 : images.length - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      handleSelect(activeIndex < images.length - 1 ? activeIndex + 1 : 0);
    }
  }

  return (
    <section
      aria-label="Property photo gallery"
      className="space-y-3"
      onKeyDown={handleKeyDown}
      tabIndex={images.length > 1 ? 0 : undefined}
    >
      <div className="relative overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
        {loadError ? (
          <div className="flex h-72 w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 sm:h-96 dark:bg-slate-800 dark:text-slate-400">
            <svg className="size-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">Unable to load photo</p>
          </div>
        ) : (
          <img
            src={currentImage}
            alt={`${house.title} - Photo ${activeIndex + 1} of ${images.length}`}
            className="h-72 w-full object-cover sm:h-96"
            onError={() => setLoadError(true)}
          />
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() =>
                handleSelect(activeIndex > 0 ? activeIndex - 1 : images.length - 1)
              }
              className="absolute left-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/70 p-2 text-white shadow-md backdrop-blur-sm transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Next photo"
              onClick={() =>
                handleSelect(activeIndex < images.length - 1 ? activeIndex + 1 : 0)
              }
              className="absolute right-3 top-1/2 inline-flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/70 p-2 text-white shadow-md backdrop-blur-sm transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-3 right-3 rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white shadow backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="Photo thumbnails"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeIndex === idx}
              aria-label={`View photo ${idx + 1}`}
              onClick={() => handleSelect(idx)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                activeIndex === idx
                  ? "ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900"
                  : "opacity-70 hover:opacity-100 ring-1 ring-slate-200 dark:ring-slate-700"
              }`}
            >
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Find Your Boarding</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Discover student accommodation with BoardInG.
      </p>

      <form
        onSubmit={searchHouses}
        className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:flex lg:items-end dark:bg-slate-900 dark:ring-slate-800"
      >
        <div className="w-full lg:min-w-48 lg:flex-1">
          <label
            htmlFor="search-city"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            City or area
          </label>
          <input
            id="search-city"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
            placeholder="City or area"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
          />
        </div>

        <div className="w-full lg:min-w-40 lg:flex-1">
          <label
            htmlFor="search-maxRent"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Maximum monthly rent (LKR)
          </label>
          <input
            id="search-maxRent"
            type="number"
            min="1"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
            placeholder="Maximum monthly rent"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:col-span-2 lg:w-auto dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <SearchIcon className="size-5" />
          <span>Search</span>
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 dark:border dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-6 text-slate-500 dark:text-slate-400"
        >
          Loading boarding houses...
        </p>
      ) : houses.length === 0 ? (
        <p className="mt-6 text-slate-600 dark:text-slate-400">
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
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to="/houses"
        className="inline-flex min-h-[44px] items-center rounded-md px-1 text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:text-blue-400"
      >
        ← Back to listings
      </Link>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
        >
          <h1 className="text-xl font-bold">Unable to display boarding house</h1>
          <p className="mt-2 text-sm">{error}</p>
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            The property may have been archived, removed, or the link is invalid.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500"
            >
              Try again
            </button>
            <Link
              to="/houses"
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-slate-800"
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
          className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800"
        >
          <p className="text-base font-medium">Loading details...</p>
        </div>
      )}

      {!loading && !error && house && (
        <>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{house.title}</h1>

          <p className="text-slate-600 dark:text-slate-400">
            {house.area}, {house.city}
          </p>

          <PropertyGallery key={house._id} house={house} />

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              LKR {house.monthlyRentLkr.toLocaleString()} / month
            </p>

            <p className="mt-3 text-slate-700 dark:text-slate-300">
              Availability: {house.availability}
            </p>

            <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {house.description}
            </p>

            <h2 className="mt-6 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Facilities
            </h2>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              {house.facilities.length
                ? house.facilities.join(", ")
                : "Not specified"}
            </p>

            {house.availability === "AVAILABLE" && user?.role === "STUDENT" && (
              <Link
                to={`/student/requests?houseId=${house._id}`}
                className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Request accommodation →
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Sign in to request accommodation →
              </Link>
            )}
            {house.availability === "FULL" && (
              <p className="mt-5 text-amber-700 dark:text-amber-400">This house is currently full.</p>
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
    const urls =
      Array.isArray(house.imageUrls) && house.imageUrls.length > 0
        ? house.imageUrls
        : house.imageUrl
          ? [house.imageUrl]
          : [];

    setEditingId(house._id);
    setForm({
      title: house.title,
      description: house.description,
      city: house.city,
      area: house.area,
      monthlyRentLkr: String(house.monthlyRentLkr),
      facilities: house.facilities.join(", "),
      imageUrl: house.imageUrl || "",
      imageUrls: urls.join("\n"),
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

    const rawUrls = form.imageUrls || form.imageUrl || "";
    const parsedUrls = rawUrls
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);

    const body = {
      ...form,
      monthlyRentLkr: Number(form.monthlyRentLkr),
      facilities: form.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      imageUrls: parsedUrls.slice(0, 5),
      imageUrl: parsedUrls[0] || "",
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
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 transition placeholder:text-slate-400 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400";

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        Manage Boarding Houses
      </h1>

      <form
        onSubmit={saveHouse}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {editingId ? "Edit Boarding House" : "Add Boarding House"}
        </h2>

        <div>
          <label
            htmlFor="house-title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
            htmlFor="house-images"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Property image URLs (optional, up to 5 HTTPS or safe local paths, one per line)
          </label>
          <textarea
            id="house-images"
            className={inputClass}
            rows={3}
            placeholder={"/demo/houses/house-01-exterior.svg\n/demo/houses/house-01-bedroom.svg\n/demo/houses/house-01-shared.svg"}
            value={form.imageUrls}
            onChange={(e) => update("imageUrls", e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Enter up to 5 URLs separated by line breaks or commas. The first image will be used as the primary cover photo.
          </p>
        </div>

        <div>
          <label
            htmlFor="house-availability"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
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
            className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 dark:border dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-800 dark:border dark:border-green-900/60 dark:bg-green-950/60 dark:text-green-300"
          >
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
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
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
          My Boarding Houses
        </h2>

        {houses.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">
            You haven't created any boarding houses yet.
          </p>
        ) : (
          <div className="space-y-3">
            {houses.map((house) => (
              <div
                key={house._id}
                className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
              >
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{house.title}</h3>

                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {house.city} — LKR{" "}
                  {house.monthlyRentLkr.toLocaleString()}
                </p>

                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {house.status} / {house.availability}
                </p>

                {house.status === "ACTIVE" && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                      onClick={() => editHouse(house)}
                    >
                      <PencilIcon className="size-4" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
                      onClick={() =>
                        archiveHouse(house._id)
                      }
                    >
                      <ArchiveIcon className="size-4" />
                      <span>Archive</span>
                    </button>

                    <Link
                      to={`/houses/${house._id}`}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <ExternalLinkIcon className="size-4" />
                      <span>View Listing</span>
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
