import {
  Apartment,
  AssignmentLate,
  Cancel,
  Celebration,
  CreditCard,
  CurrencyExchange,
  Filter2,
  House,
  KeyboardDoubleArrowDown,
  ShoppingCartCheckout,
  Shuffle,
  Style,
  SwapVert,
} from "@mui/icons-material";
import { Box, Theme, Typography } from "@mui/material";
import { SystemStyleObject } from "@mui/system";
import clsx from "clsx";
import { colorToColor, moneyToColor, rainbowBackground, stagesMap } from "./constants";
import type { Color, TCard } from "./gameReducer";

export interface CardProps {
  card: TCard;
  canFlip?: boolean;
  onFlip?: (card: TCard) => void;
  onClick?: (card: TCard) => void;
  sx?: SystemStyleObject<Theme>;
  containerSx?: SystemStyleObject<Theme>;
  selected?: boolean;
  isHand?: boolean;
}

const Card = ({
  card,
  canFlip = true,
  onFlip,
  onClick,
  sx,
  containerSx,
  selected,
  isHand,
}: CardProps) => {
  const { type, value } = card;
  let content: React.ReactNode = null;
  let backgroundColor = "black";
  let otherStyles: SystemStyleObject<Theme> = {};
  let secondValueColor: string | undefined;
  switch (type) {
    case "money": {
      const { value } = card;
      content = <Typography fontSize={20}>{value}</Typography>;
      backgroundColor = moneyToColor[value as keyof typeof moneyToColor];
      break;
    }
    case "property": {
      const { color, stages, actingColor } = card;
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
          <SwapVert sx={{ fontSize: 12 }} />
        </Box>
      );
      if (isDual) {
        colorToUse = actingColor ?? color[0];
        stagesToUse = stagesMap[colorToUse];
        secondValueColor = colorToColor[color.filter(c => c !== colorToUse)[0]];
      } else if (color !== "rainbow") {
        colorToUse = color;
        stagesToUse = stages;
      } else {
        if (actingColor) {
          backgroundColor = colorToColor[actingColor];
        }
        content = (
          <>
            {actingColor && reverseCircle}
            <Typography
              sx={{
                lineHeight: "normal",
                marginTop: 3,
                fontWeight: "medium",
                fontSize: 14,
              }}
            >
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
          <Typography sx={{ backgroundColor: "rgba(0,0,0,0.3)", fontSize: 6, padding: "2px 4px" }}>
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
                backgroundColor: secondValueColor,
                marginBottom: 0,
                marginTop: "-4px",
                paddingY: 0.5,
                paddingX: 1.5,
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
    case "rent": {
      const { description } = card;
      content = (
        <>
          <Box sx={{ height: 25 }} />
          <Box
            className="perfect-center"
            sx={{
              backgroundColor: "white",
              width: "calc(var(--size) *4/9)",
              height: "calc(var(--size) *4/9)",
              borderRadius: "50%",
              color: "black",
              fontWeight: "bold",
              zIndex: 1,
            }}
          >
            RENT
          </Box>
          <Box className="perfect-center" sx={{ height: 25, paddingX: 0.25, zIndex: 1 }}>
            <Typography sx={{ fontSize: 6, color: "white" }}>{description}</Typography>
          </Box>
          {Array.isArray(card.color) && (
            <Box
              sx={{
                position: "absolute",
                inset: "-24px 0px 0px -24px",
                transform: "rotate(48deg)",
                transformOrigin: "left bottom",
                backgroundColor: colorToColor[card.color[1]],
              }}
            />
          )}
        </>
      );
      otherStyles = {
        justifyContent: "space-between",
        ...(card.color === "rainbow" && { backgroundImage: rainbowBackground }),
      };
      backgroundColor = Array.isArray(card.color) ? colorToColor[card.color[0]] : "black";
      if (Array.isArray(card.color)) secondValueColor = colorToColor[card.color[1]];
      break;
    }
    case "action": {
      const { id, title, description } = card;
      let Icon = CreditCard;
      let decorationColor = "white";
      switch (id) {
        case 24: {
          Icon = AssignmentLate;
          decorationColor = "rgb(206, 146, 244)";
          break;
        }
        case 25: {
          Icon = Cancel;
          decorationColor = "rgb(71, 138, 234)";
          break;
        }
        case 26: {
          Icon = KeyboardDoubleArrowDown;
          decorationColor = "rgb(153, 140, 136)";
          break;
        }
        case 27: {
          Icon = Shuffle;
          decorationColor = "rgb(193, 193, 193)";
          break;
        }
        case 28: {
          Icon = CurrencyExchange;
          decorationColor = "rgb(49, 178, 158)";
          break;
        }
        case 29: {
          Icon = Apartment;
          decorationColor = "rgb(86, 183, 118)";
          break;
        }
        case 30: {
          Icon = House;
          decorationColor = "rgb(119, 173, 172)";
          break;
        }
        case 31: {
          Icon = Celebration;
          decorationColor = "rgb(242, 139, 195)";
          break;
        }
        case 32: {
          Icon = Filter2;
          decorationColor = "rgb(229, 206, 108)";
          break;
        }
        case 33: {
          Icon = ShoppingCartCheckout;
          decorationColor = "rgb(249, 168, 80)";
        }
      }
      otherStyles = { "--color": decorationColor };
      backgroundColor = "grey.900";
      content = (
        <>
          <Box
            sx={{
              paddingX: 0.5,
              paddingTop: [26, 29, 30, 33].includes(card.id) ? 3 : 2.5,
              marginBottom: [26, 29, 30, 33].includes(card.id) ? 1 : 0.5,
            }}
          >
            <Typography sx={{ fontSize: 12, color: decorationColor, lineHeight: 1 }}>
              {title}
            </Typography>
          </Box>
          <Box
            className="perfect-center"
            sx={{
              color: "white",
              zIndex: 1,
              flex: 1,
            }}
          >
            <Icon
              sx={{ color: decorationColor, fontSize: [26, 29, 30].includes(card.id) ? 30 : 28 }}
            />
          </Box>
          <Box className="perfect-center" sx={{ height: 25, paddingX: 0.25, zIndex: 1 }}>
            <Typography sx={{ fontSize: 6, color: "white" }}>{description}</Typography>
          </Box>
        </>
      );
      break;
    }
    default: {
      // @ts-ignore
      content = `${card.title ?? ""}${card.color ?? ""} ${value}`;
    }
  }
  return (
    <Box className="reverser" sx={containerSx}>
      <Box
        className={clsx({ selected, front: isHand })}
        sx={{
          boxShadow: theme => `0 0 0 1px ${theme.palette.grey[900]}99`,
          position: "relative",
          borderRadius: 2,
          width: "var(--size)",
          height: "calc(1.5 * var(--size))",
          transition: "all 0.2s ease 0s",
          zIndex: 2,
          ...(!isHand && {
            ":hover": {
              transform: "scale(1.2)",
              zIndex: 3,
              marginRight: "58px",
              cursor: "grab",
            },
          }),
          ...sx,
        }}
        onClick={() => onClick?.(card)}
      >
        <Box
          className="perfect-center"
          sx={{
            "--color": "white",
            flexDirection: "column",
            color: "white",
            backgroundColor,
            borderRadius: 2,
            fontSize: 12,
            position: "relative",
            overflow: "hidden",
            userSelect: "none",
            border: "4px solid var(--color)",
            height: "100%",
            ...otherStyles,
          }}
        >
          <Box
            sx={{
              backgroundColor: "var(--color)",
              width: "calc(var(--size)*0.34)",
              height: "calc(var(--size)*0.34)",
              position: "absolute",
              top: 0,
              left: 0,
              transform: "translate(-50%, -50%) rotate(45deg)",
              transformOrigin: "center center",
            }}
          />

          <Box
            className="perfect-center"
            sx={{
              position: "absolute",
              backgroundColor,
              border: "2px solid var(--color)",
              borderRadius: "50%",
              fontSize: 8,
              width: "calc(var(--size)/4)",
              height: "calc(var(--size)/4)",
              top: -1,
              left: -1,
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
                  height: "calc((var(--size)/8) - 2px)",
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
      {isHand && (
        <Box
          className="back"
          sx={{
            boxShadow: theme => `0 0 0 1px ${theme.palette.grey[900]}99`,
            position: "relative",
            borderRadius: 2,
            width: "var(--size)",
            height: "calc(1.5 * var(--size))",
            transition: "all 0.2s ease 0s",
            zIndex: 2,
          }}
        >
          <Box
            className="perfect-center"
            sx={{
              flexDirection: "column",
              color: "white",
              backgroundColor: "#74d370",
              borderRadius: 2,
              fontSize: 12,
              position: "relative",
              overflow: "hidden",
              userSelect: "none",
              height: "100%",
            }}
          >
            <Box
              sx={{
                paddingX: 0.5,
                paddingTop: 3,
                marginBottom: 1,
              }}
            >
              <Typography sx={{ fontSize: 12, color: "white", lineHeight: 1 }}>
                Monopoly Deal
              </Typography>
            </Box>
            <Box
              className="perfect-center"
              sx={{
                color: "white",
                zIndex: 1,
                flex: 1,
              }}
            >
              <Style sx={{ color: "white", fontSize: [26, 29, 30].includes(card.id) ? 30 : 28 }} />
            </Box>
            <Box sx={{ height: 25, paddingX: 0.25 }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};
export default Card;
