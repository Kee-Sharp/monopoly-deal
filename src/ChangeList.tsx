import { Box, Typography } from "@mui/material";

interface ChangeListProps {
  title: string;
  list: string[];
}

const ChangeList = ({ title, list }: ChangeListProps) => {
  return (
    <Box>
      <Typography color="white" fontSize={14}>
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
