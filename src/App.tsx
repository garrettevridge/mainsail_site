import { Routes, Route } from "react-router-dom";
import Shell from "./seamark/Whitepaper";
import Spine from "./seamark/Spine";
import TopicView from "./seamark/TopicView";
import { TOPICS } from "./seamark/topics";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Spine />} />
        {TOPICS.map((t) => (
          <Route key={t.slug} path={t.slug} element={<TopicView topic={t} />} />
        ))}
        <Route path="*" element={<Spine />} />
      </Route>
    </Routes>
  );
}
