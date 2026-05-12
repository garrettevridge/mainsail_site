import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Communities from "./pages/Communities";
import Harvest from "./pages/Harvest";
import Markets from "./pages/Markets";
import Management from "./pages/Management";
import Bycatch from "./pages/Bycatch";
import Biomass from "./topics/Biomass";
import Observer from "./topics/Observer";
import Halibut from "./topics/Halibut";
import Chinook from "./topics/Chinook";
import Chum from "./topics/Chum";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: "communities", element: <Communities /> },
      { path: "harvest",     element: <Harvest /> },
      { path: "markets",     element: <Markets /> },
      { path: "management",  element: <Management /> },
      { path: "bycatch",     element: <Bycatch /> },
      { path: "topics/biomass",  element: <Biomass /> },
      { path: "topics/observer", element: <Observer /> },
      { path: "topics/halibut",  element: <Halibut /> },
      { path: "topics/chinook",  element: <Chinook /> },
      { path: "topics/chum",     element: <Chum /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
