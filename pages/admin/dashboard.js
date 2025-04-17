import { useState, useEffect } from "react";
import Head from "next/head";
import styles from "../../styles/Dashboard.module.css";
import { Analytics } from "@vercel/analytics/react";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalCount: 0 });
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  useEffect(() => {
    fetchStats();
    fetchRecentPhotos(1);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchRecentPhotos = async (pageNum) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/stats?includeRecent=true&page=${pageNum}&limit=12`
      );
      const data = await res.json();

      if (!Array.isArray(data.recentPhotos) || data.recentPhotos.length === 0) {
        setHasMore(false);
      } else {
        setRecentPhotos((prev) =>
          pageNum === 1 ? data.recentPhotos : [...prev, ...data.recentPhotos]
        );
      }
    } catch (err) {
      console.error("Failed to fetch recent photos:", err);
    } finally {
      setLoading(false);
    }
  };
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecentPhotos(nextPage);
  };
  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Dashboard - Event Invitation Creator</title>
        <meta
          name="description"
          content="Admin dashboard for Event Invitation Creator"
        />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Admin Dashboard</h1>

        <div className={styles.statsCard}>
          <h2>Photo Statistics</h2>
          <p className={styles.stat}>
            Total Photos Created: <span>{stats.totalCount}</span>
          </p>
        </div>

        <div className={styles.photosContainer}>
          <h2>Recent Photo Creations</h2>

          <div className={styles.photoGrid}>
            {recentPhotos.map((photo) => (
              <div key={photo._id} className={styles.photoCard}>
                <div className={styles.photoWrapper}>
                  <img
                    src={photo.file_url}
                    alt={`Photo by ${photo.user_name || "Anonymous"}`}
                    className={styles.photoThumbnail}
                    width={200}
                    height={200}
                  />
                </div>
                <div className={styles.photoInfo}>
                  <p>Created by: {photo.user_name || "Anonymous"}</p>
                  <p>Date: {new Date(photo.created_at).toLocaleString()}</p>
                  <a
                    href={photo.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewBtn}
                  >
                    View Full Size
                  </a>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              className={styles.loadMoreBtn}
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}

          {!hasMore && recentPhotos.length > 0 && (
            <p className={styles.endMessage}>
              You've reached the end of the photos
            </p>
          )}

          {!loading && recentPhotos.length === 0 && (
            <p className={styles.noPhotos}>No photos have been created yet</p>
          )}
        </div>
      </main>
      <Analytics/>
    </div>
  );
}