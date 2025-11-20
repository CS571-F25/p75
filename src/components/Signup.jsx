import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Signup (props) {
    const navigate = useNavigate();
    const attributes = ["spiciness", "savory", "sweetness"];
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [answers, setAnswers] = useState({
    spiciness: 5,
    savory: 5,
    sweetness: 5,
    });

    const handleChange = (attr, val) => {
    setAnswers(prev => ({ ...prev, [attr]: +val }));
    };

    const handleSubmit = () => {
    if (!username || !password) {
        alert("Please enter both username and password.");
        return;
    }

    const dataToSave = {
        username,
        password,
        flavorProfile: answers,
    };

    console.log("Save this data:", dataToSave);
    navigate("/mainfeed");
    };

    return (
    <Form>
        <h3>Flavor Profile</h3>
        {attributes.map(attr => (
        <div key={attr} style={{ marginBottom: "20px" }}>
            <Form.Label style={{ textTransform: "capitalize" }}>
            {attr}: {answers[attr]}
            </Form.Label>
            <Form.Range
            min={1}
            max={10}
            value={answers[attr]}
            onChange={e => handleChange(attr, e.target.value)}
            />
        </div>
        ))}

        <h3>Create Account</h3>
        <Form.Group style={{ marginBottom: "15px" }}>
        <Form.Label>Username</Form.Label>
        <Form.Control value={username} onChange={e => setUsername(e.target.value)} />
        </Form.Group>

        <Form.Group style={{ marginBottom: "15px" }}>
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </Form.Group>

        <Button onClick={handleSubmit}>Save Profile & Create Account</Button>
    </Form>
    );
}