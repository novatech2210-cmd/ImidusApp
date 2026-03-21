import {useEffect} from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../store';
import {logoutUser} from '../store/authSlice';
import {fetchCustomerLoyalty, fetchLoyaltyHistory} from '../store/loyaltySlice';
import {Colors, Elevation, Spacing, TextStyles, TouchTarget, BorderRadius} from '../theme';

const ProfileScreen = ({navigation}: any) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const {customerId, balance, transactions, loading} = useSelector(
    (state: RootState) => state.loyalty,
  );
  const dispatch = useDispatch<AppDispatch>();

  // Fetch loyalty data when screen loads (per user decision)
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{width: 50}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {user?.firstName?.[0] || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.loyaltyCard}>
          <Text style={styles.loyaltyLabel}>Loyalty Points Balance</Text>
          {loading && !balance ? (
            <ActivityIndicator
              size="large"
              color={Colors.brandGold}
              style={styles.loader}
            />
          ) : (
            <>
              <Text style={TextStyles.loyaltyPoints}>{balance}</Text>
              <Text style={styles.loyaltyVoice}>
                You've earned {balance} loyalty points.
              </Text>
              <View style={styles.divider} />
              <Text style={styles.loyaltySubtext}>100 points = $1.00 USD</Text>
            </>
          )}
        </View>

        {transactions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <FlatList
              data={transactions}
              keyExtractor={(item, index) => item?.id?.toString() ?? `order-${index}`}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Order History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Saved Addresses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Payment Methods</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.brandGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.level3,
  },
  headerTitle: {
    ...TextStyles.headline,
    color: Colors.dark,
  },
  backButtonText: {
    ...TextStyles.label,
    color: Colors.dark,
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    textAlignVertical: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userName: {
    ...TextStyles.headline,
    color: Colors.slate900,
  },
  userEmail: {
    ...TextStyles.body,
    color: Colors.slate600,
    marginTop: Spacing.xs,
  },
  loyaltyCard: {
    backgroundColor: Colors.lightGold,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.brandGold,
    ...Elevation.level2,
  },
  loyaltyLabel: {
    ...TextStyles.label,
    color: Colors.brandBlue,
    marginBottom: Spacing.sm,
  },
  loyaltyVoice: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    width: '100%',
    marginVertical: Spacing.md,
  },
  loyaltySubtext: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  historySection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Elevation.level1,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDesc: {
    ...TextStyles.body,
    color: Colors.slate900,
  },
  transactionDate: {
    ...TextStyles.microLabel,
    color: Colors.slate600,
    marginTop: 2,
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: 'bold',
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
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    ...Elevation.level1,
  },
  sectionTitle: {
    ...TextStyles.title,
    color: Colors.slate900,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
    minHeight: TouchTarget.minimum,
    justifyContent: 'center',
  },
  menuItemText: {
    ...TextStyles.body,
    color: Colors.slate900,
  },
  logoutButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
