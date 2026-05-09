import RouterProvider from "./routes/RouterProvider";
import { ToastProvider } from "./routes/ToastProvider";
function App() {
  return (
    <ToastProvider>
    <RouterProvider /></ToastProvider>
  );
}

export default App;
