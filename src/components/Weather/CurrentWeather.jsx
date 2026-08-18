import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Sun,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";

export default function CurrentWeather({ weather, unit = "metric" }) {
  if (!weather) return null;

  const temp = Math.round(weather.main?.temp ?? 0);
  const feelsLike = Math.round(weather.main?.feels_like ?? 0);
  const humidity = weather.main?.humidity ?? "N/A";
  const pressure = weather.main?.pressure ?? "N/A";
  const windSpeed = weather.wind?.speed ?? "N/A";
  const visibility = weather.visibility
    ? `${(weather.visibility / 1000).toFixed(1)} km`
    : "N/A";

  const tempUnit = unit === "metric" ? "°C" : "°F";
  const speedUnit = unit === "metric" ? "m/s" : "mph";
  const description = weather.weather?.[0]?.description || "Clear sky";

  const getWeatherIcon = () => {
    const desc = description.toLowerCase();

    if (desc.includes("thunderstorm")) return <Zap size={64} />;
    if (desc.includes("rain") || desc.includes("drizzle")) return <CloudRain size={64} />;
    if (desc.includes("snow")) return <CloudSnow size={64} />;
    if (desc.includes("cloud")) return <Cloud size={64} />;
    if (desc.includes("clear")) return <Sun size={64} />;

    return <CloudSun size={64} />;
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/90 via-cyan-600/80 to-slate-900 p-8 mb-8 shadow-2xl">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 text-blue-100 mb-3">
            <MapPin size={18} />
            <span className="font-medium">
              {weather.name || "Unknown City"}, {weather.sys?.country || ""}
            </span>
          </div>

          <p className="text-blue-100/80 mb-6">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              {getWeatherIcon()}
            </div>

            <div>
              <p className="text-7xl font-black tracking-tight">
                {temp}
                <span className="text-3xl align-top">{tempUnit}</span>
              </p>

              <p className="text-blue-100 capitalize mt-2">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 min-w-[320px]">
          <WeatherMiniCard
            icon={<Thermometer size={20} />}
            label="Feels Like"
            value={`${feelsLike}${tempUnit}`}
          />

          <WeatherMiniCard
            icon={<Droplets size={20} />}
            label="Humidity"
            value={`${humidity}%`}
          />

          <WeatherMiniCard
            icon={<Wind size={20} />}
            label="Wind"
            value={`${windSpeed} ${speedUnit}`}
          />

          <WeatherMiniCard
            icon={<Gauge size={20} />}
            label="Pressure"
            value={`${pressure} hPa`}
          />

          <WeatherMiniCard
            icon={<Eye size={20} />}
            label="Visibility"
            value={visibility}
          />
        </div>
      </div>
    </section>
  );
}

function WeatherMiniCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-xl">
      <div className="text-blue-100 mb-2">{icon}</div>
      <p className="text-xs text-blue-100/70">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}