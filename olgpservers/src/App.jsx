import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/home";
import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

function App() {
  return;

  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      {/*Home*/}
      <Route path="/" element={<Home />} />
      {/*Register*/}
      <Route path="/" element={<Register />} />
      {/*Login*/}
      <Route path="/" element={<Login />} />
      {/*Dashboard*/}
    </Routes>
  </BrowserRouter>;
}

export default App;
