"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useMap } from "react-leaflet";
import { useEffect } from "react";

function FlyToMarker({
  post,
}: {
  post: Post | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!post) return;

    map.flyTo(
      [post.latitude, post.longitude],
      16,
      {
        duration: 1.5,
      }
    );
  }, [post, map]);

  return null;
}

interface Post {
  id: string;
  title: string;
  location: string;
  rating: number;
  latitude: number;
  longitude: number;
  images: string[];
}

interface Props {
  posts: Post[];
  selectedPost: Post | null;
  onSelectPost?: (post: Post) => void;
}

// ホーム画面のミニマップで使う共通のアクセントカラー
const PIN_COLOR = "#0284c7";

// タイトルを短く省略（ラベルが長すぎて地図が見づらくなるのを防ぐ）
const truncateTitle = (title: string, max = 10) => {
  if (!title) return "";
  return title.length > max ? `${title.slice(0, max)}…` : title;
};

// =========================
// 投稿ピンのアイコンを生成
// 写真がある場合：丸い写真サムネイル＋色付き枠＋三角のピン先端
// 写真がない場合：色付き涙型ピン
// =========================
function getPostIcon(post: Post) {
  const imageUrl = post.images?.[0];

  if (imageUrl) {
    return L.divIcon({
      className: "",
      html: `
        <div style="position:relative;width:64px;height:74px;">
          <div style="
            position:absolute;
            top:0;
            left:2px;
            width:60px;
            height:60px;
            border-radius:50%;
            border:3px solid ${PIN_COLOR};
            box-shadow:0 2px 6px rgba(0,0,0,0.35);
            overflow:hidden;
            background:#f3f4f6;
          ">
            <img
              src="${imageUrl}"
              style="width:100%;height:100%;object-fit:cover;display:block;"
              onerror="this.style.display='none';"
            />
          </div>
          <div style="
            position:absolute;
            bottom:0;
            left:50%;
            transform:translateX(-50%);
            width:0;
            height:0;
            border-left:9px solid transparent;
            border-right:9px solid transparent;
            border-top:14px solid ${PIN_COLOR};
          "></div>
        </div>
      `,
      iconSize: [64, 76],
      iconAnchor: [32, 76],
      popupAnchor: [0, -72],
      tooltipAnchor: [0, -66],
    });
  }

  // 写真がない投稿用のフォールバックピン
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${PIN_COLOR};
      width:20px;height:20px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    tooltipAnchor: [0, -16],
  });
}

export default function TravelMap({
  posts,
  selectedPost,
  onSelectPost,
}: Props) {
  const center =
    posts.length > 0
      ? [posts[0].latitude, posts[0].longitude]
      : [35.681236, 139.767125];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={12}
      style={{
        width: "100%",
        height: "320px",
        borderRadius: "24px",
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToMarker post={selectedPost} />

      {posts
        .filter(
          (post) =>
            post.latitude != null &&
            post.longitude != null
        )
        .map((post) => (
          <Marker
            key={post.id}
            position={[
                post.latitude,
                post.longitude,
            ]}
            icon={getPostIcon(post)}
            eventHandlers={{
                click: () => onSelectPost?.(post),
            }}
            >

            <Popup>
              <div
                style={{
                  width: 180,
                }}
              >
                <img
                  src={
                    post.images?.[0] ??
                    "/no-image.png"
                  }
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    marginBottom: 8,
                  }}
                />

                <h3>{post.title}</h3>

                <p>📍 {post.location}</p>

                <p>⭐ {post.rating}</p>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    post.location
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 10,
                    color: "#0284c7",
                    fontWeight: "bold",
                  }}
                >
                  📍 GoogleMapで開く
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}