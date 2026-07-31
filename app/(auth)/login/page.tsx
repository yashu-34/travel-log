"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMapPin, FiMail, FiLock } from "react-icons/fi";

import { useAuth } from "@/app/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();

  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);


  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      await login(email, password);

      router.push("/home");

    } catch (error) {
      console.error(error);

      alert(
        "メールアドレスまたはパスワードが違います"
      );

    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    try {

      setLoading(true);

      await googleLogin();

      router.push("/home");

    } catch (error) {

      console.error(error);

      alert(
        "Googleログインに失敗しました"
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-gradient-to-br
        from-sky-100
        via-white
        to-cyan-100
        px-5
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          bg-white
          p-8
          shadow-xl
        "
      >

        {/* Logo */}
        <div className="mb-8 text-center">

          <div
            className="
              mx-auto
              mb-3
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              bg-sky-500
              text-white
            "
          >
            <FiMapPin size={32}/>
          </div>


          <h1
            className="
              text-3xl
              font-bold
              text-sky-600
            "
          >
            Travel Log
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            思い出を記録する旅ログアプリ
          </p>

        </div>



        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >

          <div>

            <label className="mb-2 block font-medium">
              メールアドレス
            </label>

            <div className="relative">

              <FiMail
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                type="email"
                value={email}
                onChange={(e)=>
                  setEmail(e.target.value)
                }
                placeholder="sample@example.com"
                className="
                  w-full
                  rounded-xl
                  border
                  py-3
                  pl-10
                  pr-3
                  outline-none
                  focus:border-sky-500
                "
                required
              />

            </div>

          </div>



          <div>

            <label className="mb-2 block font-medium">
              パスワード
            </label>


            <div className="relative">

              <FiLock
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />


              <input
                type="password"
                value={password}
                onChange={(e)=>
                  setPassword(e.target.value)
                }
                placeholder="********"
                className="
                  w-full
                  rounded-xl
                  border
                  py-3
                  pl-10
                  pr-3
                  outline-none
                  focus:border-sky-500
                "
                required
              />

            </div>

          </div>



          <button
            disabled={loading}
            className="
              w-full
              rounded-xl
              bg-sky-600
              py-3
              font-bold
              text-white
              transition
              hover:bg-sky-700
            "
          >

            {loading
              ? "ログイン中..."
              : "ログイン"
            }

          </button>


        </form>



        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="
            mt-4
            w-full
            rounded-xl
            border
            py-3
            font-bold
            transition
            hover:bg-gray-100
          "
        >
          Googleでログイン
        </button>



        <div
          className="
            mt-6
            flex
            justify-between
            text-sm
          "
        >

          <Link
            href="/register"
            className="
              text-sky-600
              hover:underline
            "
          >
            新規登録
          </Link>


          <Link
            href="/forgot-password"
            className="
              text-sky-600
              hover:underline
            "
          >
            パスワード忘れた方
          </Link>

        </div>


      </div>

    </main>
  );
}