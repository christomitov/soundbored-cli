import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => {
  return (
    <Box width="100%">
      <Box marginRight={1}>
        <Text color="yellow">›</Text>
      </Box>
      <Box flexGrow={1}>
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          showCursor
        />
      </Box>
    </Box>
  );
};

export default SearchInput;