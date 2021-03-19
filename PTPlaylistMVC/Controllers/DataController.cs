using PTPlaylistMVC.Interfaces;
using PTPlaylistMVC.Services;
using System.Threading.Tasks;
using System.Web.Http;

using System.Text.RegularExpressions;

namespace PTPlaylistMVC.Controllers
{
    [Route("api/data")]
    public class DataController : ApiController
    {
        private static IYoutubeService _youtubeService = new YoutubeService();

        private static readonly ICosmosDbService _cosmosDbService = new CosmosDbService(
            new Microsoft.Azure.Cosmos.CosmosClient(
                System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_ACCOUNT"], 
                System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_KEY"]),
            System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_DB_NAME"],
            System.Web.Configuration.WebConfigurationManager.AppSettings["COSMOS_DB_CONTAINER_NAME"]);

        private static Regex alphanumericRegex = new Regex("[^a-zA-Z0-9 -]");

        // GET api/data/{query}
        public async Task<string> GetAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) {
                return "";
            }

            query = alphanumericRegex.Replace(query, "");

            if (_cosmosDbService.HasContainerId()) {
                Models.Video storedVideo = await _cosmosDbService.GetVideoAsync(query);
                if (storedVideo != null && !string.IsNullOrWhiteSpace(storedVideo.VideoId))
                {
                    bool videoStillPlayable = await _youtubeService.IsYouTubeVideoPlayable(storedVideo.VideoId);
                    if (videoStillPlayable)
                    {
                        return storedVideo.VideoId;
                    }
                    else
                    {
                        string videoId = await _youtubeService.GetSingleVideoId(query);
                        await _cosmosDbService.UpdateVideoAsync(query, storedVideo);

                        return videoId;
                    }
                }
                else // Query not in DB, fetch from YouTube and store in DB
                {
                    string videoId = await _youtubeService.GetSingleVideoId(query);
                    await _cosmosDbService.AddVideoAsync(new Models.Video(query, videoId));
                    return videoId;
                }
            }
            else
            {
                return await _youtubeService.GetSingleVideoId(query);
            }
        }
    }
}