using IntegrationService.Core.Domain.Entities;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface IIdempotencyRepository
    {
        Task<IdempotencyRecord?> GetByKeyAsync(string key);
        Task StoreAsync(IdempotencyRecord record);
    }
}
