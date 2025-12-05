import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, onSnapshot, updateDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function Buds() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [friendReviews, setFriendReviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("similarity"); // "similarity", "highest", "lowest"

  useEffect(() => {
    // Check if user is logged in
    if (!auth.currentUser) {
      console.error("No user logged in");
      return;
    }

    const unsubUsers = onSnapshot(collection(db, "users"), snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    const unsubCurrent = onSnapshot(doc(db, "users", auth.currentUser.uid), snapshot => {
      setCurrentUserData(snapshot.data());
    });
    
    return () => { unsubUsers(); unsubCurrent(); };
  }, []);

  // Fetch reviews for friends
  useEffect(() => {
    if (!currentUserData?.following?.length) return;

    const fetchFriendReviews = async () => {
      setLoading(true);
      const reviewsMap = {};

      try {
        // Get all restaurants
        const restaurantsSnap = await getDocs(collection(db, "restaurants"));
        
        // For each restaurant, get reviews by friends
        for (const restaurantDoc of restaurantsSnap.docs) {
          const reviewsSnap = await getDocs(
            collection(db, "restaurants", restaurantDoc.id, "reviews")
          );
          
          reviewsSnap.docs.forEach(reviewDoc => {
            const reviewData = reviewDoc.data();
            // Only include reviews from friends
            if (currentUserData.following.includes(reviewData.userId)) {
              if (!reviewsMap[reviewData.userId]) {
                reviewsMap[reviewData.userId] = [];
              }
              reviewsMap[reviewData.userId].push({
                id: reviewDoc.id,
                restaurantId: restaurantDoc.id, // Add restaurantId here
                restaurantName: restaurantDoc.data().name,
                ...reviewData
              });
            }
          });
        }

        setFriendReviews(reviewsMap);
      } catch (err) {
        console.error("Error fetching friend reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendReviews();
  }, [currentUserData?.following]);

  const handleFollow = async (friendId) => {
    if (!currentUserData) return;
    
    // Check if already following
    if (currentUserData.following?.includes(friendId)) {
      alert("You're already following this user!");
      return;
    }

    try {
      // Add to following
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        following: [...(currentUserData.following || []), friendId]
      });
      
      // Add to friend's followers
      const friendData = users.find(u => u.id === friendId);
      await updateDoc(doc(db, "users", friendId), {
        followers: [...(friendData.followers || []), auth.currentUser.uid]
      });
      
      alert("Bud added successfully!");
    } catch (err) {
      console.error("Error adding bud:", err);
      alert("Failed to add bud");
    }
  };

  const handleUnfollow = async (friendId) => {
    if (!currentUserData) return;

    try {
      // Remove from following
      const updatedFollowing = (currentUserData.following || []).filter(id => id !== friendId);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        following: updatedFollowing
      });
      
      // Remove from friend's followers
      const friendData = users.find(u => u.id === friendId);
      const updatedFollowers = (friendData.followers || []).filter(id => id !== auth.currentUser.uid);
      await updateDoc(doc(db, "users", friendId), {
        followers: updatedFollowers
      });
      
      alert("Unfollowed successfully!");
    } catch (err) {
      console.error("Error unfollowing:", err);
      alert("Failed to unfollow");
    }
  };

  // Calculate similarity between two user profiles (comprehensive)
  const calculateSimilarity = (profile1, profile2) => {
    if (!profile1 || !profile2) return 0;
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Required flavors - Weight: 30%
    const requiredFlavors = ['savory', 'spiciness', 'sweetness'];
    let flavorDiff = 0;
    requiredFlavors.forEach(flavor => {
      const val1 = profile1.flavorProfile?.[flavor] || 0;
      const val2 = profile2.flavorProfile?.[flavor] || 0;
      flavorDiff += Math.abs(val1 - val2);
    });
    const flavorSimilarity = ((15 - flavorDiff) / 15) * 30;
    totalScore += flavorSimilarity;
    maxPossibleScore += 30;
    
    // Price range - Weight: 20%
    const priceDiff = Math.abs((profile1.priceRange || 3) - (profile2.priceRange || 3));
    const priceSimilarity = ((5 - priceDiff) / 5) * 20;
    totalScore += priceSimilarity;
    maxPossibleScore += 20;
    
    // Optional: Additional flavors - Weight: 15%
    if (profile1.flavorProfile && profile2.flavorProfile) {
      const optionalFlavors = ['bitter', 'sour', 'umami', 'rich', 'mild'];
      const hasFlavors1 = optionalFlavors.some(f => profile1.flavorProfile[f] !== undefined);
      const hasFlavors2 = optionalFlavors.some(f => profile2.flavorProfile[f] !== undefined);
      
      if (hasFlavors1 && hasFlavors2) {
        let extraFlavorDiff = 0;
        let count = 0;
        optionalFlavors.forEach(flavor => {
          if (profile1.flavorProfile[flavor] && profile2.flavorProfile[flavor]) {
            extraFlavorDiff += Math.abs(profile1.flavorProfile[flavor] - profile2.flavorProfile[flavor]);
            count++;
          }
        });
        if (count > 0) {
          const extraFlavorSim = ((count * 5 - extraFlavorDiff) / (count * 5)) * 15;
          totalScore += extraFlavorSim;
          maxPossibleScore += 15;
        }
      }
    }
    
    // Optional: Textures - Weight: 10%
    if (profile1.textureProfile && profile2.textureProfile) {
      const textures = ['crunchy', 'creamy', 'chewy', 'soft', 'crispy'];
      let textureDiff = 0;
      let count = 0;
      textures.forEach(texture => {
        if (profile1.textureProfile[texture] && profile2.textureProfile[texture]) {
          textureDiff += Math.abs(profile1.textureProfile[texture] - profile2.textureProfile[texture]);
          count++;
        }
      });
      if (count > 0) {
        const textureSim = ((count * 5 - textureDiff) / (count * 5)) * 10;
        totalScore += textureSim;
        maxPossibleScore += 10;
      }
    }
    
    // Optional: Cuisines - Weight: 15%
    if (profile1.cuisinePreferences?.length > 0 && profile2.cuisinePreferences?.length > 0) {
      const common = profile1.cuisinePreferences.filter(c => 
        profile2.cuisinePreferences.includes(c)
      ).length;
      const total = new Set([...profile1.cuisinePreferences, ...profile2.cuisinePreferences]).size;
      const cuisineSim = (common / total) * 15;
      totalScore += cuisineSim;
      maxPossibleScore += 15;
    }
    
    // Optional: Environment - Weight: 10%
    if (profile1.environmentPreferences && profile2.environmentPreferences) {
      const environments = ['casual', 'formal', 'outdoor', 'cozy', 'lively', 'quiet'];
      let envDiff = 0;
      let count = 0;
      environments.forEach(env => {
        if (profile1.environmentPreferences[env] && profile2.environmentPreferences[env]) {
          envDiff += Math.abs(profile1.environmentPreferences[env] - profile2.environmentPreferences[env]);
          count++;
        }
      });
      if (count > 0) {
        const envSim = ((count * 5 - envDiff) / (count * 5)) * 10;
        totalScore += envSim;
        maxPossibleScore += 10;
      }
    }
    
    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} style={{ color: i < rating ? "#ffc107" : "#e4e5e9" }}>★</span>
    ));
  };

  // Filter out current user from the list
  const otherUsers = users.filter(u => auth.currentUser && u.id !== auth.currentUser.uid);
  
  // Users you're following with similarity scores
  const followingUsers = users
    .filter(u => currentUserData?.following?.includes(u.id))
    .map(u => ({
      ...u,
      similarity: calculateSimilarity(currentUserData, u)
    }));

  // Sort following users based on selected sort method
  const sortedFollowingUsers = [...followingUsers].sort((a, b) => {
    if (sortBy === "similarity") {
      return b.similarity - a.similarity; // Highest similarity first
    }
    return 0; // Keep original order for now (will sort reviews separately)
  });

  // Sort all reviews for the feed
  const getAllReviewsSorted = () => {
    const allReviews = [];
    
    followingUsers.forEach(friend => {
      const reviews = friendReviews[friend.id] || [];
      reviews.forEach(review => {
        allReviews.push({
          ...review,
          friendEmail: friend.email,
          friendSimilarity: friend.similarity
        });
      });
    });

    // Sort based on selection
    if (sortBy === "similarity") {
      return allReviews.sort((a, b) => b.friendSimilarity - a.friendSimilarity);
    } else if (sortBy === "highest") {
      return allReviews.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      return allReviews.sort((a, b) => a.rating - b.rating);
    }
    
    return allReviews;
  };

  const sortedReviews = getAllReviewsSorted();

  // Show loading or login message
  if (!auth.currentUser) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3>Please log in to see your buds</h3>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>
      <div style={{ flex: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Friends Feed</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontWeight: "bold" }}>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                cursor: "pointer"
              }}
            >
              <option value="similarity">Similar to Me</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
        </div>

        {loading && <p>Loading reviews...</p>}
        
        {!loading && followingUsers.length === 0 && (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            You're not following anyone yet. Add some buds to see their reviews!
          </p>
        )}

        {!loading && sortedFollowingUsers.map(friend => (
          <div key={friend.id} style={{ marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h5 
                style={{ cursor: "pointer", color: "#0d6efd", margin: 0 }}
                onClick={() => navigate(`/bud-profile/${friend.id}`)}
                onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.target.style.textDecoration = "none"}
              >
                {friend.email}'s Reviews
              </h5>
              <button
                onClick={() => handleUnfollow(friend.id)}
                style={{
                  padding: "5px 15px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Unfollow
              </button>
            </div>
            {friendReviews[friend.id] && friendReviews[friend.id].length > 0 ? (
              friendReviews[friend.id].map((review, i) => (
                <div key={i} style={{ 
                  border: "1px solid #ddd", 
                  padding: "15px", 
                  marginBottom: "10px",
                  borderRadius: "5px",
                  backgroundColor: "#f9f9f9"
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    {review.restaurantName}
                  </div>
                  <div style={{ marginBottom: "5px" }}>
                    {renderStars(review.rating)}
                  </div>
                  <p style={{ margin: "10px 0" }}>{review.text}</p>
                  <small style={{ color: "#666" }}>
                    {review.timestamp ? new Date(
                      review.timestamp.seconds ? review.timestamp.seconds * 1000 : review.timestamp
                    ).toLocaleDateString() : ""}
                  </small>
                </div>
              ))
            ) : (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                {friend.email} hasn't posted any reviews yet.
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div style={{ flex: 1, borderLeft: "1px solid #ddd", paddingLeft: "20px" }}>
        <h3>All Users</h3>
        {otherUsers.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No other users yet.</p>
        ) : (
          otherUsers.map(u => {
            const similarity = calculateSimilarity(currentUserData, u);
            return (
              <div key={u.id} style={{ 
                padding: "10px",
                borderBottom: "1px solid #eee",
                marginBottom: "5px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "500" }}>{u.email}</div>
                    {u.flavorProfile && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "3px" }}>
                        {similarity.toFixed(0)}% taste match
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleFollow(u.id)}
                    disabled={currentUserData?.following?.includes(u.id)}
                    style={{
                      padding: "5px 15px",
                      backgroundColor: currentUserData?.following?.includes(u.id) ? "#6c757d" : "#0d6efd",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: currentUserData?.following?.includes(u.id) ? "not-allowed" : "pointer",
                      fontSize: "14px"
                    }}
                  >
                    {currentUserData?.following?.includes(u.id) ? "Following" : "Add Bud"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}