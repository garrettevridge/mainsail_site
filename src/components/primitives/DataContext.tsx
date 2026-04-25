interface DataContextProps {
  use: string[];
  could: string[];
  ideas: string[];
}

export default function DataContext({ use, could, ideas }: DataContextProps) {
  return (
    <div className="data-ctx">
      <div className="data-ctx-col">
        <div className="data-ctx-head use">Data we use</div>
        <ul>
          {use.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="data-ctx-col">
        <div className="data-ctx-head could">Data we could use</div>
        <ul>
          {could.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="data-ctx-col">
        <div className="data-ctx-head ideas">Ideas</div>
        <ul>
          {ideas.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}
