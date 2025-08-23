import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import SearchInput from './SearchInput';
import SoundList from './SoundList';
import StatusBar from './StatusBar';
import { fetchSounds, playSound } from '../services/api';
import { Sound } from '../types';
import fuzzy from 'fuzzy';

interface AppProps {
  initialQuery?: string;
}

const App: React.FC<AppProps> = ({ initialQuery = '' }) => {
  const { exit } = useApp();
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastPlayedSound, setLastPlayedSound] = useState<Sound | null>(null);
  const [ctrlCPressed, setCtrlCPressed] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');

  // Load sounds on mount
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const data = await fetchSounds();
        setSounds(data);
        setFilteredSounds(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sounds');
        setLoading(false);
      }
    };
    loadSounds();
  }, []);

  // Filter sounds based on search query
  useEffect(() => {
    // Use lastSearchQuery for filtering if search input is empty but we had a previous search
    const queryToFilter = searchQuery || lastSearchQuery;
    
    if (!queryToFilter) {
      setFilteredSounds(sounds);
      setSelectedIndex(0);
      return;
    }

    const fuzzyResult = fuzzy.filter(queryToFilter, sounds, {
      extract: (sound) => `${sound.filename} ${sound.tags?.join(' ') || ''}`,
    });

    setFilteredSounds(fuzzyResult.map(r => r.original));
    setSelectedIndex(0);
  }, [searchQuery, lastSearchQuery, sounds]);

  // Handle playing a sound
  const handlePlaySound = useCallback(async (sound: Sound) => {
    setIsPlaying(true);
    setLastPlayedSound(sound);
    try {
      await playSound(sound.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play sound');
    } finally {
      setIsPlaying(false);
    }
  }, []);

  // Handle keyboard input including Ctrl+C
  useInput((input: string, key: any) => {
    // Handle Ctrl+C
    if (key.ctrl && input === 'c') {
      if (searchQuery || lastSearchQuery) {
        // First Ctrl+C: clear search and results
        setSearchQuery('');
        setLastSearchQuery('');
        setCtrlCPressed(false);
      } else if (ctrlCPressed) {
        // Second Ctrl+C: exit
        exit();
      } else {
        // First Ctrl+C with no search: show message
        setCtrlCPressed(true);
        setTimeout(() => setCtrlCPressed(false), 2000);
      }
      return;
    }
    
    // Reset Ctrl+C state on other keys
    setCtrlCPressed(false);

    // Navigation keys
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filteredSounds.length - 1, prev + 1));
    } else if (key.pageUp) {
      // Page Up - move up by 10 items
      setSelectedIndex((prev) => Math.max(0, prev - 10));
    } else if (key.pageDown) {
      // Page Down - move down by 10 items
      setSelectedIndex((prev) => Math.min(filteredSounds.length - 1, prev + 10));
    } else if (input === 'k' || (key.shift && key.upArrow)) {
      // Vim-style up or Shift+Up for faster movement
      setSelectedIndex((prev) => Math.max(0, prev - 5));
    } else if (input === 'j' || (key.shift && key.downArrow)) {
      // Vim-style down or Shift+Down for faster movement
      setSelectedIndex((prev) => Math.min(filteredSounds.length - 1, prev + 5));
    } else if (input === 'g') {
      // Jump to top
      setSelectedIndex(0);
    } else if (input === 'G') {
      // Jump to bottom
      setSelectedIndex(filteredSounds.length - 1);
    } else if (key.return && filteredSounds[selectedIndex]) {
      // Save the current search query before clearing
      if (searchQuery) {
        setLastSearchQuery(searchQuery);
        setSearchQuery('');
      }
      handlePlaySound(filteredSounds[selectedIndex]);
    } else if (key.escape) {
      if (searchQuery || lastSearchQuery) {
        setSearchQuery('');
        setLastSearchQuery('');
      } else {
        exit();
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="green">
            <Spinner type="dots" /> Loading sounds...
          </Text>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🎵 SoundBored CLI
        </Text>
        <Text color="gray"> - {sounds.length} sounds loaded</Text>
      </Box>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search sounds... (Ctrl+C to clear, ESC to exit)"
      />

      <Box flexGrow={1} flexDirection="column" marginY={1}>
        <SoundList
          sounds={filteredSounds}
          selectedIndex={selectedIndex}
          onSelect={handlePlaySound}
          isPlaying={isPlaying}
          lastPlayedSound={lastPlayedSound}
        />
      </Box>

      <StatusBar
        totalSounds={sounds.length}
        filteredSounds={filteredSounds.length}
        ctrlCPressed={ctrlCPressed}
        isPlaying={isPlaying}
        lastPlayedSound={lastPlayedSound}
      />
    </Box>
  );
};

export default App;