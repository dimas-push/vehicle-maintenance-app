import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, View } from "react-native";
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
  listMaintenanceRecords,
  listSchedulesForVehicle,
  recalculateSchedules,
  recordMaintenanceDone,
  snoozeSchedule,
} from "../../repositories/scheduleRepository";
import { createDocument, deleteDocument, listDocumentsForVehicle } from "../../repositories/documentRepository";
import { listOdometerReadings, recordOdometerReading } from "../../repositories/odometerRepository";
import { getLoanForVehicle, setLoanForVehicle, summarizeLoan } from "../../repositories/loanRepository";
import { listRecallsForVehicle } from "../../repositories/recallRepository";
import { listExpensesForVehicle } from "../../repositories/expenseRepository";
import { listShops } from "../../repositories/shopRepository";
import type {
  DocumentType,
  MaintenanceSchedule,
  ServiceShop,
  VehicleDocument,
  VehicleLoan,
  VehicleRecall,
} from "../../types/models";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { colors, radius, spacing, typography } from "../../theme";
import { STATUS_LABEL, STATUS_STYLE } from "../../utils/scheduleStatusPresentation";
import { DOCUMENT_TYPE_LABEL, statusFromExpiry } from "../../utils/documentStatus";
import { getReminderThresholds } from "../../utils/reminderSettings";
import { deleteVehiclePhoto, pickVehiclePhotoFromLibrary, takeVehiclePhoto } from "../../services/photos";
import { notifyDueSchedules } from "../../services/notifications";
import { showErrorAlert } from "../../utils/errorAlert";
import { confirmDestructive } from "../../utils/confirmDestructive";
import { useUnitPreference } from "../../context/UnitPreferenceContext";
import { formatDistance } from "../../utils/units";
import { vehicleClassIcon } from "../../utils/vehicleIcon";
import { formatVehicleSpecs } from "../../utils/vehicleSpecs";
import { useAsyncData, useFocusRefresh } from "../../hooks/useAsyncData";
import Card from "../../components/Card";
import SectionHeader from "../../components/SectionHeader";
import StatusBadge from "../../components/StatusBadge";
import ListRow from "../../components/ListRow";
import IconButton from "../../components/IconButton";
import QuickActionButton from "../../components/QuickActionButton";
import UpdateKmModal from "./UpdateKmModal";
import EditVehicleModal, { type EditVehicleSubmitValues } from "./EditVehicleModal";
import MarkDoneModal from "./MarkDoneModal";
import AddDocumentModal from "./AddDocumentModal";
import AddLoanModal from "./AddLoanModal";

type Props = NativeStackScreenProps<RootStackParamList, "VehicleDetail">;
type ScheduleRow = MaintenanceSchedule & { item_name: string };

interface DetailData {
  vehicle: VehicleWithClass | null;
  schedules: ScheduleRow[];
  documents: VehicleDocument[];
  daysThreshold: number;
  loan: VehicleLoan | null;
  recalls: VehicleRecall[];
  shops: ServiceShop[];
}

function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/** Placeholder for actions whose real UI (a FormSheet modal or an external service) lands in a later milestone — keeps the button honest instead of silently doing nothing. */
function comingSoon(feature: string, milestone: string) {
  Alert.alert(feature, `Coming in ${milestone}.`);
}

/**
 * Deleting a vehicle cascades its DB rows, but not the photo files those
 * rows pointed at — collect every child photo_uri before the delete removes
 * the rows they came from, so they can be cleaned up too.
 */
async function collectChildPhotoUris(vehicleId: number): Promise<string[]> {
  const [records, odometerReadings, expenses] = await Promise.all([
    listMaintenanceRecords(vehicleId),
    listOdometerReadings(vehicleId),
    listExpensesForVehicle(vehicleId),
  ]);
  return [...records, ...odometerReadings, ...expenses]
    .map((row) => row.photo_uri)
    .filter((uri): uri is string => uri != null);
}

async function loadDetail(vehicleId: number): Promise<DetailData> {
  const [vehicle, schedules, documents, thresholds, loan, recalls, shops] = await Promise.all([
    getVehicle(vehicleId),
    listSchedulesForVehicle(vehicleId),
    listDocumentsForVehicle(vehicleId),
    getReminderThresholds(),
    getLoanForVehicle(vehicleId),
    listRecallsForVehicle(vehicleId),
    listShops(),
  ]);
  return {
    vehicle,
    schedules: schedules.sort((a, b) => b.status.localeCompare(a.status)),
    documents,
    daysThreshold: thresholds.daysThreshold,
    loan,
    recalls,
    shops,
  };
}

export default function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { unit } = useUnitPreference();
  const { data, error, reload } = useAsyncData(useCallback(() => loadDetail(vehicleId), [vehicleId]));
  useFocusRefresh(reload);

  const [kmModalVisible, setKmModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [markDoneItem, setMarkDoneItem] = useState<ScheduleRow | null>(null);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);

  useEffect(() => {
    if (error) showErrorAlert("Couldn't load vehicle", error);
  }, [error]);

  const vehicle = data?.vehicle ?? null;
  const schedules = data?.schedules ?? [];
  const documents = data?.documents ?? [];
  const daysThreshold = data?.daysThreshold ?? 14;
  const loan = data?.loan ?? null;
  const recalls = data?.recalls ?? [];
  const shops = data?.shops ?? [];

  const handleDelete = useCallback(() => {
    if (!vehicle) return;
    confirmDestructive(
      "Delete this vehicle?",
      `${vehicle.nickname} and all its service history will be permanently removed. This can't be undone.`,
      async () => {
        try {
          const childPhotoUris = await collectChildPhotoUris(vehicleId);
          deleteVehiclePhoto(vehicle.photo_uri);
          childPhotoUris.forEach(deleteVehiclePhoto);
          await deleteVehicle(vehicleId);
          navigation.goBack();
        } catch (err) {
          showErrorAlert("Couldn't delete vehicle", err);
        }
      }
    );
  }, [vehicle, vehicleId, navigation]);

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

  async function handleEditSave(values: EditVehicleSubmitValues) {
    setEditModalVisible(false);
    try {
      await updateVehicleDetails(vehicleId, {
        nickname: values.nickname,
        plate_number: values.plateNumber,
        vin: values.vin,
        year: values.year,
        color: values.color,
        engine_size: values.engineSize,
        transmission: values.transmission,
        fuel_type: values.fuelType,
      });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't save changes", err);
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

  async function handleAddDocument(documentType: DocumentType, label: string, expiryDate: string) {
    setDocumentModalVisible(false);
    try {
      await createDocument({ vehicle_id: vehicleId, document_type: documentType, label, expiry_date: expiryDate });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't add document", err);
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
      await setLoanForVehicle(vehicleId, {
        lender,
        monthly_payment: monthlyPayment,
        start_date: startDate,
        term_months: termMonths,
      });
      await reload();
    } catch (err) {
      showErrorAlert("Couldn't save loan", err);
    }
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
        ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => applyPhoto(null) }]
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
          <IconButton
            icon={<Ionicons name="share-outline" size={22} color={colors.primary} />}
            onPress={() => comingSoon("Export Report", "M5")}
            accessibilityLabel="Export report"
          />
          <IconButton
            icon={<Ionicons name="pencil-outline" size={22} color={colors.primary} />}
            onPress={() => setEditModalVisible(true)}
            accessibilityLabel="Edit vehicle"
          />
          <IconButton
            icon={<Ionicons name="trash-outline" size={22} color={colors.danger} />}
            onPress={handleDelete}
            accessibilityLabel="Delete vehicle"
          />
        </View>
      ),
    });
  }, [navigation, vehicle, handleDelete]);

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

  function confirmDeleteDocument(doc: VehicleDocument) {
    confirmDestructive("Delete this reminder?", doc.label, async () => {
      try {
        await deleteDocument(doc.id);
        await reload();
      } catch (err) {
        showErrorAlert("Couldn't delete document", err);
      }
    });
  }

  if (!vehicle) return null;
  const metaLine = [vehicle.plate_number, vehicle.vin ? `VIN ${vehicle.vin}` : null, formatVehicleSpecs(vehicle) || null]
    .filter((part): part is string => !!part)
    .join(" · ");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <IconButton
            icon={
              vehicle.photo_uri ? (
                <Image source={{ uri: vehicle.photo_uri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialCommunityIcons name={vehicleClassIcon(vehicle.vehicle_class)} size={26} color={colors.primary} />
                </View>
              )
            }
            onPress={handleChangePhoto}
            accessibilityLabel="Change vehicle photo"
          />
          <View style={styles.topRowText}>
            <Text style={styles.nickname}>{vehicle.nickname}</Text>
            {metaLine !== "" && (
              <Text style={styles.plate} numberOfLines={1}>
                {metaLine}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.kmRow}>
          <View>
            <Text style={typography.caption}>Current odometer</Text>
            <Text style={styles.kmValue}>{formatDistance(vehicle.current_km, unit)}</Text>
          </View>
          <IconButton
            icon={
              <View style={styles.kmButton}>
                <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
                <Text style={styles.kmButtonText}>Update Odometer</Text>
              </View>
            }
            onPress={() => setKmModalVisible(true)}
            accessibilityLabel="Update odometer"
          />
        </View>

        <View style={styles.quickActions}>
          <QuickActionButton
            icon={<Ionicons name="time-outline" size={19} color={colors.primary} />}
            label="History"
            onPress={() => navigation.navigate("MaintenanceHistory", { vehicleId, nickname: vehicle.nickname })}
          />
          <QuickActionButton
            icon={<Ionicons name="water-outline" size={19} color={colors.primary} />}
            label="Fuel"
            onPress={() => navigation.navigate("FuelLog", { vehicleId, nickname: vehicle.nickname })}
          />
          <QuickActionButton
            icon={<Ionicons name="wallet-outline" size={19} color={colors.primary} />}
            label="Expenses"
            onPress={() => navigation.navigate("ExpenseLog", { vehicleId, nickname: vehicle.nickname })}
          />
          <QuickActionButton
            icon={<Ionicons name="stats-chart-outline" size={19} color={colors.primary} />}
            label="Trends"
            onPress={() => navigation.navigate("VehicleStats", { vehicleId, nickname: vehicle.nickname })}
          />
        </View>
      </View>

      <FlatList
        data={schedules}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {recalls.length > 0 && (
              <Card style={styles.section}>
                <SectionHeader
                  title="Open Recalls"
                  right={
                    <IconButton
                      icon={<Ionicons name="refresh-outline" size={18} color={colors.primary} />}
                      onPress={() => comingSoon("Check Recalls", "M7")}
                      accessibilityLabel="Check for recalls"
                    />
                  }
                />
                {recalls.map((r) => (
                  <View key={r.id} style={styles.recallCard}>
                    <View style={styles.recallHeader}>
                      <Text style={styles.docLabel}>{r.component}</Text>
                      <StatusBadge label="Open Recall" bg={colors.danger} fg={colors.onPrimary} />
                    </View>
                    <Text style={styles.docExpiry}>{r.summary}</Text>
                  </View>
                ))}
              </Card>
            )}

            <Card style={styles.section}>
              <SectionHeader
                title="Documents"
                subtitle={
                  recalls.length === 0 ? (
                    <Text
                      style={styles.inlineRecallCheckText}
                      onPress={() => comingSoon("Check Recalls", "M7")}
                    >
                      {vehicle.recalls_checked_at == null
                        ? "Check for recalls"
                        : `No recalls · checked ${formatDueDate(vehicle.recalls_checked_at)}`}
                    </Text>
                  ) : undefined
                }
                right={
                  <IconButton
                    icon={<Ionicons name="add-circle-outline" size={18} color={colors.primary} />}
                    onPress={() => setDocumentModalVisible(true)}
                    accessibilityLabel="Add document"
                  />
                }
              />
              {documents.length === 0 ? (
                <Text style={styles.emptyHint}>No tax, insurance, or registration reminders yet.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {documents.map((doc) => {
                    const status = statusFromExpiry(doc.expiry_date, daysThreshold);
                    const statusStyle = STATUS_STYLE[status];
                    return (
                      <View key={doc.id} style={[styles.docChip, { borderColor: statusStyle.fg }]}>
                        <Text
                          style={styles.docChipLabel}
                          numberOfLines={1}
                          onPress={() => confirmDeleteDocument(doc)}
                        >
                          {DOCUMENT_TYPE_LABEL[doc.document_type]}: {doc.label}
                        </Text>
                        <Text style={[styles.docChipStatus, { color: statusStyle.fg }]}>
                          {STATUS_LABEL[status]} · {formatDueDate(doc.expiry_date)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </Card>

            <Card style={styles.section}>
              <SectionHeader
                title="Loan"
                right={
                  !loan ? (
                    <IconButton
                      icon={<Ionicons name="add-circle-outline" size={18} color={colors.primary} />}
                      onPress={() => setLoanModalVisible(true)}
                      accessibilityLabel="Add loan"
                    />
                  ) : undefined
                }
              />
              {loan ? (
                (() => {
                  const summary = summarizeLoan(loan);
                  return (
                    <ListRow
                      title={`${loan.lender || "Loan"} · ${loan.monthly_payment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`}
                      subtitle={
                        summary.isPaidOff
                          ? "Paid off"
                          : `${summary.monthsRemaining} month(s) left · payoff ${formatDueDate(summary.payoffDate)}`
                      }
                      onPress={() => setLoanModalVisible(true)}
                    />
                  );
                })()
              ) : (
                <Text style={styles.emptyHint}>No loan on file for this vehicle.</Text>
              )}
            </Card>

            <Text style={[typography.label, styles.scheduleTitle]}>Maintenance Schedule</Text>
          </>
        }
        renderItem={({ item }) => {
          const status = STATUS_STYLE[item.status];
          const isSnoozed = item.snoozed_until != null && item.snoozed_until > new Date().toISOString().slice(0, 10);
          return (
            <Card style={styles.scheduleCard}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.item_name}</Text>
                <StatusBadge label={STATUS_LABEL[item.status]} bg={status.bg} fg={status.fg} />
              </View>
              <Text style={styles.cardSub}>
                {item.due_km != null ? `Due at: ${formatDistance(item.due_km, unit)}` : ""}
                {item.due_km != null && item.due_date ? " • " : ""}
                {item.due_date ? `by ${formatDueDate(item.due_date)}` : ""}
              </Text>
              {isSnoozed && (
                <Text style={styles.snoozedText}>Snoozed until {formatDueDate(item.snoozed_until)}</Text>
              )}
              <View style={styles.cardActions}>
                <IconButton
                  icon={
                    <View style={styles.doneButton}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                      <Text style={styles.doneButtonText}>Mark as Done</Text>
                    </View>
                  }
                  onPress={() => setMarkDoneItem(item)}
                  accessibilityLabel={`Mark ${item.item_name} as done`}
                />
                {(item.status === "due_soon" || item.status === "overdue") && (
                  <IconButton
                    icon={
                      <View style={styles.doneButton}>
                        <Ionicons name="notifications-off-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.snoozeButtonText}>Snooze</Text>
                      </View>
                    }
                    onPress={() => handleSnooze(item)}
                    accessibilityLabel={`Snooze ${item.item_name} reminder`}
                  />
                )}
              </View>
            </Card>
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
        vehicleClass={vehicle.vehicle_class}
        nickname={vehicle.nickname}
        plateNumber={vehicle.plate_number}
        vin={vehicle.vin}
        year={vehicle.year}
        color={vehicle.color}
        engineSize={vehicle.engine_size}
        transmission={vehicle.transmission}
        fuelType={vehicle.fuel_type}
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
  plate: { ...typography.caption, marginTop: spacing.xs },
  kmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  kmValue: { ...typography.title, marginTop: spacing.xs },
  kmButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  kmButtonText: { ...typography.smallBold, color: colors.primaryDark },
  quickActions: {
    flexDirection: "row",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.md },
  scheduleTitle: { marginTop: spacing.xs, marginBottom: spacing.sm },
  inlineRecallCheckText: { ...typography.caption },
  emptyHint: { ...typography.caption },
  chipRow: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.md },
  docChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    minWidth: 140,
    maxWidth: 180,
  },
  docChipLabel: { ...typography.smallBold, color: colors.text },
  docChipStatus: { ...typography.microBold, marginTop: spacing.xs },
  docLabel: { ...typography.body, fontWeight: "700" },
  docExpiry: { ...typography.caption, marginTop: spacing.xs },
  recallCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  recallHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm },
  scheduleCard: { marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { ...typography.body, fontWeight: "700" },
  cardSub: { ...typography.caption, marginTop: spacing.xs },
  doneButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  doneButtonText: { ...typography.smallBold, color: colors.primary },
  cardActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  snoozeButtonText: { ...typography.smallBold, color: colors.textMuted },
  snoozedText: { ...typography.caption, color: colors.warning, marginTop: spacing.xs, fontWeight: "600" },
});
