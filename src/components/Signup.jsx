import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Signup() {
  const navigate = useNavigate();
  const attributes = ["spiciness", "savory", "sweetness"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [answers, setAnswers] = useState({ spiciness: 5, savory: 5, sweetness: 5 });

  const handleChange = (attr, val) => setAnswers(prev => ({ ...prev, [attr]: +val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Enter email and password");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        flavorProfile: answers,
        followers: [],
        following: []
      });

      navigate("/mainfeed");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h3>Flavor Profile</h3>
      {attributes.map(attr => (
        <div key={attr} style={{ marginBottom: 20 }}>
          <Form.Label>{attr}: {answers[attr]}</Form.Label>
          <Form.Range min={1} max={5} value={answers[attr]} onChange={e => handleChange(attr, e.target.value)} />
        </div>
      ))}

      <h3>Create Account</h3>
      <Form.Group style={{ marginBottom: 15 }}>
        <Form.Label>Email</Form.Label>
        <Form.Control value={email} onChange={e => setEmail(e.target.value)} />
      </Form.Group>
      <Form.Group style={{ marginBottom: 15 }}>
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} />
      </Form.Group>
      <Button type="submit">Save Profile & Create Account</Button>
    </Form>
  );
}
