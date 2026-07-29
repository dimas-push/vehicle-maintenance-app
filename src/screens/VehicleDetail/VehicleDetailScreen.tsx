import { useCallback, useLayoutEffect, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  deleteVehicle,
  getVehicle,
  updateCurrentKm,
  updateVehicleDetails,
  updateVehiclePhoto,
} from "../../repositories/vehicleRepository";
import type { VehicleWithClass } from "../../repositories/vehicleRepository";
import {
  listSchedulesForVehicle,
  recalculateSchedules,
  recordMaintenanceDone,
} from "../../repositories/scheduleRepository";
import {
  createDocument,
  deleteDocument,
  listDocumentsForVehicle,
} from "../../repositories/documentRepository";
import { recordOdometerReading } from "../../repositories/odometerRepository";
import { getLoanForVehicle, setLoanForVehicle, summarizeLoan } from "../../repositories/loanRepository";
import { listShops } from "../../repositories/shopRepository";
import { snoozeSchedule } from "../../repositories/scheduleRepository";
import type {
  DocumentType,
  MaintenanceSchedule,
  ServiceShop,
  VehicleDocument,
  VehicleLoan,
} from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, shadow, spacing, typography } from "../../theme";
import { STATUS_LABEL, STATUS_STYLE } from "../../utils/scheduleStatusPresentation";
import { DOCUMENT_TYPE_LABEL, statusFromExpiry } from "../../utils/documentStatus";
import { getReminderThresholds } from "../../utils/reminderSettings";
import { notifyDueSchedules } from "../../services/notifications";
import { deleteVehiclePhoto, pickVehiclePhotoFromLibrary, takeVehiclePhoto } from "../../services/photos";
import { exportServiceReportCsv, exportServiceReportPdf } from "../../services/report";
import { showErrorAlert } from "../../utils/errorAlert";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance } from "../../utils/units";
import { vehicleClassIcon } from "../../utils/vehicleIcon";
import UpdateKmModal from "./UpdateKmModal";
import EditVehicleModal from "./EditVehicleModal";
import MarkDoneModal from "./MarkDoneModal";
import AddDocumentModal from "./AddDocumentModal";
import AddLoanModal from "./AddLoanModal";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;
type ScheduleRow = MaintenanceSchedule & { item_name: string };

function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<VehicleWithClass | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [daysThreshold, setDaysThreshold] = useState(14);
  const [kmModalVisible, setKmModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [markDoneItem, setMarkDoneItem] = useState<ScheduleRow | null>(null);
  const [loan, setLoan] = useState<VehicleLoan | null>(null);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [shops, setShops] = useState<ServiceShop[]>([]);
  const { unit, volumeUnit } = useUnitPreference();

  const reload = useCallback(async () => {
    const [v, s, d, thresholds, l, sh] = await Promise.all([
      getVehicle(vehicleId),
      listSchedulesForVehicle(vehicleId),
      listDocumentsForVehicle(vehicleId),
      getReminderThresholds(),
      getLoanForVehicle(vehicleId),
      listShops(),
    ]);
    setVehicle(v);
    setSchedules(s.sort((a, b) => b.status.localeCompare(a.status)));
    setDocuments(d);
    setDaysThreshold(thresholds.daysThreshold);
    setLoan(l);
    setShops(sh);
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  function handleDelete() {
    if (!vehicle) return;
    Alert.alert(
      "Delete this vehicle?",
      `${vehicle.nickname} and all its service history will be permanently removed. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              deleteVehiclePhoto(vehicle.photo_uri);
              await deleteVehicle(vehicleId);
              navigation.goBack();
            } catch (err) {
              showErrorAlert("Couldn't delete vehicle", err);
            }
          },
        },
      ]
    );
  }

  async function handleEditSave(nickname: string, plateNumber: string | null, vin: string | null) {
    setEditModalVisible(false);
    try {
      await updateVehicleDetails(vehicleId, { nickname, plate_number: plateNumber, vin });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't save changes", err);
    }
  }

  function handleExportReport() {
    Alert.alert("Export Report", "Include service history, fuel log, and documents.", [
      {
        text: "PDF",
        onPress: async () => {
          try {
            await exportServiceReportPdf(vehicleId, unit, volumeUnit);
          } catch (err) {
            showErrorAlert("Export failed", err);
          }
        },
      },
      {
        text: "CSV",
        onPress: async () => {
          try {
            await exportServiceReportCsv(vehicleId);
          } catch (err) {
            showErrorAlert("Export failed", err);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function handleChangePhoto() {
    Alert.alert("Vehicle Photo", undefined, [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const uri = await takeVehiclePhoto();
            if (uri) await applyPhoto(uri);
          } catch (err) {
            showErrorAlert("Couldn't open camera", err);
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          try {
            const uri = await pickVehiclePhotoFromLibrary();
            if (uri) await applyPhoto(uri);
          } catch (err) {
            showErrorAlert("Couldn't open photo library", err);
          }
        },
      },
      ...(vehicle?.photo_uri
        ? [
            {
              text: "Remove Photo",
              style: "destructive" as const,
              onPress: () => applyPhoto(null),
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  async function applyPhoto(uri: string | null) {
    const previous = vehicle?.photo_uri ?? null;
    try {
      await updateVehiclePhoto(vehicleId, uri);
    } catch (err) {
      showErrorAlert("Couldn't save photo", err);
      return;
    }
    if (previous && previous !== uri) deleteVehiclePhoto(previous);
    await reload();
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleExportReport}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Export report"
          >
            <Ionicons name="share-outline" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => setEditModalVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit vehicle"
          >
            <Ionicons name="pencil-outline" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Delete vehicle"
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, vehicle, unit, volumeUnit]);

  async function handleUpdateKm(newKm: number, photoUri: string | null) {
    setKmModalVisible(false);
    try {
      await updateCurrentKm(vehicleId, newKm);
      await recordOdometerReading(vehicleId, newKm, photoUri);
      await recalculateSchedules(vehicleId);
      await notifyDueSchedules(vehicleId);
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't update odometer", err);
    }
  }

  async function handleMarkDoneSubmit(
    cost: number | null,
    notes: string | null,
    photoUri: string | null,
    shopId: number | null
  ) {
    if (!vehicle || !markDoneItem) return;
    setMarkDoneItem(null);
    try {
      await recordMaintenanceDone({
        vehicleId,
        maintenanceItemId: markDoneItem.maintenance_item_id,
        doneAtKm: vehicle.current_km,
        doneAtDate: new Date().toISOString().slice(0, 10),
        notes,
        cost,
        photoUri,
        shopId,
      });
      await notifyDueSchedules(vehicleId);
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't save service record", err);
    }
  }

  async function handleSaveLoan(
    lender: string | null,
    monthlyPayment: number,
    startDate: string,
    termMonths: number
  ) {
    setLoanModalVisible(false);
    try {
      await setLoanForVehicle(vehicleId, { lender, monthly_payment: monthlyPayment, start_date: startDate, term_months: termMonths });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't save loan", err);
    }
  }

  function handleSnooze(schedule: ScheduleRow) {
    Alert.alert("Snooze reminder", `${schedule.item_name} — hide from notifications for how long?`, [
      { text: "3 days", onPress: () => applySnooze(schedule.id, 3) },
      { text: "1 week", onPress: () => applySnooze(schedule.id, 7) },
      { text: "2 weeks", onPress: () => applySnooze(schedule.id, 14) },
      ...(schedule.snoozed_until
        ? [{ text: "Clear snooze", onPress: () => applySnooze(schedule.id, null) }]
        : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  async function applySnooze(scheduleId: number, days: number | null) {
    try {
      if (days == null) {
        await snoozeSchedule(scheduleId, null);
      } else {
        const until = new Date();
        until.setDate(until.getDate() + days);
        await snoozeSchedule(scheduleId, until.toISOString().slice(0, 10));
      }
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't update snooze", err);
    }
  }

  async function handleAddDocument(documentType: DocumentType, label: string, expiryDate: string) {
    setDocumentModalVisible(false);
    try {
      await createDocument({ vehicle_id: vehicleId, document_type: documentType, label, expiry_date: expiryDate });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't add document", err);
    }
  }

  function confirmDeleteDocument(doc: VehicleDocument) {
    Alert.alert("Delete this reminder?", doc.label, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDocument(doc.id);
            await reload();
          } catch (err) {
            showErrorAlert("Couldn't delete document", err);
          }
        },
      },
    ]);
  }

  if (!vehicle) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={handleChangePhoto} accessibilityRole="button" accessibilityLabel="Change vehicle photo">
            {vehicle.photo_uri ? (
              <Image source={{ uri: vehicle.photo_uri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name={vehicleClassIcon(vehicle.vehicle_class)} size={26} color={colors.primary} />
              </View>
            )}
          </Pressable>
          <View style={styles.topRowText}>
            <Text style={styles.nickname}>{vehicle.nickname}</Text>
            {vehicle.plate_number && <Text style={styles.plate}>{vehicle.plate_number}</Text>}
            {vehicle.vin && <Text style={styles.plate}>VIN {vehicle.vin}</Text>}
          </View>
        </View>

        <View style={styles.kmRow}>
          <View>
            <Text style={typography.caption}>Current odometer</Text>
            <Text style={styles.kmValue}>{formatDistance(vehicle.current_km, unit)}</Text>
          </View>
          <Pressable style={styles.kmButton} onPress={() => setKmModalVisible(true)}>
            <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
            <Text style={styles.kmButtonText}>Update Odometer</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.historyLink}
          onPress={() =>
            navigation.navigate("MaintenanceHistory", { vehicleId, nickname: vehicle.nickname })
          }
        >
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <Text style={styles.historyLinkText}>View Service History</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
        </Pressable>

        <Pressable
          style={[styles.historyLink, styles.noBorderTop]}
          onPress={() => navigation.navigate("FuelLog", { vehicleId, nickname: vehicle.nickname })}
        >
          <Ionicons name="water-outline" size={16} color={colors.textMuted} />
          <Text style={styles.historyLinkText}>View Fuel Log</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
        </Pressable>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.documentsHeader}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <Pressable
                onPress={() => setDocumentModalVisible(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add document"
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </Pressable>
            </View>
            {documents.length === 0 ? (
              <Text style={styles.emptyDocsText}>
                No tax, insurance, or registration reminders yet.
              </Text>
            ) : (
              documents.map((doc) => {
                const status = statusFromExpiry(doc.expiry_date, daysThreshold);
                const statusStyle = STATUS_STYLE[status];
                return (
                  <Pressable
                    key={doc.id}
                    style={styles.docRow}
                    onPress={() => confirmDeleteDocument(doc)}
                  >
                    <View style={styles.docRowText}>
                      <Text style={styles.docLabel}>
                        {doc.label} · {DOCUMENT_TYPE_LABEL[doc.document_type]}
                      </Text>
                      <Text style={styles.docExpiry}>Expires {formatDueDate(doc.expiry_date)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.badgeText, { color: statusStyle.fg }]}>
                        {STATUS_LABEL[status]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            <View style={styles.documentsHeader}>
              <Text style={[styles.sectionTitle, styles.scheduleTitle]}>Loan</Text>
              {!loan && (
                <Pressable
                  onPress={() => setLoanModalVisible(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Add loan"
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>
            {loan ? (
              (() => {
                const summary = summarizeLoan(loan);
                return (
                  <Pressable style={styles.loanCard} onPress={() => setLoanModalVisible(true)}>
                    <View style={styles.docRowText}>
                      <Text style={styles.docLabel}>
                        {loan.lender || "Loan"} · {loan.monthly_payment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                      </Text>
                      <Text style={styles.docExpiry}>
                        {summary.isPaidOff
                          ? "Paid off"
                          : `${summary.monthsRemaining} month(s) left • payoff ${formatDueDate(summary.payoffDate)}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
                  </Pressable>
                );
              })()
            ) : (
              <Text style={styles.emptyDocsText}>No loan on file for this vehicle.</Text>
            )}

            <Text style={[styles.sectionTitle, styles.scheduleTitle]}>Maintenance Schedule</Text>
          </>
        }
        renderItem={({ item }) => {
          const status = STATUS_STYLE[item.status];
          const isSnoozed = item.snoozed_until != null && item.snoozed_until > new Date().toISOString().slice(0, 10);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.item_name}</Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.fg }]}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>
                {item.due_km != null ? `Due at: ${formatDistance(item.due_km, unit)}` : ""}
                {item.due_km != null && item.due_date ? " • " : ""}
                {item.due_date ? `by ${formatDueDate(item.due_date)}` : ""}
              </Text>
              {isSnoozed && (
                <Text style={styles.snoozedText}>
                  Snoozed until {formatDueDate(item.snoozed_until)}
                </Text>
              )}
              <View style={styles.cardActions}>
                <Pressable style={styles.doneButton} onPress={() => setMarkDoneItem(item)}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.doneButtonText}>Mark as Done</Text>
                </Pressable>
                {(item.status === "due_soon" || item.status === "overdue") && (
                  <Pressable style={styles.doneButton} onPress={() => handleSnooze(item)}>
                    <Ionicons name="notifications-off-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.snoozeButtonText}>Snooze</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      <UpdateKmModal
        visible={kmModalVisible}
        currentKm={vehicle.current_km}
        unit={unit}
        onCancel={() => setKmModalVisible(false)}
        onSubmit={handleUpdateKm}
      />

      <EditVehicleModal
        visible={editModalVisible}
        nickname={vehicle.nickname}
        plateNumber={vehicle.plate_number}
        vin={vehicle.vin}
        onCancel={() => setEditModalVisible(false)}
        onSubmit={handleEditSave}
      />

      <MarkDoneModal
        visible={markDoneItem != null}
        itemName={markDoneItem?.item_name ?? ""}
        odometerLabel={formatDistance(vehicle.current_km, unit)}
        shops={shops}
        onCancel={() => setMarkDoneItem(null)}
        onSubmit={handleMarkDoneSubmit}
      />

      <AddDocumentModal
        visible={documentModalVisible}
        onCancel={() => setDocumentModalVisible(false)}
        onSubmit={handleAddDocument}
      />

      <AddLoanModal
        visible={loanModalVisible}
        existing={loan}
        onCancel={() => setLoanModalVisible(false)}
        onSubmit={handleSaveLoan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerActions: { flexDirection: "row", gap: spacing.md, marginRight: spacing.sm },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  photo: { width: 56, height: 56, borderRadius: radius.md, marginRight: spacing.sm },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  topRowText: { flex: 1 },
  nickname: { ...typography.title },
  plate: { ...typography.caption, marginTop: 2 },
  kmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  kmValue: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 2 },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyLinkText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  noBorderTop: { borderTopWidth: 0, marginTop: 0, paddingTop: 0 },
  kmButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  kmButtonText: { color: colors.primaryDark, fontWeight: "700", fontSize: 13 },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { ...typography.label },
  scheduleTitle: { marginTop: spacing.md, marginBottom: spacing.sm },
  documentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emptyDocsText: { ...typography.caption, marginBottom: spacing.sm },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.xs,
    ...shadow.card,
  },
  docRowText: { flex: 1 },
  docLabel: { ...typography.body, fontWeight: "700", fontSize: 14 },
  docExpiry: { ...typography.caption, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: 4 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: "700" },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  doneButtonText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  cardActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  snoozeButtonText: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
  snoozedText: { ...typography.caption, color: colors.warning, marginTop: spacing.xs, fontWeight: "600" },
  loanCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.xs,
    ...shadow.card,
  },
});
