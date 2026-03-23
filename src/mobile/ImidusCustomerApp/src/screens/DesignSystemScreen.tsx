/**
 * IMIDUS Imperial Onyx Design System Showcase
 * Comprehensive preview of all design tokens, components, and screens
 * Web-only developer tool for design system preview
 */

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, TextStyles, Spacing, BorderRadius, Elevation, TouchTarget, Images } from '@/theme';
import MenuItemCard from '../components/MenuItemCard';
import ImidusHeader from '../components/common/ImidusHeader';
import LoyaltyCard from '../components/common/LoyaltyCard';
import SkeletonMenuCard from '../components/SkeletonMenuCard';
import FloatingCartButton from '../components/FloatingCartButton';

const DesignSystemScreen = ({ navigation }: any) => {
  const [activeSection, setActiveSection] = useState('brand');

  // ── Section: Brand Identity ──────────────────────────────────────
  const BrandSection = () => (
    <View style={styles.section}>
      <LinearGradient
        colors={[Colors.brandBlue, Colors.darkBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.brandHeader}>
        <Text style={[TextStyles.display, { color: Colors.white }]}>IMIDUS</Text>
        <View style={styles.taglineRow}>
          <View style={styles.dot} />
          <Text style={[TextStyles.microLabel, { color: Colors.white }]}>Order</Text>
          <View style={styles.dot} />
          <Text style={[TextStyles.microLabel, { color: Colors.white }]}>Track</Text>
          <View style={styles.dot} />
          <Text style={[TextStyles.microLabel, { color: Colors.white }]}>Earn</Text>
          <View style={styles.dot} />
        </View>
      </LinearGradient>
      <View style={styles.sectionContent}>
        <Text style={[TextStyles.h3]}>Brand Identity</Text>
        <Text style={[TextStyles.body, { marginVertical: Spacing.md }]}>
          Seamless Ordering. Real-Time Sync. Unified Loyalty.
        </Text>
        <Text style={[TextStyles.label, { color: Colors.textMuted }]}>LUXURY RESTAURANT LOYALTY PLATFORM</Text>
      </View>
    </View>
  );

  // ── Section: Color Palette ───────────────────────────────────────
  const ColorSwatch = ({ name, hex }: { name: string; hex: string }) => {
    const rgb = parseInt(hex.slice(1), 16);
    const color = `rgb(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255})`;
    return (
      <View style={styles.colorSwatchContainer}>
        <View style={[styles.colorSwatch, { backgroundColor: color }]} />
        <Text style={[TextStyles.label, { fontSize: 11, marginTop: Spacing.sm }]}>{name}</Text>
        <Text style={[TextStyles.body, { fontSize: 11, color: Colors.textMuted }]}>{hex}</Text>
      </View>
    );
  };

  const ColorPaletteSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[TextStyles.h2]}>Color Palette</Text>
        <Text style={[TextStyles.body, { color: Colors.textSecondary }]}>
          All design tokens as swatches
        </Text>
      </View>
      <View style={styles.sectionContent}>
        {/* Core Brand */}
        <Text style={[TextStyles.title, { marginBottom: Spacing.md }]}>Core Brand</Text>
        <View style={styles.colorRow}>
          <ColorSwatch name="Brand Blue" hex={Colors.brandBlue} />
          <ColorSwatch name="Brand Gold" hex={Colors.brandGold} />
          <ColorSwatch name="Background" hex={Colors.background} />
          <ColorSwatch name="Surface" hex={Colors.surface} />
        </View>

        {/* Text Hierarchy */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Text Colors
        </Text>
        <View style={styles.colorRow}>
          <ColorSwatch name="Text Primary" hex={Colors.textPrimary} />
          <ColorSwatch name="Text Secondary" hex={Colors.textSecondary} />
          <ColorSwatch name="Text Muted" hex={Colors.textMuted} />
          <ColorSwatch name="Text OnDark" hex={Colors.textOnDark} />
        </View>

        {/* Status Colors */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Status Colors
        </Text>
        <View style={styles.colorRow}>
          <ColorSwatch name="Success" hex={Colors.success} />
          <ColorSwatch name="Warning" hex={Colors.warning} />
          <ColorSwatch name="Error" hex={Colors.error} />
          <ColorSwatch name="Info" hex={Colors.info} />
        </View>

        {/* Elevation Surfaces */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Elevation Surfaces
        </Text>
        <View style={styles.colorRow}>
          <ColorSwatch name="Elevation 0" hex={Colors.elevation0} />
          <ColorSwatch name="Elevation 1" hex={Colors.elevation1} />
          <ColorSwatch name="Elevation 2" hex={Colors.elevation2} />
          <ColorSwatch name="Elevation 3" hex={Colors.elevation3} />
        </View>
      </View>
    </View>
  );

  // ── Section: Typography ──────────────────────────────────────────
  const TypographySection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[TextStyles.h2]}>Typography Scale</Text>
        <Text style={[TextStyles.body, { color: Colors.textSecondary }]}>
          Imperial Onyx font hierarchy
        </Text>
      </View>
      <View style={styles.sectionContent}>
        <Text style={TextStyles.display}>Display 48px / 800</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.headline}>Headline 24px / 700</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.title}>Title 18px / 600</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.body}>Body 14px / 500 — Regular reading text with comfortable line height</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.label}>LABEL 12px / 600 / UPPERCASE</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.microLabel}>MICROLABEL 11px / 700 / ULTRA TRACKING</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.price}>$29.99</Text>
        <View style={styles.divider} />
        <Text style={TextStyles.loyaltyPoints}>1,250 pts</Text>
      </View>
    </View>
  );

  // ── Section: Components ──────────────────────────────────────────
  const ComponentsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[TextStyles.h2]}>Components</Text>
        <Text style={[TextStyles.body, { color: Colors.textSecondary }]}>
          Live component previews with mock data
        </Text>
      </View>
      <View style={styles.sectionContent}>
        {/* Buttons */}
        <Text style={[TextStyles.title, { marginBottom: Spacing.md }]}>Buttons</Text>
        <LinearGradient
          colors={[Colors.brandBlue, Colors.primary]}
          style={[styles.button, { marginBottom: Spacing.md }]}>
          <Text style={[TextStyles.label, { color: Colors.white }]}>Primary Button</Text>
        </LinearGradient>

        <LinearGradient
          colors={[Colors.brandGold, Colors.brandGold]}
          style={[styles.button, { marginBottom: Spacing.md }]}>
          <Text style={[TextStyles.label, { color: Colors.textPrimary }]}>CTA Gold Button</Text>
        </LinearGradient>

        {/* Input Fields */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Input Fields
        </Text>
        <TextInput
          placeholder="Default input"
          style={styles.input}
          placeholderTextColor={Colors.placeholderText}
        />
        <TextInput
          placeholder="With focus ring"
          style={[styles.input, { borderColor: Colors.brandBlue }]}
          placeholderTextColor={Colors.placeholderText}
        />

        {/* Status Badges */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Status Badges
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: Colors.info }]}>
            <Text style={[TextStyles.label, { color: Colors.white, fontSize: 11 }]}>PENDING</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.warning }]}>
            <Text style={[TextStyles.label, { color: Colors.white, fontSize: 11 }]}>PREPARING</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.success }]}>
            <Text style={[TextStyles.label, { color: Colors.white, fontSize: 11 }]}>READY</Text>
          </View>
        </View>

        {/* Menu Item Card */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Menu Item Card
        </Text>
        <MenuItemCard
          item={{
            ID: 1,
            IName: 'Grilled Salmon',
            CategoryID: 1,
            Description: 'Fresh Atlantic salmon grilled to perfection',
            Alcohol: 0,
            Taste: 0,
            OnlineItem: 1,
          }}
          onPress={() => {}}
        />

        {/* Loyalty Card */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Loyalty Card
        </Text>
        <LoyaltyCard
          customerName="Sarah Chen"
          pointsBalance={2450}
          memberSince="Jan 2024"
          tier="Gold"
        />

        {/* Loading State */}
        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Loading State
        </Text>
        <SkeletonMenuCard />
      </View>
    </View>
  );

  // ── Section: Spacing & Layout ────────────────────────────────────
  const SpacingSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[TextStyles.h2]}>Spacing & Layout</Text>
        <Text style={[TextStyles.body, { color: Colors.textSecondary }]}>
          Spacing scale and border radius
        </Text>
      </View>
      <View style={styles.sectionContent}>
        <Text style={[TextStyles.title, { marginBottom: Spacing.md }]}>Spacing Scale</Text>
        {[
          { name: 'xs (4px)', value: 4 },
          { name: 'sm (8px)', value: 8 },
          { name: 'md (12px)', value: 12 },
          { name: 'base (16px)', value: 16 },
          { name: 'lg (20px)', value: 20 },
        ].map((s) => (
          <View key={s.name} style={styles.spacingRow}>
            <View style={[styles.spacingBar, { width: s.value * 4, backgroundColor: Colors.brandBlue }]} />
            <Text style={[TextStyles.body, { marginLeft: Spacing.md }]}>{s.name}</Text>
          </View>
        ))}

        <Text style={[TextStyles.title, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
          Border Radius
        </Text>
        {[
          { name: 'sm (4px)', radius: 4 },
          { name: 'md (8px)', radius: 8 },
          { name: 'lg (12px)', radius: 12 },
          { name: 'xl (16px)', radius: 16 },
        ].map((br) => (
          <View key={br.name} style={styles.radiusRow}>
            <View
              style={[
                styles.radiusBox,
                {
                  borderRadius: br.radius,
                  backgroundColor: Colors.brandBlue,
                },
              ]}
            />
            <Text style={[TextStyles.body, { marginLeft: Spacing.md }]}>{br.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ── Section: Screen Navigation ───────────────────────────────────
  const ScreenNavigationSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[TextStyles.h2]}>Screen Navigation</Text>
        <Text style={[TextStyles.body, { color: Colors.textSecondary }]}>
          Tap a screen card to navigate
        </Text>
      </View>
      <View style={styles.sectionContent}>
        <View style={styles.screenGrid}>
          {[
            { name: 'Splash', screen: 'Splash' },
            { name: 'Login', screen: 'Login' },
            { name: 'Register', screen: 'Register' },
            { name: 'Menu', screen: 'Menu' },
            { name: 'Item Detail', screen: 'ItemDetail' },
            { name: 'Cart', screen: 'Cart' },
            { name: 'Checkout', screen: 'Checkout' },
            { name: 'Confirmation', screen: 'OrderConfirmation' },
            { name: 'Tracking', screen: 'OrderTracking' },
            { name: 'History', screen: 'OrderHistory' },
            { name: 'Profile', screen: 'Profile' },
          ].map((s) => (
            <TouchableOpacity
              key={s.screen}
              style={styles.screenCard}
              onPress={() => navigation.navigate(s.screen)}>
              <Text style={[TextStyles.label, { color: Colors.white }]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────
  const sections = {
    brand: <BrandSection />,
    colors: <ColorPaletteSection />,
    typography: <TypographySection />,
    components: <ComponentsSection />,
    spacing: <SpacingSection />,
    screens: <ScreenNavigationSection />,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImidusHeader title="Design System" showBackButton={false} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section Tabs */}
        <View style={styles.tabs}>
          {Object.keys(sections).map((section) => (
            <TouchableOpacity
              key={section}
              style={[
                styles.tab,
                activeSection === section && styles.tabActive,
              ]}
              onPress={() => setActiveSection(section)}>
              <Text
                style={[
                  TextStyles.label,
                  { fontSize: 12 },
                  activeSection === section
                    ? { color: Colors.white }
                    : { color: Colors.textSecondary },
                ]}>
                {section.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Section */}
        {sections[activeSection as keyof typeof sections]}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[TextStyles.microLabel, { color: Colors.textMuted }]}>
            IMPERIAL ONYX DESIGN SYSTEM
          </Text>
          <Text style={[TextStyles.body, { color: Colors.textMuted, marginTop: Spacing.sm }]}>
            Brand Blue: {Colors.brandBlue}
          </Text>
          <Text style={[TextStyles.body, { color: Colors.textMuted }]}>
            Brand Gold: {Colors.brandGold}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.midGray,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.brandGold,
  },
  section: {
    marginBottom: Spacing['3xl'],
  },
  sectionHeader: {
    backgroundColor: Colors.elevation1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomColor: Colors.midGray,
    borderBottomWidth: 1,
  },
  sectionContent: {
    padding: Spacing.lg,
  },
  brandHeader: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brandGold,
    marginHorizontal: Spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  colorSwatchContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.midGray,
    marginVertical: Spacing.lg,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  badge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  spacingBar: {
    height: 16,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  radiusBox: {
    width: 40,
    height: 40,
  },
  screenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  screenCard: {
    width: '48%',
    backgroundColor: Colors.brandBlue,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderTopColor: Colors.midGray,
    borderTopWidth: 1,
    alignItems: 'center',
  },
});

export default DesignSystemScreen;
