import Card from "./Card";
import cards from "./cards.json";
import type { TCard } from "./gameReducer";
import { defaultCardConfig } from "./constants";
import { useState, useLayoutEffect } from "react";
import { Box, Button, Slider } from "@mui/material";
import { ArrowDropUp } from "@mui/icons-material";

interface CardConfigProps {
  initialConfig?: number[];
  canEditConfig: boolean;
  onSave: (config: number[]) => void;
  onCancel: () => void;
}
const defaultConfig = defaultCardConfig.slice(24, 34);
const isIOS =
  ["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].includes(
    navigator.platform
  ) ||
  // iPad on iOS 13 detection
  (navigator.userAgent.includes("Mac") && "ontouchend" in document);

const CardConfig = ({
  initialConfig = defaultConfig,
  canEditConfig,
  onSave,
  onCancel,
}: CardConfigProps) => {
  const [configValues, setConfigValues] = useState(initialConfig);
  const setValueAtIndex = (value: number, index: number) => {
    const newValues = [...configValues];
    newValues[index] = value;
    setConfigValues(newValues);
  };
  const [numPerRow, setNumPerRow] = useState<number>(0);

  useLayoutEffect(() => {
    const recalculateNum = (win: Window) => {
      const availableSpace = win.innerWidth - 64;
      const n = Math.floor(availableSpace / 120);
      setNumPerRow(n);
    };
    recalculateNum(window);
    const handleResize = (event: UIEvent) => {
      recalculateNum(event.target as Window);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ padding: 32, paddingTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <h2 style={{ color: "white" }}>{`${
          canEditConfig ? "Customize" : "View"
        } the frequency of each card`}</h2>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: numPerRow ? 0 : 16, marginBottom: 32 }}>
        {cards
          .filter(({ type }) => type === "action")
          .map((card, index) => (
            <div
              key={index}
              id={`${index}`}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexBasis: numPerRow ? `calc(100% / ${numPerRow})` : "auto",
              }}
            >
              <Card card={card as TCard} sx={{ ":hover": {} }} />
              <Box
                className="perfect-center"
                sx={{
                  marginTop: 1,
                  paddingX: 1,
                  paddingY: 0.5,
                  border: "2px solid",
                  borderColor: "grey.700",
                  borderRadius: 1,
                  color: "primary.light",
                  fontSize: 10,
                }}
              >
                {configValues[index]}
              </Box>
              <Slider
                defaultValue={initialConfig[index]}
                disabled={!canEditConfig}
                value={configValues[index]}
                onChange={(event, newValue) => {
                  if (isIOS && event.type === "mousedown") return;
                  setValueAtIndex(newValue as number, index);
                }}
                step={1}
                marks={[...Array(13)].map((_, value) => ({
                  value,
                  label:
                    value === defaultConfig[index] ? (
                      <ArrowDropUp
                        sx={{ color: "white", marginTop: -1 }}
                        onClick={() => setValueAtIndex(defaultConfig[index], index)}
                      />
                    ) : undefined,
                }))}
                min={0}
                max={12}
                track={false}
                sx={{ width: 100 }}
              />
            </div>
          ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        <Button
          className={canEditConfig ? "" : "disabled"}
          color="success"
          onClick={() => onSave(configValues)}
        >
          Save Changes
        </Button>
        <Button color="error" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
export default CardConfig;
