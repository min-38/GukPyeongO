"use client";

import ScenarioListLoader from "../ScenarioListLoader";
import KindTab from "../KindTab";

export default function Pane() {
  return (
    <ScenarioListLoader>
      {(scenarios) => <KindTab scenarios={scenarios} />}
    </ScenarioListLoader>
  );
}
