import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Container, Card, Button, Form, Accordion } from "react-bootstrap";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Required fields
  const [savory, setSavory] = useState(3);
  const [spiciness, setSpiciness] = useState(3);
  const [sweetness, setSweetness] = useState(3);
  const [priceRange, setPriceRange] = useState(3);
  
  // Optional - Additional Flavors
  const [bitter, setBitter] = useState(3);
  const [sour, setSour] = useState(3);
  const [umami, setUmami] = useState(3);
  const [rich, setRich] = useState(3);
  const [mild, setMild] = useState(3);
  
  // Optional - Textures
  const [crunchy, setCrunchy] = useState(3);
  const [creamy, setCreamy] = useState(3);
  const [chewy, setChewy] = useState(3);
  const [soft, setSoft] = useState(3);
  const [crispy, setCrispy] = useState(3);
  
  // Optional - Aromas
  const [fragrant, setFragrant] = useState(3);
  const [aromasMild, setAromasMild] = useState(3);
  const [strong, setStrong] = useState(3);
  const [earthy, setEarthy] = useState(3);
  const [fresh, setFresh] = useState(3);
  
  // Optional - Cuisines (checkboxes)
  const [cuisines, setCuisines] = useState([]);
  const availableCuisines = [
    "Italian", "Mexican", "Chinese", "Japanese", "Thai", "Indian", 
    "American", "Mediterranean", "French", "Korean", "Vietnamese", 
    "Seafood", "BBQ", "Vegetarian", "Vegan", "Fast Food", "Fine Dining"
  ];
  
  // Optional - Environments
  const [casual, setCasual] = useState(3);
  const [formal, setFormal] = useState(3);
  const [outdoor, setOutdoor] = useState(3);
  const [cozy, setCozy] = useState(3);
  const [lively, setLively] = useState(3);
  const [quiet, setQuiet] = useState(3);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        
        // Load required fields
        setSavory(data.flavorProfile?.savory || 3);
        setSpiciness(data.flavorProfile?.spiciness || 3);
        setSweetness(data.flavorProfile?.sweetness || 3);
        setPriceRange(data.priceRange || 3);
        
        // Load optional fields if they exist
        setBitter(data.flavorProfile?.bitter || 3);
        setSour(data.flavorProfile?.sour || 3);
        setUmami(data.flavorProfile?.umami || 3);
        setRich(data.flavorProfile?.rich || 3);
        setMild(data.flavorProfile?.mild || 3);
        
        setCrunchy(data.textureProfile?.crunchy || 3);
        setCreamy(data.textureProfile?.creamy || 3);
        setChewy(data.textureProfile?.chewy || 3);
        setSoft(data.textureProfile?.soft || 3);
        setCrispy(data.textureProfile?.crispy || 3);
        
        setFragrant(data.aromaProfile?.fragrant || 3);
        setAromasMild(data.aromaProfile?.mild || 3);
        setStrong(data.aromaProfile?.strong || 3);
        setEarthy(data.aromaProfile?.earthy || 3);
        setFresh(data.aromaProfile?.fresh || 3);
        
        setCuisines(data.cuisinePreferences || []);
        
        setCasual(data.environmentPreferences?.casual || 3);
        setFormal(data.environmentPreferences?.formal || 3);
        setOutdoor(data.environmentPreferences?.outdoor || 3);
        setCozy(data.environmentPreferences?.cozy || 3);
        setLively(data.environmentPreferences?.lively || 3);
        setQuiet(data.environmentPreferences?.quiet || 3);
      }
      setLoading(false);
    };
    
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const profileData = {
        email: auth.currentUser.email,
        // Required fields
        flavorProfile: {
          savory,
          spiciness,
          sweetness,
          // Optional flavors - only save if changed from default
          ...(bitter !== 3 && { bitter }),
          ...(sour !== 3 && { sour }),
          ...(umami !== 3 && { umami }),
          ...(rich !== 3 && { rich }),
          ...(mild !== 3 && { mild })
        },
        priceRange,
        // Optional profiles - only save if at least one value is not default
        ...(hasNonDefaultTextures() && {
          textureProfile: {
            crunchy, creamy, chewy, soft, crispy
          }
        }),
        ...(hasNonDefaultAromas() && {
          aromaProfile: {
            fragrant, mild: aromasMild, strong, earthy, fresh
          }
        }),
        ...(cuisines.length > 0 && { cuisinePreferences: cuisines }),
        ...(hasNonDefaultEnvironments() && {
          environmentPreferences: {
            casual, formal, outdoor, cozy, lively, quiet
          }
        })
      };
      
      await setDoc(doc(db, "users", auth.currentUser.uid), profileData, { merge: true });
      alert("Profile saved successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Error saving profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const hasNonDefaultTextures = () => {
    return crunchy !== 3 || creamy !== 3 || chewy !== 3 || soft !== 3 || crispy !== 3;
  };
  
  const hasNonDefaultAromas = () => {
    return fragrant !== 3 || aromasMild !== 3 || strong !== 3 || earthy !== 3 || fresh !== 3;
  };
  
  const hasNonDefaultEnvironments = () => {
    return casual !== 3 || formal !== 3 || outdoor !== 3 || cozy !== 3 || lively !== 3 || quiet !== 3;
  };

  const toggleCuisine = (cuisine) => {
    if (cuisines.includes(cuisine)) {
      setCuisines(cuisines.filter(c => c !== cuisine));
    } else {
      setCuisines([...cuisines, cuisine]);
    }
  };

  const renderSlider = (label, value, setter, required = false) => (
    <Form.Group style={{ marginBottom: "20px" }}>
      <Form.Label>
        <strong>{label}</strong> {required && <span style={{ color: "red" }}>*</span>}
      </Form.Label>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <Form.Range
          min="1"
          max="5"
          value={value}
          onChange={(e) => setter(Number(e.target.value))}
        />
        <span style={{ fontWeight: "bold", minWidth: "20px" }}>{value}</span>
      </div>
    </Form.Group>
  );

  if (loading) {
    return (
      <Container style={{ marginTop: "100px", textAlign: "center" }}>
        <h3>Loading profile...</h3>
      </Container>
    );
  }

  return (
    <Container style={{ marginTop: "100px", maxWidth: "800px" }}>
      <h2>My Profile</h2>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Fields marked with <span style={{ color: "red" }}>*</span> are required. 
        Optional fields help us find better matches for you!
      </p>

      <Card style={{ marginBottom: "20px" }}>
        <Card.Body>
          <h4>Required Preferences</h4>
          <hr />
          
          <h5>Basic Flavors</h5>
          {renderSlider("Savory", savory, setSavory, true)}
          {renderSlider("Spiciness", spiciness, setSpiciness, true)}
          {renderSlider("Sweetness", sweetness, setSweetness, true)}
          
          <hr />
          
          <h5>Price Range</h5>
          {renderSlider("Budget ($) to Luxury ($$$$$)", priceRange, setPriceRange, true)}
          <small style={{ color: "#666" }}>
            1 = Budget-friendly, 3 = Moderate, 5 = Fine dining/Luxury
          </small>
        </Card.Body>
      </Card>

      <Accordion style={{ marginBottom: "20px" }}>
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <strong>Optional: Additional Flavors</strong>
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "#666" }}>
              (Improve your matches!)
            </span>
          </Accordion.Header>
          <Accordion.Body>
            {renderSlider("Bitter", bitter, setBitter)}
            {renderSlider("Sour", sour, setSour)}
            {renderSlider("Umami", umami, setUmami)}
            {renderSlider("Rich", rich, setRich)}
            {renderSlider("Mild", mild, setMild)}
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>
            <strong>Optional: Texture Preferences</strong>
          </Accordion.Header>
          <Accordion.Body>
            {renderSlider("Crunchy", crunchy, setCrunchy)}
            {renderSlider("Creamy", creamy, setCreamy)}
            {renderSlider("Chewy", chewy, setChewy)}
            {renderSlider("Soft", soft, setSoft)}
            {renderSlider("Crispy", crispy, setCrispy)}
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="2">
          <Accordion.Header>
            <strong>Optional: Aroma Preferences</strong>
          </Accordion.Header>
          <Accordion.Body>
            {renderSlider("Fragrant", fragrant, setFragrant)}
            {renderSlider("Mild", aromasMild, setAromasMild)}
            {renderSlider("Strong", strong, setStrong)}
            {renderSlider("Earthy", earthy, setEarthy)}
            {renderSlider("Fresh", fresh, setFresh)}
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="3">
          <Accordion.Header>
            <strong>Optional: Cuisine Preferences</strong>
          </Accordion.Header>
          <Accordion.Body>
            <p style={{ marginBottom: "15px", color: "#666" }}>
              Select all cuisines you enjoy:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {availableCuisines.map(cuisine => (
                <Form.Check
                  key={cuisine}
                  type="checkbox"
                  label={cuisine}
                  checked={cuisines.includes(cuisine)}
                  onChange={() => toggleCuisine(cuisine)}
                />
              ))}
            </div>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="4">
          <Accordion.Header>
            <strong>Optional: Dining Environment</strong>
          </Accordion.Header>
          <Accordion.Body>
            {renderSlider("Casual", casual, setCasual)}
            {renderSlider("Formal", formal, setFormal)}
            {renderSlider("Outdoor", outdoor, setOutdoor)}
            {renderSlider("Cozy", cozy, setCozy)}
            {renderSlider("Lively/Energetic", lively, setLively)}
            {renderSlider("Quiet", quiet, setQuiet)}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </Container>
  );
}