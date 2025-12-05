import React, { useState, useEffect } from "react";
import { Row, Col, Modal, Button, Form, Container } from "react-bootstrap";
import RestaurantCard from "./RestaurantCard";
import ReviewCard from "./ReviewCard";
import { collection, getDocs, addDoc, Timestamp, doc, getDoc, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function RestaurantList({ city }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", location: "", image: "" });
  const [newReview, setNewReview] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [sortBy, setSortBy] = useState("similarity");
  const [allUsers, setAllUsers] = useState({});

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setCurrentUserData(userDoc.data());
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch restaurants for the selected city
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Fetch all users to get their flavor profiles
        const usersSnap = await getDocs(collection(db, "users"));
        const usersMap = {};
        usersSnap.docs.forEach(userDoc => {
          usersMap[userDoc.id] = userDoc.data();
        });
        setAllUsers(usersMap);

        // Query restaurants by city
        const q = query(collection(db, "restaurants"), where("city", "==", city));
        const snap = await getDocs(q);

        const data = await Promise.all(
          snap.docs.map(async (docSnap) => {
            // Fetch reviews subcollection for each restaurant
            const reviewsSnap = await getDocs(
              collection(db, "restaurants", docSnap.id, "reviews")
            );
            const reviews = reviewsSnap.docs.map(revDoc => ({
              id: revDoc.id,
              restaurantId: docSnap.id, // Add restaurantId for likes to work
              ...revDoc.data()
            }));
            
            return {
              id: docSnap.id,
              ...docSnap.data(),
              reviews: reviews
            };
          })
        );
        setRestaurants(data);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
      }
    };
    
    if (city) {
      fetchRestaurants();
    }
  }, [city]);

  const handleClose = () => {
    setSelectedRestaurant(null);
    setNewReview("");
    setNewReviewRating(5);
  };

  const handleAddClose = () => setShowAddModal(false);

  const handleAddRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.location) {
      alert("Please fill in name and location");
      return;
    }
    
    // Add restaurant with city field
    const docRef = await addDoc(collection(db, "restaurants"), { 
      ...newRestaurant,
      city: city
    });
    
    const addedRestaurant = { id: docRef.id, ...newRestaurant, city: city, reviews: [] };
    setRestaurants([...restaurants, addedRestaurant]);
    setNewRestaurant({ name: "", location: "", image: "" });
    setShowAddModal(false);

    // Immediately open modal for adding review
    setSelectedRestaurant(addedRestaurant);
  };

  const handleAddReview = async () => {
    if (!auth.currentUser) {
      alert("Please log in to add a review.");
      return;
    }
    if (!newReview.trim()) {
      alert("Please enter a review.");
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        text: newReview.trim(),
        rating: Number(newReviewRating),
        timestamp: Timestamp.now(),
        likes: [] // Initialize likes array
      };

      console.log("Submitting review:", reviewData);

      const reviewRef = collection(db, "restaurants", selectedRestaurant.id, "reviews");
      const newReviewDoc = await addDoc(reviewRef, reviewData);

      const reviewWithId = { 
        id: newReviewDoc.id, 
        restaurantId: selectedRestaurant.id, 
        ...reviewData 
      };
      
      // Update local state
      setRestaurants(prev => prev.map(r => {
        if (r.id === selectedRestaurant.id) {
          return { ...r, reviews: [...(r.reviews || []), reviewWithId] };
        }
        return r;
      }));

      setSelectedRestaurant(prev => ({
        ...prev,
        reviews: [...(prev.reviews || []), reviewWithId]
      }));

      setNewReview("");
      setNewReviewRating(5);
      alert("Review added successfully!");
    } catch (err) {
      console.error("Error adding review:", err);
      alert("Error adding review: " + err.message);
    } finally {
      setLoading(false);
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
    const flavorSimilarity = ((15 - flavorDiff) / 15) * 30; // Max diff is 15 (3 flavors * 5)
    totalScore += flavorSimilarity;
    maxPossibleScore += 30;
    
    // Price range - Weight: 20%
    const priceDiff = Math.abs((profile1.priceRange || 3) - (profile2.priceRange || 3));
    const priceSimilarity = ((5 - priceDiff) / 5) * 20;
    totalScore += priceSimilarity;
    maxPossibleScore += 20;
    
    // Optional: Additional flavors - Weight: 15% (if both have it)
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
    
    // Optional: Textures - Weight: 10% (if both have it)
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
    
    // Optional: Cuisines - Weight: 15% (if both have it)
    if (profile1.cuisinePreferences?.length > 0 && profile2.cuisinePreferences?.length > 0) {
      const common = profile1.cuisinePreferences.filter(c => 
        profile2.cuisinePreferences.includes(c)
      ).length;
      const total = new Set([...profile1.cuisinePreferences, ...profile2.cuisinePreferences]).size;
      const cuisineSim = (common / total) * 15;
      totalScore += cuisineSim;
      maxPossibleScore += 15;
    }
    
    // Optional: Environment - Weight: 10% (if both have it)
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
    
    // Calculate percentage based on available comparison points
    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  };

  // Sort reviews based on selected method
  const getSortedReviews = (reviews) => {
    if (!reviews || reviews.length === 0) return [];

    const reviewsWithSimilarity = reviews.map(review => {
      const reviewerData = allUsers[review.userId];
      const similarity = calculateSimilarity(currentUserData, reviewerData);
      return {
        ...review,
        similarity
      };
    });

    // Debug: Check if restaurantId exists
    if (reviewsWithSimilarity.length > 0) {
      console.log("Sample review with data:", reviewsWithSimilarity[0]);
    }

    if (sortBy === "similarity") {
      return reviewsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    } else if (sortBy === "highest") {
      return reviewsWithSimilarity.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      return reviewsWithSimilarity.sort((a, b) => a.rating - b.rating);
    }

    return reviewsWithSimilarity;
  };

  const sortedReviews = selectedRestaurant ? getSortedReviews(
    selectedRestaurant.reviews.map(r => ({ ...r, restaurantId: selectedRestaurant.id }))
  ) : [];

  return (
    <div>
      {/* Button to add a new restaurant */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <Button onClick={() => setShowAddModal(true)}>Add New Restaurant</Button>
      </div>

      <Container>
        <Col>
          {restaurants.length === 0 ? (
            <Row>
              <p style={{ textAlign: "center", color: "#666", fontSize: "18px", marginTop: "40px" }}>
                No restaurants in {city} yet. Be the first to add one!
              </p>
            </Row>
          ) : (
            restaurants.map((r) => (
              <Row key={r.id} md={4} className="mb-3">
                <RestaurantCard restaurant={r} onClick={setSelectedRestaurant} />
              </Row>
            ))
          )}
        </Col>
      </Container>

      {/* Modal: View & add reviews */}
      <Modal
        show={selectedRestaurant !== null}
        onHide={handleClose}
        size="fullscreen"
        centered
      >
        {selectedRestaurant && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedRestaurant.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>{selectedRestaurant.location}</p>
              <img
                src={selectedRestaurant.image || "https://via.placeholder.com/150"}
                alt={selectedRestaurant.name}
                style={{ width: "100%", maxHeight: "400px", objectFit: "cover", marginBottom: "20px" }}
              />
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3>Reviews ({sortedReviews.length})</h3>
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

              {sortedReviews.length > 0 ? (
                sortedReviews.map((review) => (
                  <div key={review.id} style={{ marginBottom: "10px" }}>
                    <ReviewCard review={review} />
                    {sortBy === "similarity" && review.similarity > 0 && (
                      <div style={{ 
                        fontSize: "12px", 
                        color: "#1976d2",
                        backgroundColor: "#e3f2fd",
                        padding: "4px 8px",
                        borderRadius: "3px",
                        display: "inline-block",
                        marginTop: "-5px",
                        marginLeft: "15px",
                        marginBottom: "5px"
                      }}>
                        {review.similarity.toFixed(0)}% taste match
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No reviews yet. Be the first to review!</p>
              )}

              <hr />
              <h4>Add Your Review</h4>

              {/* RATING BUTTONS */}
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
                  Rating: {newReviewRating} ★
                </label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setNewReviewRating(n)}
                      style={{
                        padding: "10px 20px",
                        fontSize: "18px",
                        backgroundColor: newReviewRating === n ? "#0d6efd" : "#fff",
                        color: newReviewRating === n ? "#fff" : "#000",
                        border: "2px solid #0d6efd",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {n} ★
                    </button>
                  ))}
                </div>
              </div>

              <Form style={{ marginTop: "20px" }}>
                <Form.Group>
                  <Form.Label style={{ fontWeight: "bold" }}>Your Review:</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={4}
                    value={newReview} 
                    onChange={(e) => setNewReview(e.target.value)} 
                    placeholder="Write your review..."
                  />
                </Form.Group>
                <Button 
                  style={{ marginTop: "10px" }} 
                  onClick={handleAddReview}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </Button>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Modal: Add new restaurant */}
      <Modal show={showAddModal} onHide={handleAddClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Restaurant to {city}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group style={{ marginBottom: "15px" }}>
              <Form.Label>Name</Form.Label>
              <Form.Control 
                value={newRestaurant.name} 
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group style={{ marginBottom: "15px" }}>
              <Form.Label>Location</Form.Label>
              <Form.Control 
                value={newRestaurant.location} 
                onChange={(e) => setNewRestaurant({ ...newRestaurant, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group style={{ marginBottom: "15px" }}>
              <Form.Label>Image URL (optional)</Form.Label>
              <Form.Control 
                value={newRestaurant.image} 
                onChange={(e) => setNewRestaurant({ ...newRestaurant, image: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleAddClose}>Cancel</Button>
          <Button variant="primary" onClick={handleAddRestaurant}>Add Restaurant</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}