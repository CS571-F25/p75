import React, { useState } from "react";
import { Row, Col, Modal, Button } from "react-bootstrap";
import RestaurantCard from "./RestaurantCard";
import ReviewCard from "./ReviewCard";

const restaurants = [
  {
    id: "r1",
    name: "Pizza Palace",
    location: "123 Main St",
    image: "https://via.placeholder.com/150",
    reviews: [
      { user: "Alice", text: "Amazing pizza!" },
      { user: "Bob", text: "Great crust." },
    ],
  },
  {
    id: "r2",
    name: "Sushi World",
    location: "456 Elm St",
    image: "https://via.placeholder.com/150",
    reviews: [
      { user: "Charlie", text: "Fresh sushi!" },
      { user: "Dana", text: "Delicious rolls." },
    ],
  },
];

export default function RestaurantList() {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const handleClose = () => setSelectedRestaurant(null);

  return (
    <>
      <Col>
        {restaurants.map((r) => (
          <Row key={r.id} md={4}>
            <RestaurantCard restaurant={r} onClick={setSelectedRestaurant} />
          </Row>
        ))}
      </Col>

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
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                  marginBottom: "20px",
                }}
              />
              <h3>Reviews</h3>
              {selectedRestaurant.reviews.map((review, i) => (
                <ReviewCard key={i} review={review} />
                ))}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}