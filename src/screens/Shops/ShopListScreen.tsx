import { useCallback, useState } from "react";
import { Alert, FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { createShop, deleteShop, listShops, updateShop } from "../../repositories/shopRepository";
import { showErrorAlert } from "../../utils/errorAlert";
import type { ServiceShop } from "../../types/models";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import AddEditShopModal from "./AddEditShopModal";

export default function ShopListScreen() {
  const [shops, setShops] = useState<ServiceShop[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<ServiceShop | null>(null);

  const reload = useCallback(() => {
    listShops().then(setShops);
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

  return (
    <View style={styles.container}>
      <FlatList
        data={shops}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="storefront-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No shops saved yet</Text>
            <Text style={styles.emptyText}>
              Add a mechanic or shop to quickly attribute service records to them.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openEdit(item)}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.phone && <Text style={styles.cardSub}>{item.phone}</Text>}
              {item.address && <Text style={styles.cardSub}>{item.address}</Text>}
            </View>
            {item.phone && (
              <Pressable
                style={styles.callButton}
                onPress={(e) => {
                  e.stopPropagation();
                  Linking.openURL(`tel:${item.phone}`);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.name}`}
              >
                <Ionicons name="call-outline" size={18} color={colors.primary} />
              </Pressable>
            )}
            <Pressable
              style={styles.deleteButton}
              onPress={() => confirmDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={openAdd} accessibilityRole="button" accessibilityLabel="Add shop">
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

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
  listContent: { padding: spacing.md, paddingBottom: spacing.xl * 2, flexGrow: 1 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.title, marginBottom: spacing.xs },
  emptyText: { ...typography.subtitle, textAlign: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardBody: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: 2 },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 2px 10px rgba(37, 99, 235, 0.35)",
    elevation: 4,
  },
});
