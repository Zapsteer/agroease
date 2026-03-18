"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../../lib/api";
import { useAuth } from "../../../lib/AuthContext";
import toast from "react-hot-toast";

const ROLES = [
  { id: "buyer",  label: "Kisan / Buyer",   emoji: "👨‍🌾", desc: "Products kharidne ke liye" },
  { id: "seller", label: "Dukan / Seller",  emoji: "🏪", desc: "Products bechne ke liye"  },
  { id: "driver", label: "Delivery Partner",emoji: "🚛", desc: "Delivery karne ke liye"   },
];

export default function LoginPage() {
  const router    = useRouter();
  const { login } = useAuth();

  const [step,     setStep]     = useState("phone"); // phone | otp | name
  const [phone,    setPhone]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [name,     setName]     = useState("");
  const [role,     setRole]     = useState("buyer");
  const [loading,  setLoading]  = useState(false);
  const [devOtp,   setDevOtp]   = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return toast.error("10-digit phone number dein");
    try {
      setLoading(true);
      const res = await authAPI.sendOTP(phone, role);
      toast.success(res.message);
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep("otp");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("6-digit OTP dein");
    try {
      setLoading(true);
      const res = await authAPI.verifyOTP(phone, otp, role, name || undefined);
      if (res.needsName) { setStep("name"); return; }
      login(res.token, res.user);
      toast.success(`Welcome ${res.user.name}! 🌾`);
      router.push("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Apna naam likhein");
    try {
      setLoading(true);
      const res = await authAPI.verifyOTP(phone, otp, role, name);
      login(res.token, res.user);
      toast.success(`AgroEase mein Swagat hai, ${res.user.name}! 🌾`);
      router.push("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-primary flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🌾</span>
          <div>
            <h1 className="font-display text-3xl font-bold text-beige">AgroEase</h1>
            <p className="text-white/60 text-sm">Himachal Pradesh Agri Platform</p>
          </div>
        </div>
        <p className="text-white/80 text-base">
          {step === "phone" && "Apna phone number dein, OTP se login karein"}
          {step === "otp"   && `OTP ${phone} par bheja gaya`}
          {step === "name"  && "Pehli baar login — apna naam dein"}
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">

        {/* Role selector (only on phone step) */}
        {step === "phone" && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3">Aap kaun hain?</p>
            <div className="flex flex-col gap-2">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left
                    ${role === r.id
                      ? "border-green-primary bg-green-pale"
                      : "border-gray-100 hover:border-gray-200"}`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div>
                    <p className={`font-semibold text-sm ${role === r.id ? "text-green-primary" : "text-gray-800"}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-400">{r.desc}</p>
                  </div>
                  {role === r.id && <span className="ml-auto text-green-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PHONE FORM */}
        {step === "phone" && (
          <form onSubmit={handleSendOTP}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-green-primary transition">
              <span className="bg-gray-50 px-3 py-3.5 text-gray-500 text-sm font-medium border-r border-gray-200">+91</span>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))}
                placeholder="98XXXXXXXX" required maxLength={10}
                className="flex-1 px-3 py-3.5 text-base outline-none bg-transparent"
              />
            </div>
            <button type="submit" disabled={loading || phone.length !== 10}
              className="w-full mt-4 bg-green-primary text-white font-bold py-4 rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-medium transition">
              {loading ? "Bhej raha hai..." : "OTP Bhejo"}
            </button>
          </form>
        )}

        {/* OTP FORM */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">6-digit OTP</label>
            <input
              type="tel" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/,"").slice(0,6))}
              placeholder="123456" required maxLength={6}
              className="w-full border-2 border-gray-200 focus:border-green-primary rounded-xl px-4 py-3.5 text-2xl font-bold text-center tracking-widest outline-none transition"
            />
            {devOtp && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                <p className="text-xs text-yellow-700">DEV MODE — OTP: <strong>{devOtp}</strong></p>
              </div>
            )}
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full mt-4 bg-green-primary text-white font-bold py-4 rounded-xl
                         disabled:opacity-50 hover:bg-green-medium transition">
              {loading ? "Verify ho raha hai..." : "Verify Karo"}
            </button>
            <button type="button" onClick={() => { setStep("phone"); setOtp(""); }}
              className="w-full mt-2 text-gray-500 text-sm py-2">
              ← Wapis Jao
            </button>
          </form>
        )}

        {/* NAME FORM */}
        {step === "name" && (
          <form onSubmit={handleNameSubmit}>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Aapka Naam</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ramesh Kumar" required
              className="w-full border-2 border-gray-200 focus:border-green-primary rounded-xl px-4 py-3.5 text-base outline-none transition"
            />
            <button type="submit" disabled={loading || !name.trim()}
              className="w-full mt-4 bg-green-primary text-white font-bold py-4 rounded-xl
                         disabled:opacity-50 hover:bg-green-medium transition">
              {loading ? "Account ban raha hai..." : "Shuru Karein 🌾"}
            </button>
          </form>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Login karke aap AgroEase ke Terms se agree karte hain
        </p>
      </div>
    </div>
  );
}
