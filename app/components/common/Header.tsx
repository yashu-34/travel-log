"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { FiLogOut, FiMapPin } from "react-icons/fi";

export default function Header() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header
      className="
        fixed
        top-0
        left-0
        right-0
        z-50
        bg-gradient-to-r
        from-sky-500
        to-cyan-400
        shadow-md
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          max-w-5xl
          items-center
          justify-between
          px-5
        "
      >

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white/20
              text-white
            "
          >
            <FiMapPin size={22} />
          </div>

          <h1
            className="
              text-xl
              font-bold
              tracking-wide
              text-white
            "
          >
            Travel Log
          </h1>
        </div>


        {/* Logout */}
        <button
          onClick={handleLogout}
          className="
            flex
            items-center
            gap-2
            rounded-full
            bg-white/90
            px-4
            py-2
            text-sm
            font-medium
            text-sky-600
            shadow-sm
            transition
            hover:bg-white
            hover:scale-105
          "
        >
          <FiLogOut size={16} />

          ログアウト
        </button>

      </div>
    </header>
  );
}