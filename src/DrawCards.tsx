import { toPng } from "html-to-image";
import Card from "./Card";
import cards from "./cards.json";
import type { TCard } from "./gameReducer";
// @ts-ignore
import download from "downloadjs";

const DrawCards = () => {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginBottom: 16 }}>
        {cards.map((card, index) => (
          <div key={index} id={`${index}`} style={{ flexShrink: 0, padding: 4 }}>
            <Card
              card={
                {
                  ...card,
                  ...(card.type === "property" &&
                    Array.isArray(card.color) && { actingColor: card.color[1] }),
                } as TCard
              }
              sx={{ zoom: 1.2, ":hover": {} }}
              onClick={() => {
                toPng(document.getElementById(`${index}`)!).then(dataUrl => {
                  download(dataUrl, `${index}-flipped.png`);
                });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
export default DrawCards;
