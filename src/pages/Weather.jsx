import WeatherDashboard from "../components/Weather/WeatherDashboard";

export default function Weather() {
  return (
    <div className="relative p-8 max-w-[1600px] mx-auto animate-fade-in overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <WeatherDashboard />
      </div>
    </div>
  );
}