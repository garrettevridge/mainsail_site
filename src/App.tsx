import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import StoryChinook from "./pages/StoryChinook";
import StoryHalibut from "./pages/StoryHalibut";
import StoryDiscards from "./pages/StoryDiscards";
import StoryObserver from "./pages/StoryObserver";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: "stories/chinook",  element: <StoryChinook /> },
        { path: "stories/halibut",  element: <StoryHalibut /> },
        { path: "stories/discards", element: <StoryDiscards /> },
        { path: "stories/observer", element: <StoryObserver /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

export default function App() {
  return <RouterProvider router={router} />;
}
