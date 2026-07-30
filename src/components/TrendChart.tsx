import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { colors, radius, spacing, typography } from "../theme";

export interface TrendPoint {
  label: string;
  value: number;
}

export default function TrendChart({
  data,
  color = colors.primary,
  formatValue = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 }),
  height = 160,
}: {
  data: TrendPoint[];
  color?: string;
  formatValue?: (value: number) => string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Not enough data yet — log at least two entries to see a trend.</Text>
      </View>
    );
  }

  const width = Math.max(280, data.length * 56);
  const padding = { top: 18, bottom: 26, left: 10, right: 10 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (plotWidth * i) / (data.length - 1),
    y: padding.top + plotHeight - ((d.value - minValue) / valueRange) * plotHeight,
    label: d.label,
    value: d.value,
  }));

  const baseline = padding.top + plotHeight;
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  const showEveryLabel = data.length <= 6;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={width} height={height}>
          <Path d={`M ${padding.left} ${baseline} L ${width - padding.right} ${baseline}`} stroke={colors.border} strokeWidth={1} />
          <Path d={areaPath} fill={color} fillOpacity={0.12} />
          <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />
          {points.map((p, i) => (
            <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 3} fill={color} />
          ))}
          {points.map(
            (p, i) =>
              (showEveryLabel || i === 0 || i === points.length - 1) && (
                <SvgText
                  key={`label-${i}`}
                  x={p.x}
                  y={height - 8}
                  fontSize={10}
                  fill={colors.textSubtle}
                  textAnchor="middle"
                >
                  {p.label}
                </SvgText>
              )
          )}
        </Svg>
      </ScrollView>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Min {formatValue(minValue)}</Text>
        <Text style={styles.legendText}>Max {formatValue(maxValue)}</Text>
        <Text style={styles.legendLatest}>Latest {formatValue(values[values.length - 1])}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  emptyText: { ...typography.caption, textAlign: "center" },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  legendText: { ...typography.caption, color: colors.textSubtle },
  legendLatest: { ...typography.caption, color: colors.primary, fontWeight: "700" },
});
