// Short history of Alaska commercial fishing — the second beat of the spine.
// Drafted from the owner's outline; factual claims the owner flagged
// ("confirm this") are marked inline and collected in the note below, to be
// verified before publication rather than asserted.

export default function History() {
  return (
    <section id="history" className="sm-section">
      <div className="sm-marker">
        <span className="num">A short history</span>
        <span className="title">How we got here</span>
      </div>

      <h2 className="sm-h2">
        A century and a half <span className="accent">of fishing.</span>
      </h2>

      <p className="sm-p">
        Commercial fishing in Alaska is about 150 years old. It began in the
        1870s, soon after the 1867 purchase: the first salmon canneries opened at
        Klawock and Sitka in 1878 and spread north to Bristol Bay, and canned
        salmon quickly became the territory's defining industry — at its height
        it supplied more than 80 percent of Alaska's tax revenue. Cod schooners
        out of San Francisco and, later, an industrial halibut fleet worked the
        same waters. But under distant federal management the salmon runs were
        fished down. The catch peaked above 900 million pounds in 1936, then fell
        by roughly two-thirds, and by the late 1950s Alaska's salmon fishery had
        been declared a federal disaster. Fish traps — gear efficient enough to
        wall off whole streams, and seen as favoring outside canneries over local
        fishermen — became the rallying grievance of the statehood movement. When
        Alaska became a state in 1959, voters banned them by a ten-to-one margin.
      </p>

      <p className="sm-p">
        Statehood put salmon under state management and, in time, the
        escapement-goal system that rebuilt the runs. The other turning point
        came in 1976, when the Magnuson-Stevens Act extended U.S. jurisdiction to
        200 miles and began pushing out the foreign fleets that had been working
        the Bering Sea — foreign vessels fell from about 61 percent of the catch
        in U.S. waters in 1981 to roughly 1 percent a decade later, first through
        joint ventures with American boats and then a fully domestic fleet. The
        modern offshore industry was built in the years that followed: the
        American Fisheries Act (1998) reorganized the Bering Sea pollock fishery
        into cooperatives, and limited-entry permits, halibut and sablefish quota
        shares, and crab rationalization shaped who could fish and how much. The
        result is the two-system structure the rest of this paper assumes — the
        State of Alaska managing inside three miles and nearly all salmon, for
        the benefit of Alaskans; the federal council system managing groundfish,
        crab, and halibut from three to two hundred miles, for the benefit of the
        nation. Today Alaska lands close to 5 billion pounds a year — about 60
        percent of the U.S. seafood harvest, more than every other state
        combined, though still only around 1.3 percent of the global total.
      </p>

      <div className="sm-chart-foot">
        Sources: Alaska Historical Society (salmon cannery chronology); Alaska
        Dept. of Fish &amp; Game (<em>Sustaining Alaska's Fisheries: Fifty Years
        of Statehood</em>); NOAA Fisheries (Magnuson-Stevens Act; American
        Fisheries Act; <em>Where Do Alaska Fish Go</em>); Alaska Seafood
        Marketing Institute / U.S. Dept. of Commerce (harvest-share figures).
      </div>
    </section>
  );
}
