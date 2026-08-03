"use client";

import ProtectedRoute from "@/app/components/common/ProtectedRoute";
import Header from "@/app/components/common/Header";
import BottomNav from "@/app/components/common/BottomNav.tsx";

import {
  PiMapTrifoldFill,
  PiCameraFill,
  PiHeartFill,
  PiMapPinFill,
  PiAirplaneTiltFill,
  PiSparkleFill,
  PiArrowRightBold,
} from "react-icons/pi";

import styles from "./page.module.css";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/firebase/config";

import dynamic from "next/dynamic";

const TravelMap = dynamic(
  () => import("@/app/components/Map"),
  {
    ssr: false,
  }
);

interface Post {
  id: string;
  uid: string;
  userName: string;
  userPhoto: string;
  title: string;
  content: string;
  location: string;
  category: string;
  price: number;
  rating: number;
  tags: string[];
  images: string[];
  likes: number;
  comments: number;
  createdAt: any;
  latitude: number;
  longitude: number;
}


export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] =
  useState<Post | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        setPosts(data);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);
  return (
    <ProtectedRoute>
      <Header />

      <main className={styles.main}>
        {/* ふわふわ背景の飾り */}
        <span className={`${styles.blob} ${styles.blobA}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobB}`} aria-hidden="true" />
        <span className={`${styles.blob} ${styles.blobC}`} aria-hidden="true" />

        {/* Map Card */}
        <section className={styles.heroCard}>

          {loading ? (

            <p>読み込み中...</p>

          ) : (

            <TravelMap
              posts={posts}
              selectedPost={selectedPost}
            />

          )}

        </section>

        {/* 最近の旅 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <PiCameraFill className={styles.titleIcon} />
              最近の旅
            </h2>

            <button className={styles.seeAllButton}>
              すべて見る
              <PiArrowRightBold className={styles.seeAllIcon} />
            </button>
          </div>

          <div className={styles.photoGrid}>
            {posts.map((post) => (
              <div
                key={post.id}
                className={styles.postCard}
                onClick={() => setSelectedPost(post)}
                style={{
                  cursor: "pointer",
                }}
              >
                <img
                  src={
                    post.images?.length
                      ? post.images[0]
                      : "/no-image.png"
                  }
                  alt={post.title}
                  className={styles.postImage}
                />

                <div className={styles.postBody}>
                  <h3>{post.title}</h3>

                  {post.location && (
                    <p>📍 {post.location}</p>
                  )}

                  {post.rating > 0 && (
                    <p>⭐ {post.rating}</p>
                  )}

                  {post.price && (
                    <p>💰 ¥{post.price.toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 行きたい場所 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <PiHeartFill className={styles.titleIcon} />
            行きたい場所
          </h2>

          <div className={styles.wishList}>
            <div className={styles.wishCard}>
              <div className={`${styles.wishIconWrap} ${styles.pin}`}>
                <PiMapPinFill />
              </div>
              <div>
                <h3 className={styles.wishTitle}>京都カフェ巡り</h3>
                <p className={styles.wishSubtitle}>行きたいリスト</p>
              </div>
            </div>

            <div className={styles.wishCard}>
              <div className={`${styles.wishIconWrap} ${styles.plane}`}>
                <PiAirplaneTiltFill />
              </div>
              <div>
                <h3 className={styles.wishTitle}>北海道旅行</h3>
                <p className={styles.wishSubtitle}>次の旅候補</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </ProtectedRoute>
  );
}