import { useState } from "react";
import { Alert } from "react-native";
import FormField from "../../components/FormField";
import FormSheet from "../../components/FormSheet";
import type { ServiceShop } from "../../types/models";

export default function AddEditShopModal({
  visible,
  existing,
  onCancel,
  onSubmit,
}: {
  visible: boolean;
  existing: ServiceShop | null;
  onCancel: () => void;
  onSubmit: (name: string, phone: string | null, address: string | null) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");

  function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Shop name is required", "Please enter a name for this shop");
      return;
    }
    onSubmit(name.trim(), phone.trim() || null, address.trim() || null);
    setName("");
    setPhone("");
    setAddress("");
  }

  return (
    <FormSheet
      visible={visible}
      title={existing ? "Edit Shop" : "Add Shop"}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      submitLabel="Save"
    >
      <FormField label="Name" value={name} onChangeText={setName} placeholder="Shop name" />
      <FormField label="Phone" value={phone} onChangeText={setPhone} placeholder="Optional" />
      <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Optional" />
    </FormSheet>
  );
}
