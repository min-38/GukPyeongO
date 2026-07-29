"use client";

import ScenarioListLoader from "../ScenarioListLoader";
import ScheduleTab from "../ScheduleTab";

export default function Pane() {
  return (
    <ScenarioListLoader>
      {(scenarios) => <ScheduleTab scenarios={scenarios} />}
    </ScenarioListLoader>
  );
}
