"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/layout/Navbar";
import BottomNav from "../../components/layout/BottomNav";
import { aiAPI } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import toast from "react-hot-toast";

const CROPS = ["apple","peach","plum","wheat","maize","vegetable","other"];

const SEVERITY_CONFIG = {
  low:    { color: "bg-green-50  text-green-700",  label: "Low Severity",    emoji: "🟢" },
  medium: { color: "bg-yellow-50 text-yellow-700", label: "Medium Severity", emoji: "🟡" },
  high:   { color: "bg-red-50    text-red-700",    label: "High Severity",   emoji: "🔴" },
};

export default function AIPage() {
  const { user }   = useAuth();
  const router     = useRouter();
  const fileRef    = useRef();

  const [cropType,   setCropType]   = useState("apple");
  const [preview,    setPreview]    = useState(null);
  const [base64,     setBase64]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [history,    setHistory]    = useState([]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Sirf image file select karein");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPreview(dataUrl);
      setBase64(dataUrl.split(",")[1]);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!user) { router.push("/login"); return; }
    if (!base64) return toast.error("Pehle image select karein");
    try {
      setLoading(true);
      const res = await aiAPI.detect({ imageBase64: base64, cropType });
      setResult(res.detection);
      toast.success("Detection complete! 🤖");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sev = result ? (SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium) : null;

  return (
    <div className="pb-24">
      <Navbar />

      {/* Header */}
      <div className="bg-green-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-white">AI Disease Detection 🤖</h1>
        <p className="text-white/70 text-sm mt-1">Plant ki photo lo, disease pata karo</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Crop selector */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Fasal chunein:</p>
          <div className="flex gap-2 flex-wrap">
            {CROPS.map(c => (
              <button key={c} onClick={() => setCropType(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition capitalize
                  ${cropType === c ? "bg-green-primary text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Upload zone */}
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          {!preview ? (
            <button
              onClick={() => fileRef.current.click()}
              className="w-full border-2 border-dashed border-green-muted rounded-2xl py-12 flex flex-col items-center gap-3 bg-green-pale hover:border-green-primary transition"
            >
              <span className="text-5xl">📸</span>
              <div className="text-center">
                <p className="font-semibold text-green-medium">Photo Upload Karein</p>
                <p className="text-sm text-gray-400 mt-1">Patte ki clear photo lo</p>
              </div>
            </button>
          ) : (
            <div className="relative">
              <img src={preview} alt="Plant" className="w-full h-56 object-cover rounded-2xl" />
              <button
                onClick={() => { setPreview(null); setBase64(null); setResult(null); fileRef.current.value=""; }}
                className="absolute top-2 right-2 bg-white rounded-xl p-1.5 shadow-md"
              >✕</button>
              <button
                onClick={() => fileRef.current.click()}
                className="absolute bottom-2 right-2 bg-white text-green-primary text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Detect button */}
        {preview && !result && (
          <button
            onClick={handleDetect}
            disabled={loading}
            className="w-full bg-green-primary text-white font-bold py-4 rounded-xl hover:bg-green-medium transition disabled:opacity-60 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span> AI Analyze Kar Raha Hai...
              </span>
            ) : "🔍 Disease Detect Karo"}
          </button>
        )}

        {/* RESULT CARD */}
        {result && (
          <div className="card border-green-primary border-2 space-y-4 page-enter">
            {/* Disease name + confidence */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {result.diseaseName === "Healthy Plant" ? "✅" : "⚠️"}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900">{result.diseaseName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Confidence: {result.confidence}%</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                    <div className="bg-green-primary h-1.5 rounded-full" style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>
              </div>
              {sev && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ml-auto flex-shrink-0 ${sev.color}`}>
                  {sev.emoji} {sev.label}
                </span>
              )}
            </div>

            {result.diseaseName !== "Healthy Plant" && (
              <>
                {/* Cause */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">🔬 Karan (Cause)</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{result.cause}</p>
                </div>

                {/* Treatment */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">💊 Ilaj (Treatment)</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{result.treatment}</p>
                </div>

                {/* Prevention */}
                {result.prevention && (
                  <div className="bg-green-pale rounded-xl p-3">
                    <p className="text-xs font-bold text-green-medium uppercase tracking-wide mb-1">🛡️ Bachao (Prevention)</p>
                    <p className="text-sm text-green-700 leading-relaxed">{result.prevention}</p>
                  </div>
                )}
              </>
            )}

            {/* Recommended products */}
            {result.recommendedProducts?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🛒 Suggested Products</p>
                <div className="grid grid-cols-2 gap-2">
                  {result.recommendedProducts.map(p => (
                    <Link key={p._id} href={`/product/${p._id}`}
                      className="bg-green-pale border border-green-muted rounded-xl p-3 hover:bg-green-muted/30 transition"
                    >
                      <p className="font-semibold text-xs text-green-primary">{p.name}</p>
                      <p className="text-green-medium font-bold text-sm mt-1">₹{p.price}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Retry */}
            <button onClick={() => { setResult(null); setPreview(null); setBase64(null); fileRef.current.value=""; }}
              className="w-full border border-green-primary text-green-primary py-3 rounded-xl text-sm font-semibold hover:bg-green-pale transition"
            >
              Naya Detection Karo
            </button>
          </div>
        )}

        {/* How it works */}
        {!preview && !result && (
          <div className="card">
            <p className="font-semibold text-sm mb-3">Kaise kaam karta hai?</p>
            {[
              { step: "1", text: "Apni fasal ke patte ki photo lo" },
              { step: "2", text: "Fasal ka type chunein" },
              { step: "3", text: "AI 2-3 seconds mein disease detect karega" },
              { step: "4", text: "Treatment aur recommended products milenge" },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
                <div className="w-6 h-6 bg-green-primary text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <p className="text-sm text-gray-600">{s.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
