import React from "react";
import { Card } from "react-bootstrap";

export default function ReviewCard({ review }) {
  return (
    <Card style={{ marginBottom: "10px" }}>
      <Card.Body>
        <Card.Title style={{ fontSize: "1rem" }}>{review.user}</Card.Title>
        <Card.Text>{review.text}</Card.Text>
      </Card.Body>
    </Card>
  );
}