using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace PTPlaylistMVC.Controllers
{
    [Route("api/data")]
    public class DataController : ApiController
    {
        // GET api/<controller>
        public string Get()
        {
            return "not what you want";
        }

        // GET api/<controller>/q
        public string Get(string query)
        {
            return "a value";
        }
    }
}