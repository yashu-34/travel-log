"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";

import {
  PiMapTrifoldFill,
  PiSparkleFill,
  PiRocketLaunchFill,
  PiHeartFill,
} from "react-icons/pi";

import styles from "./page.module.css";

export default function Page() {
  const router = useRouter();

  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/home");
    }
  }, [user, loading, router]);

  // ログイン確認中 or ログイン済み（/home へ遷移中）は、ふわっとしたローディング表示
  if (loading || user) {
    return (
      <main className={styles.loadingMain}>
        <div className={styles.loadingIcon}>
          <PiMapTrifoldFill />
        </div>
        <p className={styles.loadingText}>Loading...</p>
      </main>
    );
  }

  // 未ログインの場合は /login へは飛ばさず、かわいい Coming Soon ページを表示
  return (
    <main className={styles.main}>
      <span className={`${styles.blob} ${styles.blobA}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobB}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobC}`} aria-hidden="true" />

      <div className={styles.card}>
        <PiSparkleFill className={`${styles.sparkle} ${styles.sparkle1}`} />
        <PiSparkleFill className={`${styles.sparkle} ${styles.sparkle2}`} />
        <PiSparkleFill className={`${styles.sparkle} ${styles.sparkle3}`} />

        <div className={styles.iconWrap}>
          <PiRocketLaunchFill />
        </div>

        <h1 className={styles.title}>Travel Log</h1>

        <div className={styles.badge}>
          <PiHeartFill className={styles.badgeIcon} />
          Coming Soon
        </div>

        <p className={styles.subtitle}>
          あなたの旅の思い出を記録しよう
        </p>

        <p className={styles.description}>
          ただいま準備中です。もうしばらくお待ちくださいね ✨
        </p>
      </div>
    </main>
  );
}