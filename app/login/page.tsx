"use client";

import { useEffect, useMemo, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { startTelegramAuth, verifyCode, getCurrentUser } from "@/lib/api";

const CODE_LEN = 6;

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [codeArr, setCodeArr] = useState<string[]>(Array(CODE_LEN).fill(""));
  const [error, setError] = useState("");
  const [botLink, setBotLink] = useState("");
  const [botUsername, setBotUsername] = useState("muruvvat1_bot");
  const [initLoading, setInitLoading] = useState(true);

  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profil";

  const code = useMemo(() => codeArr.join(""), [codeArr]);
  const isComplete = useMemo(
    () => codeArr.every((c) => c.length === 1),
    [codeArr],
  );

  const focusAt = (i: number) => {
    const el = document.getElementById(`code-${i}`) as HTMLInputElement | null;
    el?.focus();
    el?.select();
  };

  // Sahifa yuklanganda avtomatik sessiya yaratish
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await startTelegramAuth(window.location.origin);
        if (response.success && response.data?.botDeepLink) {
          setBotLink(response.data.botDeepLink);
          // Extract bot username from deep link (https://t.me/BOT_NAME?start=...)
          const match = response.data.botDeepLink.match(/t\.me\/([^?]+)/);
          if (match) setBotUsername(match[1]);
        }
      } catch (err) {
        console.error("Sessiya yaratishda xatolik:", err);
      } finally {
        setInitLoading(false);
      }
    };
    initSession();
  }, []);

  const handleVerifyCode = useCallback(async () => {
    if (!isComplete || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await verifyCode(code);

      if (!response.success) {
        throw new Error(
          response.message || "Code noto'g'ri yoki muddati o'tgan",
        );
      }

      const userResponse = await getCurrentUser();
      if (userResponse.success && userResponse.data?.isAdmin) {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = returnUrl;
      }
      // Don't set loading=false on success - keep loading while redirecting
    } catch (err: any) {
      setError(err.message || "Tasdiqlashda xatolik");
      setCodeArr(Array(CODE_LEN).fill(""));
      setLoading(false);
      setTimeout(() => focusAt(0), 100);
    }
  }, [code, isComplete, returnUrl, loading]);

  // 8 ta to'lsa avtomatik tasdiqlash
  useEffect(() => {
    if (isComplete && !loading) {
      handleVerifyCode();
    }
  }, [isComplete, handleVerifyCode, loading]);

  const setChar = (index: number, raw: string) => {
    const val = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!val) return;

    setCodeArr((prev) => {
      const next = [...prev];
      next[index] = val[0];
      return next;
    });

    setError("");
    if (index < CODE_LEN - 1) focusAt(index + 1);
  };

  const clearChar = (index: number) => {
    setCodeArr((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const handlePasteAll = (text: string) => {
    const cleaned = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, CODE_LEN);
    if (!cleaned) return;

    const next = Array(CODE_LEN).fill("");
    for (let i = 0; i < cleaned.length; i++) next[i] = cleaned[i];

    setCodeArr(next);
    setError("");
    focusAt(Math.min(cleaned.length, CODE_LEN - 1));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Otbozor"
              width={80}
              height={80}
              className="dark:invert"
            />
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Kirish
        </h1>

        {/* Description */}
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
          Telegram bot orqali bir martalik kod oling va quyida kiriting
        </p>

        {/* Get password button */}
        <a
          href={botLink || `https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full h-12 flex items-center justify-center gap-2.5 rounded-xl font-semibold text-sm transition-all mb-8 ${initLoading
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait pointer-events-none"
              : "bg-[#2AABEE] hover:bg-[#229ED9] text-white"
            }`}
        >
          {initLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Tayyorlanmoqda...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.605l-2.979-.929c-.648-.203-.66-.648.136-.961l11.647-4.49c.538-.194 1.01.131.83.996z" />
              </svg>
              Parol olish
            </>
          )}
        </a>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-3">
          Botdan olgan kodni kiriting
        </p>

        {/* Code Inputs - always single row */}
        <div className="flex gap-1.5 sm:gap-2 justify-center mb-10">
          {Array.from({ length: CODE_LEN }).map((_, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              value={codeArr[index]}
              disabled={loading}
              autoFocus={index === 0}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  clearChar(index);
                } else if (raw.length > 1) {
                  // Paste yoki ko'p belgi kiritilganda
                  handlePasteAll(raw);
                } else {
                  setChar(index, raw);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  if (codeArr[index]) {
                    clearChar(index);
                    return;
                  }
                  if (index > 0) {
                    focusAt(index - 1);
                    clearChar(index - 1);
                  }
                  return;
                }
                if (e.key === "ArrowLeft" && index > 0) {
                  e.preventDefault();
                  focusAt(index - 1);
                }
                if (e.key === "ArrowRight" && index < CODE_LEN - 1) {
                  e.preventDefault();
                  focusAt(index + 1);
                }
                if (e.key === "Enter" && isComplete) handleVerifyCode();
              }}
              onPaste={(e) => {
                e.preventDefault();
                handlePasteAll(e.clipboardData.getData("text"));
              }}
              className="w-9 h-12 sm:w-11 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-lg sm:rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all focus:border-slate-900 dark:focus:border-white focus:ring-0 disabled:opacity-40"
            />
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleVerifyCode}
          disabled={loading || !isComplete}
          className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-40 text-white dark:text-slate-900 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Tekshirilmoqda...
            </>
          ) : (
            "Tasdiqlash"
          )}
        </button>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
