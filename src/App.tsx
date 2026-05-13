import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Landing from "./topics/Landing";
import Harvest from "./topics/Harvest";
import Communities from "./topics/Communities";
import Markets from "./topics/Markets";
import Management from "./topics/Management";
import Bycatch from "./topics/Bycatch";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/topics/landing" replace /> },
      { path: "topics/landing",     element: <Landing /> },
      { path: "topics/harvest",     element: <Harvest /> },
      { path: "topics/communities", element: <Communities /> },
      { path: "topics/markets",     element: <Markets /> },
      { path: "topics/management",  element: <Management /> },
      { path: "topics/bycatch",     element: <Bycatch /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
