import { useState } from 'react'
import {BrowserRouter, Routes, Route, Outlet} from "react-router-dom"
import Navbar from './components/Navbar'
import './App.css'
import Latesttweets from './pages/Latesttweets'
import Market from './pages/Market'

function App() {
  return(
    <div >
      <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Latesttweets />} />
        <Route path="/market" element={<Market />} />
      </Routes>
      </BrowserRouter>
    </div>
  )  
}

export default App
