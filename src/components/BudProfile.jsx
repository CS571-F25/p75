import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Container, Card, Button } from "react-bootstrap";
import ReviewCard from "./ReviewCard";

export default function BudProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() });
        } else {
          alert("User not found");
          navigate("/mainfeed");
          return;
        }

        // Fetch all user's reviews from all restaurants
        const restaurantsSnap = await getDocs(collection(db, "restaurants"));
        const allReviews = [];

        for (const restaurantDoc of restaurantsSnap.docs) {
          const reviewsSnap = await getDocs(
            collection(db, "restaurants", restaurantDoc.id, "reviews")
          );

          reviewsSnap.docs.forEach(reviewDoc => {
            const reviewData = reviewDoc.data();
            if (reviewData.userId === userId) {
              allReviews.push({
                id: reviewDoc.id,
                restaurantId: restaurantDoc.id,
                restaurantName: restaurantDoc.data().name,
                ...reviewData
              });
            }
          });
        }

        // Sort reviews by timestamp (newest first)
        allReviews.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });

        setUserReviews(allReviews);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        alert("Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, navigate]);

  const renderStars = (rating) => {
    return (
      <div aria-label={`Rating: ${rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <span key={i} style={{ color: i < rating ? "#ffc107" : "#e4e5e9", fontSize: "20px" }} aria-hidden="true">★</span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Container style={{ marginTop: "100px", textAlign: "center" }}>
        <h3>Loading profile...</h3>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container style={{ marginTop: "100px", textAlign: "center" }}>
        <h3>User not found</h3>
        <Button onClick={() => navigate("/mainfeed")}>Back to Main Feed</Button>
      </Container>
    );
  }

  const flavorProfile = userData.flavorProfile || {};
  const textureProfile = userData.textureProfile || {};
  const aromaProfile = userData.aromaProfile || {};
  const cuisinePreferences = userData.cuisinePreferences || [];
  const environmentPreferences = userData.environmentPreferences || {};
  const priceRange = userData.priceRange || 3;
  
  const averageRating = userReviews.length > 0
    ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
    : "N/A";
  
  const renderPreferenceBar = (label, value, color = "#0d6efd") => (
    <div style={{ marginBottom: "15px" }}>
      <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px", fontSize: "14px" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ 
          flex: 1, 
          height: "20px", 
          backgroundColor: "#e0e0e0", 
          borderRadius: "10px",
          overflow: "hidden"
        }}>
          <div style={{ 
            width: `${(value || 0) * 20}%`, 
            height: "100%", 
            backgroundColor: color 
          }}></div>
        </div>
        <span style={{ fontWeight: "bold", minWidth: "20px", fontSize: "14px" }}>
          {value || 0}
        </span>
      </div>
    </div>
  );

  return (
    <Container style={{ marginTop: "100px", maxWidth: "900px" }}>
      <Button 
        variant="outline-secondary" 
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px" }}
      >
        ← Back
      </Button>

      {/* User Info Card */}
      <Card style={{ marginBottom: "30px" }}>
        <Card.Body>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <h2>{userData.email}</h2>
              <div style={{ display: "flex", gap: "30px", marginTop: "15px" }}>
                <div>
                  <strong>Total Likes:</strong> {userData.totalLikes || 0}
                </div>
                <div>
                  <strong>Reviews:</strong> {userReviews.length}
                </div>
                <div>
                  <strong>Followers:</strong> {userData.followers?.length || 0}
                </div>
                <div>
                  <strong>Following:</strong> {userData.following?.length || 0}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", fontWeight: "bold", color: "#0d6efd" }}>
                {averageRating}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>Avg Rating</div>
            </div>
          </div>

          {/* Taste Preferences */}
          <hr />
          <h4>Taste Preferences</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "15px" }}>
            {renderPreferenceBar("Savory", flavorProfile.savory, "#0d6efd")}
            {renderPreferenceBar("Spiciness", flavorProfile.spiciness, "#dc3545")}
            {renderPreferenceBar("Sweetness", flavorProfile.sweetness, "#ffc107")}
            {renderPreferenceBar("Price Range ($-$$$)", priceRange, "#28a745")}
            {flavorProfile.bitter && renderPreferenceBar("Bitter", flavorProfile.bitter, "#6c757d")}
            {flavorProfile.sour && renderPreferenceBar("Sour", flavorProfile.sour, "#20c997")}
            {flavorProfile.umami && renderPreferenceBar("Umami", flavorProfile.umami, "#fd7e14")}
            {flavorProfile.rich && renderPreferenceBar("Rich", flavorProfile.rich, "#6f42c1")}
            {flavorProfile.mild && renderPreferenceBar("Mild", flavorProfile.mild, "#17a2b8")}
          </div>

          {/* Texture Profile */}
          {textureProfile && Object.keys(textureProfile).length > 0 && (
            <>
              <hr />
              <h4>Texture Preferences</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "15px" }}>
                {textureProfile.crunchy && renderPreferenceBar("Crunchy", textureProfile.crunchy, "#ff6b6b")}
                {textureProfile.creamy && renderPreferenceBar("Creamy", textureProfile.creamy, "#f9ca24")}
                {textureProfile.chewy && renderPreferenceBar("Chewy", textureProfile.chewy, "#6c5ce7")}
                {textureProfile.soft && renderPreferenceBar("Soft", textureProfile.soft, "#a29bfe")}
                {textureProfile.crispy && renderPreferenceBar("Crispy", textureProfile.crispy, "#fd79a8")}
              </div>
            </>
          )}

          {/* Aroma Profile */}
          {aromaProfile && Object.keys(aromaProfile).length > 0 && (
            <>
              <hr />
              <h4>Aroma Preferences</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "15px" }}>
                {aromaProfile.fragrant && renderPreferenceBar("Fragrant", aromaProfile.fragrant, "#00b894")}
                {aromaProfile.mild && renderPreferenceBar("Mild", aromaProfile.mild, "#74b9ff")}
                {aromaProfile.strong && renderPreferenceBar("Strong", aromaProfile.strong, "#e17055")}
                {aromaProfile.earthy && renderPreferenceBar("Earthy", aromaProfile.earthy, "#d63031")}
                {aromaProfile.fresh && renderPreferenceBar("Fresh", aromaProfile.fresh, "#55efc4")}
              </div>
            </>
          )}

          {/* Cuisine Preferences */}
          {cuisinePreferences.length > 0 && (
            <>
              <hr />
              <h4>Favorite Cuisines</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "15px" }}>
                {cuisinePreferences.map(cuisine => (
                  <span key={cuisine} style={{
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    padding: "6px 12px",
                    borderRadius: "15px",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}>
                    {cuisine}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Environment Preferences */}
          {environmentPreferences && Object.keys(environmentPreferences).length > 0 && (
            <>
              <hr />
              <h4>Dining Environment</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "15px" }}>
                {environmentPreferences.casual && renderPreferenceBar("Casual", environmentPreferences.casual, "#0984e3")}
                {environmentPreferences.formal && renderPreferenceBar("Formal", environmentPreferences.formal, "#2d3436")}
                {environmentPreferences.outdoor && renderPreferenceBar("Outdoor", environmentPreferences.outdoor, "#00b894")}
                {environmentPreferences.cozy && renderPreferenceBar("Cozy", environmentPreferences.cozy, "#fdcb6e")}
                {environmentPreferences.lively && renderPreferenceBar("Lively", environmentPreferences.lively, "#e17055")}
                {environmentPreferences.quiet && renderPreferenceBar("Quiet", environmentPreferences.quiet, "#6c5ce7")}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Reviews Section */}
      <h2 style={{ marginBottom: "20px" }}>Reviews ({userReviews.length})</h2>
      {userReviews.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: "center", color: "#666" }}>
            <p>This user hasn't posted any reviews yet.</p>
          </Card.Body>
        </Card>
      ) : (
        userReviews.map(review => (
          <div key={review.id} style={{ marginBottom: "15px" }}>
            <Card>
              <Card.Body>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "start",
                  marginBottom: "10px"
                }}>
                  <div>
                    <h3 style={{ marginBottom: "5px", fontSize: "1.25rem" }}>{review.restaurantName}</h3>
                    <div>{renderStars(review.rating)}</div>
                  </div>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    {review.timestamp ? new Date(
                      review.timestamp.seconds * 1000
                    ).toLocaleDateString() : ""}
                  </div>
                </div>
                <p style={{ margin: "10px 0" }}>{review.text}</p>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  ❤️ {review.likes?.length || 0} {review.likes?.length === 1 ? "like" : "likes"}
                </div>
              </Card.Body>
            </Card>
          </div>
        ))
      )}
    </Container>
  );
}