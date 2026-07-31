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

export default function HomePage() {
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
          <div className={styles.heroInner}>
            <PiSparkleFill className={`${styles.sparkle} ${styles.sparkle1}`} />
            <PiSparkleFill className={`${styles.sparkle} ${styles.sparkle2}`} />
            <PiSparkleFill className={`${styles.sparkle} ${styles.sparkle3}`} />

            <div className={styles.heroContent}>
              <div className={styles.heroIcon}>
                <PiMapTrifoldFill />
              </div>
              <h2 className={styles.heroTitle}>旅マップ</h2>
              <p className={styles.heroSubtitle}>
                行った場所を記録しよう <PiAirplaneTiltFill className={styles.inlineIcon} />
              </p>
            </div>
          </div>
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
            {[1, 2].map((item) => (
              <div key={item} className={styles.polaroid}>
                <div className={styles.tape} aria-hidden="true" />
                <div className={styles.photoFrame}>
                  <PiCameraFill className={styles.photoIcon} />
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