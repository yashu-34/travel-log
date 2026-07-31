"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      await resetPassword(email);

      alert("パスワード再設定メールを送信しました。");
    } catch (error) {
      console.error(error);

      alert("メール送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-sky-600">
          パスワード再設定
        </h1>

        <form
          onSubmit={handleResetPassword}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block font-medium">
              メールアドレス
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="sample@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 py-3 font-bold text-white hover:bg-sky-700"
          >
            {loading ? "送信中..." : "再設定メールを送信"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sky-600 hover:underline"
          >
            ログイン画面へ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}