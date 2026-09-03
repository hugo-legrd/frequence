import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "./ThemeContext";
import type { ThemeColors } from "./tokens";

/** Crée un hook de styles mémoïsé sur le thème */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors, isDark: boolean) => T
) {
  return function useStyles(): T {
    const { colors, isDark } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors, isDark)), [colors, isDark]) 
  };
}

/** Couleur du texte posé sur colors.accent, selon le thème. */
export const onAccent = (colors: ThemeColors, isDark: boolean) =>
  isDark ? colors.bg : '#ffffff';