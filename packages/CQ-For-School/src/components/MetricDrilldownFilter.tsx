import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, X } from "lucide-react";
import { FRICTION_ISSUES, CQ_WINS } from "@/lib/data";

export type DrilldownMode = "aggregate" | "friction" | "wins";

export interface DrilldownState {
  mode: DrilldownMode;
  selectedFrictionIds: string[];
  selectedWinIds: string[];
}

const INITIAL_STATE: DrilldownState = {
  mode: "aggregate",
  selectedFrictionIds: [],
  selectedWinIds: [],
};

interface Props {
  value: DrilldownState;
  onChange: (state: DrilldownState) => void;
  showWins?: boolean;
}

export function useMetricDrilldown() {
  const [state, setState] = useState<DrilldownState>(INITIAL_STATE);
  return { drilldown: state, setDrilldown: setState };
}

export function MetricDrilldownFilter({ value, onChange, showWins = true }: Props) {
  const activeCount = value.selectedFrictionIds.length + value.selectedWinIds.length;

  const toggleFriction = (id: string) => {
    const ids = value.selectedFrictionIds.includes(id)
      ? value.selectedFrictionIds.filter((x) => x !== id)
      : [...value.selectedFrictionIds, id];
    onChange({
      mode: ids.length > 0 ? "friction" : value.selectedWinIds.length > 0 ? "wins" : "aggregate",
      selectedFrictionIds: ids,
      selectedWinIds: value.selectedWinIds,
    });
  };

  const toggleWin = (id: string) => {
    const ids = value.selectedWinIds.includes(id)
      ? value.selectedWinIds.filter((x) => x !== id)
      : [...value.selectedWinIds, id];
    onChange({
      mode: value.selectedFrictionIds.length > 0 ? "friction" : ids.length > 0 ? "wins" : "aggregate",
      selectedFrictionIds: value.selectedFrictionIds,
      selectedWinIds: ids,
    });
  };

  const clearAll = () => onChange(INITIAL_STATE);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Friction filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Friction Issues
            {value.selectedFrictionIds.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {value.selectedFrictionIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">Filter by Friction Issue</p>
            <p className="text-xs text-muted-foreground">Select specific issues to compare across groups</p>
          </div>
          <ScrollArea className="h-64 p-2">
            {FRICTION_ISSUES.map((issue) => (
              <label
                key={issue.id}
                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={value.selectedFrictionIds.includes(issue.id)}
                  onCheckedChange={() => toggleFriction(issue.id)}
                  className="mt-0.5"
                />
                <span className="text-sm leading-tight">{issue.description}</span>
              </label>
            ))}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Wins filter */}
      {showWins && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5" />
              CQ Wins
              {value.selectedWinIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {value.selectedWinIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">Filter by CQ Win</p>
              <p className="text-xs text-muted-foreground">Select specific wins to compare across groups</p>
            </div>
            <ScrollArea className="h-64 p-2">
              {CQ_WINS.map((win) => (
                <label
                  key={win.id}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={value.selectedWinIds.includes(win.id)}
                    onCheckedChange={() => toggleWin(win.id)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-tight">{win.label}</span>
                </label>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      )}

      {/* Active filters badges */}
      {activeCount > 0 && (
        <>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={clearAll}>
            <X className="h-3 w-3" /> Clear all
          </Button>
          <div className="flex flex-wrap gap-1 ml-1">
            {value.selectedFrictionIds.map((id) => {
              const issue = FRICTION_ISSUES.find((f) => f.id === id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="text-[10px] cursor-pointer gap-1"
                  onClick={() => toggleFriction(id)}
                >
                  {issue?.description?.slice(0, 25)}…
                  <X className="h-2.5 w-2.5" />
                </Badge>
              );
            })}
            {value.selectedWinIds.map((id) => {
              const win = CQ_WINS.find((w) => w.id === id);
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="text-[10px] cursor-pointer gap-1"
                  onClick={() => toggleWin(id)}
                >
                  {win?.label?.slice(0, 25)}…
                  <X className="h-2.5 w-2.5" />
                </Badge>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
