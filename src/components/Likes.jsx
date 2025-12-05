import React, { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthProvider";

/**
 * Likes component for reviews
 * Props:
 * - review: { id, userId, likes, restaurantId }
 */
export default function Likes({ review }) {
  const { firebaseUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser) return;
    
    // Check if user has liked this review
    const liked = review.likes?.includes(firebaseUser.uid) || false;
    setHasLiked(liked);
    setLikeCount(review.likes?.length || 0);
  }, [firebaseUser, review.likes]);

  const handleLike = async () => {
    if (!firebaseUser) {
      alert("Log in to like reviews.");
      return;
    }
    
    if (!review.restaurantId) {
      console.error("Review missing restaurantId:", review);
      alert("Error: Cannot like this review (missing restaurant info)");
      return;
    }
    
    setProcessing(true);
    try {
      const reviewRef = doc(db, "restaurants", review.restaurantId, "reviews", review.id);
      const reviewerRef = doc(db, "users", review.userId);
      
      if (hasLiked) {
        // Unlike
        await updateDoc(reviewRef, { likes: arrayRemove(firebaseUser.uid) });
        await updateDoc(reviewerRef, { totalLikes: increment(-1) });
        setHasLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like - initialize likes array if it doesn't exist
        const updates = review.likes 
          ? { likes: arrayUnion(firebaseUser.uid) }
          : { likes: [firebaseUser.uid] };
        
        await updateDoc(reviewRef, updates);
        await updateDoc(reviewerRef, { totalLikes: increment(1) });
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
      }
      
      console.log("Like operation successful");
    } catch (err) {
      console.error("Error liking review:", err);
      alert("Could not like review: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={processing}
      style={{
        backgroundColor: "transparent",
        border: "none",
        cursor: processing ? "not-allowed" : "pointer",
        fontSize: "16px",
        padding: "4px 8px",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        color: hasLiked ? "#dc3545" : "#666"
      }}
    >
      <span style={{ fontSize: "20px" }}>{hasLiked ? "❤️" : "🤍"}</span>
      <span>{likeCount}</span>
    </button>
  );
}