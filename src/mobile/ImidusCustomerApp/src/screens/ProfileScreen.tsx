import {ArrowLeft, ChevronRight} from 'lucide-react-native';
import {useEffect} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../store';
import {logoutUser} from '../store/authSlice';
import {fetchCustomerLoyalty, fetchLoyaltyHistory} from '../store/loyaltySlice';
import {Colors} from '../theme/colors';
import {Elevation, Spacing} from '../theme/spacing';

const ProfileScreen = ({navigation}: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {customerId, balance, transactions, loading} = useSelector(
    (state: RootState) => state.loyalty,
  );
  const dispatch = useDispatch<AppDispatch>();

  // Fetch loyalty data when screen loads
  useEffect(() => {
    if (user?.phone || user?.email) {
      dispatch(fetchCustomerLoyalty({phone: user.phone, email: user.email}));
    }
  }, [dispatch, user?.phone, user?.email]);

  // Fetch transaction history after customer lookup succeeds
  useEffect(() => {
    if (customerId) {
      dispatch(fetchLoyaltyHistory(customerId));
    }
  }, [dispatch, customerId]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{width: 44}} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & Name */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={[Colors.brandBlue, Colors.brandBlueDark]}
            style={styles.avatarGradient}>
            <Text style={styles.avatarInitial}>
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <Text style={styles.loyaltyLabel}>LOYALTY POINTS</Text>
            <View style={styles.loyaltyBadge}>
              <Text style={styles.loyaltyBadgeText}>MEMBER</Text>
            </View>
          </View>
          {loading && !balance ? (
            <ActivityIndicator
              size="large"
              color={Colors.brandGold}
              style={styles.loader}
            />
          ) : (
            <>
              <Text style={styles.loyaltyPoints}>{balance}</Text>
              <Text style={styles.loyaltyVoice}>points available</Text>
              <View style={styles.divider} />
              <View style={styles.loyaltyConversion}>
                <Text style={styles.loyaltyConversionText}>
                  100 pts = $1.00 USD
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Recent Activity */}
        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <FlatList
              data={transactions}
              keyExtractor={(item, index) =>
                item?.id?.toString() ?? `order-${index}`
              }
              renderItem={({item}) => (
                <View style={styles.transactionRow}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDesc}>
                      {item.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionPoints,
                      item.type === 'earn'
                        ? styles.earnPoints
                        : styles.redeemPoints,
                    ]}>
                    {item.type === 'earn' ? '+' : '-'}
                    {item.points} pts
                  </Text>
                </View>
              )}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No transaction history yet</Text>
              }
            />
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Order History</Text>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Saved Addresses</Text>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Payment Methods</Text>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>IMIDUS v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafe: {
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loyaltyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.brandGold,
    ...Elevation.level2,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loyaltyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  loyaltyBadge: {
    backgroundColor: Colors.brandGold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loyaltyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textOnGold,
    letterSpacing: 1,
  },
  loyaltyPoints: {
    fontSize: 56,
    fontWeight: '800',
    color: Colors.brandGold,
    textAlign: 'center',
    lineHeight: 64,
  },
  loyaltyVoice: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  loyaltyConversion: {
    alignItems: 'center',
  },
  loyaltyConversionText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Elevation.level1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  earnPoints: {
    color: Colors.success,
  },
  redeemPoints: {
    color: Colors.error,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  logoutButton: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default ProfileScreen;
