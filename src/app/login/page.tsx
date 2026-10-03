"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  // State tampilan: 1 = Input Nomor, 2 = Verifikasi OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Nilai form
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // Status UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(60);

  // Timer hitung mundur untuk kirim ulang OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Sensor tampilan nomor telepon (contoh: 0812****789)
  const formatMaskedPhone = (num: string) => {
    const cleaned = num.trim();
    if (cleaned.length < 8) return cleaned;
    return `${cleaned.slice(0, 4)}****${cleaned.slice(-3)}`;
  };

  // State 1 Action: Kirim Kode OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        // Menggunakan data.error sesuai format penanganan error dari backend
        throw new Error(
          data.error || "Gagal mengirimkan kode OTP. Silakan periksa kembali nomor Anda."
        );
      }

      setSuccessMsg("Kode verifikasi telah dikirimkan ke WhatsApp Anda.");
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi gangguan koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  // State 2 Action: Verifikasi Kode OTP & Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
        }),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        // Menggunakan data.error sesuai format penanganan error dari backend
        throw new Error(data.error || "Kode OTP tidak valid atau telah kedaluwarsa.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memverifikasi OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3 font-semibold text-lg">
            WA
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 1 ? "Masuk dengan WhatsApp" : "Verifikasi Kode OTP"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {step === 1
              ? "Masukkan nomor WhatsApp aktif untuk menerima kode verifikasi"
              : `Kode telah dikirim ke ${formatMaskedPhone(phone)}`}
          </p>
        </div>

        {/* Notifikasi Status */}
        {errorMsg && (
          <div className="mb-5 rounded-lg bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-5 rounded-lg bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            {successMsg}
          </div>
        )}

        {/* State 1: Input Nomor HP/WhatsApp */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-slate-800 mb-2"
              >
                Nomor WhatsApp
              </label>
              <input
                id="phone"
                type="tel"
                required
                placeholder="Contoh: 08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 shadow-sm"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Pastikan nomor terdaftar pada WhatsApp dan dapat menerima pesan.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phone.trim()}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? "Mengirim Kode..." : "Kirim Kode OTP"}
            </button>
          </form>
        )}

        {/* State 2: Verifikasi Kode OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="otp"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Kode OTP (6 Digit)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Ubah Nomor
                </button>
              </div>

              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full tracking-widest text-center text-3xl font-bold rounded-xl border border-slate-300 bg-white py-3 text-slate-900 placeholder-slate-300 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isLoading ? "Memverifikasi..." : "Verifikasi & Login"}
            </button>

            {/* Countdown / Tombol Kirim Ulang */}
            <div className="text-center pt-2">
              {countdown > 0 ? (
                <p className="text-xs text-slate-500">
                  Kirim ulang kode dalam{" "}
                  <span className="font-semibold text-slate-700">
                    {countdown} detik
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendOtp()}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-50"
                >
                  Kirim Ulang Kode
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}