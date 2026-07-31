import { useState } from "react";
import { Alert } from "react-native";
import FormSheet from "../../components/FormSheet";
import FormField from "../../components/FormField";
import { Chip, ChipGroup } from "../../components/Chip";
import type { DocumentType } from "../../types/models";
import { DOCUMENT_TYPE_LABEL } from "../../utils/documentStatus";

const TYPES: DocumentType[] = ["tax", "insurance", "registration", "warranty", "inspection", "other"];

export default function AddDocumentModal({ visible, onCancel, onSubmit }: {
  visible: boolean; onCancel: () => void;
  onSubmit: (documentType: DocumentType, label: string, expiryDate: string) => void;
}) {
  const [documentType, setDocumentType] = useState<DocumentType>("tax");
  const [label, setLabel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  function handleSubmit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate.trim())) {
      Alert.alert("Invalid date", "Enter the expiry date as YYYY-MM-DD, e.g. 2027-03-15");
      return;
    }
    const finalLabel = label.trim() || DOCUMENT_TYPE_LABEL[documentType];
    onSubmit(documentType, finalLabel, expiryDate.trim());
    setLabel(""); setExpiryDate(""); setDocumentType("tax");
  }

  return (
    <FormSheet
      visible={visible}
      title="Add Document Reminder"
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Add"
    >
      <ChipGroup>
        {TYPES.map((type) => (
          <Chip
            key={type}
            label={DOCUMENT_TYPE_LABEL[type]}
            selected={documentType === type}
            onPress={() => setDocumentType(type)}
          />
        ))}
      </ChipGroup>
      <FormField
        label="Label"
        value={label}
        onChangeText={setLabel}
        placeholder={DOCUMENT_TYPE_LABEL[documentType]}
      />
      <FormField
        label="Expiry date (YYYY-MM-DD)"
        value={expiryDate}
        onChangeText={setExpiryDate}
        placeholder="2027-03-15"
      />
    </FormSheet>
  );
}
