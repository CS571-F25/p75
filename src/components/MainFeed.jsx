import React, { useState } from "react";
import { Container, Nav, Navbar, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import RestaurantList from "./RestaurantList";

export default function MainFeed() {
  const [selectedCity, setSelectedCity] = useState("Madison");
  
  // You can add more cities here later
  const cities = ["Madison", "Milwaukee", "Chicago"];

  return (
    <div>
      {/* Navbar */}
      <Navbar expand="lg" fixed='top' className="bg-body-tertiary">
        <Container fluid>
          <Navbar.Brand as={Link} to="/mainfeed">TasteBuds</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/mainfeed">Main Feed</Nav.Link>
              <Nav.Link as={Link} to="/buds">Buds</Nav.Link>
              <Nav.Link as={Link} to="/profile">Profile</Nav.Link>
              <Nav.Link as={Link} to="/logout">Logout</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* City Selector */}
      <div style={{ marginTop: "80px", marginBottom: "20px", textAlign: "center" }}>
        <Form.Group style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <Form.Label style={{ fontWeight: "bold", fontSize: "18px", margin: 0 }}>
            Select City:
          </Form.Label>
          <Form.Select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: "200px" }}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </div>

      {/* Restaurant List for selected city */}
      <RestaurantList city={selectedCity} />
    </div>
  );
}