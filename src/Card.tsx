import ImportExportIcon from "@mui/icons-material/ImportExport";
import { Box, Typography } from "@mui/material";
import type { Color, SolidColor, TCard } from "./gameReducer";
import { SystemStyleObject } from "@mui/system";
import { Theme } from "@mui/material";
import { moneyToColor, colorToColor, rainbowBackground, stagesMap } from "./constants";

interface CardProps {
  card: TCard;
  onFlip: (card: TCard) => void;
  onClick?: (card: TCard) => void;
  /** Used for when the card is a rainbow */
  currentSet?: SolidColor;
  sx?: SystemStyleObject<Theme>;
}

const Card = ({ card, onFlip, onClick, currentSet, sx }: CardProps) => {
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
            ":hover": {
              opacity: 0.7,
              cursor: "pointer",
            },
          }}
          onClick={e => {
            e.stopPropagation();
            onFlip(card);
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
            sx={{ backgroundColor: "rgba(0,0,0,0.3)", fontSize: 7, padding: "2px 4px" }}
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
                <Typography fontSize={8}>{index + 1}</Typography>
                <Typography fontSize={8}>------</Typography>
                <Typography fontSize={8}>{value}M</Typography>
              </Box>
            ))}
          </Box>
          <Typography
            sx={{
              fontSize: 8,
              paddingX: 1,
              marginBottom: 0.5,
              ...(isDual && {
                backgroundColor: colorToColor[color[1]],
                marginBottom: 0,
                paddingY: 1,
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
        ...sx,
      }}
      onClick={() => onClick?.(card)}
    >
      <Box
        className="perfect-center"
        sx={{
          flexDirection: "column",
          width: 88.5,
          height: 135,
          color: "white",
          backgroundColor,
          borderRadius: 2,
          fontSize: 12,
          border: "4px solid white",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.2s ease 0s",
          userSelect: "none",
          ":hover": {
            cursor: "grab",
          },
          ...otherStyles,
        }}
      >
        {type !== "money" && (
          <>
            <Box
              sx={{
                backgroundColor: "white",
                width: 30,
                height: 30,
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
                width: 20,
                height: 20,
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
                    height: 10,
                    backgroundColor: secondValueColor,
                  }}
                ></Box>
              )}
              <Typography fontSize="inherit" fontWeight="medium" zIndex={1}>
                {value}M
              </Typography>
            </Box>
          </>
        )}
        {content}
      </Box>
    </Box>
  );
};
export default Card;
