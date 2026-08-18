import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CloudSun,
  Droplets,
  MapPin,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sun,
  Thermometer,
  Wind,
  X,
} from "lucide-react";

const cityWeather = {
  Beirut: {
    city: "Beirut",
    condition: "Partly Cloudy",
    temp: 24,
    humidity: 62,
    wind: 14,
    visibility: "Good",
    risk: "Normal",
    alert: "Weather is safe for hospital operations.",
    forecast: [
      { day: "Mon", temp: 24, condition: "Cloudy" },
      { day: "Tue", temp: 25, condition: "Sunny" },
      { day: "Wed", temp: 23, condition: "Windy" },
      { day: "Thu", temp: 26, condition: "Sunny" },
      { day: "Fri", temp: 22, condition: "Rain" },
    ],
  },
  Saida: {
    city: "Saida",
    condition: "Sunny",
    temp: 26,
    humidity: 58,
    wind: 11,
    visibility: "Excellent",
    risk: "Normal",
    alert: "Clear weather. No operational risk detected.",
    forecast: [
      { day: "Mon", temp: 26, condition: "Sunny" },
      { day: "Tue", temp: 27, condition: "Sunny" },
      { day: "Wed", temp: 25, condition: "Cloudy" },
      { day: "Thu", temp: 24, condition: "Windy" },
      { day: "Fri", temp: 23, condition: "Rain" },
    ],
  },
  Tripoli: {
    city: "Tripoli",
    condition: "Windy",
    temp: 21,
    humidity: 70,
    wind: 28,
    visibility: "Moderate",
    risk: "Warning",
    alert: "High wind detected. Emergency transport should be monitored.",
    forecast: [
      { day: "Mon", temp: 21, condition: "Windy" },
      { day: "Tue", temp: 22, condition: "Cloudy" },
      { day: "Wed", temp: 20, condition: "Rain" },
      { day: "Thu", temp: 23, condition: "Sunny" },
      { day: "Fri", temp: 24, condition: "Sunny" },
    ],
  },
};

export default function WeatherDashboard() {
  const [selectedCity, setSelectedCity] = useState("Beirut");
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const weather = cityWeather[selectedCity];

  const filteredCities = useMemo(() => {
    return Object.keys(cityWeather).filter((city) =>
      city.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [search]);

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const foundCity = Object.keys(cityWeather).find(
      (city) => city.toLowerCase() === search.toLowerCase().trim()
    );

    if (foundCity) {
      setSelectedCity(foundCity);
      setSearch("");
    } else {
      alert("City not found. Try Beirut, Saida, or Tripoli.");
    }
  };

  return (
    <div>
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm mb-4">
            <CloudSun size={16} />
            Hospital Weather Monitoring
          </div>

          <h1 className="text-4xl font-black text-white mb-3">
            Weather Dashboard
          </h1>

          <p className="text-slate-400">
            Monitor city weather, transport risk, emergency readiness, and
            hospital operation safety.
          </p>

          <p className="text-xs text-slate-500 mt-3">
            Last updated: {lastUpdated}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="h-14 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold flex items-center justify-center gap-2 transition"
        >
          <RefreshCcw size={20} />
          Refresh Weather
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city..."
                  className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/40"
                />
              </form>

              <div className="flex flex-wrap gap-3">
                {filteredCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setSearch("");
                    }}
                    className={`h-11 px-5 rounded-2xl border font-bold transition ${
                      selectedCity === city
                        ? "bg-cyan-500 text-white border-cyan-400"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 p-8">
                <div className="flex items-center gap-3 text-cyan-300 mb-4">
                  <MapPin size={22} />
                  <span className="font-bold">{weather.city}, Lebanon</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <h2 className="text-7xl font-black text-white">
                      {weather.temp}°C
                    </h2>
                    <p className="text-2xl font-bold text-slate-300 mt-2">
                      {weather.condition}
                    </p>
                  </div>

                  <Sun className="text-yellow-300" size={90} />
                </div>

                <button
                  onClick={() => setDetailsOpen(true)}
                  className="mt-8 h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold transition"
                >
                  View Full Details
                </button>
              </div>

              <div className="space-y-4">
                <WeatherInfo
                  icon={<Droplets />}
                  title="Humidity"
                  value={`${weather.humidity}%`}
                  color="blue"
                />

                <WeatherInfo
                  icon={<Wind />}
                  title="Wind Speed"
                  value={`${weather.wind} km/h`}
                  color="cyan"
                />

                <WeatherInfo
                  icon={<ShieldCheck />}
                  title="Operation Risk"
                  value={weather.risk}
                  color={weather.risk === "Normal" ? "green" : "yellow"}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
              <CalendarDays className="text-cyan-400" />
              5-Day Forecast
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              {weather.forecast.map((item) => (
                <button
                  key={item.day}
                  onClick={() =>
                    alert(`${item.day}: ${item.temp}°C - ${item.condition}`)
                  }
                  className="rounded-3xl bg-white/[0.03] border border-white/10 p-5 hover:bg-white/[0.06] transition text-center"
                >
                  <p className="text-slate-500 text-sm mb-3">{item.day}</p>
                  <CloudSun className="mx-auto text-cyan-300 mb-3" size={34} />
                  <h3 className="text-2xl font-black text-white">
                    {item.temp}°C
                  </h3>
                  <p className="text-sm text-slate-400 mt-2">
                    {item.condition}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div
            className={`rounded-3xl border p-6 shadow-2xl ${
              weather.risk === "Normal"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-yellow-500/5 border-yellow-500/20"
            }`}
          >
            <h3
              className={`font-black flex items-center gap-2 mb-4 ${
                weather.risk === "Normal"
                  ? "text-emerald-400"
                  : "text-yellow-400"
              }`}
            >
              <AlertTriangle size={20} />
              Weather Alert
            </h3>

            <p className="text-slate-300 text-sm leading-relaxed">
              {weather.alert}
            </p>

            <button
              onClick={() => alert(weather.alert)}
              className="mt-5 w-full h-11 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition"
            >
              Check Alert
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-6 shadow-2xl">
            <h3 className="font-black text-white mb-5">
              Hospital Readiness
            </h3>

            <div className="space-y-4">
              <ReadinessItem label="Ambulance Routes" value="Active" />
              <ReadinessItem label="Emergency Power" value="Ready" />
              <ReadinessItem label="Outdoor Access" value="Safe" />
              <ReadinessItem label="QR Checkpoints" value="Online" />
            </div>
          </div>
        </div>
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-slate-950 border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">
                Weather Details
              </h2>

              <button
                onClick={() => setDetailsOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <Detail label="City" value={weather.city} />
              <Detail label="Condition" value={weather.condition} />
              <Detail label="Temperature" value={`${weather.temp}°C`} />
              <Detail label="Humidity" value={`${weather.humidity}%`} />
              <Detail label="Wind Speed" value={`${weather.wind} km/h`} />
              <Detail label="Visibility" value={weather.visibility} />
              <Detail label="Risk Level" value={weather.risk} />

              <button
                onClick={() => setDetailsOpen(false)}
                className="w-full h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherInfo({ icon, title, value, color }) {
  const styles = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div
        className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${styles[color]}`}
      >
        {icon}
      </div>

      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-black text-white">{value}</h3>
    </div>
  );
}

function ReadinessItem({ label, value }) {
  return (
    <button
      onClick={() => alert(`${label}: ${value}`)}
      className="w-full flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition"
    >
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-bold text-emerald-400">{value}</span>
    </button>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-bold text-sm">{value}</span>
    </div>
  );
}