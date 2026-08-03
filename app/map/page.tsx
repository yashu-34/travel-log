"use client";

import { useEffect, useState, useMemo } from "react";

import ProtectedRoute from "@/app/components/common/ProtectedRoute";
import Header from "@/app/components/common/Header";
import BottomNav from "@/app/components/common/BottomNav.tsx";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

interface Post {
  id: string;
  title: string;
  content: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  images: string[];
  rating: number;
  price: number;
  tags: string[];
}

// 現在地用アイコン
const currentLocationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// カテゴリ別ピン色分け（DivIconで簡易に色付け）
const categoryColors: Record<string, string> = {
  food: "#f97316",
  sightseeing: "#0ea5e9",
  hotel: "#a855f7",
  default: "#22c55e",
};

function getPostIcon(category: string) {
  const color = categoryColors[category] ?? categoryColors.default;
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

function MoveMap({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);

  return null;
}

export default function MapPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [position, setPosition] = useState<[number, number]>([
    35.170915, 136.881537,
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "posts"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        setPosts(data);
      } catch (err) {
        console.error("投稿の取得に失敗しました", err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("位置情報が取得できません");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      () => {
        alert("位置情報の取得に失敗しました");
        setLoading(false);
      }
    );
  };

  const validPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          typeof p.latitude === "number" && typeof p.longitude === "number"
      ),
    [posts]
  );

  return (
    <ProtectedRoute>
      <Header />

      <main className="relative bg-sky-50 pt-16 pb-24">
        {/* タイトルはコンパクトにしてスマホ画面を圧迫しない */}
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">🗺 Travel Map</h1>
          {postsLoading && (
            <span className="text-xs text-gray-400">読み込み中...</span>
          )}
        </div>

        {/* 地図はフルブリードにして画面を最大限使う */}
        <div className="relative h-[calc(100vh-220px)] w-full overflow-hidden shadow-inner">
          <MapContainer
            center={position}
            zoom={15}
            scrollWheelZoom={true}
            zoomControl={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MoveMap position={position} />

            {/* 現在地マーカー */}
            <Marker position={position} icon={currentLocationIcon}>
              <Popup>現在地</Popup>
            </Marker>

            {/* 投稿マーカー */}
            {validPosts.map((post) => (
              <Marker
                key={post.id}
                position={[post.latitude, post.longitude]}
                icon={getPostIcon(post.category)}
              >
                <Popup>
                  <div className="w-40">
                    {post.images?.[0] && (
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="mb-1 h-20 w-full rounded object-cover"
                      />
                    )}
                    <p className="text-sm font-bold leading-tight">
                      {post.title}
                    </p>
                    {post.rating > 0 && (
                      <p className="text-xs text-amber-500">
                        ★{post.rating.toFixed(1)}
                      </p>
                    )}
                    {post.price > 0 && (
                      <p className="text-xs text-gray-600">
                        ¥{post.price.toLocaleString()}〜
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* FAB: 親指で押しやすい右下固定 */}
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="absolute bottom-4 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl text-white shadow-lg active:scale-95 disabled:opacity-60"
            aria-label="現在地を取得"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "📍"
            )}
          </button>
        </div>

        {/* 下部ボトムシート: 近くの投稿を横スクロールで一覧 */}
        <div className="absolute bottom-16 left-0 right-0 z-[900]">
          <div className="flex gap-3 overflow-x-auto px-4 py-3 [-webkit-overflow-scrolling:touch]">
            {validPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setPosition([post.latitude, post.longitude])}
                className="flex w-40 flex-shrink-0 flex-col overflow-hidden rounded-xl bg-white text-left shadow"
              >
                {post.images?.[0] ? (
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="h-20 w-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-full bg-gray-100" />
                )}
                <div className="p-2">
                  <p className="truncate text-xs font-bold">{post.title}</p>
                  <p className="truncate text-[10px] text-gray-500">
                    {post.location}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </ProtectedRoute>
  );
}