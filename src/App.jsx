import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import HelloWorld from './components/HelloWorld'
import { HashRouter, Route, Routes } from 'react-router'

function App() {
  return <HashRouter>
    <Routes>
      <Route path="/" element={<HelloWorld/>}></Route>
    </Routes>
  </HashRouter>
}

export default App
