using PTPlaylistMVC.Interfaces;
using PTPlaylistMVC.Services;
using System.Threading.Tasks;
using System.Web.Http;

using Google.Apis.YouTube.v3;
using System.Text.RegularExpressions;

namespace PTPlaylistMVC.Controllers
{
    [Route("api/data")]
    public class DataController : ApiController
    {
        private static YouTubeService _youtubeService = new YouTubeService(new Google.Apis.Services.BaseClientService.Initializer()
        {
            ApiKey = System.Web.Configuration.WebConfigurationManager.AppSettings["API_KEY"],
            ApplicationName = System.Web.Configuration.WebConfigurationManager.AppSettings["ApplicationName"]
        });

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

            Models.Video storedVideo = await _cosmosDbService.GetVideoAsync(query);
            if (storedVideo != null && !string.IsNullOrWhiteSpace(storedVideo.VideoId))
            {
                bool videoStillPlayable = await IsYouTubeVideoPlayable(storedVideo.VideoId);
                if (videoStillPlayable)
                {
                    return storedVideo.VideoId;
                }
                else
                {
                    string videoId = await GetSingleVideoIdFromYoutubeAPI(query);
                    await _cosmosDbService.UpdateVideoAsync(query, storedVideo);

                    return videoId;
                }
            }
            else // Query not in DB, fetch from YouTube and store in DB
            {
                string videoId = await GetSingleVideoIdFromYoutubeAPI(query);
                await _cosmosDbService.AddVideoAsync(new Models.Video(query, videoId));
                return videoId;
            }
        }

        private async Task<string> GetSingleVideoIdFromYoutubeAPI(string query) 
        {
            var searchListRequest = _youtubeService.Search.List("id");
            searchListRequest.Q = query;
            searchListRequest.MaxResults = 1;
            searchListRequest.SafeSearch = SearchResource.ListRequest.SafeSearchEnum.None;
            searchListRequest.Type = "video";
            searchListRequest.VideoEmbeddable = SearchResource.ListRequest.VideoEmbeddableEnum.True__;

            var searchListResponse = await searchListRequest.ExecuteAsync();

            if (searchListResponse.Items.Count <= 0)
            {
                return "";
            }

            var searchResult = searchListResponse.Items[0];
            var videoId = searchResult.Id.VideoId;
            return videoId;
        }

        private async Task<bool> IsYouTubeVideoPlayable(string videoId)
        {
            var videoListRequest = _youtubeService.Videos.List("status");
            videoListRequest.Id = videoId;
            var videoListResponse = await videoListRequest.ExecuteAsync();

            if (videoListResponse.Items.Count <= 0) {
                return false;
            }

            var searchResult = videoListResponse.Items[0];
            bool embeddable = searchResult.Status.Embeddable.HasValue ? searchResult.Status.Embeddable.Value : false;
            return embeddable && !searchResult.Status.PrivacyStatus.ToLower().Contains("private");
        }
    }
}