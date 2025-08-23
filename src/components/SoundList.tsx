import React from 'react';
import { Box, Text } from 'ink';
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
  if (sounds.length === 0) {
    return (
      <Box>
        <Text color="gray">No sounds found</Text>
      </Box>
    );
  }

  // Calculate visible window (show 10 items at a time)
  const windowSize = 10;
  const startIndex = Math.max(0, Math.min(selectedIndex - Math.floor(windowSize / 2), sounds.length - windowSize));
  const endIndex = Math.min(sounds.length, startIndex + windowSize);
  const visibleSounds = sounds.slice(startIndex, endIndex);

  return (
    <Box flexDirection="column">
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
          <Box key={`sound-${sound.id}-${actualIndex}`}>
            <Box width={3}>
              {isCurrentlyPlaying && <Text color="green">▶ </Text>}
              {isSelected && !isCurrentlyPlaying && <Text color="cyan">→ </Text>}
              {!isSelected && !isCurrentlyPlaying && <Text>  </Text>}
            </Box>
            
            <Box flexGrow={1}>
              <Text
                color={isSelected ? 'cyan' : isCurrentlyPlaying ? 'green' : 'white'}
                bold={isSelected || isCurrentlyPlaying}
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