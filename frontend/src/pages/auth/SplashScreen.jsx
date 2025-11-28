import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/welcome");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-blue-600 rounded-full mb-8 animate-pulse">
          <Shield size={64} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          NeighborWatch Connect
        </h1>
        <p className="text-xl text-slate-300 mb-8">Community Safety Platform</p>
        <div className="flex justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
