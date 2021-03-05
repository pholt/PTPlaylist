using PTPlaylistMVC.Interfaces;
using PTPlaylistMVC.Services;
using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace PTPlaylistMVC.Controllers
{
    [Route("api/data")]
    public class DataController : ApiController
    {
        private static readonly ICosmosDbService _cosmosDbService = new CosmosDbService(
            new Microsoft.Azure.Cosmos.CosmosClient(
                System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_ACCOUNT"], 
                System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_KEY"]),
            System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_DB_NAME"],
            System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_DB_CONTAINER_NAME"]);

        private static readonly string API_KEY = System.Web.Configuration.WebConfigurationManager.AppSettings["API_KEY"];
        private static readonly HttpClient client = new HttpClient();

        // GET api/data/{query}
        public async Task<string> GetAsync(string query)
        {
            // TODO: Try DB first for entry, if it exists, pull the video id from there and check YouTube if it's still valid
            //  if it doesn't exist in the DB, query YouTube for it, store it in DB
            // finally, return the id

            // This query fetches a single result from the YouTubeV3 API.
            string urlBase = "https://www.googleapis.com/youtube/v3/search?key={0}&q={1}&part=snippet&maxResults=1&safeSearch=none&type=video&videoEmbeddable=true";
            string formattedUrl = String.Format(urlBase, API_KEY, HttpUtility.UrlEncode(query));

            try
            {
                string response = await client.GetStringAsync(formattedUrl);
                // TODO: Client really only needs video id and video name, this data should be broken down here
                return response;
            }
            catch (Exception ex)
            {
                return ex.ToString();
            }
        }
    }
}