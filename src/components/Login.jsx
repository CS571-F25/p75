import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/mainfeed");
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  return (
    <Form onSubmit={handleLogin}>
      <h3>Log In</h3>
      <Form.Group style={{ marginBottom: 15 }}>
        <Form.Label>Email</Form.Label>
        <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} />
      </Form.Group>
      <Form.Group style={{ marginBottom: 15 }}>
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Form.Group>
      <Button type="submit">Log In</Button>
    </Form>
  );
}
