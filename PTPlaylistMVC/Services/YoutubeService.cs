using Google.Apis.YouTube.v3;
using Newtonsoft.Json;
using PTPlaylistMVC.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;

namespace PTPlaylistMVC.Services
{
    public class YoutubeService : IYoutubeService
    {
        private static HttpClient _httpClient;
        private static string _urlBase = "https://www.googleapis.com/youtube/v3/search?key={0}&q={1}&part=snippet&maxResults=1&safeSearch=none&type=video&videoEmbeddable=true";
        private static readonly string API_KEY = System.Web.Configuration.WebConfigurationManager.AppSettings["API_KEY"];

        private static YouTubeService _youtubeService;

        public YoutubeService()
        {
            if(!string.IsNullOrWhiteSpace(API_KEY))
            {
                _youtubeService = new YouTubeService(new Google.Apis.Services.BaseClientService.Initializer()
                {
                    ApiKey = API_KEY,
                    ApplicationName = System.Web.Configuration.WebConfigurationManager.AppSettings["ApplicationName"]
                });
            }
            else
            {
                _httpClient = new HttpClient();
            }
        }

        public async Task<string> GetSingleVideoId(string query)
        {
            Google.Apis.YouTube.v3.Data.SearchListResponse searchResponse;
            if (_youtubeService != null)
            {
                searchResponse = await GetSearchListDataFromService(query);
            }
            else
            {
                searchResponse = await GetSearchListDataFromHttpClient(query);
            }

            if (searchResponse != null && searchResponse.Items.Count <= 0)
            {
                return ""; // TODO: Throw exception?
            }

            var searchResult = searchResponse.Items[0];
            var videoId = searchResult.Id.VideoId;
            return videoId;
        }

        private async Task<Google.Apis.YouTube.v3.Data.SearchListResponse> GetSearchListDataFromService(string query)
        {
            var searchListRequest = _youtubeService.Search.List("id");
            searchListRequest.Q = query;
            searchListRequest.MaxResults = 1;
            searchListRequest.SafeSearch = SearchResource.ListRequest.SafeSearchEnum.None;
            searchListRequest.Type = "video";
            searchListRequest.VideoEmbeddable = SearchResource.ListRequest.VideoEmbeddableEnum.True__;

            return await searchListRequest.ExecuteAsync();
        }

        private async Task<Google.Apis.YouTube.v3.Data.SearchListResponse> GetSearchListDataFromHttpClient(string query)
        {
            string formattedUrl = String.Format(_urlBase, API_KEY, HttpUtility.UrlEncode(query));
            var searchResult = await _httpClient.GetStringAsync(formattedUrl);
            return JsonConvert.DeserializeObject<Google.Apis.YouTube.v3.Data.SearchListResponse>(searchResult);
        }

        public async Task<bool> IsYouTubeVideoPlayable(string videoId)
        {
            if (_youtubeService == null)
            {
                throw new Exception("Youtube Service required to perform this function.");
            }

            var videoListRequest = _youtubeService.Videos.List("status");
            videoListRequest.Id = videoId;
            var videoListResponse = await videoListRequest.ExecuteAsync();

            if (videoListResponse.Items.Count <= 0)
            {
                return false;
            }

            var searchResult = videoListResponse.Items[0];
            bool embeddable = searchResult.Status.Embeddable.HasValue ? searchResult.Status.Embeddable.Value : false;
            return embeddable && !searchResult.Status.PrivacyStatus.ToLower().Contains("private");
        }

        private async Task<Google.Apis.YouTube.v3.Data.VideoListResponse> GetVideoListResponseFromService(string videoId)
        {
            var videoListRequest = _youtubeService.Videos.List("status");
            videoListRequest.Id = videoId;
            return await videoListRequest.ExecuteAsync();
        }
    }
}