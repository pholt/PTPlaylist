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
        private static YouTubeService _youtubeService;

        public YoutubeService(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException("API key must not be empty or null.");
            }

            _youtubeService = new YouTubeService(new Google.Apis.Services.BaseClientService.Initializer()
            {
                ApiKey = key,
                ApplicationName = System.Web.Configuration.WebConfigurationManager.AppSettings["ApplicationName"]
            });
        }

        public async Task<string> GetSingleVideoId(string query)
        {
            Google.Apis.YouTube.v3.Data.SearchListResponse searchResponse = await GetSearchListData(query);

            if (searchResponse == null || searchResponse.Items.Count <= 0)
            {
                return ""; // TODO: Throw exception?
            }

            var searchResult = searchResponse.Items[0];
            var videoId = searchResult.Id.VideoId;
            return videoId;
        }

        private async Task<Google.Apis.YouTube.v3.Data.SearchListResponse> GetSearchListData(string query)
        {
            var searchListRequest = _youtubeService.Search.List("id");
            searchListRequest.Q = query;
            searchListRequest.MaxResults = 1;
            searchListRequest.SafeSearch = SearchResource.ListRequest.SafeSearchEnum.None;
            searchListRequest.Type = "video";
            searchListRequest.VideoEmbeddable = SearchResource.ListRequest.VideoEmbeddableEnum.True__;

            return await searchListRequest.ExecuteAsync();
        }

        public async Task<bool> IsYouTubeVideoPlayable(string videoId)
        {
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

        private async Task<Google.Apis.YouTube.v3.Data.VideoListResponse> GetVideoListResponse(string videoId)
        {
            var videoListRequest = _youtubeService.Videos.List("status");
            videoListRequest.Id = videoId;
            return await videoListRequest.ExecuteAsync();
        }
    }
}