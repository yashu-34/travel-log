"use client";

import Link from "next/link";
import {
  HiOutlineHome,
  HiOutlinePlusCircle,
  HiOutlineMap,
  HiOutlineHeart,
  HiOutlineUser,
} from "react-icons/hi2";


export default function BottomNav() {

  const menus = [
    {
      name: "ホーム",
      href: "/home",
      icon: HiOutlineHome,
    },
    {
      name: "投稿",
      href: "/post/create",
      icon: HiOutlinePlusCircle,
    },
    {
      name: "地図",
      href: "/map",
      icon: HiOutlineMap,
    },
    {
      name: "リスト",
      href: "/wishlist",
      icon: HiOutlineHeart,
    },
    {
      name: "プロフィール",
      href: "/profile",
      icon: HiOutlineUser,
    },
  ];


  return (
    <nav className="
      fixed
      bottom-0
      left-0
      right-0
      z-50
      border-t
      bg-white
    ">

      <div className="
        mx-auto
        flex
        h-16
        max-w-5xl
        items-center
        justify-around
      ">

        {menus.map((menu) => {

          const Icon = menu.icon;

          return (
            <Link
              key={menu.name}
              href={menu.href}
              className="
                flex
                flex-col
                items-center
                text-gray-500
                hover:text-sky-600
              "
            >

              <Icon size={24}/>

              <span className="text-xs">
                {menu.name}
              </span>

            </Link>
          );

        })}

      </div>

    </nav>
  );
}