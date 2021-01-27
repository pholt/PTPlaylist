using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace PTPlaylistMVC.Controllers
{
    public class HomeController : Controller
    {
        static string API_KEY = System.Web.Configuration.WebConfigurationManager.AppSettings["API_KEY"];

        public ActionResult Index()
        {
            ViewBag.API_KEY = API_KEY;
            return View();
        }

        // TODO: API action to get YouTube video ID from first result. Currently this is handled through js, but should instead be handled through server calls
    }
}