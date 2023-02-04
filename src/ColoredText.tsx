import { Theme, Typography } from "@mui/material";
import { SystemStyleObject } from "@mui/system";

interface ColoredTextProps {
  sentence: string;
  coloredWords: string[];
  color: string;
  sx?: SystemStyleObject<Theme>;
}

const ColoredText = ({ sentence, coloredWords, color, sx }: ColoredTextProps) => {
  let separated = [sentence];
  coloredWords.forEach(word => {
    const last = separated.pop() as string;
    const split = last.split(word);
    separated = [...separated, split[0], word, split[1]];
  });
  const result = separated.map(word =>
    coloredWords.includes(word) ? (
      <Typography key={word} fontSize="inherit" fontWeight="medium" component="span" sx={{ color }}>
        {word}
      </Typography>
    ) : (
      word
    )
  );
  return <Typography sx={{ color: "white", ...sx }}>{result}</Typography>;
};

export default ColoredText;
