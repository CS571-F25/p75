import React, { useState, useEffect } from "react";
import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { useAuth } from "../AuthProvider";
import Likes from "./Likes";

/**
 * review: { id, userId, userName, text, rating, timestamp, likes, restaurantId }
 */
export default function ReviewCard({ review }) {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Check if current user already follows this reviewer
  useEffect(() => {
    async function check() {
      if (!firebaseUser) return;
      const meRef = doc(db, "users", firebaseUser.uid);
      const meSnap = await getDoc(meRef).catch(() => null);
      if (!meSnap || !meSnap.exists()) return;
      const data = meSnap.data();
      setIsFollowing(data?.following?.includes(review.userId));
    }
    check();
  }, [firebaseUser, review.userId]);

  const handleAddBud = async () => {
    if (!firebaseUser) return alert("Log in to add Buds.");
    if (firebaseUser.uid === review.userId) return alert("Can't add yourself.");
    
    setProcessing(true);
    try {
      const meRef = doc(db, "users", firebaseUser.uid);
      const themRef = doc(db, "users", review.userId);
      
      await updateDoc(meRef, { following: arrayUnion(review.userId) });
      await updateDoc(themRef, { followers: arrayUnion(firebaseUser.uid) });
      
      setIsFollowing(true);
    } catch (err) {
      console.error(err);
      alert("Could not add bud");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfollow = async () => {
    if (!firebaseUser) return alert("Log in to unfollow.");
    
    setProcessing(true);
    try {
      const meRef = doc(db, "users", firebaseUser.uid);
      const themRef = doc(db, "users", review.userId);
      
      await updateDoc(meRef, { following: arrayRemove(review.userId) });
      await updateDoc(themRef, { followers: arrayRemove(firebaseUser.uid) });
      
      setIsFollowing(false);
    } catch (err) {
      console.error(err);
      alert("Could not unfollow");
    } finally {
      setProcessing(false);
    }
  };

  // Render stars based on rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= review.rating ? "#ffc107" : "#e4e5e9" }}>
          ★
        </span>
      );
    }
    return stars;
  };

  // Don't show follow button for own reviews
  const isOwnReview = firebaseUser?.uid === review.userId;

  return (
    <Card style={{ marginBottom: "10px" }}>
      <Card.Body>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ flex: 1 }}>
            <Card.Title 
              style={{ 
                fontSize: "1rem", 
                cursor: "pointer", 
                color: "#0d6efd",
                textDecoration: "none"
              }}
              onClick={() => navigate(`/bud-profile/${review.userId}`)}
              onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.target.style.textDecoration = "none"}
            >
              {review.userName}
            </Card.Title>
            <div style={{ marginBottom: "5px" }}>{renderStars()}</div>
            <Card.Text>{review.text}</Card.Text>
            <div style={{ fontSize: ".8rem", color: "#666", marginBottom: "8px" }}>
              {review.timestamp
                ? new Date(
                    review.timestamp.seconds
                      ? review.timestamp.seconds * 1000
                      : review.timestamp
                  ).toLocaleString()
                : ""}
            </div>
            {/* Like component */}
            <Likes review={review} />
          </div>
          <div>
            {!isOwnReview && (
              <Button
                size="sm"
                variant={isFollowing ? "danger" : "outline-primary"}
                onClick={isFollowing ? handleUnfollow : handleAddBud}
                disabled={processing}
              >
                {processing ? "..." : isFollowing ? "Unfollow" : "Add Bud"}
              </Button>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}