import { Canvas } from "./Components/main/Canvas";
import { Navbar } from "./Components/main/Navbar";
import { Sidebar } from "./Components/main/Sidebar";

function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="h-full w-full flex justify-between">
        <Sidebar />
        <Canvas />
      </div>
    </div>
  );
}

export default App;
