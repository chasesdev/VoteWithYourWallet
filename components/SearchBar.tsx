import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import Input from './ui/Input';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Card from './ui/Card';
import { transcribeAudio } from '../utils/api';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  showVoiceSearch?: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  popularity?: number;
  type: 'suggestion' | 'history';
  timestamp?: string;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onSearch,
  onFilter,
  placeholder = "Search businesses...",
  showFilters = true,
  showVoiceSearch = true,
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchSuggestion[]>([]);
  const [voiceSearchActive, setVoiceSearchActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSearchText, setVoiceSearchText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadSearchHistory();
    
    // Request audio permissions
    const requestPermissions = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Audio permissions not granted');
        }
      } catch (error) {
        console.error('Error requesting audio permissions:', error);
      }
    };
    
    requestPermissions();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      generateSuggestions(searchQuery);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('searchHistory');
      if (history) {
        const parsed = JSON.parse(history);
        setSearchHistory(parsed.slice(0, 10)); // Keep only last 10 searches
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveToSearchHistory = (query: string) => {
    if (!query.trim()) return;

    try {
      const newHistoryItem: SearchSuggestion = {
        id: Date.now().toString(),
        text: query,
        type: 'history',
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [
        newHistoryItem,
        ...searchHistory.filter(item => item.text.toLowerCase() !== query.toLowerCase()),
      ].slice(0, 10);

      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const generateSuggestions = (query: string) => {
    const allSuggestions: SearchSuggestion[] = [
      { id: '1', text: 'coffee shops near me', category: 'Food', popularity: 95, type: 'suggestion' },
      { id: '2', text: 'organic grocery stores', category: 'Retail', popularity: 88, type: 'suggestion' },
      { id: '3', text: 'sustainable clothing brands', category: 'Retail', popularity: 82, type: 'suggestion' },
      { id: '4', text: 'electric vehicle charging', category: 'Energy', popularity: 76, type: 'suggestion' },
      { id: '5', text: 'renewable energy companies', category: 'Energy', popularity: 71, type: 'suggestion' },
      { id: '6', text: 'eco-friendly restaurants', category: 'Food', popularity: 68, type: 'suggestion' },
      { id: '7', text: 'green building materials', category: 'Manufacturing', popularity: 65, type: 'suggestion' },
      { id: '8', text: 'solar panel installers', category: 'Energy', popularity: 62, type: 'suggestion' },
    ];

    const filtered = allSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(filtered);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    saveToSearchHistory(suggestion.text);
    onSearch?.(suggestion.text);
    Keyboard.dismiss();
  };

  const startVoiceSearch = async () => {
    try {
      // Check if we have audio permissions
      const { status } = await Audio.getPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permissions to use voice search');
        return;
      }

      setVoiceSearchActive(true);
      setIsListening(true);
      setVoiceSearchText('Listening...');

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);

      // Stop recording after 5 seconds
      setTimeout(async () => {
        try {
          setIsListening(false);
          setVoiceSearchText('Processing...');
          
          if (recording) {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            
            if (uri) {
              // Convert the recorded audio to a format that can be sent to the API
              const fileInfo = await FileSystem.getInfoAsync(uri);
              if (fileInfo.exists && fileInfo.size > 0) {
                // Read the audio file as base64
                const audioBase64 = await FileSystem.readAsStringAsync(uri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                
                // Create a File object from the base64 data
                const audioBlob = await fetch(`data:audio/wav;base64,${audioBase64}`).then(r => r.blob());
                const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
                
                // Send to speech-to-text API
                const result = await transcribeAudio(audioFile);
                
                if (result.success && result.data) {
                  const transcription = result.data.data.transcription;
                  setVoiceSearchText(`Found: "${transcription}"`);
                  
                  setTimeout(() => {
                    setSearchQuery(transcription);
                    setVoiceSearchActive(false);
                    setVoiceSearchText('');
                    saveToSearchHistory(transcription);
                    onSearch?.(transcription);
                  }, 1500);
                } else {
                  throw new Error(result.error || 'Failed to transcribe audio');
                }
              } else {
                throw new Error('Recording file not found or empty');
              }
            }
          }
        } catch (error) {
          console.error('Error processing voice recording:', error);
          setVoiceSearchText('Error processing speech');
          setTimeout(() => {
            setVoiceSearchActive(false);
            setVoiceSearchText('');
          }, 2000);
        }
      }, 5000);
    } catch (error) {
      console.error('Error starting voice search:', error);
      setVoiceSearchActive(false);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice search');
    }
  };

  const stopVoiceSearch = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setVoiceSearchActive(false);
      setIsListening(false);
      setVoiceSearchText('');
    } catch (error) {
      console.error('Error stopping voice search:', error);
    }
  };

  const renderVoiceSearch = () => {
    if (!voiceSearchActive) return null;

    return (
      <View style={styles.voiceSearchContainer}>
        <View style={[styles.voiceIcon, isListening && styles.voiceIconListening]}>
          <Ionicons 
            name={isListening ? "mic" : "mic-off"} 
            size={24} 
            color={isListening ? Colors.white : Colors.primary[600]} 
          />
        </View>
        <View style={styles.voiceSearchContent}>
          <Text style={styles.voiceSearchText}>
            {isListening ? 'Listening...' : 'Voice Search'}
          </Text>
          {voiceSearchText ? (
            <Text style={styles.voiceSearchQuery}>{voiceSearchText}</Text>
          ) : null}
        </View>
        <TouchableOpacity 
          style={styles.voiceCancelButton}
          onPress={stopVoiceSearch}
        >
          <Text style={styles.voiceCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    const showHistory = searchQuery.trim() === '' && searchHistory.length > 0;
    const dataToShow = showHistory ? searchHistory : suggestions;

    return (
      <View style={styles.suggestionsContainer}>
        <Card style={styles.suggestionsCard}>
          {showHistory ? (
            <View style={styles.historyHeader}>
              <Text style={styles.suggestionsHeader}>Recent Searches</Text>
              <TouchableOpacity onPress={clearSearchHistory}>
                <Text style={styles.clearHistoryText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.suggestionsHeader}>Suggestions</Text>
          )}

          <FlatList
            data={dataToShow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={showHistory ? styles.historyItem : styles.suggestionItem}
                onPress={() => handleSuggestionPress(item)}
              >
                <View style={showHistory ? styles.historyContent : styles.suggestionContent}>
                  <Ionicons
                    name={showHistory ? "time" : "search"}
                    size={16}
                    color={Colors.gray[500]}
                  />
                  <View style={showHistory ? null : styles.suggestionTextContainer}>
                    <Text style={showHistory ? styles.historyText : styles.suggestionText}>
                      {item.text}
                    </Text>
                    {!showHistory && (
                      <View style={styles.suggestionMeta}>
                        {item.category && (
                          <Badge variant="gray" size="sm" style={styles.suggestionBadge}>
                            {item.category}
                          </Badge>
                        )}
                        {item.popularity && (
                          <Text style={styles.suggestionPopularity}>{item.popularity}%</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                {showHistory && (
                  <Text style={styles.historyTime}>
                    {new Date(item.timestamp!).toLocaleDateString()}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.noSuggestions}>
                <Ionicons name="search" size={32} color={Colors.gray[300]} />
                <Text style={styles.noSuggestionsText}>
                  {searchQuery ? 'No suggestions found' : 'No recent searches'}
                </Text>
              </View>
            }
          />
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={Colors.gray[500]} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.gray[500]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.trim()) {
                saveToSearchHistory(searchQuery);
                onSearch?.(searchQuery);
              }
            }}
          />
          {searchQuery && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setSearchQuery('');
                inputRef.current?.focus();
              }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.gray[500]} />
            </TouchableOpacity>
          )}
          {showVoiceSearch && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={isListening ? stopVoiceSearch : startVoiceSearch}
            >
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={20} 
                color={isListening ? Colors.primary[600] : Colors.gray[500]} 
              />
            </TouchableOpacity>
          )}
          {showFilters && (
            <TouchableOpacity style={styles.iconButton} onPress={onFilter}>
              <Ionicons name="options" size={20} color={Colors.gray[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderVoiceSearch()}
      {renderSuggestions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  searchContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  input: {
    flex: 1,
    ...StyleMixins.body,
    color: Colors.gray[900],
    paddingVertical: Spacing[1],
  },
  iconButton: {
    padding: Spacing[2],
    marginLeft: Spacing[2],
  },
  voiceSearchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary[50],
    borderRadius: 12,
    gap: Spacing[2],
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    padding: Spacing[3],
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[100],
    ...StyleMixins.flexCenter,
  },
  voiceIconListening: {
    backgroundColor: Colors.primary[600],
  },
  voiceSearchContent: {
    flex: 1,
  },
  voiceSearchText: {
    ...StyleMixins.body,
    color: Colors.primary[700],
    fontWeight: '600' as const,
  },
  voiceSearchQuery: {
    ...StyleMixins.bodySmall,
    color: Colors.primary[600],
    fontStyle: 'italic' as const,
  },
  voiceCancelButton: {
    marginTop: Spacing[2],
    padding: Spacing[2],
  },
  voiceCancelText: {
    ...StyleMixins.bodySmall,
    color: Colors.error[600],
    fontWeight: '500' as const,
  },
  suggestionsContainer: {
    position: 'absolute' as const,
    top: '100%' as const,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  suggestionsCard: {
    ...Shadows.medium,
    marginTop: Spacing[2],
    maxHeight: 300,
  },
  suggestionsHeader: {
    ...StyleMixins.bodySmall,
    fontWeight: '600' as const,
    color: Colors.gray[700],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  suggestionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  suggestionContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  suggestionTextContainer: {
    marginLeft: Spacing[3],
    flex: 1,
  },
  suggestionText: {
    ...StyleMixins.body,
    color: Colors.gray[900],
    marginBottom: Spacing[1],
  },
  suggestionMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing[2],
  },
  suggestionBadge: {
    backgroundColor: Colors.gray[100],
  },
  suggestionCategory: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
  },
  suggestionPopularity: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
  },
  noSuggestions: {
    ...StyleMixins.flexCenter,
    padding: Spacing[6],
  },
  noSuggestionsText: {
    ...StyleMixins.body,
    color: Colors.gray[500],
    marginTop: Spacing[2],
  },
  historyHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  clearHistoryText: {
    ...StyleMixins.caption,
    color: Colors.error[600],
    fontWeight: '500' as const,
  },
  historyItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  historyContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  historyText: {
    ...StyleMixins.body,
    color: Colors.gray[900],
    marginLeft: Spacing[3],
  },
  historyTime: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
  },
});