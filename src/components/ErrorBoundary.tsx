import { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { errorMessage } from "../utils/errorAlert";

interface Props {
  children: ReactNode;
}

interface State {
  error: unknown;
}

/**
 * Catches render/lifecycle errors anywhere below it so one broken screen
 * shows a recoverable fallback instead of taking down the whole app. Wraps
 * NavigationContainer in App.tsx, so "Try Again" remounts navigation fresh
 * at the initial route rather than requiring a full app relaunch.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) console.error("Unhandled error caught by ErrorBoundary:", error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.detail}>{errorMessage(this.state.error)}</Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: { ...typography.title, marginTop: spacing.sm, textAlign: "center" },
  detail: { ...typography.caption, marginTop: spacing.xs, textAlign: "center" },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  buttonText: { color: colors.onPrimary, fontWeight: "700" },
});
