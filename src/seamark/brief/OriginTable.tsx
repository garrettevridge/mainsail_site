import { k } from "./parts";

export interface OriginTableRow {
  region: string;
  fish: number;
  pct: number;
}

// Editorial context: 2-sentence description of each genetic reporting group,
// covering specific runs, commercial and subsistence activity. Keyed to the
// NOAA/NPFMC genetic stock ID reporting group names.
const NOTES: Record<string, string> = {
  "Kuskokwim/Bristol Bay":
    "The Kuskokwim and Bristol Bay drainages host Alaska's most extensive subsistence Chinook fisheries, with dozens of communities from Bethel to the headwaters depending on king salmon as a dietary staple. Directed commercial Chinook harvests on the Kuskokwim have been closed or severely restricted since 2020 as the run has fallen far below escapement goals.",
  "Yukon Alaska":
    "The Yukon supports subsistence Chinook harvests in more than 50 communities from the delta to the Canadian border; this genetic count combines U.S.- and Canadian-origin fish, as the stock crosses the international boundary before returning. Commercial directed Chinook fishing has been closed since 2021, and subsistence harvests have been sharply restricted as the run has failed to meet escapement goals for multiple consecutive years.",
  "Seward Peninsula/Norton Sound":
    "Norton Sound Chinook support subsistence fisheries in communities including Nome, Unalakleet, and Shaktoolik, with the Unalakleet River serving as one of three rivers in the federal abundance index that determines whether the BSAI bycatch cap drops to its lower 45,000-fish tier. Sport and small-scale commercial Chinook harvests also occur in the region, though subsistence is the dominant use.",
  "North Alaska Peninsula":
    "This group covers Chinook from river systems along the Pacific coast of the Alaska Peninsula, where directed commercial Chinook fisheries are small relative to the area's large sockeye runs. Subsistence Chinook harvests occur in communities such as Naknek, Egegik, and King Salmon, where king salmon hold cultural and dietary significance.",
  "Cook Inlet":
    "Cook Inlet supports Alaska's largest Chinook sport fishery, centered on the Kenai River's late run — one of the most intensively managed and sought-after king salmon fisheries in the state. Commercial drift gillnet and set-net fisheries also operate in the inlet, with openings timed against in-river sonar escapement goals for multiple stocks.",
  "Copper":
    "Copper River Chinook travel more than 300 miles to spawning grounds in the Wrangell Mountains, accumulating the fat content that makes Copper River king a premium commercial product landed at Cordova. Commercial drift gillnet, personal-use dip-net, and subsistence fisheries all operate in the lower river, managed against an escapement goal at the Miles Lake sonar.",
  "Chignik/Kodiak":
    "Chinook from this genetic group are associated with the Karluk and Ayakulik rivers on Kodiak Island, which support subsistence and sport Chinook fishing — though sockeye dominate those systems commercially. Chignik, on the Alaska Peninsula, operates a commercial salmon fishery in which Chinook are a secondary species alongside large sockeye and pink runs.",
  "Southeast Alaska":
    "Southeast Alaska Chinook include fish from the transboundary Stikine, Taku, and Unuk rivers, which originate in British Columbia and are managed jointly under the Pacific Salmon Treaty. Commercial troll and net fisheries, sport, and subsistence harvests operate throughout the region; the Chilkat River near Haines supports an additional Chinook run with subsistence significance.",
  "Alsek/Situk":
    "The Situk River near Yakutat is one of Alaska's most productive Chinook sport fisheries by weight per mile, running through the Yakutat Forelands refuge in a short, fish-dense system accessible from town. The Alsek drains through Yukon Territory before reaching the Gulf of Alaska, with subsistence Chinook harvests in the remote Dry Bay area.",
};

interface OriginTableProps {
  rows: OriginTableRow[];
  year: number;
}

export default function OriginTable({ rows, year }: OriginTableProps) {
  return (
    <div className="br-origin-tbl">
      <div className="br-origin-tbl-hd">
        <span>River system · {year} genetics</span>
        <span>Bycatch fish</span>
      </div>
      {rows.map((r) => (
        <div className="row" key={r.region}>
          <div className="top">
            <span className="rname">{r.region}</span>
            <span className="rcount">~{k(r.fish)}</span>
          </div>
          {NOTES[r.region] && <p className="rnote">{NOTES[r.region]}</p>}
        </div>
      ))}
    </div>
  );
}
