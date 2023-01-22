import ImportExportIcon from "@mui/icons-material/ImportExport";
import { Box, Typography } from "@mui/material";
import type { Color, SolidColor, TCard } from "./gameReducer";
import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material";
import { moneyToColor, colorToColor, rainbowBackground, stagesMap } from "./constants";

export interface CardProps {
  card: TCard;
  canFlip?: boolean;
  onFlip?: (card: TCard) => void;
  onClick?: (card: TCard) => void;
  /** Used for when the card is a rainbow */
  currentSet?: SolidColor;
  sx?: SystemStyleObject<Theme>;
}

const Card = ({ card, canFlip = true, onFlip, onClick, currentSet, sx }: CardProps) => {
  const { type, value } = card;
  let content: React.ReactNode = null;
  let backgroundColor = "black";
  let otherStyles: React.CSSProperties = {};
  let secondValueColor: string | undefined;
  switch (type) {
    case "money": {
      const { value } = card;
      content = <Typography fontSize={20}>{value}</Typography>;
      backgroundColor = moneyToColor[value as keyof typeof moneyToColor];
      break;
    }
    case "property": {
      const { color, stages } = card;
      const isDual = Array.isArray(color);
      let colorToUse: Color;
      let stagesToUse: Extract<TCard, { type: "property" }>["stages"];
      const reverseCircle = (
        <Box
          className="perfect-center"
          sx={{
            position: "absolute",
            backgroundColor: "white",
            borderRadius: "50%",
            width: 15,
            height: 15,
            top: -2,
            right: -2,
            flexDirection: "column",
            color: "black",
            ...(canFlip && {
              ":hover": {
                opacity: 0.7,
                cursor: "pointer",
              },
            }),
          }}
          onClick={e => {
            if (canFlip) {
              e.stopPropagation();
              onFlip?.(card);
            }
          }}
        >
          <ImportExportIcon sx={{ fontSize: 12 }} />
        </Box>
      );
      if (isDual) {
        colorToUse = color[0];
        stagesToUse = stagesMap[color[0]];
        secondValueColor = colorToColor[color[1]];
      } else if (color !== "rainbow") {
        colorToUse = color;
        stagesToUse = stages;
      } else {
        if (currentSet) {
          backgroundColor = colorToColor[currentSet];
        }
        content = (
          <>
            {currentSet && reverseCircle}
            <Typography sx={{ lineHeight: "normal", marginTop: 3, fontWeight: "medium" }}>
              Rainbow Wildcard
            </Typography>
          </>
        );
        otherStyles = {
          justifyContent: "flex-start",
          backgroundImage: rainbowBackground,
        };
        break;
      }
      backgroundColor = colorToColor[colorToUse];
      content = (
        <>
          {isDual && reverseCircle}
          <Typography
            sx={{ backgroundColor: "rgba(0,0,0,0.3)", fontSize: 6, padding: "2px 4px" }}
          >
            {colorToUse.replace("_", " ")}
          </Typography>
          <Box width="100%">
            {stagesToUse.map((value, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-around",
                  backgroundColor: "white",
                  borderRadius: 1,
                  color: "black",
                  marginX: 1,
                  opacity: (index + 1) / stagesToUse.length + 0.1,
                }}
              >
                <Typography fontSize={6}>{index + 1}</Typography>
                <Typography fontSize={6}>------</Typography>
                <Typography fontSize={6}>{value}M</Typography>
              </Box>
            ))}
          </Box>
          <Typography
            sx={{
              fontSize: 6,
              paddingX: 1,
              marginBottom: 0.5,
              ...(isDual && {
                backgroundColor: colorToColor[color[1]],
                marginBottom: 0,
                marginTop: "-4px",
                paddingY: 0.5,
                width: "100%",
              }),
            }}
          >
            {isDual ? "Flip to change color" : "More Properties, More Rent"}
          </Typography>
        </>
      );
      otherStyles = { justifyContent: "space-between" };
      break;
    }
    default: {
      // @ts-ignore
      content = `${card.title ?? ""}${card.color ?? ""} ${value}`;
    }
  }
  return (
    <Box
      sx={{
        boxShadow: theme => `0 0 0 1px ${theme.palette.grey[800]}`,
        position: "relative",
        borderRadius: 2,
        width: "var(--size)",
        height: "calc(1.5 * var(--size))",
        transition: "all 0.2s ease 0s",
        ":hover": {
          transform: "scale(1.2)",
          zIndex: 2,
          marginRight: "58px",
          cursor: "grab",
        },
        ...sx,
      }}
      onClick={() => onClick?.(card)}
    >
      <Box
        className="perfect-center"
        sx={{
          flexDirection: "column",
          color: "white",
          backgroundColor,
          borderRadius: 2,
          fontSize: 12,
          border: "4px solid white",
          position: "relative",
          overflow: "hidden",
          userSelect: "none",
          height: "100%",
          ...otherStyles,
        }}
      >
        <Box
          sx={{
            backgroundColor: "white",
            width: "calc(var(--size)/3)",
            height: "calc(var(--size)/3)",
            position: "absolute",
            top: 0,
            left: 0,
            transform: "translate(-50%, -50%) rotate(45deg)",
          }}
        />
        <Box
          className="perfect-center"
          sx={{
            position: "absolute",
            backgroundColor,
            border: "2px solid white",
            borderRadius: "50%",
            fontSize: 8,
            width: "calc(var(--size)*1/4)",
            height: "calc(var(--size)*1/4)",
            top: -2,
            left: -2,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {secondValueColor && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                height: "calc((var(--size)*1/8) - 2px)",
                backgroundColor: secondValueColor,
              }}
            ></Box>
          )}
          <Typography fontSize="inherit" fontWeight="medium" zIndex={1}>
            {value}M
          </Typography>
        </Box>
        {content}
      </Box>
    </Box>
  );
};
export default Card;
