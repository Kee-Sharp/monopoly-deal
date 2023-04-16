import { Box, Button, Dialog, Theme } from "@mui/material";
import { SystemStyleObject } from "@mui/system";
import Card from "./Card";
import { colors, Player, PropertyCard, SolidColor, TCard } from "./gameReducer";
import { useToggle } from "./hooks";

export type ChooseCardsOptions =
  | {
      isSet: false;
      clickBehavior: "toggle" | "reset";
      onChoose?: never;
    }
  | {
      isSet: true;
      clickBehavior?: never;
      onChoose: (color: SolidColor) => void;
    };

export type ChooseCardsProps = {
  player: Player;
  cards?: TCard[];
  cardSx?: SystemStyleObject<Theme>;
  title:
    | React.ReactNode
    | ((selectedProperties: TCard[], selectedOtherCards: TCard[]) => React.ReactNode);
  titleSx?: SystemStyleObject<Theme>;
  borderColor?: string;
  otherTitle?: React.ReactNode;
  otherCards?: TCard[];
  otherClickBehavior?: "toggle" | "reset";
  otherFilter?: (property: TCard) => boolean;
  primaryAction?: {
    label: string;
    action: (selectedProperties: TCard[], selectedOtherCards: TCard[]) => void;
    disabled?: boolean | ((selectedProperties: TCard[], selectedOtherCards: TCard[]) => boolean);
  };
  secondaryAction: { label: string; action: () => void; disabled?: boolean };
  skipFullSetFilter?: boolean;
} & ChooseCardsOptions;

const ChooseCards = ({
  isSet,
  onChoose,
  player,
  cards,
  cardSx,
  title,
  titleSx,
  borderColor = player.displayHex,
  otherTitle,
  otherCards,
  clickBehavior,
  otherClickBehavior,
  otherFilter,
  primaryAction,
  secondaryAction,
  skipFullSetFilter = false,
}: ChooseCardsProps) => {
  const [selectedProperties, toggleSelectedProperties, setSelectedProperties] = useToggle();
  /** Other cards can be other properties or our own money */
  const [selectedOtherCards, toggleSelectedOtherCards, setSelectedOtherCards] = useToggle();

  const { properties = [], fullSets = {} } = player;
  const propertiesMap = properties.reduce((map, property, index) => {
    const color = property.actingColor ?? (property.color as SolidColor);
    return {
      ...map,
      [color]: [...(map[color] ?? []), { card: property, originalIndex: index }],
    };
  }, {} as Record<SolidColor, { card: PropertyCard; originalIndex: number }[]>);

  let isPrimaryActionDisabled = false;
  if (typeof primaryAction?.disabled === "function")
    isPrimaryActionDisabled = primaryAction.disabled(selectedProperties, selectedOtherCards);
  else isPrimaryActionDisabled = !!primaryAction?.disabled;

  const onClickProperty = (property: TCard, index: number) => {
    if (clickBehavior === "reset") {
      const newArray = [];
      newArray[index] = true;
      setSelectedProperties(newArray);
    } else {
      toggleSelectedProperties(index, property);
    }
  };

  const onClickOtherCard = (otherCard: TCard, index: number) => {
    if (otherClickBehavior === "reset") {
      const newArray = [];
      newArray[index] = true;
      setSelectedOtherCards(newArray);
    } else {
      toggleSelectedOtherCards(index, otherCard);
    }
  };

  return (
    <Dialog open sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}>
      <Box
        sx={{
          padding: 2,
          borderRadius: 2,
          backgroundColor: "grey.900",
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
          {typeof title === "function" ? title(selectedProperties, selectedOtherCards) : title}
        </Box>
        <Box className="custom-scrollbar" sx={{ display: "flex", overflowX: "auto", gap: 0.5 }}>
          {!isSet &&
            (cards ?? properties)
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
                    ...cardSx,
                  }}
                />
              ))
              .filter((_, index) => {
                if (skipFullSetFilter) return true;
                const color =
                  properties[index].actingColor ?? (properties[index].color as SolidColor);
                return !fullSets[color];
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
                      sx={{
                        ":hover": {},
                        cursor: "default",
                      }}
                      containerSx={{
                        ":not(:first-of-type)": {
                          marginTop: "calc(-1.5 * var(--size) * 0.82)",
                        },
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
              className={isPrimaryActionDisabled ? "disabled" : ""}
              color="success"
              sx={{ fontSize: 10 }}
              onClick={() => primaryAction.action(selectedProperties, selectedOtherCards)}
            >
              {primaryAction.label}
            </Button>
          )}
          <Button
            className={secondaryAction.disabled ? "disabled" : ""}
            color="error"
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
