import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from "react-router-dom";

export default function Home (props) {
    return (
        <>
        <Navbar expand="lg" fixed='top' className="bg-body-tertiary">
        <Container fluid>
            <Navbar.Brand as={Link} to="/">TasteBuds</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/signup">Signup</Nav.Link>
            </Nav>
            </Navbar.Collapse>
        </Container>
    </Navbar>

    <h1>Welcome to TasteBuds!</h1>

    </>
    );
}