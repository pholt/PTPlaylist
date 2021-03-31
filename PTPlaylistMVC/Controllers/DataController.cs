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
        private static readonly IYoutubeService _youtubeService = new YoutubeService();

        private static ICosmosDbService _cosmosDbService;

        private static Regex alphanumericRegex = new Regex("[^a-zA-Z0-9 -]");

        public DataController()
        {
            if(bool.Parse(System.Web.Configuration.WebConfigurationManager.AppSettings["USE_COSMOS_DB"]))
            {
                _cosmosDbService = new CosmosDbService();
            }
        }

        // GET api/data/{query}
        public async Task<string> GetAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query)) {
                return "";
            }

            query = alphanumericRegex.Replace(query, "");

            if (_cosmosDbService != null) {
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
            else // Cosmos DB unavailable
            {
                return await _youtubeService.GetSingleVideoId(query);
            }
        }
    }
}