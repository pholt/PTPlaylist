using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PTPlaylistMVC.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Fluent;
using Microsoft.Extensions.Configuration;
using PTPlaylistMVC.Interfaces;

namespace PTPlaylistMVC.Services
{
    public class CosmosDbService : ICosmosDbService
    {
        private Container _container;

        public CosmosDbService(
            CosmosClient dbClient,
            string databaseName,
            string containerName)
        {
            this._container = dbClient.GetContainer(databaseName, containerName);
        }

        public async Task AddVideoAsync(Video video)
        {
            await this._container.CreateItemAsync<Video>(video, new PartitionKey(video.Id));
        }

        public async Task DeleteVideoAsync(string id)
        {
            await this._container.DeleteItemAsync<Video>(id, new PartitionKey(id));
        }

        public async Task<Video> GetVideoAsync(string id)
        {
            try
            {
                ItemResponse<Video> response = await this._container.ReadItemAsync<Video>(id, new PartitionKey(id));
                return response.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

        }

        public async Task<IEnumerable<Video>> GetVideosAsync(string queryString)
        {
            var query = this._container.GetItemQueryIterator<Video>(new QueryDefinition(queryString));
            List<Video> results = new List<Video>();
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();

                results.AddRange(response.ToList());
            }

            return results;
        }

        public async Task UpdateVideoAsync(string id, Video video)
        {
            await this._container.UpsertItemAsync<Video>(video, new PartitionKey(id));
        }
    }
}