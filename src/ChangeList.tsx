import { Box, Typography } from "@mui/material";

interface ChangeListProps {
  title: string;
  list: string[];
  italic?: boolean;
}

const ChangeList = ({ title, list, italic }: ChangeListProps) => {
  return (
    <Box>
      <Typography color="white" fontSize={14} {...(italic && { fontStyle: "italic" })}>
        {title}
      </Typography>
      <ul>
        {list.map((item, index) => (
          <li key={index} style={{ color: "white", fontSize: 12 }}>
            {item}
          </li>
        ))}
      </ul>
    </Box>
  );
};
export default ChangeList;
