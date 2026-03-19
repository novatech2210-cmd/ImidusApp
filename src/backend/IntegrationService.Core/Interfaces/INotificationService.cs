using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface INotificationService
    {
        Task SendNotificationAsync(int customerId, string title, string message, Dictionary<string, string>? data = null);
    }
}
