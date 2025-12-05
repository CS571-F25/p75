import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import MainFeed from './components/MainFeed'
import Profile from './components/Profile'
import Buds from './components/Buds'
import Logout from './components/Logout'
import BudProfile from './components/BudProfile'
import { HashRouter, Route, Routes } from 'react-router'
import { useAuth } from "./AuthProvider";

function App() {
  return <HashRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/mainfeed" element={<MainFeed />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/buds" element={<Buds />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/bud-profile/:userId" element={<BudProfile />} />
    </Routes>
  </HashRouter>
}

export default App
