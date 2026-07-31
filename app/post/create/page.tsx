"use client";

import { useState, KeyboardEvent } from "react";
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

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/app/hooks/useAuth";

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

  const [price, setPrice] = useState("");

  const [rating, setRating] = useState(0);

  const [images, setImages] = useState<File[]>([]);

  const [tags, setTags] = useState<string[]>([]);

  const [tagInput, setTagInput] = useState("");

  const { user } = useAuth();

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

  const uploadImages = async (): Promise<string[]> => {
  // Cloudinaryへアップロード
  const imageUrls = await uploadImages();

  for (const image of images) {
    const formData = new FormData();

    formData.append("file", image);

    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
    );

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      }/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("画像アップロードに失敗しました");
    }

    const data = await res.json();

    imageUrls.push(data.secure_url);
  }

  return imageUrls;
};

  // =========================
  // 投稿（Part2でFirebase接続）
  // =========================

  const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  if (!user) {
    alert("ログインしてください");
    return;
  }

  try {
    // 画像URLを保存する配列
    const imageUrls: string[] = [];

    // Firestoreへ保存
    await addDoc(collection(db, "posts"), {
      uid: user.uid,

      category,

      title,

      content,

      location,

      price: price === "" ? null : Number(price),

      rating,

      tags,

      images: imageUrls,

      createdAt: serverTimestamp(),
    });

    alert("投稿しました！");

    router.push("/home");

  } catch (error) {
    console.error(error);

    alert("投稿に失敗しました");
  }
};return (

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
        {/* 場所 */}
        {/* ========================= */}

        <section>

          <label className="mb-2 block text-lg font-semibold">
            📍 場所
          </label>

          <div className="relative">

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
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：沖縄県 那覇市"
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
          "
        >
          🚀 投稿する
        </button>

      </form>

    </div>

  </main>

    <BottomNav />
    
    
    </ProtectedRoute>

);
}