import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  View, 
  Image,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePropertyStore, Property, Unit, SubUnit } from '@/store/propertyStore';

type SubUnitType = 'bedroom' | 'bathroom' | 'living_room' | 'kitchen' | 'other';

const SUB_UNIT_TYPES: { value: SubUnitType; label: string; icon: string }[] = [
  { value: 'bedroom', label: 'Bedroom', icon: 'bed-outline' },
  { value: 'bathroom', label: 'Bathroom', icon: 'shower' },
  { value: 'living_room', label: 'Living Room', icon: 'sofa-outline' },
  { value: 'kitchen', label: 'Kitchen', icon: 'stove' },
  { value: 'other', label: 'Other', icon: 'door' },
];

export default function PropertyDetailScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { 
    getPropertyById, 
    updateProperty, 
    deleteProperty,
    addUnit, 
    updateUnit, 
    deleteUnit,
    addSubUnit,
    deleteSubUnit,
  } = usePropertyStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddSubUnitModal, setShowAddSubUnitModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [newSubUnitName, setNewSubUnitName] = useState('');
  const [newSubUnitType, setNewSubUnitType] = useState<SubUnitType>('bedroom');
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#101922' : '#f6f7f8';
  const cardBgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const secondaryTextColor = isDark ? '#9ca3af' : '#6b7280';
  const primaryColor = '#137fec';
  const successColor = '#10b981';
  const dangerColor = '#ef4444';
  const warningColor = '#f59e0b';

  useEffect(() => {
    if (id) {
      const fetchedProperty = getPropertyById(id);
      if (fetchedProperty) {
        setProperty(fetchedProperty);
        // Expand all units by default
        setExpandedUnits(new Set(fetchedProperty.units.map(u => u.id)));
      }
    }
  }, [id, getPropertyById]);

  // Refresh property data
  const refreshProperty = () => {
    if (id) {
      const updated = getPropertyById(id);
      if (updated) setProperty(updated);
    }
  };

  const toggleUnitExpanded = (unitId: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  const handleAddUnit = () => {
    if (!newUnitName.trim()) {
      Alert.alert('Error', 'Please enter a unit name');
      return;
    }
    if (!property) return;

    addUnit(property.id, { name: newUnitName.trim() });
    setNewUnitName('');
    setShowAddUnitModal(false);
    refreshProperty();
  };

  const handleDeleteUnit = (unitId: string) => {
    if (!property) return;
    
    Alert.alert(
      'Delete Unit',
      'Are you sure you want to delete this unit? This will also delete all rooms within it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteUnit(property.id, unitId);
            refreshProperty();
          },
        },
      ]
    );
  };

  const handleAddSubUnit = () => {
    if (!newSubUnitName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }
    if (!property || !selectedUnitId) return;

    addSubUnit(property.id, selectedUnitId, { 
      name: newSubUnitName.trim(), 
      type: newSubUnitType 
    });
    setNewSubUnitName('');
    setNewSubUnitType('bedroom');
    setShowAddSubUnitModal(false);
    setSelectedUnitId(null);
    refreshProperty();
  };

  const handleDeleteSubUnit = (unitId: string, subUnitId: string) => {
    if (!property) return;
    
    Alert.alert(
      'Delete Room',
      'Are you sure you want to delete this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSubUnit(property.id, unitId, subUnitId);
            refreshProperty();
          },
        },
      ]
    );
  };

  const handleDeleteProperty = () => {
    if (!property) return;
    
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProperty(property.id);
            router.back();
          },
        },
      ]
    );
  };

  const openAddSubUnitModal = (unitId: string) => {
    setSelectedUnitId(unitId);
    setShowAddSubUnitModal(true);
  };

  const getSubUnitIcon = (type: SubUnitType) => {
    return SUB_UNIT_TYPES.find(t => t.value === type)?.icon || 'door';
  };

  if (!property) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Property Details</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
            Property not found
          </ThemedText>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: primaryColor }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const occupiedUnits = property.units.filter(u => u.isOccupied).length;
  const totalSubUnits = property.units.reduce((acc, u) => acc + u.subUnits.length, 0);

  return (
    <ThemedView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: textColor }]}>Property Details</ThemedText>
        <TouchableOpacity onPress={handleDeleteProperty}>
          <MaterialCommunityIcons name="delete-outline" size={24} color={dangerColor} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Image */}
        {property.photo ? (
          <Image source={{ uri: property.photo }} style={styles.propertyImage} />
        ) : (
          <View style={[styles.propertyImage, styles.imagePlaceholder, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <MaterialCommunityIcons name="home-outline" size={64} color={secondaryTextColor} />
          </View>
        )}

        {/* Property Info Card */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={primaryColor} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Location</ThemedText>
          </View>
          
          <View style={styles.locationInfo}>
            <ThemedText style={[styles.addressText, { color: textColor }]}>
              {property.streetAddress}
            </ThemedText>
            <ThemedText style={[styles.cityStateText, { color: secondaryTextColor }]}>
              {property.city}, {property.state} {property.zipCode}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Property Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <MaterialCommunityIcons name="home-group" size={18} color={primaryColor} />
              </View>
              <View>
                <ThemedText style={[styles.statValue, { color: textColor }]}>
                  {property.units.length}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Units</ThemedText>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <MaterialCommunityIcons name="account-check" size={18} color={successColor} />
              </View>
              <View>
                <ThemedText style={[styles.statValue, { color: textColor }]}>
                  {occupiedUnits}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Occupied</ThemedText>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                <MaterialCommunityIcons name="door" size={18} color={warningColor} />
              </View>
              <View>
                <ThemedText style={[styles.statValue, { color: textColor }]}>
                  {totalSubUnits}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: secondaryTextColor }]}>Rooms</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Property Type Badge */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="home-city-outline" size={20} color={primaryColor} />
            </View>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Property Type</ThemedText>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${primaryColor}15` }]}>
            <MaterialCommunityIcons 
              name={property.propertyType === 'single_unit' ? 'home' : 'office-building'} 
              size={20} 
              color={primaryColor} 
            />
            <ThemedText style={[styles.typeText, { color: primaryColor }]}>
              {property.propertyType === 'single_unit' ? 'Single Unit Property' : 'Multi-Unit Property'}
            </ThemedText>
          </View>
          <ThemedText style={[styles.typeDescription, { color: secondaryTextColor }]}>
            {property.propertyType === 'single_unit' 
              ? 'This property has one main unit with individual rooms (sub-units).'
              : 'This property has multiple units, each with their own rooms (sub-units).'}
          </ThemedText>
        </View>

        {/* Units Section */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <View style={styles.cardHeaderWithAction}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="floor-plan" size={20} color={primaryColor} />
              </View>
              <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                Units & Rooms
              </ThemedText>
            </View>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: primaryColor }]}
              onPress={() => setShowAddUnitModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={18} color="white" />
              <ThemedText style={styles.addButtonText}>Add Unit</ThemedText>
            </TouchableOpacity>
          </View>

          {property.units.length === 0 ? (
            <View style={styles.emptyUnits}>
              <MaterialCommunityIcons name="home-plus-outline" size={48} color={secondaryTextColor} />
              <ThemedText style={[styles.emptyText, { color: secondaryTextColor }]}>
                No units added yet
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: secondaryTextColor }]}>
                Add units to organize your property
              </ThemedText>
            </View>
          ) : (
            property.units.map((unit) => (
              <View key={unit.id} style={[styles.unitContainer, { borderColor }]}>
                <TouchableOpacity 
                  style={styles.unitHeader}
                  onPress={() => toggleUnitExpanded(unit.id)}
                >
                  <View style={styles.unitHeaderLeft}>
                    <MaterialCommunityIcons 
                      name={expandedUnits.has(unit.id) ? 'chevron-down' : 'chevron-right'} 
                      size={24} 
                      color={secondaryTextColor} 
                    />
                    <View>
                      <ThemedText style={[styles.unitName, { color: textColor }]}>
                        {unit.name}
                      </ThemedText>
                      <View style={styles.unitMeta}>
                        <View style={[
                          styles.occupancyBadge, 
                          { backgroundColor: unit.isOccupied ? `${successColor}20` : `${dangerColor}20` }
                        ]}>
                          <View style={[
                            styles.occupancyDot, 
                            { backgroundColor: unit.isOccupied ? successColor : dangerColor }
                          ]} />
                          <ThemedText style={[
                            styles.occupancyText, 
                            { color: unit.isOccupied ? successColor : dangerColor }
                          ]}>
                            {unit.isOccupied ? 'Occupied' : 'Vacant'}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.roomCount, { color: secondaryTextColor }]}>
                          {unit.subUnits.length} room{unit.subUnits.length !== 1 ? 's' : ''}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleDeleteUnit(unit.id)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={dangerColor} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {expandedUnits.has(unit.id) && (
                  <View style={styles.subUnitsContainer}>
                    {unit.subUnits.map((subUnit) => (
                      <View key={subUnit.id} style={[styles.subUnitItem, { backgroundColor: isDark ? '#1a242d' : '#f9fafb' }]}>
                        <View style={styles.subUnitInfo}>
                          <MaterialCommunityIcons 
                            name={getSubUnitIcon(subUnit.type) as any} 
                            size={18} 
                            color={secondaryTextColor} 
                          />
                          <ThemedText style={[styles.subUnitName, { color: textColor }]}>
                            {subUnit.name}
                          </ThemedText>
                          <View style={[styles.subUnitTypeBadge, { backgroundColor: `${primaryColor}15` }]}>
                            <ThemedText style={[styles.subUnitTypeText, { color: primaryColor }]}>
                              {subUnit.type.replace('_', ' ')}
                            </ThemedText>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteSubUnit(unit.id, subUnit.id)}>
                          <MaterialCommunityIcons name="close" size={18} color={secondaryTextColor} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity 
                      style={[styles.addSubUnitButton, { borderColor }]}
                      onPress={() => openAddSubUnitModal(unit.id)}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={primaryColor} />
                      <ThemedText style={[styles.addSubUnitText, { color: primaryColor }]}>
                        Add Room
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Unit Modal */}
      <Modal
        visible={showAddUnitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddUnitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddUnitModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: cardBgColor }]}>
            <View style={styles.modalHandle} />
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Add New Unit</ThemedText>
            <ThemedText style={[styles.modalDescription, { color: secondaryTextColor }]}>
              {property.propertyType === 'single_unit' 
                ? 'Add the main unit for your single-unit property.'
                : 'Add a unit (e.g., Apartment 1A, Unit 2B) to your property.'}
            </ThemedText>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1a242d' : '#f9fafb', borderColor, color: textColor }]}
              placeholder="Enter unit name (e.g., Unit A, Apartment 101)"
              placeholderTextColor={secondaryTextColor}
              value={newUnitName}
              onChangeText={setNewUnitName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor }]}
                onPress={() => { setShowAddUnitModal(false); setNewUnitName(''); }}
              >
                <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleAddUnit}
              >
                <ThemedText style={styles.confirmButtonText}>Add Unit</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Sub-Unit Modal */}
      <Modal
        visible={showAddSubUnitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSubUnitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddSubUnitModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: cardBgColor }]}>
            <View style={styles.modalHandle} />
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Add New Room</ThemedText>
            <ThemedText style={[styles.modalDescription, { color: secondaryTextColor }]}>
              Add a room (sub-unit) to this unit.
            </ThemedText>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1a242d' : '#f9fafb', borderColor, color: textColor }]}
              placeholder="Enter room name (e.g., Master Bedroom)"
              placeholderTextColor={secondaryTextColor}
              value={newSubUnitName}
              onChangeText={setNewSubUnitName}
              autoFocus
            />
            
            <ThemedText style={[styles.typeSelectLabel, { color: textColor }]}>Room Type</ThemedText>
            <View style={styles.typeGrid}>
              {SUB_UNIT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor: newSubUnitType === type.value ? `${primaryColor}15` : (isDark ? '#1a242d' : '#f9fafb'),
                      borderColor: newSubUnitType === type.value ? primaryColor : borderColor,
                    },
                  ]}
                  onPress={() => setNewSubUnitType(type.value)}
                >
                  <MaterialCommunityIcons 
                    name={type.icon as any} 
                    size={20} 
                    color={newSubUnitType === type.value ? primaryColor : secondaryTextColor} 
                  />
                  <ThemedText 
                    style={[
                      styles.typeOptionText, 
                      { color: newSubUnitType === type.value ? primaryColor : textColor }
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor }]}
                onPress={() => { 
                  setShowAddSubUnitModal(false); 
                  setNewSubUnitName(''); 
                  setSelectedUnitId(null);
                }}
              >
                <ThemedText style={[styles.cancelButtonText, { color: textColor }]}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleAddSubUnit}
              >
                <ThemedText style={styles.confirmButtonText}>Add Room</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#137fec15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  locationInfo: {
    gap: 4,
  },
  addressText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cityStateText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeDescription: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyUnits: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
  },
  unitContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  unitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  unitName: {
    fontSize: 15,
    fontWeight: '600',
  },
  unitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  occupancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  occupancyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  occupancyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  roomCount: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  subUnitsContainer: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  subUnitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
  },
  subUnitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subUnitName: {
    fontSize: 14,
    fontWeight: '500',
  },
  subUnitTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subUnitTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  addSubUnitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 4,
  },
  addSubUnitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  typeSelectLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {},
  confirmButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
