using Newtonsoft.Json;
using System;

namespace PTPlaylistMVC.Models
{
    public class Video
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        [JsonProperty(PropertyName = "videoId")]
        public string VideoId { get; set; }

        [JsonProperty(PropertyName = "lastModifiedDate")]
        public DateTime LastModifiedDate { get; set; }

        public Video(string query, string videoId) {
            this.Id = query;
            this.VideoId = videoId;
            this.LastModifiedDate = DateTime.UtcNow;
        }
    }
}