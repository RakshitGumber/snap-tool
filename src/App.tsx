import { Canvas } from "./Components/main/Canvas";
import { Navbar } from "./Components/main/Navbar";
import { Sidebar } from "./Components/main/Sidebar";

function App() {
  return (
    <div className="flex h-screen flex-col overflow-hidden transition-colors duration-300">
      <Navbar />
      <div className="flex h-full w-full flex-1 justify-between">
        <Sidebar />
        <Canvas />
      </div>
    </div>
  );
}

export default App;
