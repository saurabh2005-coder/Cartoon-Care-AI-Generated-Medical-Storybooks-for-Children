import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Generating from "./pages/Generating";
import Storybook from "./pages/Storybook";
import Library from "./pages/Library";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/generating/:storyId" element={<Generating />} />
        <Route path="/storybook/:storyId" element={<Storybook />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </BrowserRouter>
  );
}
