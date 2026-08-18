import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";

// One page is one file in src/pages/. Adding a page means adding a file and
// a Route here — never inlining a page component.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
