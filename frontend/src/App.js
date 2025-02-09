import TextEditor from "./TextEditor";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/documents" 
          element={<Navigate to={`/documents/${Math.random().toString(36).substring(2)}`} />} 
        />
        <Route path="/documents/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
