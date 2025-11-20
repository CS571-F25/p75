import React from "react";
import RestaurantList from "./RestaurantList";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from "react-router-dom";

export default function MainFeed (props) {
    return ( <div>
        <Navbar expand="lg" fixed='top' className="bg-body-tertiary">
        <Container fluid>
            <Navbar.Brand as={Link} to="/mainfeed">TasteBuds</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Link as={Link} to="/mainfeed">Main Feed</Nav.Link>
                <Nav.Link >Buds</Nav.Link>
                <Nav.Link>Profile</Nav.Link>
                <Nav.Link as={Link} to="/">Logout</Nav.Link>
            </Nav>
            </Navbar.Collapse>
        </Container>
    </Navbar>
        <RestaurantList />
        </div>
    );
}