using PTPlaylistMVC.Interfaces;
using PTPlaylistMVC.Services;
using System.Threading.Tasks;
using System.Web.Http;

using System.Text.RegularExpressions;
using System.Collections.Generic;

namespace PTPlaylistMVC.Controllers
{
    [Route("api/data")]
    public class DataController : ApiController
    {
        private static Dictionary<string, IYoutubeService> _youtubeServices = new Dictionary<string, IYoutubeService>();

        private static ICosmosDbService _cosmosDbService;

        private static Regex alphanumericRegex = new Regex("[^a-zA-Z0-9 -]");

        public DataController()
        {
            if(bool.Parse(System.Web.Configuration.WebConfigurationManager.AppSettings["USE_COSMOS_DB"]))
            {
                try
                {
                    _cosmosDbService = new CosmosDbService();
                }
                catch (System.Exception)
                {
                    // null is fine
                }
            }
        }

        // GET api/data/{query}
        public async Task<string> GetAsync(string query, string key)
        {
            if (string.IsNullOrWhiteSpace(query) || string.IsNullOrWhiteSpace(key)) {
                throw new System.Exception("Arguments cannot be null or empty.");
            }

            query = alphanumericRegex.Replace(query, "");

            IYoutubeService youtubeService;
            if (_youtubeServices.ContainsKey(key))
            {
                youtubeService = _youtubeServices[key];
            }
            else
            {
                youtubeService = new YoutubeService(key);
                _youtubeServices.Add(key, youtubeService);
            }

            if (_cosmosDbService != null) {
                Models.Video storedVideo = await _cosmosDbService.GetVideoAsync(query);
                if (storedVideo != null && !string.IsNullOrWhiteSpace(storedVideo.VideoId))
                {
                    bool videoStillPlayable = await youtubeService.IsYouTubeVideoPlayable(storedVideo.VideoId);
                    if (videoStillPlayable)
                    {
                        return storedVideo.VideoId;
                    }
                    else
                    {
                        string videoId = await youtubeService.GetSingleVideoId(query);
                        await _cosmosDbService.UpdateVideoAsync(query, storedVideo);

                        return videoId;
                    }
                }
                else // Query not in DB, fetch from YouTube and store in DB
                {
                    string videoId = await youtubeService.GetSingleVideoId(query);
                    await _cosmosDbService.AddVideoAsync(new Models.Video(query, videoId));
                    return videoId;
                }
            }
            else // Cosmos DB unavailable
            {
                return await youtubeService.GetSingleVideoId(query);
            }
        }
    }
}