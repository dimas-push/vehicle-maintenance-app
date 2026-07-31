import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type { ServiceShop } from "../../types/models";
import { typography, spacing } from "../../theme";
import FormSheet from "../../components/FormSheet";
import FormField from "../../components/FormField";
import { Chip, ChipGroup } from "../../components/Chip";
import PhotoPickerButton from "../../components/PhotoPickerButton";

export default function MarkDoneModal({ visible, itemName, odometerLabel, shops, onCancel, onSubmit }: {
  visible: boolean; itemName: string; odometerLabel: string; shops: ServiceShop[]; onCancel: () => void;
  onSubmit: (cost: number | null, notes: string | null, photoUri: string | null, shopId: number | null) => void;
}) {
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [shopId, setShopId] = useState<number | null>(null);

  function handleSubmit() {
    const parsedCost = cost.trim() ? Number(cost) : null;
    onSubmit(
      parsedCost != null && Number.isFinite(parsedCost) ? parsedCost : null,
      notes.trim() || null,
      photoUri,
      shopId
    );
    setCost(""); setNotes(""); setPhotoUri(null); setShopId(null);
  }

  return (
    <FormSheet visible={visible} title="Mark as Done" onCancel={onCancel} onSubmit={handleSubmit} submitLabel="Done">
      <Text style={styles.subtitle}>{itemName + " - logged today at " + odometerLabel}</Text>
      <FormField label="Cost" value={cost} onChangeText={setCost} placeholder="Optional" numeric allowDecimal />
      {shops.length > 0 ? (
        <ChipGroup>
          {shops.map((shop) => (
            <Chip
              key={shop.id}
              label={shop.name}
              selected={shopId === shop.id}
              onPress={() => setShopId(shopId === shop.id ? null : shop.id)}
            />
          ))}
        </ChipGroup>
      ) : null}
      <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
      <PhotoPickerButton photoUri={photoUri} label="Add Receipt Photo" onChange={setPhotoUri} />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...typography.subtitle, marginBottom: spacing.md },
});
