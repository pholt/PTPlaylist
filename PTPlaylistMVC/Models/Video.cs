using Newtonsoft.Json;
using System;

namespace PTPlaylistMVC.Models
{
    public class Video
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        [JsonProperty(PropertyName = "query")]
        public string Query { get; set; }

        [JsonProperty(PropertyName = "videoId")]
        public string VideoId { get; set; }

        [JsonProperty(PropertyName = "refreshDate")]
        public DateTime RefreshDate { get; set; }
    }
}