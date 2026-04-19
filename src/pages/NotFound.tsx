import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="font-serif text-5xl font-semibold mb-4">Not found</h1>
      <p className="text-muted mb-6">That page isn't part of this site.</p>
      <Link to="/">Back to the stories</Link>
    </div>
  );
}
