import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
  Droplets,
  Zap,
} from "lucide-react";

export default function WeatherForecast({
  forecast,
  unit = "metric",
}) {
  if (!forecast?.list) return null;

  const tempUnit = unit === "metric" ? "°C" : "°F";

  const dailyForecast = forecast.list.filter((item, index) => index % 8 === 0);

  const getWeatherIcon = (description = "") => {
    const desc = description.toLowerCase();

    if (desc.includes("thunderstorm")) {
      return <Zap size={32} className="text-yellow-300" />;
    }

    if (desc.includes("rain") || desc.includes("drizzle")) {
      return <CloudRain size={32} className="text-cyan-300" />;
    }

    if (desc.includes("snow")) {
      return <CloudSnow size={32} className="text-blue-100" />;
    }

    if (desc.includes("cloud")) {
      return <Cloud size={32} className="text-slate-200" />;
    }

    if (desc.includes("clear")) {
      return <Sun size={32} className="text-yellow-300" />;
    }

    return <CloudSun size={32} className="text-blue-200" />;
  };

  return (
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-3xl font-black text-white mb-2">
            5-Day Forecast
          </h3>

          <p className="text-slate-400">
            Advanced weather outlook and environmental conditions
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {dailyForecast.slice(0, 5).map((day, index) => {
          const date = new Date(day.dt * 1000);

          const temp = Math.round(day.main?.temp ?? 0);
          const humidity = day.main?.humidity ?? 0;
          const wind = day.wind?.speed ?? 0;

          const description =
            day.weather?.[0]?.description || "Clear sky";

          return (
            <div
              key={index}
              className="
                relative overflow-hidden
                rounded-3xl
                border border-white/10
                bg-slate-900/70
                backdrop-blur-xl
                p-6
                shadow-2xl
                transition-all duration-300
                hover:scale-[1.02]
                hover:border-blue-500/20
              "
            >
              {/* Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10">
                {/* Day */}
                <div className="mb-6">
                  <p className="text-lg font-bold text-white">
                    {date.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </p>

                  <p className="text-sm text-slate-500">
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Icon */}
                <div className="mb-5 flex justify-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {getWeatherIcon(description)}
                  </div>
                </div>

                {/* Temp */}
                <div className="text-center mb-5">
                  <h4 className="text-4xl font-black text-white">
                    {temp}
                    <span className="text-xl align-top">
                      {tempUnit}
                    </span>
                  </h4>

                  <p className="text-slate-400 capitalize mt-2">
                    {description}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <ForecastItem
                    icon={<Droplets size={16} />}
                    label="Humidity"
                    value={`${humidity}%`}
                  />

                  <ForecastItem
                    icon={<Wind size={16} />}
                    label="Wind"
                    value={`${wind} ${
                      unit === "metric" ? "m/s" : "mph"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ForecastItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <span className="text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}