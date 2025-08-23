import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { Sound } from '../types';

interface SoundListProps {
  sounds: Sound[];
  selectedIndex: number;
  onSelect: (sound: Sound) => void;
  isPlaying: boolean;
  lastPlayedSound: Sound | null;
}

const SoundList: React.FC<SoundListProps> = ({ 
  sounds, 
  selectedIndex, 
  onSelect, 
  isPlaying,
  lastPlayedSound 
}) => {
  const { stdout } = useStdout();
  
  if (sounds.length === 0) {
    return (
      <Box>
        <Text color="gray">No sounds found</Text>
      </Box>
    );
  }

  // Calculate visible window based on terminal height
  // Reserve lines for: header (2), search (2), status bar (2), padding (2)
  const reservedLines = 8;
  const terminalHeight = stdout?.rows || 24;
  const windowSize = Math.max(5, Math.min(sounds.length, terminalHeight - reservedLines));
  
  // Center the selected item in the visible window when possible
  let startIndex = 0;
  if (sounds.length > windowSize) {
    // Try to center the selected item
    startIndex = selectedIndex - Math.floor(windowSize / 2);
    // Ensure we don't go past the beginning
    startIndex = Math.max(0, startIndex);
    // Ensure we don't leave empty space at the bottom
    startIndex = Math.min(startIndex, sounds.length - windowSize);
  }
  
  const endIndex = Math.min(sounds.length, startIndex + windowSize);
  const visibleSounds = sounds.slice(startIndex, endIndex);

  return (
    <Box flexDirection="column" width="100%">
      {startIndex > 0 && (
        <Text color="gray" dimColor>
          ↑ {startIndex} more...
        </Text>
      )}
      
      {visibleSounds.map((sound, index) => {
        const actualIndex = startIndex + index;
        const isSelected = actualIndex === selectedIndex;
        const isCurrentlyPlaying = isPlaying && lastPlayedSound?.id === sound.id;
        
        return (
          <Box key={`sound-${sound.id}-${actualIndex}`} width="100%">
            <Box width={3}>
              {isCurrentlyPlaying && <Text color="green">▶ </Text>}
              {isSelected && !isCurrentlyPlaying && <Text color="cyan">→ </Text>}
              {!isSelected && !isCurrentlyPlaying && <Text>  </Text>}
            </Box>
            
            <Box flexGrow={1}>
              <Text
                color={isSelected ? 'cyan' : isCurrentlyPlaying ? 'green' : 'white'}
                bold={isSelected || isCurrentlyPlaying}
                wrap="truncate"
              >
                {sound.filename}
              </Text>
              
              {sound.tags && sound.tags.length > 0 && (
                <Text color="blue" dimColor={!isSelected}>
                  {' '}[{sound.tags.join(', ')}]
                </Text>
              )}
            </Box>
          </Box>
        );
      })}
      
      {endIndex < sounds.length && (
        <Text color="gray" dimColor>
          ↓ {sounds.length - endIndex} more...
        </Text>
      )}
    </Box>
  );
};

export default SoundList;