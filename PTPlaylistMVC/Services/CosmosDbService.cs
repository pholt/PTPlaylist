using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PTPlaylistMVC.Models;
using Microsoft.Azure.Cosmos;
using PTPlaylistMVC.Interfaces;

namespace PTPlaylistMVC.Services
{
    public class CosmosDbService : ICosmosDbService
    {
        private bool _isConfigured = false;
        private Container _container;

        public CosmosDbService()
        {
            string cosmosAccountName = System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_ACCOUNT"];
            string cosmosKey = System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_KEY"];
            string cosmosDbName = System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_DB_NAME"];
            string cosmosContainerName = System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_DB_CONTAINER_NAME"];
            
            this._isConfigured = 
                !string.IsNullOrWhiteSpace(cosmosAccountName) &&
                !string.IsNullOrWhiteSpace(cosmosKey) &&
                !string.IsNullOrWhiteSpace(cosmosDbName) &&
                !string.IsNullOrWhiteSpace(cosmosContainerName);

            CosmosClient dbClient = new CosmosClient(cosmosAccountName, cosmosKey);
            this._container = dbClient.GetContainer(cosmosDbName, cosmosContainerName);
        }

        public CosmosDbService(CosmosClient dbClient, string dbName, string containerName)
        {
            this._isConfigured =
                dbClient != null &&
                !string.IsNullOrWhiteSpace(dbName) &&
                !string.IsNullOrWhiteSpace(containerName);

            this._container = dbClient.GetContainer(dbName, containerName);
        }

        public bool IsConfigured() {
            return this._isConfigured;
        }

        public async Task AddVideoAsync(Video video)
        {
            await this._container.CreateItemAsync<Video>(video, new PartitionKey(video.Id));
        }

        public async Task DeleteVideoAsync(string query)
        {
            await this._container.DeleteItemAsync<Video>(query, new PartitionKey(query));
        }

        public async Task<Video> GetVideoAsync(string query)
        {
            try
            {
                ItemResponse<Video> response = await this._container.ReadItemAsync<Video>(query, new PartitionKey(query));
                return response.Resource;
            }
            catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

        }

        public async Task<IEnumerable<Video>> GetVideosAsync(string queryString)
        {
            if (string.IsNullOrWhiteSpace(queryString))
            {
                queryString = "SELECT * FROM c";
            }

            var query = this._container.GetItemQueryIterator<Video>(new QueryDefinition(queryString));
            List<Video> results = new List<Video>();
            while (query.HasMoreResults)
            {
                var response = await query.ReadNextAsync();

                results.AddRange(response.ToList());
            }

            return results;
        }

        public async Task UpdateVideoAsync(string query, Video video)
        {
            await this._container.UpsertItemAsync<Video>(video, new PartitionKey(query));
        }
    }
}