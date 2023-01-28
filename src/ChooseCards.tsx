import { Box, Button, Dialog, Theme } from "@mui/material";
import { SystemStyleObject } from "@mui/system";
import Card from "./Card";
import { colors, Player, PropertyCard, SolidColor, TCard } from "./gameReducer";

export type ChooseCardsOptions =
  | {
      isSet: false;
      onClickProperty: (property: TCard, index: number) => void;
      onChoose?: never;
    }
  | {
      isSet: true;
      onClickProperty?: never;
      onChoose: (color: SolidColor) => void;
    };

export type ChooseCardsProps = {
  player: Player;
  title: React.ReactNode;
  titleSx?: SystemStyleObject<Theme>;
  borderColor?: string;
  otherTitle?: React.ReactNode;
  otherCards?: TCard[];
  selectedProperties?: TCard[];
  selectedOtherCards?: TCard[];
  onClickOtherCard?: (property: TCard, index: number) => void;
  otherFilter?: (property: TCard) => boolean;
  primaryAction?: {
    label: string;
    action: (selectedProperties: TCard[], selectedOtherCards: TCard[]) => void;
    disabled?: boolean;
  };
  secondaryAction: { label: string; action: () => void; disabled?: boolean };
  skipFullSetFilter?: boolean;
} & ChooseCardsOptions;

const ChooseCards = ({
  isSet,
  onChoose,
  player,
  title,
  titleSx,
  borderColor = player.displayHex,
  otherTitle,
  otherCards,
  selectedProperties = [],
  selectedOtherCards = [],
  onClickProperty,
  onClickOtherCard,
  otherFilter,
  primaryAction,
  secondaryAction,
  skipFullSetFilter = false,
}: ChooseCardsProps) => {
  const { properties = [], fullSets = {} } = player;
  const propertiesMap = properties.reduce((map, property, index) => {
    const color = property.actingColor ?? (property.color as SolidColor);
    return {
      ...map,
      [color]: [...(map[color] ?? []), { card: property, originalIndex: index }],
    };
  }, {} as Record<SolidColor, { card: PropertyCard; originalIndex: number }[]>);
  return (
    <Dialog open sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}>
      <Box
        sx={{
          padding: 2,
          borderRadius: 2,
          backgroundColor: "grey.900",
          // border: `2px solid ${playerChargingRent?.displayHex ?? "primary.main"}`,
          border: `2px solid ${borderColor}`,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
            gap: 1,
            ...titleSx,
          }}
        >
          {title}
        </Box>
        <Box className="custom-scrollbar" sx={{ display: "flex", overflowX: "auto", gap: 0.5 }}>
          {!isSet &&
            properties
              .map((property, index) => (
                <Card
                  key={`property-${index}`}
                  card={property}
                  selected={!!selectedProperties[index]}
                  canFlip={false}
                  onClick={() => onClickProperty(property, index)}
                  sx={{
                    flexShrink: 0,
                    zoom: 0.9,
                    ":hover": {},
                  }}
                />
              ))
              .filter((_, index) => {
                const color =
                  properties[index].actingColor ?? (properties[index].color as SolidColor);
                return !fullSets[color] || skipFullSetFilter;
              })}
          {isSet &&
            colors
              .filter(color => fullSets[color])
              .map(color => (
                <Box
                  key={color}
                  onClick={() => onChoose(color)}
                  sx={{
                    height: "min-content",
                  }}
                >
                  {(propertiesMap[color] ?? []).map(({ card, originalIndex }) => (
                    <Card
                      key={`${color}-card ${card.id}-${originalIndex}`}
                      card={card}
                      canFlip={false}
                      currentSet={color}
                      sx={{
                        ":not(:first-of-type)": {
                          marginTop: "calc(-1.5 * var(--size) * 0.82)",
                        },
                        ":hover": {},
                        cursor: "default",
                      }}
                    />
                  ))}
                </Box>
              ))}
        </Box>
        {otherTitle}
        {otherCards && (
          <Box
            className="custom-scrollbar"
            sx={{ display: "flex", overflowX: "auto", gap: 0.5, marginY: 1 }}
          >
            {otherCards
              .map((otherCard, index) => (
                <Card
                  key={`otherCard-${index}`}
                  card={otherCard}
                  selected={!!selectedOtherCards?.[index]}
                  canFlip={false}
                  onClick={() => onClickOtherCard?.(otherCard, index)}
                  sx={{
                    flexShrink: 0,
                    zoom: 0.9,
                    ":hover": {},
                    ...(!!selectedOtherCards?.[index] && {
                      "&::after": {
                        content: "''",
                        backgroundColor: "rgb(33,173,153)",
                        opacity: "0.8",
                        position: "absolute",
                        inset: "0px",
                        zIndex: 4,
                      },
                    }),
                  }}
                />
              ))
              .filter((_, index) => otherFilter?.(otherCards[index]) ?? true)}
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            paddingTop: 2,
            gap: 0.5,
          }}
        >
          {primaryAction && (
            <Button
              className={primaryAction.disabled ? "disabled" : ""}
              color="success"
              variant="contained"
              sx={{ fontSize: 10 }}
              onClick={() => primaryAction.action(selectedProperties, selectedOtherCards)}
            >
              {primaryAction.label}
            </Button>
          )}
          <Button
            className={secondaryAction.disabled ? "disabled" : ""}
            color="error"
            variant="contained"
            sx={{ fontSize: 10 }}
            onClick={secondaryAction.action}
          >
            {secondaryAction.label}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ChooseCards;
