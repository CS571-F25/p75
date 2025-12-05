import React from "react";
import { Card, Button } from "react-bootstrap";

export default function RestaurantCard({ restaurant, onClick }) {
  return (
    <Card
      style={{ width: "50rem", margin: "10px", cursor: "pointer" }}
      onClick={() => onClick(restaurant)}
    >
      <Card.Img variant="top" src={restaurant.image} />
      <Card.Body>
        <Card.Title>{restaurant.name}</Card.Title>
        <Card.Text>{restaurant.location}</Card.Text>
        <Button
          onClick={(e) => {
            e.stopPropagation(); // prevent the outer onClick from firing twice
            onClick(restaurant);
          }}
        >
          See Reviews
        </Button>
      </Card.Body>
    </Card>
  );
}
