"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import {
  FiImage,
  FiMapPin,
  FiTag,
  FiDollarSign,
} from "react-icons/fi";

import { FaStar } from "react-icons/fa";
import BottomNav from "@/app/components/common/BottomNav.tsx";
import ProtectedRoute from "@/app/components/common/ProtectedRoute";
import Header from "@/app/components/common/Header";

import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/app/hooks/useAuth";

import { Geolocation } from "@capacitor/geolocation";
// =========================
// Overpass APIのレスポンス型
// =========================
interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  distanceMeters?: number;
}

interface OverpassElement {
  type: string;

  id: number;

  lat?: number;

  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: {
    name?: string;
    addr_city?: string;
    addr_street?: string;
    addr_housenumber?: string;
  };
}

type GeoStatus = "idle" | "loading" | "success" | "error";

// 検索範囲は段階的に広げていく（狭い範囲でヒットしなければ自動で広げる）
// ユーザーには見せず、内部処理としてのみ使用する
const SEARCH_RADIUS_STEPS = [1000, 3000, 10000]; // メートル

// 2点間の距離を計算（メートル、簡易版ハーバサイン公式）
const calcDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 距離を「120m」「1.3km」のような表示用文字列に変換
const formatDistance = (meters: number) => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export default function CreatePostPage() {
  const router = useRouter();

  // =========================
  // カテゴリー一覧
  // =========================

  const categories = [
    "🍜 食べ物",
    "☕ カフェ",
    "📍 観光地",
    "🏨 ホテル",
    "🚗 交通",
    "🛍 買い物",
    "🌅 景色",
    "🎡 アクティビティ",
    "♨ 温泉",
    "🎉 イベント",
    "📷 その他",
  ];

  // =========================
  // State
  // =========================

  const [category, setCategory] = useState(categories[0]);

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [location, setLocation] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);

  const [longitude, setLongitude] = useState<number | null>(null);

  const [price, setPrice] = useState("");

  const [rating, setRating] = useState(0);

  const [images, setImages] = useState<File[]>([]);

  const [tags, setTags] = useState<string[]>([]);

  const [tagInput, setTagInput] = useState("");

  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  // ================import { Geolocation } from "@capacitor/geolocation";=========
  // ジオコーディング関連 State
  // =========================

  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const [geoCandidates, setGeoCandidates] = useState<GeocodeResult[]>([]);

  // 検索の中心点（ページを開いた時に自動取得する現在地）
  const [centerLat, setCenterLat] = useState<number | null>(null);

  const [centerLon, setCenterLon] = useState<number | null>(null);

  // 現在地の取得状況（ユーザーには基本的に意識させない）
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);

  // =========================
  // 写真追加
  // =========================

  const handleImages = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    setImages((prev) => [...prev, ...files]);
  };

  // =========================
  // 写真削除
  // =========================

  const removeImage = (index: number) => {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =========================
  // タグ追加
  // =========================

  const addTag = () => {
    const tag = tagInput.trim();

    if (!tag) return;

    if (tags.includes(tag)) return;

    setTags([...tags, tag]);

    setTagInput("");
  };

  // Enterで追加
  const handleTagKeyDown = (
    e: KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      addTag();
    }
  };

  // =========================
  // タグ削除
  // =========================

  const removeTag = (tag: string) => {
    setTags(
      tags.filter((item) => item !== tag)
    );
  };

  // =========================
  // 星評価
  // =========================

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={28}
            onClick={() => setRating(star)}
            className={`
              cursor-pointer
              transition
              ${
                star <= rating
                  ? "text-yellow-400"
                  : "text-gray-300"
              }
            `}
          />
        ))}
      </div>
    );
  };

  // =========================
  // 正規表現エスケープ
  // Overpassクエリへのインジェクション防止のため、
  // ユーザー入力に含まれる正規表現の特殊文字を無害化する
  // =========================

  const escapeRegex = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\"]/g, "\\$&");

  // =========================
  // 現在地取得
  // =========================

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("このブラウザは位置情報に対応していません"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  };

  // ページを開いたタイミングで自動的に現在地を取得しておく
  // （ユーザーに操作させない。許可ダイアログはブラウザが自動で出す）
  useEffect(() => {
    getCurrentPosition()
      .then((pos) => {
        setCenterLat(pos.coords.latitude);
        setCenterLon(pos.coords.longitude);
        setLocationPermissionDenied(false);
      })
      .catch(() => {
        // 拒否・取得失敗しても静かに待つ。
        // 実際に検索しようとした時にだけメッセージを出す
        setLocationPermissionDenied(true);
      });
  }, []);

  // 指定した半径1つ分だけOverpassに問い合わせる内部関数
  const fetchNearbyPlaces = async (
    name: string,
    lat: number,
    lon: number,
    radiusMeters: number
  ): Promise<GeocodeResult[]> => {
    const safeName = escapeRegex(name);

    const query = `
      [out:json][timeout:15];
      (
        node["name"~"${safeName}",i]["shop"](around:${radiusMeters},${lat},${lon});
        node["name"~"${safeName}",i]["amenity"](around:${radiusMeters},${lat},${lon});
        node["name"~"${safeName}",i]["tourism"](around:${radiusMeters},${lat},${lon});
        way["name"~"${safeName}",i]["shop"](around:${radiusMeters},${lat},${lon});
        way["name"~"${safeName}",i]["amenity"](around:${radiusMeters},${lat},${lon});
        way["name"~"${safeName}",i]["tourism"](around:${radiusMeters},${lat},${lon});
      );
      out center 10;
    `;

    const response = await fetch(
      "https://overpass.kumi.systems/api/interpreter",
      {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
      }
    );

    if (!response.ok) {
      throw new Error("Overpass API error");
    }

    const data = await response.json();

    return data.elements
      .map((item: OverpassElement) => {
        let elLat: number | undefined;
        let elLon: number | undefined;

        if (item.type === "node") {
          elLat = item.lat;
          elLon = item.lon;
        } else if (item.center) {
          elLat = item.center.lat;
          elLon = item.center.lon;
        }

        if (elLat === undefined || elLon === undefined) return null;

        return {
          display_name: [
            item.tags?.name,
            item.tags?.addr_city,
            item.tags?.addr_street,
            item.tags?.addr_housenumber,
          ]
            .filter(Boolean)
            .join(" "),
          lat: String(elLat),
          lon: String(elLon),
          distanceMeters: calcDistanceMeters(lat, lon, elLat, elLon),
        };
      })
      .filter(
        (item: GeocodeResult | null): item is GeocodeResult => item !== null
      );
  };

  // =========================
  // 場所文字列 → 緯度経度（周辺の店舗・施設検索）
  // ユーザーには範囲を意識させず、狭い範囲から自動で段階的に広げて探す
  // =========================

  const searchLocation = async () => {
  if (!location.trim()) return;

  setGeoStatus("loading");
  setGeoCandidates([]);
  setLatitude(null);
  setLongitude(null);

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        location
      )}&limit=5`
    );

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();

    const results: GeocodeResult[] = data.features
      .map((item: any) => ({
        display_name:
          item.properties.name ||
          item.properties.city ||
          item.properties.country ||
          "名称なし",

        lat: String(item.geometry.coordinates[1]),
        lon: String(item.geometry.coordinates[0]),
      }))
      .filter(
        (item: GeocodeResult) =>
          item.lat !== "undefined" &&
          item.lon !== "undefined"
      );

    if (results.length === 0) {

        const q = query(
          collection(db, "places"),
          where("name", "==", location)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {

          const place = snap.docs[0].data();

          setLatitude(place.latitude);
          setLongitude(place.longitude);

          setGeoStatus("success");

          return;
        }

        setGeoStatus("error");
        return;
      }

    if (results.length === 1) {
      setLocation(results[0].display_name);
      setLatitude(Number(results[0].lat));
      setLongitude(Number(results[0].lon));
      setGeoStatus("success");
    } else {
      setGeoCandidates(results);
      setGeoStatus("idle");
    }
  } catch (error) {
    console.error(error);
    setGeoStatus("error");
  }
};

  const selectCandidate = (candidate: GeocodeResult) => {
    setLocation(candidate.display_name);
    setLatitude(parseFloat(candidate.lat));
    setLongitude(parseFloat(candidate.lon));
    setGeoCandidates([]);
    setGeoStatus("success");
  };

  const handleLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLocation(e.target.value);
    // 手動で書き換えたら緯度経度は一旦リセット（場所と座標のズレを防ぐ）
    setLatitude(null);
    setLongitude(null);
    setGeoStatus("idle");
    setGeoCandidates([]);
  };

  const registerCurrentPlace = async () => {
  if (!user) return;

  if (!location.trim()) {
    alert("店名を入力してください");
    return;
  }

  try {
    const position = await Geolocation.getCurrentPosition();

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    await addDoc(collection(db, "places"), {
      name: location,
      latitude,
      longitude,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });

    setLatitude(latitude);
    setLongitude(longitude);

    alert("現在地で登録しました");
    setGeoStatus("success");
  } catch (error) {
    console.error(error);
    alert("現在地を取得できませんでした");
  }
};

  const uploadImages = async (): Promise<string[]> => {
    const imageUrls: string[] = [];

    for (const image of images) {
      const formData = new FormData();

      formData.append("file", image);

      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message);
      }

      imageUrls.push(data.secure_url);
    }

    return imageUrls;
  };

  // =========================
  // 投稿
  // =========================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!user) return;

    // 緯度経度が未確定のまま投稿されるのを防ぐ
    if (latitude === null || longitude === null) {
      alert("場所を検索して位置を確定してください");
      return;
    }

    setLoading(true);

    try {
      // 画像URLを保存する配列
      const imageUrls = await uploadImages();

      // Firestoreへ保存
      await addDoc(collection(db, "posts"), {

        uid: user.uid,

        userName: user.displayName,

        userPhoto: user.photoURL,

        category,

        title,

        content,

        location,

        latitude,
        longitude,

        price,

        rating,

        tags,

        images: imageUrls,

        likes: 0,

        comments: 0,

        views: 0,

        isLive: false,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp()

      });

      alert("投稿しました！");

      router.push("/home");

    } catch (error) {
      console.error(error);
      alert("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (

    <ProtectedRoute>

      <Header />

      <main className="min-h-screen bg-gray-50 px-5 pt-20 pb-24">
        <div className="mx-auto max-w-2xl">

          <h1 className="mb-6 text-3xl font-bold text-sky-600">
            新しい投稿
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

            {/* ========================= */}
            {/* カテゴリー */}
            {/* ========================= */}

            <section>

              <h2 className="mb-3 text-lg font-semibold">
                📂 カテゴリー
              </h2>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                {categories.map((item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`
                      rounded-2xl
                      border
                      p-4
                      text-sm
                      font-medium
                      transition
                      ${
                        category === item
                          ? "border-sky-500 bg-sky-500 text-white"
                          : "bg-white hover:border-sky-300"
                      }
                    `}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </section>


            {/* ========================= */}
            {/* 写真 */}
            {/* ========================= */}

            <section>

              <h2 className="mb-3 text-lg font-semibold">
                📷 写真
              </h2>

              <label
                className="
                  flex
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-2xl
                  border-2
                  border-dashed
                  border-gray-300
                  bg-white
                  p-10
                  transition
                  hover:border-sky-500
                "
              >

                <FiImage
                  size={40}
                  className="mb-3 text-gray-400"
                />

                <p className="font-semibold">
                  写真を追加
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  複数枚選択できます
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={handleImages}
                />

              </label>

            </section>


            {/* ========================= */}
            {/* 写真プレビュー */}
            {/* ========================= */}

            {images.length > 0 && (

              <section>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">

                  {images.map((image, index) => (

                    <div
                      key={index}
                      className="relative overflow-hidden rounded-2xl bg-white shadow"
                    >

                      <img
                        src={URL.createObjectURL(image)}
                        alt=""
                        className="h-40 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="
                          absolute
                          right-2
                          top-2
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          text-white
                          shadow
                          transition
                          hover:bg-red-600
                        "
                      >
                        ✕

                      </button>

                    </div>

                  ))}

                </div>

              </section>

            )}


            {/* ========================= */}
            {/* タイトル */}
            {/* ========================= */}

            <section>

              <label className="mb-2 block text-lg font-semibold">
                📝 タイトル
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="例：沖縄で食べた最高のラーメン"
                className="
                  w-full
                  rounded-2xl
                  border
                  bg-white
                  p-4
                  outline-none
                  focus:border-sky-500
                "
              />

            </section>


            {/* ========================= */}
            {/* 感想 */}
            {/* ========================= */}

            <section>

              <label className="mb-2 block text-lg font-semibold">
                😊 感想
              </label>

              <textarea
                rows={6}
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                placeholder="旅行の思い出や感想を書こう！"
                className="
                  w-full
                  rounded-2xl
                  border
                  bg-white
                  p-4
                  outline-none
                  focus:border-sky-500
                "
              />

            </section>

            {/* ========================= */}
            {/* 場所（周辺検索） */}
            {/* ========================= */}

            <section>

              <label className="mb-2 block text-lg font-semibold">
                📍 場所
              </label>

              <p className="mb-3 text-sm text-gray-500">
                お店や施設の名前を入れて検索してください（近くにある場所から探します）
              </p>

              <div className="flex gap-2">

                <div className="relative flex-1">

                  <FiMapPin
                    size={20}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-sky-500
                    "
                  />

                  <input
                    type="text"
                    value={location}
                    onChange={handleLocationChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchLocation();
                      }
                    }}
                    placeholder="例：スターバックス"
                    className="
                      w-full
                      rounded-2xl
                      border
                      bg-white
                      py-4
                      pl-12
                      pr-4
                      outline-none
                      transition
                      focus:border-sky-500
                    "
                  />

                </div>

                <button
                  type="button"
                  onClick={searchLocation}
                  disabled={geoStatus === "loading" || !location.trim()}
                  className="
                    shrink-0
                    rounded-2xl
                    bg-sky-500
                    px-5
                    font-semibold
                    text-white
                    transition
                    hover:bg-sky-600
                    disabled:opacity-50
                  "
                >
                  {geoStatus === "loading" ? "検索中..." : "検索"}
                </button>

              </div>

              {/* 位置確定後の確認表示 */}
              {geoStatus === "success" &&
                geoCandidates.length === 0 &&
                latitude !== null && (
                  <p className="mt-2 text-sm text-emerald-600">
                    ✓ 「{location}」の場所を設定しました
                  </p>
                )}

              {/* 候補が複数ある場合の選択リスト（近い順・距離つき） */}
              {geoCandidates.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-2xl border bg-white shadow">
                  <p className="border-b bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    近い順に表示しています。目的の場所をタップしてください
                  </p>
                  {geoCandidates.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectCandidate(c)}
                      className="flex w-full items-center justify-between border-b p-3 text-left text-sm last:border-b-0 hover:bg-sky-50"
                    >
                      <span>{c.display_name}</span>
                      {c.distanceMeters !== undefined && (
                        <span className="ml-3 shrink-0 rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700">
                          {formatDistance(c.distanceMeters)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {geoStatus === "error" && (
                <div className="mt-3 space-y-3">

                  <p className="text-red-500">
                    この場所は見つかりませんでした
                  </p>

                  <button
                    type="button"
                    onClick={registerCurrentPlace}
                    className="rounded-xl bg-green-600 px-4 py-3 text-white"
                  >
                    📍 現在地で登録する
                  </button>

                </div>
              )}

            </section>


            {/* ========================= */}
            {/* 金額 */}
            {/* ========================= */}

            <section>

              <label className="mb-2 block text-lg font-semibold">
                💰 金額（任意）
              </label>

              <div className="relative">

                <FiDollarSign
                  size={20}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-green-500
                  "
                />

                <input
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="1200"
                  className="
                    w-full
                    rounded-2xl
                    border
                    bg-white
                    py-4
                    pl-12
                    pr-16
                    outline-none
                    transition
                    focus:border-sky-500
                  "
                />

                <span
                  className="
                    absolute
                    right-5
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                >
                  円
                </span>

              </div>

            </section>


            {/* ========================= */}
            {/* 評価 */}
            {/* ========================= */}

            <section>

              <label className="mb-3 block text-lg font-semibold">
                ⭐ 評価
              </label>

              {renderStars()}

              {rating > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {rating} / 5
                </p>
              )}

            </section>


            {/* ========================= */}
            {/* タグ */}
            {/* ========================= */}

            <section>

              <label className="mb-2 block text-lg font-semibold">
                🏷 タグ
              </label>

              <div className="flex gap-2">

                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="タグを入力してEnter"
                  className="
                    flex-1
                    rounded-xl
                    border
                    bg-white
                    p-3
                    outline-none
                    focus:border-sky-500
                  "
                />

                <button
                  type="button"
                  onClick={addTag}
                  className="
                    rounded-xl
                    bg-sky-500
                    px-5
                    text-white
                    transition
                    hover:bg-sky-600
                  "
                >
                  追加
                </button>

              </div>

              {tags.length > 0 && (

                <div className="mt-4 flex flex-wrap gap-2">

                  {tags.map((tag) => (

                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-sky-100
                        px-4
                        py-2
                        text-sm
                        text-sky-700
                      "
                    >
                      <FiTag size={14} />

                      #{tag}

                      ✕

                    </button>

                  ))}

                </div>

              )}

            </section>


            {/* ========================= */}
            {/* 投稿ボタン */}
            {/* ========================= */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-sky-500
                to-cyan-500
                py-4
                text-lg
                font-bold
                text-white
                shadow-lg
                transition
                hover:scale-[1.02]
                hover:shadow-xl
                disabled:opacity-60
                disabled:hover:scale-100
              "
            >
              {loading ? "投稿中..." : "🚀 投稿する"}
            </button>

          </form>

        </div>

      </main>

      <BottomNav />


    </ProtectedRoute>

  );
}