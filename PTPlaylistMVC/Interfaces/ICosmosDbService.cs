using System.Collections.Generic;
using System.Threading.Tasks;
using PTPlaylistMVC.Models;

namespace PTPlaylistMVC.Interfaces
{
    public interface ICosmosDbService
    {
        Task<IEnumerable<Video>> GetVideosAsync(string query);
        Task<Video> GetVideoAsync(string id);
        Task AddVideoAsync(Video video);
        Task UpdateVideoAsync(string id, Video video);
        Task DeleteVideoAsync(string id);
    }
}