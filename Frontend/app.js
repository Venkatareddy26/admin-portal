import { Routes, Route } from "react-router-dom";
import TripsPage from "./pages/TripsPage"; // adjust path if needed

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/admin/trips" element={<TripsPage />} />
      {/* add other admin routes here */}
    </Routes>
  );
}

export default App;
