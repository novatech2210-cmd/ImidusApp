using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Core.Services
{
    public class BirthdayRewardService
    {
        private readonly IPosRepository _posRepo;
        private readonly IActivityLogRepository _activityRepo;

        public BirthdayRewardService(IPosRepository posRepository, IActivityLogRepository activityRepo)
        {
            _posRepo = posRepository;
            _activityRepo = activityRepo;
        }

        public async Task<IEnumerable<PosCustomer>> GetCustomersWithBirthdayTodayAsync()
        {
            var today = DateTime.Today;
            var month = today.Month;
            var day = today.Day;

            var customerIds = await _activityRepo.GetCustomersWithBirthdayTodayAsync(month, day);
            var customers = new List<PosCustomer>();

            foreach (var id in customerIds)
            {
                var customer = await _posRepo.GetCustomerByIdAsync(id);
                if (customer != null)
                {
                    customers.Add(customer);
                }
            }

            return customers;
        }

        public async Task ProcessTodayBirthdaysAsync()
        {
            var config = await _activityRepo.GetBirthdayRewardConfigAsync();
            if (!config.IsEnabled) return;

            var customers = await GetCustomersWithBirthdayTodayAsync();
            foreach (var customer in customers)
            {
                await ApplyBirthdayRewardAsync(customer.ID, config.RewardPoints);
            }
        }

        public async Task ApplyBirthdayRewardAsync(int customerId, int points)
        {
            var customer = await _posRepo.GetCustomerByIdAsync(customerId);
            if (customer != null)
            {
                // Update loyalty points
                await _posRepo.UpdateLoyaltyPointsAsync(customerId, customer.EarnedPoints + points);
                
                // Record points transaction
                await _posRepo.InsertPointsDetailAsync(new PointsDetail
                {
                    CustomerID = customerId,
                    PointSaved = points,
                    TransactionDate = DateTime.Now,
                    SalesID = 0 // Internal system reward
                });

                // Mark as processed in overlay
                await _activityRepo.RecordBirthdayRewardSentAsync(customerId);
            }
        }
    }
}
