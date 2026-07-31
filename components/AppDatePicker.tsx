import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toValidDate } from '@/lib/dateUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export interface AppDatePickerProps {
  visible: boolean;
  /** Current value — any date-ish input. Defaults to today when missing/invalid. */
  value?: Date | string | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
  title?: string;
  /** 'datetime' adds a time-of-day row below the calendar. Defaults to 'date'. */
  mode?: 'date' | 'datetime';
}

const MINUTE_STEPS = [0, 15, 30, 45];
const YEARS_PER_PAGE = 12;

export default function AppDatePicker({
  visible,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
  title,
  mode = 'date',
}: AppDatePickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBgColor = isDark ? '#1A1B1E' : '#FFFFFF';
  const borderColor = isDark ? '#26282C' : '#E5E5E7';
  const textColor = isDark ? '#FFFFFF' : '#111315';
  const secondaryTextColor = isDark ? '#9BA1A6' : '#6E7377';
  const primaryColor = isDark ? '#FFFFFF' : '#111315';
  const onPrimaryColor = isDark ? '#0B0B0C' : '#FFFFFF';
  const disabledColor = isDark ? '#3A3C40' : '#D1D3D6';

  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [hour24, setHour24] = useState(() => new Date().getHours());
  const [minute, setMinute] = useState(0);
  const [pickerMode, setPickerMode] = useState<'days' | 'years'>('days');
  const [yearRangeStart, setYearRangeStart] = useState(() => new Date().getFullYear() - 5);

  useEffect(() => {
    if (visible) {
      const raw = toValidDate(value);
      const d = startOfDay(raw);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
      setSelected(d);
      setHour24(raw.getHours());
      setMinute(MINUTE_STEPS.reduce((closest, m) => (Math.abs(m - raw.getMinutes()) < Math.abs(closest - raw.getMinutes()) ? m : closest), 0));
      setPickerMode('days');
    }
  }, [visible, value]);

  const openYearPicker = () => {
    setYearRangeStart(viewYear - Math.floor(YEARS_PER_PAGE / 2));
    setPickerMode('years');
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setPickerMode('days');
  };

  const hour12 = ((hour24 + 11) % 12) + 1;
  const isPM = hour24 >= 12;

  const cycleHour = (delta: number) => {
    setHour24(prev => (prev + delta + 24) % 24);
  };

  const cycleMinute = (delta: number) => {
    const idx = MINUTE_STEPS.indexOf(minute);
    setMinute(MINUTE_STEPS[(idx + delta + MINUTE_STEPS.length) % MINUTE_STEPS.length]);
  };

  const togglePeriod = () => {
    setHour24(prev => (prev + 12) % 24);
  };

  const minDay = minimumDate ? startOfDay(minimumDate) : undefined;
  const maxDay = maximumDate ? startOfDay(maximumDate) : undefined;

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const weeks = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();
    const cells: (number | null)[] = Array(firstDayOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewMonth, viewYear]);

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDay && d < minDay) return true;
    if (maxDay && d > maxDay) return true;
    return false;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: cardBgColor, borderColor }]} onPress={() => {}}>
          {title && (
            <ThemedText style={[styles.title, { color: secondaryTextColor }]}>{title}</ThemedText>
          )}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => pickerMode === 'years' ? setYearRangeStart(y => y - YEARS_PER_PAGE) : goPrevMonth()}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerLabels}
              onPress={() => pickerMode === 'years' ? setPickerMode('days') : openYearPicker()}
            >
              {pickerMode === 'days' && (
                <ThemedText style={[styles.monthLabel, { color: secondaryTextColor }]}>
                  {MONTH_NAMES[viewMonth]}
                </ThemedText>
              )}
              <View style={styles.yearLabelRow}>
                <ThemedText style={[styles.yearLabel, { color: textColor }]}>{viewYear}</ThemedText>
                <MaterialCommunityIcons
                  name={pickerMode === 'years' ? 'menu-up' : 'menu-down'}
                  size={22}
                  color={secondaryTextColor}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickerMode === 'years' ? setYearRangeStart(y => y + YEARS_PER_PAGE) : goNextMonth()}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="chevron-right" size={26} color={textColor} />
            </TouchableOpacity>
          </View>

          {pickerMode === 'years' ? (
            <View style={styles.yearGrid}>
              {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearRangeStart + i).map(year => {
                const isSelected = year === viewYear;
                return (
                  <TouchableOpacity
                    key={year}
                    style={[styles.yearCell, isSelected && { backgroundColor: primaryColor }]}
                    onPress={() => selectYear(year)}
                  >
                    <ThemedText style={[styles.yearCellText, { color: isSelected ? onPrimaryColor : textColor }]}>
                      {year}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
          <View style={styles.grid}>
            {weeks.map((row, i) => (
              <View key={i} style={styles.gridRow}>
                {row.map((day, j) => {
                  if (day === null) return <View key={j} style={styles.dayCell} />;
                  const cellDate = new Date(viewYear, viewMonth, day);
                  const selectedDay = isSameDay(cellDate, selected);
                  const today = isSameDay(cellDate, new Date());
                  const disabled = isDisabled(day);
                  return (
                    <TouchableOpacity
                      key={j}
                      disabled={disabled}
                      style={[
                        styles.dayCell,
                        selectedDay && { backgroundColor: primaryColor },
                        !selectedDay && today && { borderWidth: 1, borderColor: primaryColor },
                      ]}
                      onPress={() => setSelected(cellDate)}
                    >
                      <ThemedText
                        style={[
                          styles.dayText,
                          { color: disabled ? disabledColor : selectedDay ? onPrimaryColor : textColor },
                        ]}
                      >
                        {day}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          )}

          {pickerMode === 'days' && mode === 'datetime' && (
            <View style={[styles.timeRow, { borderTopColor: borderColor }]}>
              <View style={styles.timeStepper}>
                <TouchableOpacity onPress={() => cycleHour(1)} hitSlop={8}>
                  <MaterialCommunityIcons name="chevron-up" size={20} color={textColor} />
                </TouchableOpacity>
                <ThemedText style={[styles.timeValue, { color: textColor }]}>
                  {String(hour12).padStart(2, '0')}
                </ThemedText>
                <TouchableOpacity onPress={() => cycleHour(-1)} hitSlop={8}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={textColor} />
                </TouchableOpacity>
              </View>
              <ThemedText style={[styles.timeColon, { color: textColor }]}>:</ThemedText>
              <View style={styles.timeStepper}>
                <TouchableOpacity onPress={() => cycleMinute(1)} hitSlop={8}>
                  <MaterialCommunityIcons name="chevron-up" size={20} color={textColor} />
                </TouchableOpacity>
                <ThemedText style={[styles.timeValue, { color: textColor }]}>
                  {String(minute).padStart(2, '0')}
                </ThemedText>
                <TouchableOpacity onPress={() => cycleMinute(-1)} hitSlop={8}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={textColor} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.periodToggle, { borderColor }]}
                onPress={togglePeriod}
              >
                <ThemedText style={[styles.timeValue, { color: textColor, fontSize: 14 }]}>
                  {isPM ? 'PM' : 'AM'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={onCancel}>
              <ThemedText style={[styles.footerButtonText, { color: secondaryTextColor }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => {
                const result = mode === 'datetime'
                  ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), hour24, minute)
                  : selected;
                onConfirm(result);
              }}
            >
              <ThemedText style={[styles.footerButtonText, { color: primaryColor, fontWeight: '700' }]}>
                Done
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLabels: {
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  yearLabel: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  yearLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  yearCell: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearCellText: {
    fontSize: 15,
    fontWeight: '600',
  },
  grid: {
    gap: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timeStepper: {
    alignItems: 'center',
    gap: 2,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 18,
    fontWeight: '700',
  },
  periodToggle: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  footerButtonText: {
    fontSize: 15,
  },
});
