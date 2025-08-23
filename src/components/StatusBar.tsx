import React from 'react';
import { Box, Text } from 'ink';
import { Sound } from '../types';

interface StatusBarProps {
  totalSounds: number;
  filteredSounds: number;
  ctrlCPressed: boolean;
  isPlaying: boolean;
  lastPlayedSound: Sound | null;
}

const StatusBar: React.FC<StatusBarProps> = ({
  totalSounds,
  filteredSounds,
  ctrlCPressed,
  isPlaying,
  lastPlayedSound,
}) => {
  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      flexDirection="column"
      width="100%"
    >
      <Box justifyContent="space-between" width="100%">
        <Box>
          <Text color="gray">
            {filteredSounds}/{totalSounds} sounds
          </Text>
          
          {isPlaying && lastPlayedSound && (
            <Text color="green">
              {' '} • Playing: {lastPlayedSound.filename}
            </Text>
          )}
        </Box>

        <Box>
          {ctrlCPressed ? (
            <Text color="yellow">Press Ctrl+C again to exit</Text>
          ) : (
            <Text color="gray" wrap="truncate">
              ↑↓ Nav • PgUp/Dn ±10 • Enter Play • Ctrl+C Clear • ESC Exit
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StatusBar;