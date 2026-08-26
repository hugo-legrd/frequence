import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { searchAll, SearchResult, SearchResults } from '../../lib/services/search';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '../../lib/theme/ThemeContext';
import { ThemeColors } from '../../lib/theme/tokens';

const SUGGESTIONS = ['Techno', 'Concrete', 'Rex Club', 'House', 'Hardgroove'];

type Props = {
  onFocus?: () => void;
  onBlur?: () => void; 
};

export default function SearchBar({ onFocus, onBlur }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults(null);
      return;
    }

    //Debounce 300ms
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const currentRequestId = ++requestIdRef.current;
      setLoading(true);
      setError(false)
      try {
        const data = await searchAll(query);
        if (currentRequestId === requestIdRef.current) {
          setResults(data);
        }
      } catch (err) {
        console.warn('Search error:', err);
        if (currentRequestId === requestIdRef.current) {
          setResults(null); // évite d'afficher des résultats périmés en cas d'erreur
          setError(true);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleResultPress(result: SearchResult) {
    setQuery('');
    setResults(null);
    setFocused(false);

    switch (result.type) {
      case 'event':
        router.push(`/(tabs)/screens/event/${result.id}`);
        break;
      case 'venue':
      case 'store':
      case 'artist':
        //TODO : Rediriger vers l'event avec les artistes si existant
        //pour l'instant on navigue vers concerts filtré
        router.push('/(tabs)/screens/concerts');
        break;
    }
  }

  function handleSuggestion(suggestion: string) {
    setQuery(suggestion);
  }

  const hasResults = results && (
    results.events?.length ||
    results.artists?.length ||
    results.venues?.length ||
    results.record_stores?.length
  );

  return (
    <View style={styles.container}>
      {/* Input */}
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <Text style={styles.searchIcon}>⌕</Text>
        <BottomSheetTextInput
          style={styles.input}
          placeholder="Artiste, lieu, style..."
          placeholderTextColor="#3a3a3a"
          value={query}
          onChangeText={setQuery}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color="#a78bfa" />}
        {query.length > 0 && !loading && (
          <Pressable onPress={() => { setQuery(''); setResults(null); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Résultats */}
      {focused && (
        <View style={styles.dropdown}>
          {!hasResults && query.length < 3 && (
            <>
              <Text style={styles.sectionLabel}>Suggestions</Text>
              <View style={styles.pills}>
                {SUGGESTIONS.map(s => (
                  <Pressable
                    key={s}
                    style={styles.pill}
                    onPress={() => handleSuggestion(s)}
                  >
                    <Text style={styles.pillText}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {hasResults && (
            <ScrollView
              style={styles.resultList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderSection('Artistes', results?.artists, '🎧')}
              {renderSection('Événements', results?.events, '🎵')}
              {renderSection('Lieux', results?.venues, '📍')}
              {renderSection('Disquaires', results?.record_stores, '💿')}
            </ScrollView>
          )}

          {error && query.trim().length >= 3 && !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Erreur de recherche</Text>
              <Text style={styles.emptySub}>Réessayez dans un instant</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  function renderSection(
    label: string,
    items: SearchResult[] | null | undefined,
    icon: string
  ) {
    if (!items?.length) return null;
    return (
      <View key={label} style={styles.section}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {items.map(item => (
          <Pressable
            key={item.id}
            style={styles.resultItem}
            onPress={() => handleResultPress(item)}
          >
            <View style={styles.resultIcon}>
              <Text style={styles.resultIconText}>{icon}</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.address && (
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {item.address}
                </Text>
              )}
              {item.starts_at && (
                <Text style={styles.resultMeta}>
                  {new Date(item.starts_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
            <Text style={styles.resultArrow}>›</Text>
          </Pressable>
        ))}
      </View>
    );
  }
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    padding: 10,
  },
  inputRowFocused: {
    borderColor: colors.accent,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  clearBtn: {
    fontSize: 12,
    color: colors.textMuted,
    padding: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 12,
    maxHeight: 300,
    zIndex: 200
  },
  resultList: {
    maxHeight: 260,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10, 
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  resultIcon: {
    width: 32,
    height: 32, 
    backgroundColor: colors.bg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIconText: {
    fontSize: 14,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  resultMeta: {
    fontSize: 11, 
    color: colors.textMuted,
    marginTop: 2,
  },
  resultArrow: {
    fontSize: 16,
    color: colors.textMuted,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 100,
  },
  pillText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
  },
})
};