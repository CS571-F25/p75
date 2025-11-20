import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Signup from './components/Signup'
import MainFeed from './components/MainFeed'
import { HashRouter, Route, Routes } from 'react-router'

function App() {
  return <HashRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/mainfeed" element={<MainFeed />} />
    </Routes>
  </HashRouter>
}

export default App
