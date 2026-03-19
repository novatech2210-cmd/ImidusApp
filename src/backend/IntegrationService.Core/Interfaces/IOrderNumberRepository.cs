using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface IOrderNumberRepository
    {
        Task<int> GetNextDailyOrderNumberAsync();
    }
}
