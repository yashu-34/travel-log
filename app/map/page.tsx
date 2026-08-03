"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import ProtectedRoute from "@/app/components/common/ProtectedRoute";
import Header from "@/app/components/common/Header";
import BottomNav from "@/app/components/common/BottomNav.tsx";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";

const TravelMap = dynamic(
  () => import("@/app/components/Map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-180px)] items-center justify-center">
        地図を読み込み中...
      </div>
    ),
  }
);

interface Post {
  id: string;
  title: string;
  location: string;
  rating: number;
  latitude: number;
  longitude: number;
  images: string[];
}

export default function MapPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] =
    useState<Post | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "posts")
        );

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        setPosts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <ProtectedRoute>
      <Header />

      <main className="bg-sky-50 pt-16 pb-24">

        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">
            🗺 Travel Map
          </h1>
        </div>

        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            読み込み中...
          </div>
        ) : (
          <TravelMap
            posts={posts}
            selectedPost={selectedPost}
            onSelectPost={setSelectedPost}
          />
        )}

      </main>

      <BottomNav />
    </ProtectedRoute>
  );
}