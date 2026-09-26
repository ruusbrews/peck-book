import { Navigate, Route, Routes } from 'react-router-dom';
import AgentDemo from './AgentDemo';
import ScanFlow from './ScanFlow';

// Keep the separate admin reasoning demo reachable at /admin while the new worker-facing
// scan flow is the default entry point at the root path.
function App() {
  return (
    <Routes>
      <Route path="/" element={<ScanFlow />} />
      <Route path="/scan" element={<ScanFlow />} />
      <Route path="/admin" element={<AgentDemo />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
