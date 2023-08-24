import { Build, Chat, Info, Logout, Loop, MarkUnreadChatAlt, Menu, Settings } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  SwipeableDrawer,
  TextField,
  Typography,
} from "@mui/material";
import clsx from "clsx";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import Board from "./Board";
import Card from "./Card";
import cards from "./cards.json";
import ChooseCards, { ChooseCardsProps } from "./ChooseCards";
import ColoredText from "./ColoredText";
import { colorToColor, flippableWildcards, stagesMap } from "./constants";
import { GameState, Payloads, Player, PropertyCard, SolidColor, TCard } from "./gameReducer";
import StagedActionDialog from "./StagedActionDialog";
import { createPropertyMap } from "./utils";

interface GameProps {
  clientId: string;
  gameState: GameState;
  dispatch: (payload: Payloads) => Promise<void>;
  onLeave: () => Promise<void>;
  onShowConfig: () => void;
  images: string[];
  flippedImages: string[];
}
interface ColorOptions {
  color: SolidColor;
  amountInSet: number;
}

const iOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const Game = ({
  clientId,
  gameState,
  dispatch,
  onLeave,
  onShowConfig,
  images,
  flippedImages,
}: GameProps) => {
  const { players, messages, gameStarted, deck = [], discard = [] } = gameState;

  const [draggingElement, setDraggingElement] = useState<number>();
  const draggingElementRef = useRef<number | null>(null);
  const [isOverBoard, setIsOverBoard] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [lastMessageIndex, setLastMessageIndex] = useState(0);
  const [unread, setUnread] = useState(false);

  const [isDev, setIsDev] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const [chooseColorOptions, setChooseColorOptions] = useState<{
    colorOptions: ColorOptions[];
    isRent?: boolean;
    onChoose: (color: SolidColor) => void;
  }>();
  const [choosePlayer, setChoosePlayer] = useState<{
    onChoose: (targetedPlayerId: string) => void;
  }>();
  const [chooseCards, setChooseCards] = useState<ChooseCardsProps>();

  const [chooseActionOrMoney, setChooseActionOrMoney] = useState<{
    action: () => void;
    money: () => void;
  }>();

  const [cardsReversed, setCardsReversed] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView();
    const newMessages = messages.slice(lastMessageIndex);
    if (!isChatOpen && newMessages.some(({ id }) => id !== "game")) setUnread(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, messages.length]);

  useEffect(() => {
    if (isChatOpen) {
      lastMessageRef.current?.scrollIntoView();
      setUnread(false);
    } else {
      setLastMessageIndex(messages.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen]);

  useEffect(() => {
    const cardContainer = cardContainerRef.current;
    const handleScroll = () => {
      setScrolled((cardContainer?.scrollLeft ?? 0) > 0);
    };
    cardContainer?.addEventListener("scroll", handleScroll);
    return () => cardContainer?.removeEventListener("scroll", handleScroll);
  }, []);

  const playersMap = players.reduce<Record<string, Player>>(
    (map, player) => ({ ...map, [player.id]: player }),
    {}
  );

  const thisPlayer = playersMap[clientId];
  if (!thisPlayer || !gameStarted) return <></>;

  const {
    id,
    hand = [],
    properties = [],
    money = [],
    movesLeft: thisPlayerMovesLeft,
    rentDue,
    rentModifier,
    stagedAction,
    setModifiers = {},
    fullSets = {},
    nos,
  } = thisPlayer;

  const propertiesMap = createPropertyMap(properties);
  const allColorOptions = Object.entries(propertiesMap).map<ColorOptions>(
    ([color, { length }]) => ({ color: color as SolidColor, amountInSet: length })
  );

  const otherPlayers = players.filter(({ id }) => id !== clientId);
  const currentPlayerIndex = players.findIndex(({ id }) => id === gameState.currentPlayerId);
  const {
    id: currentPlayerId,
    nickname: currentPlayerNickname,
    displayHex,
    movesLeft,
    nos: currentPlayerNos = [],
    rentModifier: currentPlayerRentModifier,
  } = players[currentPlayerIndex];

  const isThisPlayersTurn = currentPlayerId === id;
  const moreThan7 = hand.length > 7;
  const nextPlayer = players[(currentPlayerIndex + 1) % players.length];
  const playersWithRent = players.filter(({ rentDue }) => !!rentDue);
  const playerChargingRentId = playersWithRent[0]?.rentDue?.playerId;
  const playerChargingRent = playerChargingRentId ? playersMap[playerChargingRentId] : undefined;

  const otherPlayerHasAction = otherPlayers.some(({ stagedAction }) => stagedAction);

  const closeChooseCards = () => {
    setChooseCards(undefined);
  };

  //  eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (rentDue) {
      setChooseCards({
        player: thisPlayer,
        otherPlayer: playerChargingRent,
        title: (selectedProperties, selectedOtherCards) => {
          const totalSelected = [...selectedOtherCards, ...selectedProperties].reduce(
            (total, card) => total + (card?.value ?? 0),
            0
          );
          const allSelected = [properties, money].every((arr, isMoney) =>
            arr.every(({ value }, index) =>
              isMoney ? selectedOtherCards[index] : selectedProperties[index] || !value
            )
          );
          const canPayRent = totalSelected >= (rentDue?.amount ?? 0) || allSelected;
          return (
            <>
              <ColoredText
                sentence={`You owe ${rentDue.amount}M in rent to ${playerChargingRent?.nickname}`}
                coloredWords={[`${rentDue.amount}M`, playerChargingRent?.nickname ?? ""]}
                color={playerChargingRent?.displayHex ?? "primary.main"}
              />
              <Box
                className="perfect-center"
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: canPayRent ? "lightgreen" : "coral",
                  color: canPayRent ? "black" : "white",
                  fontWeight: "medium",
                  fontSize: 12,
                }}
              >
                {totalSelected}M
              </Box>
            </>
          );
        },
        clickBehavior: "toggle",
        otherCards: money,
        otherClickBehavior: "toggle",
        isSet: false,
        primaryAction: {
          label: "Pay Rent",
          action: (selectedProperties, selectedOtherCards) => {
            dispatch({
              type: "payRent",
              payload: { playerId: id, selectedProperties, selectedMoney: selectedOtherCards },
            });
            closeChooseCards();
          },
          disabled: (selectedProperties, selectedOtherCards) => {
            const totalSelected = [...selectedOtherCards, ...selectedProperties].reduce(
              (total, card) => total + (card?.value ?? 0),
              0
            );
            const allSelected = [properties, money].every((arr, isMoney) =>
              arr.every(({ value }, index) =>
                isMoney ? selectedOtherCards[index] : selectedProperties[index] || !value
              )
            );
            const canPayRent = totalSelected >= (rentDue?.amount ?? 0) || allSelected;
            return !canPayRent;
          },
        },
        secondaryAction: {
          label: "Use Just Say No!",
          action: () =>
            dispatch({
              type: "sayNo",
              payload: { isTarget: true, currentPlayerId, targetedPlayerId: id },
            }),
          disabled: !hand.some(({ id }) => id === 25),
        },
        skipFullSetFilter: true,
        borderColor: playerChargingRent?.displayHex,
      });
    } else {
      setChooseCards(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentDue, hand]);

  useEffect(() => {
    if (isThisPlayersTurn || rentDue) navigator.vibrate?.([100, 30, 100]);
  }, [isThisPlayersTurn, rentDue]);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    handIndex: number,
    id: number
  ) => {
    setDraggingElement(handIndex);
    const dragPreview = document.createElement("div");
    const emptyDiv = document.createElement("div");
    emptyDiv.id = "empty-div";
    dragPreview.id = "drag-ghost";
    const flippableIndex = flippableWildcards.indexOf(id);
    // @ts-ignore
    const isFlipped = cards[id].color?.[0] !== hand[handIndex].color?.[0];
    dragPreview.style.backgroundImage = `url(${
      flippableIndex !== -1 && isFlipped ? flippedImages[flippableIndex] : images[id]
    })`;
    dragPreview.style.backgroundSize = "cover";
    dragPreview.style.position = "absolute";
    dragPreview.style.width = `77px`;
    dragPreview.style.height = `112.5px`;
    dragPreview.style.zIndex = "4";
    dragPreview.style.pointerEvents = "none";
    dragPreview.style.transform = "scale(1.2)";
    dragPreview.style.left = `calc(${event.clientX}px - 38.5px)`;
    dragPreview.style.top = `calc(${event.clientY}px - 20px)`;

    document.body.appendChild(dragPreview);
    document.body.appendChild(emptyDiv);
    document.addEventListener("drag", function (event) {
      const { clientX, clientY } = event;
      dragPreview.style.display = clientX === 0 && clientY === 0 ? "none" : "block";
      dragPreview.style.left = `calc(${clientX}px - 38.5px)`;
      dragPreview.style.top = `calc(${clientY}px - 20px)`;
    });
    event.dataTransfer.setDragImage(emptyDiv, 0, 0);
  };
  const handleTouchStart = (
    event: React.TouchEvent<HTMLDivElement>,
    handIndex: number,
    id: number
  ) => {
    if (cardsReversed) return;
    const cardElement = document.getElementById(`${id}-${handIndex}`);
    if (!cardElement) return;
    setDraggingElement(handIndex);
    draggingElementRef.current = handIndex;
    const dragPreview = document.createElement("div");
    dragPreview.id = "touch-ghost";
    const flippableIndex = flippableWildcards.indexOf(id);
    // @ts-ignore
    const isFlipped = cards[id].color?.[0] !== hand[handIndex].color?.[0];
    dragPreview.style.backgroundImage = `url(${
      flippableIndex !== -1 && isFlipped ? flippedImages[flippableIndex] : images[id]
    })`;
    dragPreview.style.backgroundSize = "cover";
    dragPreview.style.position = "absolute";
    dragPreview.style.width = `77px`;
    dragPreview.style.height = `112.5px`;
    dragPreview.style.zIndex = "4";
    dragPreview.style.pointerEvents = "none";
    dragPreview.style.transform = "scale(1.2)";
    dragPreview.style.left = `calc(${event.touches[0].clientX}px - 38.5px)`;
    dragPreview.style.top = `calc(${event.touches[0].clientY}px - 20px)`;
    dragPreview.style.display = "none";

    document.body.appendChild(dragPreview);
    cardElement.addEventListener("touchmove", handleTouchMove, { passive: false });
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    const dragPreview = document.getElementById("touch-ghost");
    if (!dragPreview || draggingElementRef.current === null) return;
    const { clientX, clientY } = event.touches[0];
    const isOffScreen = clientX === 0 && clientY === 0;
    dragPreview.style.display = isOffScreen ? "none" : "block";
    dragPreview.style.left = `calc(${clientX}px - 38.5px)`;
    dragPreview.style.top = `calc(${clientY}px - 20px)`;
    if (!isOffScreen) {
      const overElements = document.elementsFromPoint(clientX, clientY);
      const overIds = overElements.map(e => e.id);
      setLogs(draft => [...draft, overIds]);
      setIsOverBoard(overIds.includes("myBoard") && !overIds.includes("hand"));
    }
  };

  const playActionOrRentCard = (card: TCard, index: number) => {
    const playCard = (
      otherOptions: Partial<Extract<Payloads, { type: "playCard" }>["payload"]> = {}
    ) => {
      dispatch({ type: "playCard", payload: { playerId: id, index, ...otherOptions } });
    };
    if (card.type === "rent") {
      const playRentCard = (targetedPlayerId?: string) => (color: SolidColor) => {
        const amountOfPropertiesInSet = (propertiesMap[color] ?? []).length;
        const modifiersForColor = fullSets[color]
          ? setModifiers[color]?.reduce((total, { value }) => total + value, 0) ?? 0
          : 0;
        const amountToCharge = amountOfPropertiesInSet
          ? stagesMap[color][Math.min(amountOfPropertiesInSet - 1, stagesMap[color].length - 1)] +
            modifiersForColor
          : 0;
        playCard({
          amountToCharge,
          targetedPlayerId,
          destinationColor: color,
        });
      };
      if (Array.isArray(card.color)) {
        const options = card.color.reduce<ColorOptions[]>(
          (acc, color) => [...acc, { color, amountInSet: propertiesMap[color]?.length ?? 0 }],
          []
        );
        setChooseColorOptions({
          colorOptions: options,
          isRent: true,
          onChoose: playRentCard(),
        });
      } else {
        setChoosePlayer({
          onChoose: playerId => {
            setChooseColorOptions({
              colorOptions: allColorOptions,
              isRent: true,
              onChoose: playRentCard(playerId),
            });
          },
        });
      }
    } else {
      switch (card.id) {
        // deal breaker
        case 24:
          setChoosePlayer({
            onChoose: targetedPlayerId => {
              const targetedPlayer = playersMap[targetedPlayerId];
              setChooseCards({
                player: targetedPlayer,
                otherPlayer: thisPlayer,
                title: (
                  <ColoredText
                    sentence="Click one full set in order to steal"
                    coloredWords={["full set", "steal"]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                onChoose: color => {
                  playCard({ targetedPlayerId, destinationColor: color });
                  closeChooseCards();
                },
                isSet: true,
                secondaryAction: {
                  label: "Undo",
                  action: closeChooseCards,
                },
              });
            },
          });
          break;
        // sly deal
        case 26:
          setChoosePlayer({
            onChoose: targetedPlayerId => {
              const targetedPlayer = playersMap[targetedPlayerId];
              setChooseCards({
                player: targetedPlayer,
                otherPlayer: thisPlayer,
                title: (
                  <ColoredText
                    sentence={`Select one of ${targetedPlayer.nickname}'s cards to take`}
                    coloredWords={[`${targetedPlayer.nickname}'s`]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                clickBehavior: "reset",
                isSet: false,
                primaryAction: {
                  label: "Take Card",
                  action: selectedProperties => {
                    const targetedIndex = selectedProperties.findIndex(val => val);
                    playCard({ targetedPlayerId, targetedIndex });
                    closeChooseCards();
                  },
                  disabled: selectedProperties => !selectedProperties.some(val => val),
                },
                secondaryAction: {
                  label: "Undo",
                  action: closeChooseCards,
                },
              });
            },
          });
          break;
        // forced deal
        case 27:
          setChoosePlayer({
            onChoose: targetedPlayerId => {
              const targetedPlayer = playersMap[targetedPlayerId];
              setChooseCards({
                player: targetedPlayer,
                otherPlayer: thisPlayer,
                title: (
                  <ColoredText
                    sentence={`Select one of ${targetedPlayer.nickname}'s cards to take`}
                    coloredWords={[`${targetedPlayer.nickname}'s`]}
                    color={targetedPlayer.displayHex}
                  />
                ),
                clickBehavior: "reset",
                otherTitle: (
                  <Box sx={{ marginTop: 1 }}>
                    <ColoredText
                      sentence="Select one of Your cards to give"
                      coloredWords={["Your"]}
                      color={targetedPlayer.displayHex}
                    />
                  </Box>
                ),
                otherCards: properties,
                otherFilter: card => {
                  const { color, actingColor } = card as PropertyCard;
                  const colorToUse = actingColor ?? (color as SolidColor);
                  return !fullSets[colorToUse];
                },
                otherClickBehavior: "reset",
                isSet: false,
                primaryAction: {
                  label: "Swap",
                  action: (selectedProperties, selectedOtherCards) => {
                    const targetedIndex = selectedProperties.findIndex(val => val);
                    const ownIndex = selectedOtherCards.findIndex(val => val);
                    playCard({ targetedPlayerId, targetedIndex, ownIndex });
                    closeChooseCards();
                  },
                  disabled: (selectedProperties, selectedOtherCards) => {
                    return (
                      !selectedProperties.some(val => val) || !selectedOtherCards.some(val => val)
                    );
                  },
                },
                secondaryAction: {
                  label: "Undo",
                  action: closeChooseCards,
                },
              });
            },
          });
          break;
        case 28:
          setChoosePlayer({
            onChoose: targetedPlayerId => playCard({ targetedPlayerId }),
          });
          break;
        case 29:
        case 30:
          setChooseCards({
            player: thisPlayer,
            title: (
              <Typography color="white">{`Choose a set to add this ${
                card.id === 30 ? "House" : "Hotel"
              } to`}</Typography>
            ),
            secondaryAction: {
              label: "Undo",
              action: closeChooseCards,
            },
            onChoose: color => {
              playCard({ destinationColor: color });
              setChooseCards(undefined);
            },
            isSet: true,
          });
          break;
        default:
          playCard();
      }
    }
  };

  const playAnyCard = (card: TCard, index: number) => {
    if (!thisPlayerMovesLeft) return;
    if (card.type === "property" && card.color === "rainbow") {
      if (!properties.length) {
        // Display alert that you can't play a rainbow without properties
        return;
      }
      setChooseColorOptions({
        colorOptions: allColorOptions,
        onChoose: color => {
          dispatch({
            type: "playCard",
            payload: { playerId: id, index, destinationColor: color },
          });
        },
      });
    } else if (card.type === "property" || card.type === "money") {
      dispatch({
        type: "playCard",
        payload: {
          playerId: id,
          index,
          destinationColor:
            card.type === "property" && Array.isArray(card.color) ? card.color[0] : undefined,
        },
      });
    } else {
      setChooseActionOrMoney({
        action: () => {
          playActionOrRentCard(card, index);
          setChooseActionOrMoney(undefined);
        },
        money: () => {
          dispatch({
            type: "playCard",
            payload: { playerId: id, index, asMoney: true },
          });
          setChooseActionOrMoney(undefined);
        },
      });
    }
  };

  const cleanupDrag = () => {
    setIsOverBoard(false);
    setDraggingElement(undefined);
    draggingElementRef.current = null;
    const ghost = document.getElementById("drag-ghost");
    if (ghost?.parentNode) ghost.parentNode.removeChild(ghost);
    const emptyDiv = document.getElementById("empty-div");
    if (emptyDiv?.parentNode) emptyDiv.parentNode.removeChild(emptyDiv);
    const touchGhost = document.getElementById("touch-ghost");
    if (touchGhost?.parentNode) touchGhost.parentNode.removeChild(touchGhost);
  };
  const dragExit = () => {
    setIsOverBoard(false);
  };

  const debouncedScrollIntoView = _.debounce(() => lastMessageRef.current?.scrollIntoView(), 300);

  return (
    <Box
      className="custom-scrollbar"
      sx={{ overflowY: "auto", padding: 4, paddingTop: 0, height: "100svh" }}
    >
      <SwipeableDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpen={() => setIsDrawerOpen(true)}
        disableBackdropTransition={!iOS}
        disableDiscovery={iOS}
        sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}
      >
        <Box sx={{ maxWidth: 200, color: "white" }}>
          <List>
            {["How To Play", "View Card Frequency", "Leave Game"].map((text, index) => {
              let Icon = Info;
              let onClick;
              switch (index) {
                case 0:
                  Icon = Info;
                  onClick = () =>
                    window.open("https://monopolydealrules.com/index.php?page=general", "_blank");
                  break;
                case 1:
                  Icon = Settings;
                  onClick = onShowConfig;
                  break;
                case 2:
                  Icon = Logout;
                  onClick = () => setShowLeaveConfirm(true);
              }
              return (
                <ListItem key={text}>
                  <ListItemButton
                    sx={{ ":hover": { backgroundColor: "rgba(0,0,0,0.25)" } }}
                    onClick={onClick}
                  >
                    <ListItemIcon>
                      <Icon sx={{ color: "white" }} />
                    </ListItemIcon>
                    <ListItemText>{text}</ListItemText>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          {isDev && <Box display='flex' justifyContent='center' typography='body1'>{clientId}</Box>}
        </Box>
      </SwipeableDrawer>
      <SwipeableDrawer
        anchor="right"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onOpen={() => setIsChatOpen(true)}
        disableBackdropTransition={!iOS}
        disableSwipeToOpen={false}
        sx={{ ".MuiPaper-root": { backgroundColor: "grey.900" } }}
      >
        <Stack
          sx={{
            width: 200,
            color: "white",
            padding: 1,
            paddingRight: 0,
            overflow: "hidden",
            height: "100%",
          }}
        >
          <Stack
            className="custom-scrollbar"
            sx={{ gap: 1, overflowY: "auto", overflowX: "hidden", paddingRight: 1, flex: 1 }}
          >
            {!isDev && messages.map(({ id: messageId, content }, index) => {
              const {
                nickname: messagingPlayerNickname = messageId,
                displayHex: messagingPlayerDisplayHex = "rgb(51, 51, 51)",
              } = playersMap[messageId as string] ?? {};
              const isContentSmall = messagingPlayerNickname.length - 1 >= content.length;
              return (
                <Stack
                  key={index}
                  sx={{
                    maxWidth: 140,
                    alignSelf: id === messageId ? "flex-end" : "flex-start",
                    ...(isContentSmall && { alignItems: "center" }),
                  }}
                >
                  {messageId !== "game" && (
                    <Typography
                      sx={{
                        marginLeft: 0.75,
                        marginBottom: "-2px",
                        padding: 0.5,
                        borderRadius: 1,
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        border: `2px solid ${messagingPlayerDisplayHex}`,
                        width: "fit-content",
                        fontSize: 6,
                        backgroundColor: messagingPlayerDisplayHex,
                        ...(isContentSmall && {
                          marginLeft: 0,
                          borderBottomLeftRadius: "4px",
                          borderBottomRightRadius: "4px",
                        }),
                        ...(!isContentSmall &&
                          id === messageId && {
                            alignSelf: "flex-end",
                            marginLeft: 0,
                            marginRight: 0.75,
                          }),
                      }}
                    >
                      {messagingPlayerNickname}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      padding: 1,
                      borderRadius: 2,
                      border: `2px solid ${messagingPlayerDisplayHex}`,
                      width: "fit-content",
                      fontSize: 8,
                    }}
                  >
                    {content}
                  </Typography>
                </Stack>
              );
            })}
            {isDev &&
              logs.map((log, index) => (
                <Typography
                  key={index}
                  sx={{
                    padding: 1,
                    borderRadius: 2, fontSize: 8,
                  }}>{JSON.stringify(log)}</Typography>))}
            <div ref={lastMessageRef} />
          </Stack>
          <TextField
            value={chatMessage}
            onChange={e => {
              setChatMessage(e.target.value);
              debouncedScrollIntoView();
            }}
            onKeyUp={e => {
              if ((e.key === "Enter" || e.key === "Return") && chatMessage) {
                dispatch({ type: "sendMessage", payload: { id, content: chatMessage } });
                setChatMessage("");
              }
            }}
            placeholder="write message"
            size="small"
            color="secondary"
            sx={{
              marginRight: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 0,
                "& fieldset": {
                  borderColor: "grey.400",
                },
                "&:hover fieldset": {
                  borderColor: "grey.200",
                },
              },
            }}
            inputProps={{ sx: { color: "grey.400", fontSize: 12 } }}
          />
        </Stack>
      </SwipeableDrawer>
      <Dialog
        open={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        sx={{ "& .MuiPaper-root": { maxWidth: 400 } }}
      >
        <DialogContent>
          <DialogContentText>Are you sure you want to leave the game?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setShowLeaveConfirm(false);
              onLeave();
            }}
          >
            Leave Game
          </Button>
        </DialogActions>
      </Dialog>
      {chooseCards && <ChooseCards {...chooseCards} />}
      {chooseColorOptions && (
        <Dialog open sx={{ borderRadius: 4 }} onClose={() => setChooseColorOptions(undefined)}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              padding: 4,
              backgroundColor: "grey.900",
              gap: 1,
            }}
          >
            {chooseColorOptions.colorOptions.map(({ color, amountInSet }, index) => {
              const modifiersForColor = fullSets[color]
                ? setModifiers[color]?.reduce((total, { value }) => total + value, 0) ?? 0
                : 0;
              const amountToCharge = amountInSet
                ? stagesMap[color][Math.min(amountInSet - 1, stagesMap[color].length - 1)] +
                  modifiersForColor
                : 0;
              return (
                <Box
                  key={index}
                  className="perfect-center"
                  onClick={() => {
                    chooseColorOptions.onChoose(color);
                    setChooseColorOptions(undefined);
                  }}
                  sx={{
                    flexDirection: "column",
                    width: 100,
                    height: 100,
                    backgroundColor: colorToColor[color],
                    userSelect: "none",
                    color: "white",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                >
                  <Typography>{color.replace("_", " ")}</Typography>
                  {chooseColorOptions.isRent && (
                    <Typography>{amountToCharge * rentModifier}M</Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Dialog>
      )}
      {chooseActionOrMoney && (
        <Dialog open sx={{ ".MuiPaper-root": { borderRadius: 2 } }}>
          <Box
            sx={{
              backgroundColor: "grey.900",
              borderRadius: 2,
              border: "2px solid",
              borderColor: "primary.main",
              padding: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <ColoredText
              sentence="You have some options"
              coloredWords={["options"]}
              color="primary.main"
            />
            <ColoredText
              sentence="The card you're playing can be used as an action card, or played as if it were just money"
              coloredWords={["action card", "money"]}
              color="primary.main"
              sx={{ fontSize: 10 }}
            />
            <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
              <Button color="success" sx={{ fontSize: 8 }} onClick={chooseActionOrMoney.action}>
                Play As Action
              </Button>
              <Button color="success" sx={{ fontSize: 8 }} onClick={chooseActionOrMoney.money}>
                Play As Money
              </Button>
              <Button
                color="error"
                sx={{ fontSize: 8 }}
                onClick={() => setChooseActionOrMoney(undefined)}
              >
                Undo
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
      {stagedAction && (
        <StagedActionDialog
          stagedAction={stagedAction}
          currentPlayer={players[currentPlayerIndex]}
          targetedPlayer={thisPlayer}
          sayNo={() =>
            dispatch({
              type: "sayNo",
              payload: { isTarget: true, targetedPlayerId: id, currentPlayerId },
            })
          }
          letItHappen={() => dispatch({ type: "giveUpCards", payload: stagedAction })}
        />
      )}
      {((isThisPlayersTurn && otherPlayerHasAction) || currentPlayerNos.includes(id)) && (
        <Dialog
          open
          sx={{ ".MuiPaper-root": { borderRadius: 2 }, zIndex: theme => theme.zIndex.modal + 1 }}
        >
          <Box
            sx={{
              borderRadius: 2,
              border: "2px solid yellow",
              backgroundColor: "grey.900",
              padding: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography sx={{ color: "white", marginBottom: 1 }}>
              {isThisPlayersTurn ? "You've just targeted someone!" : "You've just said no!"}
            </Typography>
            {!isThisPlayersTurn && (
              <ColoredText
                sentence="Good news, you may have just avoided an action"
                coloredWords={["Good news"]}
                color="success.main"
                sx={{ fontSize: 10 }}
              />
            )}
            <ColoredText
              sentence="But if the other player or players have a Just Say No! card, they can say no to you even if you've used a Just Say No! card against them"
              coloredWords={["they can say no to you"]}
              color="error.main"
              sx={{ fontSize: 10 }}
            />
            <Typography sx={{ color: "white", fontSize: 10 }}>
              This interface will appear whether or not they have a Just Say No! in their hand.
            </Typography>
          </Box>
        </Dialog>
      )}
      {nos?.length && (
        <Dialog
          open
          sx={{ ".MuiPaper-root": { borderRadius: 2 }, zIndex: theme => theme.zIndex.modal + 2 }}
        >
          <Box
            sx={{
              borderRadius: 2,
              border: "2px solid",
              borderColor: "primary.main",
              backgroundColor: "grey.900",
              padding: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography sx={{ color: "white", marginBottom: 1 }}>{`${
              playersMap[nos[0]].nickname
            } just said no to you!`}</Typography>
            <ColoredText
              sentence="You can say no to their say no, and put the heat back on them!"
              coloredWords={["say no to their say no"]}
              color="success.main"
              sx={{ fontSize: 10 }}
            />
            <ColoredText
              sentence="This would not take up one of your 3 plays you can do each turn"
              coloredWords={["not take up"]}
              color="success.main"
              sx={{ fontSize: 10 }}
            />
            <ColoredText
              sentence="If you don't say no, this player get's to avoid your action"
              coloredWords={["get's to avoid your action"]}
              color="error.main"
              sx={{ fontSize: 10 }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-around", marginTop: 2 }}>
              <Button
                className={!hand.length || !hand.some(({ id }) => id === 25) ? "disabled" : ""}
                color="success"
                onClick={() =>
                  dispatch({
                    type: "sayNo",
                    payload: { isTarget: false, currentPlayerId, targetedPlayerId: nos[0] },
                  })
                }
                sx={{ fontSize: 8 }}
              >
                Say No Back!
              </Button>
              <Button
                color="error"
                onClick={() =>
                  dispatch({
                    type: "acceptNo",
                    payload: { currentPlayerId, targetedPlayerId: nos[0] },
                  })
                }
                sx={{ fontSize: 8 }}
              >
                Accept You've Been No'd
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
      <Box
        sx={{
          marginX: -4,
          marginBottom: 2,
          padding: 2,
          display: "flex",
          alignItems: "center",
          backgroundColor: "black",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => setIsDrawerOpen(true)} color="secondary">
            <Menu />
          </IconButton>
        </Box>
        <Box className="perfect-center" sx={{ flex: 2, flexDirection: "column" }} onClick={e => {
          if (e.detail >= 3) setIsDev(!isDev);
        }}>
          {choosePlayer ? (
            <Typography sx={{ fontSize: 10, color: "#16c6fe" }}>
              Tap the board of the player you want to target
            </Typography>
          ) : (
            <>
              <ColoredText
                sentence={`${deck.length} card${deck.length === 1 ? "" : "s"} in deck`}
                coloredWords={[`${deck.length}`]}
                color="success.main"
                sx={{ fontSize: 12 }}
              />
              <ColoredText
                sentence={`${discard.length} card${discard.length === 1 ? "" : "s"} discarded`}
                coloredWords={[`${discard.length}`]}
                color="error.main"
                sx={{ fontSize: 10 }}
              />
            </>
          )}
        </Box>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <IconButton onClick={() => setIsChatOpen(true)} color="secondary">
            {isDev ? <Build /> : unread ? <MarkUnreadChatAlt /> : <Chat />}
          </IconButton>
        </Box>
      </Box>
      <Box
        className="custom-scrollbar"
        sx={{ display: "flex", overflowX: "auto", paddingBottom: 0.75 }}
      >
        {otherPlayers.map(otherPlayer => (
          <Board
            key={otherPlayer.id}
            player={otherPlayer}
            sx={{ zoom: 0.7, marginRight: 1, flexShrink: 0 }}
            onClick={({ id }) => {
              choosePlayer?.onChoose(id);
              setChoosePlayer(undefined);
            }}
          />
        ))}
      </Box>
      <div
        id="myBoard"
        onDragOver={e => {
          e.preventDefault();
          setIsOverBoard(true);
        }}
        onDragExit={dragExit}
        onDragLeave={dragExit}
        onDrop={e => {
          e.preventDefault();
          if (draggingElement === undefined) return;
          const card = hand[draggingElement];
          playAnyCard(card, draggingElement);
          cleanupDrag();
        }}
        style={{ marginTop: 1 }}
      >
        <Board
          player={thisPlayer}
          myBoard
          isTurn={isThisPlayersTurn}
          onFlip={(card, index) => {
            if (card.type === "property" && card.color === "rainbow") {
              setChooseColorOptions({
                colorOptions: allColorOptions,
                onChoose: chosenColor =>
                  dispatch({
                    type: "flipPropertyCard",
                    payload: {
                      playerId: id,
                      index,
                      destinationColor: chosenColor,
                    },
                  }),
              });
            } else if (card.type === "property" && Array.isArray(card.color)) {
              dispatch({
                type: "flipPropertyCard",
                payload: {
                  playerId: id,
                  index,
                  destinationColor: card.color.filter(color => color !== card.actingColor)[0],
                },
              });
            }
          }}
          sx={
            isOverBoard
              ? { backgroundColor: isThisPlayersTurn ? "lightgreen" : "red", pointerEvents: "none" }
              : undefined
          }
        />
      </div>
      {/* Hand Section */}
      <Box
        id="hand"
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "grey.900",
          marginTop: 3,
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          paddingX: 1.5,
          paddingY: 1,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          boxShadow: 2,
          overflowX: "hidden",
          zIndex: 3,
        }}
      >
        <Box className="perfect-center">
          <Button
            variant="text"
            sx={{ fontSize: 8, paddingY: 0, color: "white" }}
            startIcon={<Loop />}
            onClick={() => setCardsReversed(!cardsReversed)}
          >
            Flip Cards
          </Button>
        </Box>
        <Box
          className="custom-scrollbar"
          ref={cardContainerRef}
          sx={{
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            overscrollBehaviorX: "none",
            height: "100%",
          }}
        >
          {/* Game Info */}
          <Box
            sx={{
              display: "flex",
              height: "100%",
              flexShrink: 0,
              position: "sticky",
              top: 0,
              left: 0,
              zIndex: 4,
              backgroundColor: "grey.900",
              ...(scrolled && { boxShadow: "0px 0px 2px #333" }),
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: isThisPlayersTurn ? "space-between" : "center",
                paddingY: 2,
                maxWidth: 70,
              }}
            >
              <Box>
                <ColoredText
                  sentence={`${currentPlayerNickname} has ${movesLeft} move${
                    movesLeft === 1 ? "" : "s"
                  } left`}
                  coloredWords={[currentPlayerNickname]}
                  color={displayHex}
                  sx={{ fontSize: 10, marginBottom: 1 }}
                />
                {!!playersWithRent.length && (
                  <ColoredText
                    sentence={`${playersWithRent.length} player${
                      playersWithRent.length === 1 ? "" : "s"
                    } need${playersWithRent.length === 1 ? "s" : ""} to pay rent`}
                    coloredWords={[
                      `${playersWithRent.length} player${playersWithRent.length === 1 ? "" : "s"}`,
                    ]}
                    color="error.main"
                    sx={{ fontSize: 10, marginBottom: 1 }}
                  />
                )}
                {currentPlayerRentModifier !== 1 && (
                  <Typography
                    sx={{ color: "error.main", fontSize: 12, marginBottom: 1 }}
                  >{`${currentPlayerRentModifier}x Rent`}</Typography>
                )}
                <ColoredText
                  sentence={`${nextPlayer.nickname} is up next`}
                  coloredWords={[nextPlayer.nickname]}
                  color={nextPlayer.displayHex}
                  sx={{ fontSize: 8 }}
                />
              </Box>
              {isThisPlayersTurn && (
                <Button
                  className={playerChargingRentId === id ? "disabled" : ""}
                  color="error"
                  sx={{ fontSize: 8 }}
                  onClick={() => {
                    if (moreThan7) {
                      setChooseCards({
                        player: thisPlayer,
                        cards: hand,
                        skipFullSetFilter: true,
                        cardSx: {
                          ":not(.selected):hover::after": {
                            position: "absolute",
                            content: "'X'",
                            inset: 0,
                            background: "red",
                            color: "white",
                            borderRadius: 2,
                            opacity: 0.9,
                            fontSize: 72,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            zIndex: 5,
                          },
                        },
                        title: (
                          <ColoredText
                            sentence="You have more than 7 cards. Click to discard cards, or close this modal and play cards (if you can)"
                            coloredWords={["Click to discard cards"]}
                            color="red"
                            sx={{ fontSize: 12 }}
                          />
                        ),
                        clickBehavior: "toggle",
                        isSet: false,
                        primaryAction: {
                          label: "Discard Cards",
                          action: selectedCards => {
                            dispatch({
                              type: "discardCards",
                              payload: { playerId: id, selectedCards },
                            });
                            closeChooseCards();
                          },
                          disabled: selectedProperties => {
                            const totalSelected = selectedProperties.reduce(
                              (total, val) => (val ? total + 1 : total),
                              0
                            );
                            return hand.length - totalSelected !== 7;
                          },
                        },
                        secondaryAction: {
                          label: "Close",
                          action: closeChooseCards,
                        },
                      });
                    } else {
                      dispatch({ type: "endTurn", payload: currentPlayerIndex });
                    }
                  }}
                >
                  {moreThan7 ? "Discard and End Turn" : "End Turn"}
                </Button>
              )}
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ backgroundColor: "white", marginX: 1.5, marginY: 2 }}
            />
          </Box>
          {/* Cards in Hand */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginLeft: 1,
              ...(playerChargingRentId === id && { opacity: 0.2 }),
            }}
          >
            {hand.map((card, index) => {
              const id = `${card.id}-${index}`;
              return (
                <div
                  key={id}
                  id={id}
                  className={clsx(["hand-card", { reversed: cardsReversed }])}
                  draggable={!cardsReversed}
                  onDragStart={e => handleDragStart(e, index, card.id)}
                  onDragEnd={cleanupDrag}
                  onTouchStart={e => handleTouchStart(e, index, card.id)}
                  onTouchEnd={() => {
                    if (cardsReversed) return;
                    cleanupDrag();
                    const thisElement = document.getElementById(id);
                    // @ts-ignore
                    thisElement?.removeEventListener("touchmove", handleTouchMove, {
                      passive: false,
                    });
                    if (isOverBoard && draggingElement !== undefined) {
                      playAnyCard(hand[draggingElement], draggingElement);
                    }
                  }}
                >
                  <Card
                    card={card}
                    onFlip={() =>
                      dispatch({
                        type: "flipHandCard",
                        payload: { playerId: thisPlayer.id, index },
                      })
                    }
                    sx={draggingElement === index ? { opacity: 0.2 } : undefined}
                    isHand
                  />
                </div>
              );
            })}
          </Box>
        </Box>
      </Box>
      <Box sx={{ height: 200 }} />
    </Box>
  );
};

export default Game;
