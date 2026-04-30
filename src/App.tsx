import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import FisheriesManagement from "./topics/FisheriesManagement";
import Biomass from "./topics/Biomass";
import Observer from "./topics/Observer";
import Halibut from "./topics/Halibut";
import Chinook from "./topics/Chinook";
import Chum from "./topics/Chum";
import Discards from "./topics/Discards";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/topics/fisheries-management" replace /> },
      { path: "topics/fisheries-management", element: <FisheriesManagement /> },
      { path: "topics/biomass",              element: <Biomass /> },
      { path: "topics/observer",             element: <Observer /> },
      { path: "topics/halibut",              element: <Halibut /> },
      { path: "topics/chinook",              element: <Chinook /> },
      { path: "topics/chum",                 element: <Chum /> },
      { path: "topics/discards",             element: <Discards /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
