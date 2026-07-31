import { useCallback, useState } from "react";
import { Alert, FlatList, Linking, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import ListRow from "../../components/ListRow";
import IconButton from "../../components/IconButton";
import FAB from "../../components/FAB";
import EmptyState from "../../components/EmptyState";
import { createShop, deleteShop, listShops, updateShop } from "../../repositories/shopRepository";
import { showErrorAlert } from "../../utils/errorAlert";
import type { ServiceShop } from "../../types/models";
import { colors, spacing } from "../../theme";
import AddEditShopModal from "./AddEditShopModal";

export default function ShopListScreen() {
  const [shops, setShops] = useState<ServiceShop[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<ServiceShop | null>(null);

  const reload = useCallback(() => {
    listShops().then(setShops).catch((err) => showErrorAlert("Couldn't load shops", err));
  }, []);

  useFocusEffect(reload);

  function openAdd() {
    setEditingShop(null);
    setModalVisible(true);
  }

  function openEdit(shop: ServiceShop) {
    setEditingShop(shop);
    setModalVisible(true);
  }

  async function handleSubmit(name: string, phone: string | null, address: string | null) {
    setModalVisible(false);
    try {
      if (editingShop) {
        await updateShop(editingShop.id, { name, phone, address });
      } else {
        await createShop({ name, phone, address });
      }
      reload();
    } catch (err) {
      showErrorAlert("Couldn't save shop", err);
    }
  }

  function confirmDelete(shop: ServiceShop) {
    Alert.alert("Delete this shop?", shop.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteShop(shop.id);
            reload();
          } catch (err) {
            showErrorAlert("Couldn't delete shop", err);
          }
        },
      },
    ]);
  }

  function renderItem({ item }: { item: ServiceShop }) {
    const subtitle = [item.phone, item.address].filter((part): part is string => Boolean(part)).join(" - ");

    return (
      <Card>
        <ListRow
          title={item.name}
          subtitle={subtitle || undefined}
          onPress={() => openEdit(item)}
          showChevron={false}
          trailing={
            <View style={styles.actions}>
              {item.phone ? (
                <IconButton
                  icon={<Ionicons name="call-outline" size={22} color={colors.primary} />}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  accessibilityLabel={`Call ${item.name}`}
                />
              ) : null}
              <IconButton
                icon={<Ionicons name="trash-outline" size={22} color={colors.danger} />}
                onPress={() => confirmDelete(item)}
                accessibilityLabel={`Delete ${item.name}`}
              />
            </View>
          }
        />
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shops}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={shops.length === 0 ? styles.emptyContent : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="storefront-outline" size={32} color={colors.primary} />}
            title="No shops saved yet"
            caption="Add a mechanic or shop to quickly attribute service records to them."
          />
        }
      />
      <FAB
        icon={<Ionicons name="add" size={28} color={colors.onPrimary} />}
        onPress={openAdd}
        accessibilityLabel="Add shop"
      />
      <AddEditShopModal
        visible={modalVisible}
        existing={editingShop}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, gap: spacing.md },
  emptyContent: { flexGrow: 1 },
  actions: { flexDirection: "row", gap: spacing.sm },
});
