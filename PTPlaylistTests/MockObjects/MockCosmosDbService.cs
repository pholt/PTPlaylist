using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using PTPlaylistMVC.Interfaces;
using PTPlaylistMVC.Models;

namespace PTPlaylistTests.MockObjects
{
    class MockCosmosDbService : ICosmosDbService
    {
        public async Task AddVideoAsync(Video video)
        {
            throw new NotImplementedException();
        }

        public async Task DeleteVideoAsync(string id)
        {
            throw new NotImplementedException();
        }

        public async Task<Video> GetVideoAsync(string id)
        {
            throw new NotImplementedException();
        }

        public async Task<IEnumerable<Video>> GetVideosAsync(string query)
        {
            throw new NotImplementedException();
        }

        public async Task UpdateVideoAsync(string id, Video video)
        {
            throw new NotImplementedException();
        }
    }
}
